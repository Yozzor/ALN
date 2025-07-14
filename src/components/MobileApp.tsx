import { useState, useEffect } from 'react'
import WelcomeScreen from './WelcomeScreen'
import CameraInterface from './CameraInterface'
import GameOverScreen from './GameOverScreen'
import { usePhotoSession } from '../hooks/usePhotoSession'
import { useVercelBlob } from '../hooks/useVercelBlob'
import { testSupabaseConnection } from '../utils/supabaseTest'

type AppState = 'welcome' | 'camera' | 'gameOver'

const MobileApp = () => {
  const [appState, setAppState] = useState<AppState>('welcome')
  const [supabaseReady, setSupabaseReady] = useState(false)
  const {
    userName,
    photosRemaining,
    startSession,
    takePhoto,
    isSessionActive
  } = usePhotoSession()

  const {
    isAuthenticated,
    isUploading,
    error: storageError,
    authenticate,
    uploadPhoto
  } = useSupabaseStorage()

  // Test Supabase connection on app load
  useEffect(() => {
    const initSupabase = async () => {
      console.log('🚀 Initializing About Last Night app...')
      const isReady = await testSupabaseConnection()
      setSupabaseReady(isReady)

      if (isReady) {
        console.log('✅ App ready with Supabase integration!')
      } else {
        console.error('❌ App started but Supabase connection failed')
      }
    }

    initSupabase()
  }, [])

  // Check for existing session on app load
  useEffect(() => {
    if (isSessionActive) {
      if (photosRemaining > 0) {
        setAppState('camera')
      } else {
        setAppState('gameOver')
      }
    }
  }, [isSessionActive, photosRemaining])

  const handleStartSession = async (name: string) => {
    const success = startSession(name)
    if (success) {
      // Initialize Vercel Blob (no auth needed)
      await authenticate()
      setAppState('camera')
    }
  }

  const handlePhotoCapture = async (photoBlob: Blob) => {
    // Take photo (decrements counter)
    const photoData = takePhoto(photoBlob)
    
    if (photoData) {
      // Upload to Vercel Blob
      try {
        await uploadPhoto(photoData, userName!)
        console.log('✅ Photo uploaded successfully!')
      } catch (error) {
        console.error('❌ Failed to upload photo:', error)
        // Photo is still counted even if upload fails
        // The error will be shown in the camera interface
      }
      
      // Check if this was the last photo
      if (photosRemaining <= 1) {
        setAppState('gameOver')
      }
    }
  }

  const handleRestart = () => {
    setAppState('welcome')
  }

  return (
    <div className="min-h-screen bg-surface-primary relative overflow-hidden">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-surface-primary via-surface-secondary to-surface-tertiary opacity-80"></div>

      {/* Supabase Connection Status */}
      {!supabaseReady && (
        <div className="fixed top-0 left-0 right-0 bg-accent-orange-500 text-white px-4 py-2 text-center text-sm font-medium z-50">
          🔄 Connecting to database...
        </div>
      )}

      {/* Content */}
      <div className="relative z-10">
        {appState === 'welcome' && (
          <WelcomeScreen
            onStartSession={handleStartSession}
            isLoading={!supabaseReady}
          />
        )}

        {appState === 'camera' && (
          <CameraInterface
            userName={userName!}
            photosRemaining={photosRemaining}
            onPhotoCapture={handlePhotoCapture}
            isUploading={isUploading}
            isAuthenticated={isAuthenticated}
            blobError={blobError}
          />
        )}

        {appState === 'gameOver' && (
          <GameOverScreen
            userName={userName!}
            totalPhotos={10}
            onRestart={handleRestart}
          />
        )}
      </div>

      {/* Premium Gallery Link - Fixed position */}
      <div className="fixed top-6 right-6 z-50">
        <a
          href={`/gallery${userName ? `?user=${encodeURIComponent(userName)}` : ''}`}
          className="group bg-surface-card hover:bg-surface-hover border border-border-primary
                     text-text-primary p-3 rounded-xl shadow-premium hover:shadow-premium-lg transition-all duration-300
                     hover:-translate-y-1 active:translate-y-0 backdrop-blur-sm"
          title="View Gallery"
        >
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-text-primary opacity-60 rounded-sm"></div>
            <span className="text-sm font-medium hidden group-hover:inline-block transition-all duration-200 tracking-wide">
              Gallery
            </span>
          </div>
        </a>
      </div>

      {/* Ambient lighting effects */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-orange-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>
    </div>
  )
}

export default MobileApp
