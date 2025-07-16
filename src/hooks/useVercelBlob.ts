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

  // Upload photo to Vercel Blob via backend API
  const uploadPhoto = useCallback(async (photoData: PhotoData, userName: string, eventContext?: { eventId: string, eventCode: string }) => {
    setIsUploading(true)
    setUploadProgress(0)
    setError(null)

    try {
      console.log('📸 Starting photo upload to Vercel Blob...')

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
        throw new Error(errorData.error || `Upload failed: ${response.status} ${response.statusText}`)
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
      console.error('❌ Upload failed:', error)
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
