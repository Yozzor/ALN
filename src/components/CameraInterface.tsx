import { useState, useEffect } from 'react'
import { useCamera } from '../hooks/useCamera'
import { usePhotoSession } from '../hooks/usePhotoSession'
import PolaroidPhoto from './PolaroidPhoto'
import DebugDisplay from './DebugDisplay'

interface CameraInterfaceProps {
  userName: string
  photosRemaining: number
  onPhotoCapture: (photoBlob: Blob) => void
  isUploading: boolean
  isAuthenticated: boolean
  blobError?: string | null
  eventStatus?: 'waiting' | 'active' | 'voting' | 'completed'
  eventTitle?: string
}

const CameraInterface = ({
  userName,
  photosRemaining,
  onPhotoCapture,
  isUploading,
  isAuthenticated,
  blobError,
  eventStatus = 'active',
  eventTitle
}: CameraInterfaceProps) => {
  const [showPreview, setShowPreview] = useState(false)
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null)
  const [polaroidBlob, setPolaroidBlob] = useState<Blob | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)

  // Get debug logs from photo session
  const { debugLogs } = usePhotoSession()
  
  const {
    videoRef,
    canvasRef,
    isStreaming,
    error,
    startCamera,
    stopCamera,
    restartCamera,
    capturePhoto
  } = useCamera()

  useEffect(() => {
    console.log('📸 Initializing simple camera...')
    startCamera()
    return () => stopCamera()
  }, [startCamera, stopCamera])

  // Camera health check - restart if stream becomes inactive
  useEffect(() => {
    const healthCheck = setInterval(() => {
      if (videoRef.current && isStreaming) {
        const video = videoRef.current
        // Check if video is actually playing
        if (video.readyState === 0 || video.videoWidth === 0) {
          console.log('📸 Camera health check failed, restarting...')
          restartCamera()
        }
      }
    }, 5000) // Check every 5 seconds

    return () => clearInterval(healthCheck)
  }, [isStreaming, restartCamera])

  const handleCapture = async () => {
    const result = await capturePhoto()
    if (result) {
      setCapturedPhoto(result.dataUrl)
      setShowPreview(true)
    }
  }

  const handleKeepPhoto = async () => {
    if (polaroidBlob) {
      onPhotoCapture(polaroidBlob)
      setShowPreview(false)
      setCapturedPhoto(null)
      setPolaroidBlob(null)

      // Show success message
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)

      // Restart camera to ensure it's working after photo capture
      if (!isStreaming) {
        console.log('📸 Camera not streaming after photo, restarting...')
        await restartCamera()
      }
    }
  }

  const handlePolaroidReady = (blob: Blob) => {
    setPolaroidBlob(blob)
  }

  const handleRetakePhoto = async () => {
    setShowPreview(false)
    setCapturedPhoto(null)
    setPolaroidBlob(null)

    // Ensure camera is active
    if (!isStreaming) {
      console.log('📸 Camera not streaming, restarting...')
      await restartCamera()
    }
  }



  if (error) {
    return (
      <div className="min-h-screen bg-surface-primary flex items-center justify-center p-6">
        <div className="card-elevated p-8 max-w-md animate-fade-in">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">📷</span>
            </div>
            <h3 className="text-text-primary font-bold text-xl mb-3">Camera Access Required</h3>
            <p className="text-red-400 text-sm mb-6 bg-red-500/10 rounded-lg p-3">{error}</p>
            <button
              onClick={() => restartCamera()}
              className="btn-primary hover-glow"
            >
              <span className="mr-2">🔄</span>
              Restart Camera
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-primary flex flex-col relative overflow-hidden">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-surface-primary via-surface-secondary to-surface-tertiary opacity-80"></div>

      {/* Header */}
      <div className="relative z-10 glass border-b border-border-primary/30 p-4">
        {/* Top Row - User Info */}
        <div className="flex items-center justify-between mb-4">
          <div className="animate-slide-up">
            <h2 className="text-text-primary font-light text-lg mb-1 tracking-wide">
              Hey {userName}
            </h2>
            <div className="flex items-center space-x-2">
              <div className={`w-1.5 h-1.5 rounded-full ${
                isAuthenticated
                  ? 'bg-accent-emerald-500'
                  : 'bg-amber-400'
              }`}></div>
              <p className="text-text-tertiary text-xs font-light tracking-wide">
                {isAuthenticated ? 'Storage Ready' : 'Storage not ready'}
              </p>
            </div>
          </div>

          {/* Event Status */}
          <div className="text-right animate-slide-up" style={{ animationDelay: '100ms' }}>
            {eventTitle && (
              <p className="text-text-secondary text-sm font-medium mb-1 tracking-wide">
                {eventTitle}
              </p>
            )}
            <div className="flex items-center justify-end space-x-2">
              <div className={`w-1.5 h-1.5 rounded-full ${
                eventStatus === 'active'
                  ? 'bg-accent-emerald-500 animate-pulse'
                  : eventStatus === 'waiting'
                  ? 'bg-amber-400'
                  : 'bg-red-500'
              }`}></div>
              <p className="text-text-tertiary text-xs font-light tracking-wide capitalize">
                {eventStatus === 'active' ? 'Event Live' :
                 eventStatus === 'waiting' ? 'Event Starting Soon' :
                 eventStatus === 'voting' ? 'Voting Phase' :
                 'Event Ended'}
              </p>
            </div>
          </div>
        </div>


      </div>

      {/* Premium Success Message */}
      {showSuccess && (
        <div className="relative z-10 bg-gradient-to-r from-accent-emerald-500/90 to-primary-500/90 backdrop-blur-md p-6 text-center border-b border-accent-emerald-400/30 shadow-premium-lg animate-slide-up">
          <div className="flex items-center justify-center space-x-4">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shadow-premium">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-white font-bold text-xl">Photo uploaded successfully!</p>
              <p className="text-emerald-100 text-sm">Your memory has been captured ✨</p>
            </div>
          </div>
        </div>
      )}

      {/* Camera View */}
      <div className="flex-1 relative overflow-hidden">
        {!showPreview ? (
          <>
            {/* Live Camera Feed */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />

            {/* HUGE PHOTO COUNTER - IMPOSSIBLE TO MISS */}
            <div className="absolute top-6 left-6 right-6 z-10">
              <div className="bg-red-600 border-4 border-yellow-400 rounded-xl p-4 text-center">
                <div className="text-yellow-300 text-2xl font-bold mb-2">
                  🚨 PHOTOS LEFT: {photosRemaining} 🚨
                </div>
                <div className="text-white text-sm">
                  This should NEVER reset when you go back!
                </div>
              </div>
            </div>

            {/* Original Photo Counter - Top Right */}
            <div className="absolute top-6 right-6 z-10">
              <div className={`backdrop-blur-md rounded-xl px-4 py-3 border shadow-premium ${
                photosRemaining <= 3
                  ? 'bg-red-500/20 border-red-400/30'
                  : photosRemaining <= 5
                  ? 'bg-amber-500/20 border-amber-400/30'
                  : 'bg-white/10 border-white/20'
              }`}>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${
                    photosRemaining <= 3 ? 'bg-red-400' :
                    photosRemaining <= 5 ? 'bg-amber-400' : 'bg-white/60'
                  }`}></div>
                  <span className="text-white text-sm font-light tracking-wide">
                    {photosRemaining} left
                  </span>
                </div>
              </div>
            </div>

            {/* Premium Camera Loading Indicator */}
            {!isStreaming && !error && (
              <div className="absolute inset-0 bg-gradient-to-br from-surface-primary/95 to-surface-secondary/90 flex items-center justify-center">
                <div className="text-center card-elevated p-10 max-w-sm animate-fade-in">
                  <div className="relative mb-8">
                    <div className="animate-spin rounded-full h-20 w-20 border-2 border-surface-hover border-t-primary-500 mx-auto"></div>
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary-500 to-accent-orange-500 opacity-20 animate-pulse"></div>
                  </div>
                  <h3 className="text-text-primary font-bold text-xl mb-3">Starting camera...</h3>
                  <p className="text-text-secondary">Preparing your premium photo experience</p>
                </div>
              </div>
            )}
            
            {/* Photo Counter Warning - Fixed Position */}
            {photosRemaining <= 3 && (
              <div className="absolute top-20 left-6 right-6 z-20 bg-red-500/20 backdrop-blur-md rounded-xl p-4 text-center border border-red-400/30 shadow-premium">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <div className="w-4 h-4 bg-red-400 rounded-full opacity-60"></div>
                  <p className="text-white font-light">
                    Only {photosRemaining} photos remaining
                  </p>
                </div>
                <p className="text-red-100 text-sm font-light">Make them count</p>
              </div>
            )}

            {/* Camera Overlay */}
            <div className="absolute inset-0 flex flex-col justify-end p-6">

              {/* Upload Status */}
              {isUploading && (
                <div className="bg-blue-500/20 backdrop-blur-md rounded-xl p-4 mb-4 text-center border border-blue-400/30 shadow-premium">
                  <div className="flex items-center justify-center space-x-3">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
                    <span className="text-white font-light">Uploading photo...</span>
                  </div>
                </div>
              )}

              {/* Upload Error */}
              {blobError && (
                <div className="bg-red-500/90 backdrop-blur-sm rounded-lg p-3 mb-4 text-center">
                  <p className="text-white font-bold text-sm mb-2">Upload Issue</p>
                  <p className="text-red-100 text-xs mb-2">{blobError}</p>
                  <p className="text-red-100 text-xs mb-3">Photos are still counted. The issue is likely:</p>
                  <div className="text-red-100 text-xs mb-3 text-left">
                    • Network connection issue<br/>
                    • Vercel Blob storage issue<br/>
                    • File size too large
                  </div>
                  <button
                    onClick={() => window.location.reload()}
                    className="bg-white/20 hover:bg-white/30 text-white text-xs px-3 py-1 rounded"
                  >
                    Refresh Page
                  </button>
                </div>
              )}

              {/* Elegant Camera Controls */}
              <div className="flex justify-center items-center mb-8">
                {/* Capture Button */}
                <button
                  onClick={handleCapture}
                  disabled={!isStreaming || isUploading || photosRemaining <= 0}
                  className="relative w-24 h-24 bg-gradient-to-br from-white to-gray-100 rounded-full border-4 border-white/50 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all duration-200 shadow-2xl hover:shadow-white/20"
                >
                  <div className="absolute inset-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full shadow-inner">
                    <div className="w-full h-full bg-white/20 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Photo Counter - Top Right (Preview) */}
            <div className="absolute top-6 right-6 z-10">
              <div className={`backdrop-blur-md rounded-2xl px-4 py-3 border shadow-lg ${
                photosRemaining <= 3
                  ? 'bg-gradient-to-br from-red-500/80 to-pink-500/80 border-red-400/30'
                  : 'bg-gradient-to-br from-white/10 to-white/5 border-white/20'
              }`}>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-white/60 rounded-full"></div>
                  <span className="text-white text-sm font-semibold tracking-wide">
                    {photosRemaining} left
                  </span>
                </div>
              </div>
            </div>

            {/* Polaroid Photo Preview */}
            <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-200 flex items-center justify-center overflow-auto">
              {capturedPhoto && (
                <PolaroidPhoto
                  imageData={capturedPhoto}
                  userName={userName}
                  onPolaroidReady={handlePolaroidReady}
                  className="max-w-full max-h-full"
                />
              )}
            </div>

            {/* Preview Overlay */}
            <div className="absolute inset-0 flex flex-col justify-end p-6 pointer-events-none">
              <div className="bg-gradient-to-t from-black/80 to-black/40 backdrop-blur-md rounded-3xl p-6 mb-4 pointer-events-auto border border-white/10 shadow-2xl">
                <div className="text-center mb-6">
                  <h3 className="text-white text-xl font-bold mb-2">
                    Your Polaroid Photo
                  </h3>
                  <p className="text-gray-300 text-sm">
                    Keep this vintage-style memory?
                  </p>
                </div>
                <div className="flex space-x-4">
                  <button
                    onClick={handleRetakePhoto}
                    className="flex-1 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl active:scale-95 flex items-center justify-center space-x-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Retake</span>
                  </button>
                  <button
                    onClick={handleKeepPhoto}
                    disabled={!polaroidBlob}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Keep Photo</span>
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Hidden canvas for photo capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Debug Display */}
      <DebugDisplay logs={debugLogs} photosRemaining={photosRemaining} />

    </div>
  )
}

export default CameraInterface
