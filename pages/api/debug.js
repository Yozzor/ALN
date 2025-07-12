// Debug endpoint to check environment variables
export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. Use GET.' 
    });
  }

  try {
    // Check what environment variables are available
    const envVars = {
      BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN ? 'SET' : 'NOT SET',
      BLOB_READ_WRITE_TOKEN_LENGTH: process.env.BLOB_READ_WRITE_TOKEN ? process.env.BLOB_READ_WRITE_TOKEN.length : 0,
      BLOB_READ_WRITE_TOKEN_PREFIX: process.env.BLOB_READ_WRITE_TOKEN ? process.env.BLOB_READ_WRITE_TOKEN.substring(0, 20) + '...' : 'N/A',
      NODE_ENV: process.env.NODE_ENV || 'NOT SET',
      VERCEL: process.env.VERCEL || 'NOT SET',
      VERCEL_ENV: process.env.VERCEL_ENV || 'NOT SET'
    };

    console.log('🔍 Environment Variables Debug:', envVars);

    return res.status(200).json({
      success: true,
      message: 'Environment variables debug info',
      data: envVars,
      allEnvKeys: Object.keys(process.env).filter(key => 
        key.includes('BLOB') || key.includes('VERCEL') || key.includes('TOKEN')
      )
    });

  } catch (error) {
    console.error('❌ Debug endpoint failed:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Debug failed: ' + (error.message || 'Unknown error')
    });
  }
}
