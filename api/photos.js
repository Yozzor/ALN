// Vercel Blob Storage photos listing endpoint
import { list } from '@vercel/blob';

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. Use GET.' 
    });
  }

  try {
    console.log('📸 Fetching photos from Vercel Blob...');
    
    // List all blobs with the about-last-night prefix
    const { blobs } = await list({
      prefix: 'about-last-night/',
      limit: 1000
    });

    console.log('✅ Found', blobs.length, 'photos');

    // Organize photos by user AND create flat list for gallery
    const photosByUser = {};
    const allPhotos = [];

    blobs.forEach(blob => {
      // Extract user name from path: about-last-night/userName/timestamp-filename.jpg
      const pathParts = blob.pathname.split('/');
      if (pathParts.length >= 3) {
        const userName = pathParts[1];
        const fileName = pathParts[2];

        const photoData = {
          url: blob.url,
          fileName: fileName,
          uploadedAt: blob.uploadedAt,
          size: blob.size,
          userName: userName
        };

        // Add to user-organized structure
        if (!photosByUser[userName]) {
          photosByUser[userName] = [];
        }
        photosByUser[userName].push(photoData);

        // Add to flat list for gallery
        allPhotos.push(photoData);
      }
    });

    // Sort photos by upload date (newest first)
    Object.keys(photosByUser).forEach(userName => {
      photosByUser[userName].sort((a, b) =>
        new Date(b.uploadedAt) - new Date(a.uploadedAt)
      );
    });

    // Sort all photos by upload date (newest first)
    allPhotos.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

    return res.status(200).json({
      success: true,
      totalPhotos: blobs.length,
      userCount: Object.keys(photosByUser).length,
      photosByUser: photosByUser,
      photos: allPhotos, // Flat list for gallery
      message: 'Photos retrieved successfully from Vercel Blob!'
    });

  } catch (error) {
    console.error('❌ Failed to fetch photos:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch photos: ' + (error.message || 'Unknown error'),
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
