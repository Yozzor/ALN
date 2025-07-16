// Debug endpoint to check Vercel Blob configuration
export default function handler(req, res) {
  try {
    // Check environment variables
    const envCheck = {
      BLOB_READ_WRITE_TOKEN: {
        exists: !!process.env.BLOB_READ_WRITE_TOKEN,
        length: process.env.BLOB_READ_WRITE_TOKEN?.length || 0,
        prefix: process.env.BLOB_READ_WRITE_TOKEN?.substring(0, 20) + '...' || 'N/A'
      },
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL,
      VERCEL_ENV: process.env.VERCEL_ENV
    };

    // Try to import Vercel Blob
    let blobImportStatus = 'unknown';
    try {
      const { put } = await import('@vercel/blob');
      blobImportStatus = 'success';
    } catch (error) {
      blobImportStatus = `failed: ${error.message}`;
    }

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      environment: envCheck,
      blobImport: blobImportStatus,
      message: envCheck.BLOB_READ_WRITE_TOKEN.exists 
        ? 'Vercel Blob should be working' 
        : 'BLOB_READ_WRITE_TOKEN is missing - uploads will fail'
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
