import { useState, useEffect } from 'react'
import LobbyLanding from './LobbyLanding'
import EventCreation, { type EventCreationData } from './EventCreation'
import EventCreated from './EventCreated'
import CameraInterface from './CameraInterface'
import GameOverScreen from './GameOverScreen'
import { usePhotoSession } from '../hooks/usePhotoSession'
import { useVercelBlob } from '../hooks/useVercelBlob'
import { testSupabaseConnection } from '../utils/supabaseTest'
import {
  createEvent,
  findEventByCode,
  joinEvent,
  isEventFull,
  saveEventSession,
  getEventSession,
  clearEventSession,
  type EventSession
} from '../lib/eventUtils'
import { type Event } from '../lib/supabase'

type AppState = 'lobby' | 'createEvent' | 'eventCreated' | 'camera' | 'gameOver'

const MobileApp = () => {
  const [appState, setAppState] = useState<AppState>('lobby')
  const [supabaseReady, setSupabaseReady] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null)
  const [eventSession, setEventSession] = useState<EventSession | null>(null)
  const [prefilledEventCode, setPrefilledEventCode] = useState<string | undefined>(undefined)

  const {
    userName,
    photosRemaining,
    startSession,
    takePhoto
  } = usePhotoSession()

  const {
    isAuthenticated,
    isUploading,
    error: blobError,
    authenticate,
    uploadPhoto
  } = useVercelBlob()

  // Test Supabase connection and check for existing session on app load
  useEffect(() => {
    const initApp = async () => {
      console.log('🚀 Initializing About Last Night app...')
      try {
        const isReady = await testSupabaseConnection()
        setSupabaseReady(isReady)

        if (isReady) {
          console.log('✅ App ready with Supabase integration!')

          // Check for URL parameters (QR code scan)
          const urlParams = new URLSearchParams(window.location.search)
          const eventCodeFromUrl = urlParams.get('code')

          if (eventCodeFromUrl) {
            console.log('🔗 Event code detected from URL:', eventCodeFromUrl)
            // Clear URL parameter to avoid confusion
            window.history.replaceState({}, document.title, window.location.pathname)
            // Set the prefilled code and go to lobby
            setPrefilledEventCode(eventCodeFromUrl.toUpperCase())
            setAppState('lobby')
            return
          }

          // Check for existing event session
          const savedSession = getEventSession()
          if (savedSession) {
            console.log('📱 Found existing event session:', savedSession)
            setEventSession(savedSession)

            // Try to find the event to make sure it still exists
            try {
              const event = await findEventByCode(savedSession.eventCode)
              if (event) {
                setCurrentEvent(event)
                // Start the photo session with saved user name
                const success = startSession(savedSession.userName)
                if (success) {
                  await authenticate()
                  if (photosRemaining > 0) {
                    setAppState('camera')
                  } else {
                    setAppState('gameOver')
                  }
                } else {
                  // Session failed, clear and start fresh
                  clearEventSession()
                  setEventSession(null)
                  setAppState('lobby')
                }
              } else {
                // Event no longer exists, clear session
                clearEventSession()
                setEventSession(null)
                setAppState('lobby')
              }
            } catch (error) {
              console.error('Error validating saved session:', error)
              clearEventSession()
              setEventSession(null)
              setAppState('lobby')
            }
          }
        } else {
          // IMPORTANT: Force app to continue even if Supabase test fails
          console.warn('⚠️ Supabase test failed but continuing anyway')
          setSupabaseReady(true) // Force ready state to true
        }
      } catch (error) {
        console.error('❌ Error testing Supabase:', error)
        // IMPORTANT: Force app to continue even if Supabase test throws error
        setSupabaseReady(true) // Force ready state to true
      }
    }

    initApp()
  }, [])

  // Handle joining an existing event
  const handleJoinEvent = async (eventCode: string, userName: string) => {
    setIsLoading(true)
    setError('')

    try {
      console.log(`🔑 Attempting to join event: ${eventCode}`)

      // Find the event
      const event = await findEventByCode(eventCode)
      if (!event) {
        setError('Event not found. Please check the code and try again.')
        return
      }

      // Check if event is full
      const isFull = await isEventFull(event.id)
      if (isFull) {
        setError('This event is full. No more participants can join.')
        return
      }

      // Join the event
      const participantId = await joinEvent(event.id, userName)

      // Create session
      const session: EventSession = {
        eventId: event.id,
        eventCode: event.event_code,
        participantId,
        userName,
        eventTitle: event.title
      }

      // Save session and start photo session
      saveEventSession(session)
      setEventSession(session)
      setCurrentEvent(event)

      const success = startSession(userName)
      if (success) {
        await authenticate()
        setAppState('camera')
      } else {
        setError('Failed to start photo session')
      }

      console.log('✅ Successfully joined event!')
    } catch (error) {
      console.error('❌ Error joining event:', error)
      setError('Failed to join event. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle creating a new event
  const handleCreateEvent = async (eventData: EventCreationData) => {
    setIsLoading(true)
    setError('')

    try {
      console.log('🎉 Creating new event:', eventData)

      const event = await createEvent(eventData)
      setCurrentEvent(event)
      setAppState('eventCreated')

      console.log('✅ Event created successfully!')
    } catch (error) {
      console.error('❌ Error creating event:', error)
      setError('Failed to create event. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle entering the created event
  const handleEnterCreatedEvent = async (userName: string) => {
    if (!currentEvent) return

    setIsLoading(true)
    setError('')

    try {
      // Join the event as organizer
      const participantId = await joinEvent(currentEvent.id, userName)

      // Create session
      const session: EventSession = {
        eventId: currentEvent.id,
        eventCode: currentEvent.event_code,
        participantId,
        userName,
        eventTitle: currentEvent.title
      }

      // Save session and start photo session
      saveEventSession(session)
      setEventSession(session)

      const success = startSession(userName)
      if (success) {
        await authenticate()
        setAppState('camera')
      } else {
        setError('Failed to start photo session')
      }
    } catch (error) {
      console.error('❌ Error entering event:', error)
      setError('Failed to enter event. Please try again.')
    } finally {
      setIsLoading(false)
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
    clearEventSession()
    setEventSession(null)
    setCurrentEvent(null)
    setAppState('lobby')
  }

  const handleBackToLobby = () => {
    setAppState('lobby')
    setCurrentEvent(null)
    setError('')
    setPrefilledEventCode(undefined)
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
        {appState === 'lobby' && (
          <LobbyLanding
            onJoinEvent={handleJoinEvent}
            onCreateEvent={() => setAppState('createEvent')}
            isLoading={isLoading || !supabaseReady}
            prefilledEventCode={prefilledEventCode}
          />
        )}

        {appState === 'createEvent' && (
          <EventCreation
            onCreateEvent={handleCreateEvent}
            onBack={handleBackToLobby}
            isLoading={isLoading}
          />
        )}

        {appState === 'eventCreated' && currentEvent && (
          <EventCreated
            event={currentEvent}
            onEnterEvent={handleEnterCreatedEvent}
            isLoading={isLoading}
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

        {/* Error Display */}
        {error && (
          <div className="fixed top-20 left-4 right-4 bg-red-500 text-white p-4 rounded-xl z-50 animate-fade-in">
            <p className="text-sm font-medium">{error}</p>
            <button
              onClick={() => setError('')}
              className="absolute top-2 right-2 text-white hover:text-gray-200"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Premium Gallery Link - Fixed position - Only show if user is in an event */}
      {eventSession && (
        <div className="fixed top-6 right-6 z-50">
          <a
            href={`/gallery?event=${eventSession.eventCode}&user=${encodeURIComponent(eventSession.userName)}`}
            className="group bg-surface-card hover:bg-surface-hover border border-border-primary
                       text-text-primary px-4 py-2.5 rounded-lg shadow-premium hover:shadow-premium-lg transition-all duration-300
                       hover:-translate-y-0.5 active:translate-y-0 backdrop-blur-sm flex items-center gap-2"
            title="View Event Gallery"
          >
            <div className="w-3.5 h-3.5 bg-text-primary opacity-60 rounded-sm flex-shrink-0"></div>
            <span className="text-sm font-medium tracking-wide">
              Gallery
            </span>
          </a>
        </div>
      )}

      {/* Event Info - Show current event details */}
      {eventSession && appState === 'camera' && (
        <div className="fixed top-6 left-6 z-50">
          <div className="bg-surface-card border border-border-primary text-text-primary px-4 py-2.5 rounded-lg shadow-premium backdrop-blur-sm">
            <div className="text-xs text-text-tertiary mb-1">Event</div>
            <div className="text-sm font-medium tracking-wide">{eventSession.eventCode}</div>
          </div>
        </div>
      )}



      {/* Ambient lighting effects */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-orange-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>
    </div>
  )
}

export default MobileApp
