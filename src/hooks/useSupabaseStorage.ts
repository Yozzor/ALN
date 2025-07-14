import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

interface PhotoData {
  id: string
  blob: Blob
  timestamp: number
  fileName: string
}

export const useSupabaseStorage = () => {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  // Initialize Supabase storage bucket if needed
  const authenticate = useCallback(async () => {
    try {
      console.log('🚀 Initializing Supabase Storage...')
      
      // Check if bucket exists, create if not
      const { data: buckets, error: listError } = await supabase.storage.listBuckets()
      
      if (listError) {
        console.error('❌ Failed to list buckets:', listError)
        return false
      }

      const bucketExists = buckets?.some(bucket => bucket.name === 'event-photos')
      
      if (!bucketExists) {
        console.log('📁 Creating event-photos bucket...')
        const { error: createError } = await supabase.storage.createBucket('event-photos', {
          public: true,
          fileSizeLimit: 5242880, // 5MB
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp']
        })
        
        if (createError) {
          console.error('❌ Failed to create bucket:', createError)
          return false
        }
        
        console.log('✅ Bucket created successfully!')
      }
      
      console.log('✅ Supabase Storage ready!')
      return true
    } catch (error) {
      console.error('❌ Supabase Storage initialization failed:', error)
      return false
    }
  }, [])

  // Upload photo to Supabase Storage and save metadata to database
  const uploadPhoto = useCallback(async (photoData: PhotoData, userName: string) => {
    setIsUploading(true)
    setUploadProgress(0)
    setError(null)

    try {
      console.log('📸 Starting photo upload to Supabase Storage...')

      // Create file path: event-photos/userName/timestamp-filename.jpg
      const timestamp = new Date(photoData.timestamp).toISOString().replace(/[:.]/g, '-')
      const filePath = `${userName}/${timestamp}-${photoData.fileName}`
      
      setUploadProgress(25)

      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('event-photos')
        .upload(filePath, photoData.blob, {
          contentType: 'image/jpeg',
          upsert: false
        })

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`)
      }

      setUploadProgress(50)

      // Get public URL for the uploaded file
      const { data: urlData } = supabase.storage
        .from('event-photos')
        .getPublicUrl(filePath)

      if (!urlData?.publicUrl) {
        throw new Error('Failed to get public URL for uploaded file')
      }

      setUploadProgress(75)

      // For now, we'll skip saving to database since we need event/participant context
      // This will be implemented when we add the event system
      console.log('📸 Photo uploaded to storage successfully!')
      console.log('🔗 Photo URL:', urlData.publicUrl)

      setUploadProgress(100)

      return {
        success: true,
        url: urlData.publicUrl,
        fileName: filePath,
        message: 'Photo uploaded successfully to Supabase Storage!'
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

  // Fetch photos from Supabase Storage
  const fetchPhotos = useCallback(async () => {
    try {
      console.log('📸 Fetching photos from Supabase Storage...')
      
      // List all files in the bucket
      const { data: files, error: listError } = await supabase.storage
        .from('event-photos')
        .list('', {
          limit: 1000,
          sortBy: { column: 'created_at', order: 'desc' }
        })

      if (listError) {
        throw new Error(`Failed to fetch photos: ${listError.message}`)
      }

      // Transform files to photo format
      const photos = files?.map(file => {
        const { data: urlData } = supabase.storage
          .from('event-photos')
          .getPublicUrl(file.name)

        // Extract username from file path
        const pathParts = file.name.split('/')
        const userName = pathParts.length > 1 ? pathParts[0] : 'unknown'

        return {
          url: urlData.publicUrl,
          fileName: file.name,
          size: file.metadata?.size || 0,
          uploadedAt: file.created_at || new Date().toISOString(),
          userName: userName
        }
      }) || []

      console.log('✅ Photos fetched successfully:', photos.length, 'photos')
      
      return {
        success: true,
        totalPhotos: photos.length,
        photos: photos,
        message: 'Photos retrieved successfully from Supabase Storage!'
      }
    } catch (error) {
      console.error('❌ Failed to fetch photos:', error)
      throw error
    }
  }, [])

  return {
    isAuthenticated: true, // Always authenticated with Supabase
    isUploading,
    uploadProgress,
    error,
    authenticate,
    uploadPhoto,
    fetchPhotos
  }
}


