// Vercel Blob Storage upload endpoint with explicit token authentication
import { put } from '@vercel/blob';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = 'https://quetdrybtkhknbrkmrmn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1ZXRkcnlidGtoa25icmttcm1uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2MDg5ODIsImV4cCI6MjA2ODE4NDk4Mn0.y-P2P75LMDQjdLOESJM7Og-OZWWxaey4BRsH7Mnczq8';
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. Use POST.' 
    });
  }

  try {
    console.log('📸 Upload request received');
    console.log('📋 Request headers:', req.headers);

    const { photoData, userName, fileName, timestamp, eventCode, eventId } = req.body;

    // Validate required fields
    if (!photoData || !userName || !fileName) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: photoData, userName, fileName'
      });
    }

    // Check request body size (rough estimate)
    const requestBodySize = JSON.stringify(req.body).length;
    console.log('📊 Request body size:', Math.round(requestBodySize / 1024), 'KB');
    
    if (requestBodySize > 4 * 1024 * 1024) { // 4MB limit
      console.error('❌ Request body too large:', requestBodySize, 'bytes');
      return res.status(413).json({
        success: false,
        error: `Request too large: ${Math.round(requestBodySize / 1024 / 1024 * 100) / 100}MB. Try reducing photo quality.`
      });
    }

    console.log('📸 Starting Vercel Blob upload for user:', userName);

    // Convert base64 to buffer
    const base64Data = photoData.split(',')[1]; // Remove data:image/jpeg;base64, prefix
    const buffer = Buffer.from(base64Data, 'base64');

    // Check file size (Vercel Blob free tier has 5MB limit per file)
    const maxFileSize = 5 * 1024 * 1024; // 5MB in bytes
    if (buffer.length > maxFileSize) {
      console.error('❌ File too large:', buffer.length, 'bytes (max:', maxFileSize, 'bytes)');
      return res.status(413).json({
        success: false,
        error: `File too large: ${Math.round(buffer.length / 1024 / 1024 * 100) / 100}MB. Maximum allowed: 5MB. Try taking the photo again with lower quality.`
      });
    }

    // Create organized filename with user folder structure
    const timestamp_str = new Date(timestamp || Date.now()).toISOString().replace(/[:.]/g, '-');
    const blobFileName = `about-last-night/${userName}/${timestamp_str}-${fileName}`;

    console.log('📤 Uploading to Vercel Blob:', blobFileName);
    console.log('📁 File size:', Math.round(buffer.length / 1024 * 100) / 100, 'KB');

    // Verify token exists
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      console.error('❌ BLOB_READ_WRITE_TOKEN not found in environment variables');
      return res.status(500).json({
        success: false,
        error: 'Server configuration error: BLOB_READ_WRITE_TOKEN not configured'
      });
    }

    console.log('🔑 Token found, length:', token.length, 'prefix:', token.substring(0, 20) + '...');

    // Upload to Vercel Blob with explicit token
    const blob = await put(blobFileName, buffer, {
      access: 'public',
      contentType: 'image/jpeg',
      token: token  // Explicitly pass the token
    });

    console.log('✅ Upload successful! Blob URL:', blob.url);

    // Save metadata to Supabase if event context is provided
    let supabasePhotoId = null;
    if (eventId && eventCode) {
      try {
        console.log('💾 Saving photo metadata to Supabase...');
        
        // Find the participant in the event
        const { data: participantData, error: participantError } = await supabase
          .from('event_participants')
          .select('id')
          .eq('event_id', eventId)
          .eq('user_name', userName)
          .single();

        console.log('🔍 Participant query result:', { participantData, participantError });

        if (participantError || !participantData) {
          console.error('❌ Participant not found:', participantError);
          throw new Error('Participant not found in event');
        }

        // Save photo metadata to event_photos table (without file_size to avoid schema cache issues)
        const { data: photoData, error: photoError } = await supabase
          .from('event_photos')
          .insert({
            event_id: eventId,
            participant_id: participantData.id,
            photo_url: blob.url,
            file_name: fileName,
            uploaded_at: new Date().toISOString()
          })
          .select()
          .single();

        if (photoError) {
          console.error('❌ Failed to save photo metadata:', photoError);
          throw new Error('Failed to save photo metadata');
        }

        supabasePhotoId = photoData.id;
        console.log('✅ Photo metadata saved to Supabase with ID:', supabasePhotoId);

        // Update participant photo count
        await supabase
          .from('event_participants')
          .update({
            photos_taken: supabase.raw('photos_taken + 1'),
            last_photo_at: new Date().toISOString()
          })
          .eq('id', participantData.id);

        console.log('✅ Participant photo count updated');

      } catch (supabaseError) {
        console.error('⚠️ Supabase metadata save failed:', supabaseError);
        // Don't fail the upload if Supabase save fails, but log it
      }
    } else {
      console.log('⚠️ No event context provided - photo saved to Vercel Blob only');
    }

    // Return success response
    return res.status(200).json({
      success: true,
      message: 'Photo uploaded successfully!',
      data: {
        url: blob.url,
        fileName: blobFileName,
        size: buffer.length,
        uploadedAt: new Date().toISOString(),
        userName: userName,
        supabasePhotoId: supabasePhotoId,
        eventLinked: !!supabasePhotoId
      }
    });

  } catch (error) {
    console.error('❌ Vercel Blob upload failed:', error);
    console.error('❌ Error name:', error.name);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error stack:', error.stack);

    // Check for specific Vercel Blob errors
    let errorMessage = 'Upload failed: ' + (error.message || 'Unknown error');
    if (error.message && error.message.includes('Access denied')) {
      errorMessage = 'Vercel Blob access denied - token authentication failed';
    } else if (error.message && error.message.includes('No token found')) {
      errorMessage = 'Vercel Blob token not found - server configuration error';
    }

    return res.status(500).json({
      success: false,
      error: errorMessage,
      errorType: error.name || 'Unknown',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
