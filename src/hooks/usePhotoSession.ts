import { useState, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { getEventSession } from '../lib/eventUtils'
import { supabase } from '../lib/supabase'

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

const DEFAULT_MAX_PHOTOS = 10

// Generate user-specific storage key
const getUserPhotoSessionKey = (eventCode: string, userName: string): string => {
  return `aln_photo_session_${eventCode}_${userName.toLowerCase().replace(/[^a-z0-9]/g, '')}`
}

export const usePhotoSession = () => {
  const [sessionData, setSessionData] = useState<SessionData | null>(null)
  const [currentStorageKey, setCurrentStorageKey] = useState<string | null>(null)

  // Sync photo count with database
  const syncWithDatabase = async (eventSession: any): Promise<number> => {
    try {
      console.log(`🔄 Syncing photo count with database for ${eventSession.userName}...`)

      // Get participant data from database
      const { data: participantData, error } = await supabase
        .from('event_participants')
        .select('photos_taken')
        .eq('event_id', eventSession.eventId)
        .eq('user_name', eventSession.userName)
        .single()

      if (error || !participantData) {
        console.log('⚠️ Participant not found in database, assuming 0 photos taken')
        return 0
      }

      const photosTakenFromDB = participantData.photos_taken || 0
      console.log(`📊 Database shows ${photosTakenFromDB} photos taken by ${eventSession.userName}`)
      return photosTakenFromDB

    } catch (error) {
      console.error('❌ Failed to sync with database:', error)
      return 0
    }
  }

  // Load session from localStorage on mount and sync with event session
  useEffect(() => {
    const initializeSession = async () => {
      const eventSession = getEventSession()

      if (eventSession) {
        // Generate user-specific storage key
        const storageKey = getUserPhotoSessionKey(eventSession.eventCode, eventSession.userName)
        setCurrentStorageKey(storageKey)

        // Sync with database to get actual photo count
        const photosTakenFromDB = await syncWithDatabase(eventSession)
        const maxPhotos = DEFAULT_MAX_PHOTOS
        const photosRemaining = Math.max(0, maxPhotos - photosTakenFromDB)

        // Check if we have a saved photo session for this specific user
        const savedSession = localStorage.getItem(storageKey)
        if (savedSession) {
          try {
            const parsed = JSON.parse(savedSession)
            // Only use saved session if it matches current event and user
            if (parsed.eventId === eventSession.eventId && parsed.userName === eventSession.userName) {
              // Update with database count to ensure accuracy
              const updatedSession = {
                ...parsed,
                photosRemaining: photosRemaining,
                photosTaken: parsed.photosTaken.slice(0, photosTakenFromDB) // Keep only actual taken photos
              }
              setSessionData(updatedSession)
              console.log(`📱 Restored photo session for ${eventSession.userName} in event ${eventSession.eventCode} (${photosTakenFromDB} photos taken, ${photosRemaining} remaining)`)
              return
            }
          } catch (error) {
            console.error('Failed to parse saved photo session:', error)
            localStorage.removeItem(storageKey)
          }
        }

        // Create new session with database-synced count
        const newSession: SessionData = {
          sessionId: uuidv4(),
          userName: eventSession.userName,
          photosRemaining: photosRemaining,
          photosTaken: [], // We don't store actual photo data for existing photos
          createdAt: Date.now(),
          eventId: eventSession.eventId,
          maxPhotos: maxPhotos
        }

        setSessionData(newSession)
        console.log(`🔄 Created new photo session for ${eventSession.userName} in event ${eventSession.eventCode} (${photosTakenFromDB} photos taken, ${photosRemaining} remaining)`)

      } else {
        // No event session - clear any current photo session
        setSessionData(null)
        setCurrentStorageKey(null)
      }
    }

    initializeSession()
  }, [])

  // Save session to BOTH localStorage AND sessionStorage for maximum persistence
  useEffect(() => {
    if (sessionData && currentStorageKey) {
      const sessionJson = JSON.stringify(sessionData)
      // Save to localStorage for long-term persistence
      localStorage.setItem(currentStorageKey, sessionJson)
      // ALSO save to sessionStorage for browser navigation persistence
      sessionStorage.setItem(currentStorageKey, sessionJson)
      console.log(`💾 Saved photo session to BOTH storages for ${sessionData.userName} in event ${sessionData.eventId}`)
    }
  }, [sessionData, currentStorageKey])

  const startSession = async (userName: string): Promise<boolean> => {
    if (!userName.trim()) return false

    const eventSession = getEventSession()
    if (!eventSession) {
      console.error('❌ Cannot start photo session without event session')
      return false
    }

    if (eventSession.userName !== userName.trim()) {
      console.error('❌ Photo session username mismatch:', eventSession.userName, 'vs', userName.trim())
      return false
    }

    // Set the storage key for this specific user
    const storageKey = getUserPhotoSessionKey(eventSession.eventCode, userName.trim())
    setCurrentStorageKey(storageKey)

    // Check BOTH sessionStorage AND localStorage for existing session (sessionStorage first for browser navigation)
    let existingSessionData = sessionStorage.getItem(storageKey)
    if (!existingSessionData) {
      existingSessionData = localStorage.getItem(storageKey)
      console.log(`🔍 Checking localStorage for session: ${existingSessionData ? 'FOUND' : 'NOT FOUND'}`)
    } else {
      console.log(`🔍 Found session in sessionStorage: FOUND`)
    }

    // ALWAYS sync with database and create session based on DB truth
    const photosTakenFromDB = await syncWithDatabase(eventSession)
    const maxPhotos = DEFAULT_MAX_PHOTOS
    const photosRemaining = Math.max(0, maxPhotos - photosTakenFromDB)

    console.log(`📊 Database shows: ${photosTakenFromDB} taken, ${photosRemaining} remaining`)

    // Always create session with database-accurate counts
    let sessionToUse: SessionData

    if (existingSessionData) {
      try {
        const parsedSession = JSON.parse(existingSessionData)
        sessionToUse = {
          sessionId: parsedSession.sessionId, // Keep same ID
          userName: userName.trim(),
          photosRemaining: photosRemaining, // ALWAYS from database
          photosTaken: [], // We don't store actual photo data locally
          createdAt: parsedSession.createdAt, // Keep original creation time
          eventId: eventSession.eventId,
          maxPhotos: maxPhotos
        }
        console.log(`🔄 RESTORED session with ${photosRemaining} photos remaining`)
      } catch (error) {
        console.error('❌ Failed to parse existing session, creating new one:', error)
        sessionToUse = {
          sessionId: uuidv4(),
          userName: userName.trim(),
          photosRemaining: photosRemaining,
          photosTaken: [],
          createdAt: Date.now(),
          eventId: eventSession.eventId,
          maxPhotos: maxPhotos
        }
        console.log(`🆕 CREATED new session due to parse error with ${photosRemaining} photos remaining`)
      }
    } else {
      sessionToUse = {
        sessionId: uuidv4(),
        userName: userName.trim(),
        photosRemaining: photosRemaining,
        photosTaken: [],
        createdAt: Date.now(),
        eventId: eventSession.eventId,
        maxPhotos: maxPhotos
      }
      console.log(`🆕 CREATED new session with ${photosRemaining} photos remaining`)
    }

    setSessionData(sessionToUse)
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
    if (currentStorageKey) {
      localStorage.removeItem(currentStorageKey)
    }
    setSessionData(null)
    setCurrentStorageKey(null)
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
