import { useState, useCallback } from 'react'

interface PhotoData {
  id: string
  blob: Blob
  timestamp: number
  fileName: string
}

export const useVercelBlob = () => {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  // No authentication needed for Vercel Blob - it just works!
  const authenticate = useCallback(async () => {
    console.log('🚀 Vercel Blob ready - no authentication required!')
    return true
  }, [])

  // Upload photo to Vercel Blob via backend API with retry logic
  const uploadPhoto = useCallback(async (photoData: PhotoData, userName: string, eventContext?: { eventId: string, eventCode: string }, retryCount = 0) => {
    setIsUploading(true)
    setUploadProgress(0)
    setError(null)

    const maxRetries = 2;

    try {
      console.log(`📸 Starting photo upload to Vercel Blob... (attempt ${retryCount + 1}/${maxRetries + 1})`)

      // Convert blob to base64
      const base64Data = await blobToBase64(photoData.blob)
      setUploadProgress(25)

      // Prepare upload data
      const uploadData = {
        photoData: base64Data,
        userName: userName,
        fileName: photoData.fileName,
        timestamp: photoData.timestamp,
        eventCode: eventContext?.eventCode,
        eventId: eventContext?.eventId
      }

      setUploadProgress(50)

      // Upload via backend API
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(uploadData)
      })

      setUploadProgress(75)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Upload failed' }))
        console.error('❌ Upload API error:', {
          status: response.status,
          statusText: response.statusText,
          errorData: errorData
        });

        // Provide more specific error messages
        let errorMessage = errorData.error || `Upload failed: ${response.status} ${response.statusText}`;

        if (response.status === 500 && errorData.error?.includes('Blob storage token')) {
          errorMessage = 'Server configuration error: Photo storage not properly configured. Please contact support.';
        } else if (response.status === 413) {
          errorMessage = 'Photo file too large. Please try taking the photo again with lower quality.';
        } else if (response.status === 400) {
          errorMessage = 'Invalid photo data. Please try taking the photo again.';
        }

        throw new Error(errorMessage)
      }

      const result = await response.json()
      setUploadProgress(100)

      console.log('✅ Photo uploaded successfully to Vercel Blob!')
      console.log('🔗 Photo URL:', result.data?.url)

      return {
        success: true,
        url: result.data?.url,
        fileName: result.data?.fileName,
        message: result.message
      }

    } catch (error) {
      console.error(`❌ Upload failed (attempt ${retryCount + 1}):`, error)

      // Retry logic for network/temporary errors
      if (retryCount < maxRetries) {
        const isRetryableError = error instanceof Error && (
          error.message.includes('fetch') ||
          error.message.includes('network') ||
          error.message.includes('timeout') ||
          error.message.includes('500') ||
          error.message.includes('502') ||
          error.message.includes('503')
        );

        if (isRetryableError) {
          console.log(`🔄 Retrying upload in 2 seconds... (${retryCount + 1}/${maxRetries})`);
          setError(`Upload failed, retrying... (${retryCount + 1}/${maxRetries})`);

          await new Promise(resolve => setTimeout(resolve, 2000));
          return uploadPhoto(photoData, userName, eventContext, retryCount + 1);
        }
      }

      const errorMessage = error instanceof Error ? error.message : 'Upload failed'
      setError(errorMessage)
      throw error
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }, [])

  // Fetch all photos from Vercel Blob
  const fetchPhotos = useCallback(async () => {
    try {
      console.log('📸 Fetching photos from Vercel Blob...')
      
      const response = await fetch('/api/photos')
      
      if (!response.ok) {
        throw new Error(`Failed to fetch photos: ${response.status}`)
      }
      
      const result = await response.json()
      console.log('✅ Photos fetched successfully:', result.totalPhotos, 'photos')
      
      return result
    } catch (error) {
      console.error('❌ Failed to fetch photos:', error)
      throw error
    }
  }, [])

  return {
    isAuthenticated: true, // Always authenticated with Vercel Blob
    isUploading,
    uploadProgress,
    error,
    authenticate,
    uploadPhoto,
    fetchPhotos
  }
}

// Helper function to convert blob to base64
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
      } else {
        reject(new Error('Failed to convert blob to base64'))
      }
    }
    reader.onerror = () => reject(new Error('Failed to read blob'))
    reader.readAsDataURL(blob)
  })
}
