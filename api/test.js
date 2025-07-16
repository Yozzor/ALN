// Simple test endpoint
export default function handler(req, res) {
  return res.status(200).json({
    success: true,
    message: 'API route working!',
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url
  });
}
