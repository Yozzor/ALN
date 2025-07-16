import { useRef, useState, useCallback, useEffect } from 'react'

interface CaptureResult {
  dataUrl: string
  blob: Blob
}





export const useCamera = () => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const trackRef = useRef<MediaStreamTrack | null>(null)

  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)





  const startCamera = useCallback(async () => {
    try {
      setError(null)
      console.log('📸 Starting simple camera...')

      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported in this browser')
      }

      // Stop any existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }

      // High-quality camera constraints
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: 'environment', // Back camera
          width: { ideal: 1920, max: 4096 },
          height: { ideal: 1080, max: 2160 }
        },
        audio: false
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        
        // Get the video track
        const videoTrack = stream.getVideoTracks()[0]
        trackRef.current = videoTrack

        console.log('📸 Simple camera started successfully')

        // Wait for video to be ready with timeout and proper error handling
        await new Promise<void>((resolve, reject) => {
          if (!videoRef.current) {
            reject(new Error('Video element not available'))
            return
          }

          const video = videoRef.current
          let resolved = false

          const onLoadedMetadata = () => {
            if (!resolved) {
              resolved = true
              console.log('📸 Video metadata loaded, stream ready')
              setIsStreaming(true)
              resolve()
            }
          }

          const onCanPlay = () => {
            if (!resolved) {
              resolved = true
              console.log('📸 Video can play, stream ready')
              setIsStreaming(true)
              resolve()
            }
          }

          // Set up event listeners
          video.addEventListener('loadedmetadata', onLoadedMetadata, { once: true })
          video.addEventListener('canplay', onCanPlay, { once: true })

          // Timeout fallback
          const timeout = setTimeout(() => {
            if (!resolved) {
              resolved = true
              console.log('📸 Video ready timeout, assuming stream is ready')
              setIsStreaming(true)
              resolve()
            }
          }, 3000)

          // Cleanup function
          const cleanup = () => {
            video.removeEventListener('loadedmetadata', onLoadedMetadata)
            video.removeEventListener('canplay', onCanPlay)
            clearTimeout(timeout)
          }

          // If video is already ready
          if (video.readyState >= 2) { // HAVE_CURRENT_DATA
            cleanup()
            onLoadedMetadata()
          }
        })
      }
    } catch (err) {
      console.error('Camera access failed:', err)
      
      let errorMessage = 'Failed to access camera'

      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          errorMessage = 'Camera permission denied. Please tap the camera icon in your browser address bar and select "Allow", then try again.'
        } else if (err.name === 'NotFoundError') {
          errorMessage = 'No camera found on this device. Make sure you\'re using a phone or tablet with a camera.'
        } else if (err.name === 'NotSupportedError') {
          errorMessage = 'Camera is not supported in this browser. Try Chrome or Safari.'
        } else if (err.name === 'NotReadableError') {
          errorMessage = 'Camera is already in use by another app. Close other camera apps and try again.'
        } else if (err.name === 'OverconstrainedError') {
          errorMessage = 'Camera constraints not supported. Try a different browser.'
        } else {
          errorMessage = `Camera error: ${err.name} - ${err.message}. Try using HTTPS or a different browser.`
        }
      }
      
      setError(errorMessage)
      setIsStreaming(false)
    }
  }, [])

  const stopCamera = useCallback(() => {
    console.log('📸 Stopping camera...')

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop()
        console.log('📸 Stopped track:', track.kind)
      })
      streamRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
      // Clear any event listeners
      videoRef.current.onloadedmetadata = null
    }

    trackRef.current = null
    setIsStreaming(false)
    console.log('📸 Camera stopped')
  }, [])

  // Restart camera - useful after photo capture or browser visibility changes
  const restartCamera = useCallback(async () => {
    console.log('📸 Restarting camera...')
    stopCamera()

    // Small delay to ensure cleanup
    await new Promise(resolve => setTimeout(resolve, 100))

    await startCamera()
  }, [stopCamera, startCamera])

  const capturePhoto = useCallback(async (): Promise<CaptureResult | null> => {
    if (!videoRef.current || !canvasRef.current || !isStreaming) {
      console.log('❌ Cannot capture: missing refs or not streaming')
      return null
    }

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    if (!context) {
      console.log('❌ Cannot get canvas context')
      return null
    }

    // Optimized canvas size for mobile uploads (max 1200px width for good quality but smaller files)
    const maxWidth = 1200
    const aspectRatio = video.videoHeight / video.videoWidth

    if (video.videoWidth > maxWidth) {
      canvas.width = maxWidth
      canvas.height = maxWidth * aspectRatio
    } else {
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
    }

    // Draw the current video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Get the image data with optimized quality (0.75 for good quality but smaller files)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.75)

    // Convert to blob for upload with optimized quality
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob!)
      }, 'image/jpeg', 0.75)
    })

    console.log('📸 Photo captured successfully')
    // Keep camera running - don't stop the stream
    return { dataUrl, blob }
  }, [isStreaming])

  const switchCamera = useCallback(async () => {
    if (!isStreaming) return

    stopCamera()
    
    // Try to switch between front and back camera
    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: streamRef.current?.getVideoTracks()[0].getSettings().facingMode === 'environment' 
            ? 'user' 
            : 'environment',
          width: { ideal: 1920, max: 1920 },
          height: { ideal: 1080, max: 1080 }
        },
        audio: false
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setIsStreaming(true)
      }
    } catch (err) {
      console.error('Failed to switch camera:', err)
      // Fallback to original camera
      startCamera()
    }
  }, [isStreaming, startCamera])

  // Handle browser visibility changes to restart camera
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !isStreaming) {
        console.log('📸 App became visible, restarting camera...')
        setTimeout(() => {
          startCamera()
        }, 500) // Small delay to ensure browser is ready
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isStreaming, startCamera])

  return {
    videoRef,
    canvasRef,
    isStreaming,
    error,
    startCamera,
    stopCamera,
    restartCamera,
    capturePhoto,
    switchCamera
  }
}
