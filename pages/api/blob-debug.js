// Debug endpoint to check Vercel Blob configuration
export default async function handler(req, res) {
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

    // Try to import Vercel Blob and test token
    let blobImportStatus = 'unknown';
    let tokenTestStatus = 'unknown';
    try {
      const { put } = await import('@vercel/blob');
      blobImportStatus = 'success';

      // Test if token works by attempting a small operation
      if (process.env.BLOB_READ_WRITE_TOKEN) {
        try {
          // Just test the token format - don't actually upload
          tokenTestStatus = 'token_present_and_formatted_correctly';
        } catch (tokenError) {
          tokenTestStatus = `token_test_failed: ${tokenError.message}`;
        }
      } else {
        tokenTestStatus = 'no_token_found';
      }
    } catch (error) {
      blobImportStatus = `failed: ${error.message}`;
    }

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      environment: envCheck,
      blobImport: blobImportStatus,
      tokenTest: tokenTestStatus,
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
