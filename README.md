# About Last Night - Wedding Photo App 📸

A mobile-first PWA for wedding photo sharing with limited photo allocation per user.

## Features

- 📱 **Mobile-First Design** - Optimized for mobile camera access
- 📷 **Camera Integration** - Direct camera access with live preview
- ☁️ **Vercel Blob Storage** - Automatic photo organization by user
- ⚡ **Photo Limits** - 10 photos per user to encourage quality over quantity
- 💾 **Session Persistence** - Survives page refreshes and app restarts
- 🖥️ **Desktop Redirect** - QR code for easy mobile access
- 📱 **PWA Ready** - Installable as a mobile app

## Quick Start

### Development
```bash
npm install
npm run dev
```

### Production Build
```bash
npm run build
npm run preview
```

## Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Set environment variables:
   - `VITE_GOOGLE_CLIENT_ID` - Your Google OAuth Client ID
   - `VITE_APP_DOMAIN` - Your custom domain (e.g., aboutlastnight.lol)
3. Deploy automatically on push to main branch

### Custom Domain Setup
1. Add your domain to Vercel project settings
2. Update Google OAuth credentials with your domain:
   - Authorized JavaScript origins: `https://yourdomain.com`
   - Authorized redirect URIs: `https://yourdomain.com`

## Storage

Photos are automatically uploaded to Vercel Blob Storage with no additional configuration required. Files are organized by user name and timestamp for easy management.

## Technical Stack

- **Frontend**: Vite + React + TypeScript
- **Styling**: Tailwind CSS
- **PWA**: Vite PWA Plugin
- **Camera**: getUserMedia API
- **Storage**: localStorage + Vercel Blob Storage
- **QR Codes**: qrcode library
- **Deployment**: Vercel

## Project Structure

```
src/
├── components/
│   ├── MobileApp.tsx          # Main mobile app container
│   ├── CameraInterface.tsx    # Camera capture interface
│   ├── WelcomeScreen.tsx      # User name input
│   ├── GameOverScreen.tsx     # Photo limit reached
│   └── DesktopRedirect.tsx    # Desktop landing page
├── hooks/
│   ├── useCamera.ts           # Camera access and capture
│   ├── useVercelBlob.ts       # Vercel Blob storage integration
│   └── usePhotoSession.ts     # Session management
└── utils/
    └── deviceDetection.ts     # Mobile/desktop detection
```

## Environment Variables

```env
VITE_APP_NAME=About Last Night
VITE_APP_DOMAIN=yourdomain.com
```

## Wedding Day Usage

1. Share the app URL or QR code with guests
2. Guests enter their name and get 10 photos
3. Photos automatically upload to Vercel Blob Storage
4. Organized by user name and timestamp for easy management
5. Session persists across page refreshes

## Browser Support

- ✅ Chrome/Edge (Android/Desktop)
- ✅ Safari (iOS/macOS)
- ✅ Firefox (Android/Desktop)
- ⚠️ Requires HTTPS for camera access in production

## Security Notes

- Camera access requires user permission
- Google Drive access is scoped to app-created files only
- No sensitive data stored in localStorage
- HTTPS required for production camera access

---

Made with ❤️ for unforgettable wedding moments
