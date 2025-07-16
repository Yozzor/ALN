import { useState, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { getEventSession } from '../lib/eventUtils'

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
  eventId?: string // Link to current event
  maxPhotos?: number // Event-specific photo limit
}

const STORAGE_KEY = 'aln_photo_session'
const DEFAULT_MAX_PHOTOS = 10

export const usePhotoSession = () => {
  const [sessionData, setSessionData] = useState<SessionData | null>(null)

  // Load session from localStorage on mount and sync with event session
  useEffect(() => {
    const eventSession = getEventSession()
    const savedSession = localStorage.getItem(STORAGE_KEY)

    if (eventSession) {
      // If we have an event session, check if photo session matches
      if (savedSession) {
        try {
          const parsed = JSON.parse(savedSession)
          // Only use saved session if it matches current event
          if (parsed.eventId === eventSession.eventId && parsed.userName === eventSession.userName) {
            setSessionData(parsed)
            return
          }
        } catch (error) {
          console.error('Failed to parse saved session:', error)
        }
      }

      // Create new photo session for current event
      console.log('🔄 Creating new photo session for event:', eventSession.eventCode)
      // We'll get the max photos from the event when starting the session

    } else if (savedSession) {
      // No event session but we have a saved photo session - this shouldn't happen in new system
      console.warn('⚠️ Found photo session without event session - clearing')
      localStorage.removeItem(STORAGE_KEY)
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

    const eventSession = getEventSession()
    if (!eventSession) {
      console.error('❌ Cannot start photo session without event session')
      return false
    }

    // TODO: Get max photos from event data via Supabase
    // For now, use default but this should come from the event
    const maxPhotos = DEFAULT_MAX_PHOTOS

    const newSession: SessionData = {
      sessionId: uuidv4(),
      userName: userName.trim(),
      photosRemaining: maxPhotos,
      photosTaken: [],
      createdAt: Date.now(),
      eventId: eventSession.eventId,
      maxPhotos: maxPhotos
    }

    console.log('📸 Starting photo session for event:', eventSession.eventCode, 'Max photos:', maxPhotos)
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
    console.log('🗑️ Clearing photo session')
    setSessionData(null)
    localStorage.removeItem(STORAGE_KEY)
  }

  // Clear session when event changes
  const clearSessionForNewEvent = () => {
    console.log('🔄 Clearing photo session for new event')
    resetSession()
  }

  const getSessionStats = () => {
    if (!sessionData) return null

    return {
      totalPhotos: sessionData.maxPhotos || DEFAULT_MAX_PHOTOS,
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
    clearSessionForNewEvent,
    getSessionStats
  }
}
