import { useState, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'

interface PhotoData {
  id: string
  blob: Blob
  timestamp: number
  fileName: string
}

interface SessionData {
  sessionId: string
  userName: string
  photosRemaining: number
  photosTaken: PhotoData[]
  createdAt: number
}

const STORAGE_KEY = 'aln_photo_session'
const MAX_PHOTOS = 10

export const usePhotoSession = () => {
  const [sessionData, setSessionData] = useState<SessionData | null>(null)

  // Load session from localStorage on mount
  useEffect(() => {
    const savedSession = localStorage.getItem(STORAGE_KEY)
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession)
        setSessionData(parsed)
      } catch (error) {
        console.error('Failed to parse saved session:', error)
        localStorage.removeItem(STORAGE_KEY)
      }
    }
  }, [])

  // Save session to localStorage whenever it changes
  useEffect(() => {
    if (sessionData) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionData))
    }
  }, [sessionData])

  const startSession = (userName: string): boolean => {
    if (!userName.trim()) return false

    const newSession: SessionData = {
      sessionId: uuidv4(),
      userName: userName.trim(),
      photosRemaining: MAX_PHOTOS,
      photosTaken: [],
      createdAt: Date.now()
    }

    setSessionData(newSession)
    return true
  }

  const takePhoto = (photoBlob: Blob): PhotoData | null => {
    if (!sessionData || sessionData.photosRemaining <= 0) {
      return null
    }

    const photoData: PhotoData = {
      id: uuidv4(),
      blob: photoBlob,
      timestamp: Date.now(),
      fileName: `photo_${sessionData.photosTaken.length + 1}_${Date.now()}.jpg`
    }

    setSessionData(prev => {
      if (!prev) return null
      
      return {
        ...prev,
        photosRemaining: prev.photosRemaining - 1,
        photosTaken: [...prev.photosTaken, photoData]
      }
    })

    return photoData
  }

  const resetSession = () => {
    setSessionData(null)
    localStorage.removeItem(STORAGE_KEY)
  }

  const getSessionStats = () => {
    if (!sessionData) return null

    return {
      totalPhotos: MAX_PHOTOS,
      photosTaken: sessionData.photosTaken.length,
      photosRemaining: sessionData.photosRemaining,
      sessionDuration: Date.now() - sessionData.createdAt
    }
  }

  return {
    // Session state
    sessionId: sessionData?.sessionId || null,
    userName: sessionData?.userName || null,
    photosRemaining: sessionData?.photosRemaining || 0,
    photosTaken: sessionData?.photosTaken || [],
    isSessionActive: !!sessionData,
    
    // Actions
    startSession,
    takePhoto,
    resetSession,
    getSessionStats
  }
}
