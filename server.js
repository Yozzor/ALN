import express from 'express';
import cors from 'cors';
import path from 'path';

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import API routes
import photosHandler from './api/photos.js';
import uploadHandler from './api/upload.js';

// API Routes
app.get('/api/photos', photosHandler);
app.post('/api/upload', uploadHandler);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 API Server running on http://localhost:${PORT}`);
  console.log(`📡 API endpoints available at:`);
  console.log(`   - GET  /api/photos`);
  console.log(`   - POST /api/upload`);
  console.log(`   - GET  /api/health`);
});

export default app;
