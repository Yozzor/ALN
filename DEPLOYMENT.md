# Deployment Guide - About Last Night

## Quick Deployment to Vercel (5 minutes)

### Step 1: Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit - About Last Night wedding app"
git branch -M main
git remote add origin https://github.com/yourusername/about-last-night.git
git push -u origin main
```

### Step 2: Deploy to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click "New Project"
4. Import your GitHub repository
5. Configure:
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
6. Add Environment Variables:
   - `VITE_GOOGLE_CLIENT_ID`: `658223254556-mjucsnf9ekn604i9cvtsmkifi1dvkn4q.apps.googleusercontent.com`
   - `VITE_APP_DOMAIN`: `aboutlastnight.lol`
7. Click **Deploy**

### Step 3: Connect Custom Domain
1. In Vercel project settings, go to **Domains**
2. Add `aboutlastnight.lol`
3. Follow DNS configuration instructions
4. Wait for SSL certificate (automatic)

### Step 4: Update Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to your project > APIs & Services > Credentials
3. Edit your OAuth 2.0 Client ID
4. Add to **Authorized JavaScript origins**:
   - `https://aboutlastnight.lol`
5. Add to **Authorized redirect URIs**:
   - `https://aboutlastnight.lol`
6. Save changes

## Testing Checklist

### Desktop Testing
- [ ] Visit `https://aboutlastnight.lol` on desktop
- [ ] Verify redirect page displays correctly
- [ ] Check QR code generates and displays
- [ ] Test responsive design

### Mobile Testing
- [ ] Visit `https://aboutlastnight.lol` on mobile
- [ ] Test camera permission request
- [ ] Verify camera preview works
- [ ] Test photo capture and preview
- [ ] Test Google Drive authentication
- [ ] Verify photo upload functionality
- [ ] Test session persistence (refresh page)
- [ ] Test photo limit enforcement
- [ ] Verify game over screen

### Cross-Browser Testing
- [ ] Chrome (Android/Desktop)
- [ ] Safari (iOS/macOS)
- [ ] Firefox (Android/Desktop)
- [ ] Edge (Android/Desktop)

## Wedding Day Setup

### For the Couple
1. Share the URL: `https://aboutlastnight.lol`
2. Create QR code printouts for tables
3. Brief guests: "Enter your name, take 10 photos max"
4. Monitor Google Drive folder for uploads

### For Guests
1. Scan QR code or visit URL on mobile
2. Allow camera permissions when prompted
3. Enter your name
4. Take up to 10 photos
5. Photos automatically save to Google Drive

## Troubleshooting

### Camera Not Working
- Ensure HTTPS is enabled (required for camera access)
- Check browser permissions
- Try different browser

### Google Drive Upload Fails
- Check internet connection
- Verify Google OAuth credentials
- Try refreshing the page to re-authenticate

### App Not Loading
- Check Vercel deployment status
- Verify DNS settings for custom domain
- Check browser console for errors

## Production URLs
- **Main App**: https://aboutlastnight.lol
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Google Cloud Console**: https://console.cloud.google.com/

## Emergency Contacts
- Vercel Support: support@vercel.com
- Google Cloud Support: Via Google Cloud Console

---

**Ready for the wedding! 🎉📸**
