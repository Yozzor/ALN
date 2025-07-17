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

  // Save session to localStorage whenever it changes
  useEffect(() => {
    if (sessionData && currentStorageKey) {
      localStorage.setItem(currentStorageKey, JSON.stringify(sessionData))
      console.log(`💾 Saved photo session for ${sessionData.userName} in event ${sessionData.eventId}`)
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

    // DEBUG: Log all localStorage keys to see what's stored
    console.log('🔍 DEBUG: All localStorage keys:')
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.includes('aln-')) {
        console.log(`  ${key}: ${localStorage.getItem(key)?.substring(0, 100)}...`)
      }
    }
    console.log(`🔍 DEBUG: Looking for photo session with key: ${storageKey}`)

    // Check if there's an existing session for this user in this event
    const existingSessionData = localStorage.getItem(storageKey)
    console.log(`🔍 DEBUG: Existing session data found: ${existingSessionData ? 'YES' : 'NO'}`)
    if (existingSessionData) {
      console.log(`🔍 DEBUG: Existing session data: ${existingSessionData.substring(0, 200)}...`)
    }

    // Sync with database to get actual photo count
    const photosTakenFromDB = await syncWithDatabase(eventSession)
    const maxPhotos = DEFAULT_MAX_PHOTOS
    const photosRemaining = Math.max(0, maxPhotos - photosTakenFromDB)

    let sessionToUse: SessionData

    if (existingSessionData) {
      // Restore existing session but update photo counts from database
      try {
        const existingSession = JSON.parse(existingSessionData) as SessionData
        console.log(`🔍 DEBUG: Parsed existing session:`, existingSession)
        sessionToUse = {
          ...existingSession,
          photosRemaining: photosRemaining, // Update from database
          maxPhotos: maxPhotos
        }
        console.log(`🔄 ✅ RESTORED existing photo session for ${userName.trim()} in event ${eventSession.eventCode}`)
        console.log(`🔄 ✅ Session ID: ${sessionToUse.sessionId}`)
        console.log(`🔄 ✅ Photos from DB: ${photosTakenFromDB}, Remaining: ${photosRemaining}`)
      } catch (error) {
        console.error('❌ Failed to parse existing session, creating new one:', error)
        sessionToUse = {
          sessionId: uuidv4(),
          userName: userName.trim(),
          photosRemaining: photosRemaining,
          photosTaken: [], // We don't store actual photo data for existing photos
          createdAt: Date.now(),
          eventId: eventSession.eventId,
          maxPhotos: maxPhotos
        }
        console.log(`📸 ❌ FALLBACK: Created new session due to parse error`)
      }
    } else {
      // Create new session
      sessionToUse = {
        sessionId: uuidv4(),
        userName: userName.trim(),
        photosRemaining: photosRemaining,
        photosTaken: [], // We don't store actual photo data for existing photos
        createdAt: Date.now(),
        eventId: eventSession.eventId,
        maxPhotos: maxPhotos
      }
      console.log(`📸 🆕 CREATED NEW photo session for ${userName.trim()} in event ${eventSession.eventCode}`)
      console.log(`📸 🆕 Session ID: ${sessionToUse.sessionId}`)
      console.log(`📸 🆕 Photos from DB: ${photosTakenFromDB}, Remaining: ${photosRemaining}`)
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
