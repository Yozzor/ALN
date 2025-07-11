// Vercel Blob Storage upload endpoint
import { put } from '@vercel/blob';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use POST.'
    });
  }

  try {
    // Check if BLOB_READ_WRITE_TOKEN is available
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error('❌ BLOB_READ_WRITE_TOKEN not found in environment variables');
      return res.status(500).json({
        success: false,
        error: 'Server configuration error: Blob storage token not found'
      });
    }

    const { photoData, userName, fileName, timestamp } = req.body;

    // Validate required fields
    if (!photoData || !userName || !fileName) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: photoData, userName, fileName'
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

    // Upload to Vercel Blob
    const blob = await put(blobFileName, buffer, {
      access: 'public',
      contentType: 'image/jpeg',
    });

    console.log('✅ Upload successful! Blob URL:', blob.url);

    // Return success response
    return res.status(200).json({
      success: true,
      message: 'Photo uploaded successfully to Vercel Blob!',
      data: {
        url: blob.url,
        fileName: blobFileName,
        size: buffer.length,
        uploadedAt: new Date().toISOString(),
        userName: userName
      }
    });

  } catch (error) {
    console.error('❌ Vercel Blob upload failed:', error);

    return res.status(500).json({
      success: false,
      error: 'Upload failed: ' + (error.message || 'Unknown error'),
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}


