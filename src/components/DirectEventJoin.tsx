import { useState, useEffect } from 'react'
import { findEventByCode, joinEvent, isEventFull, saveEventSession, type EventSession } from '../lib/eventUtils'
import { type Event } from '../lib/supabase'

interface DirectEventJoinProps {
  eventCode: string
  onJoinSuccess: (session: EventSession) => void
  onError: (error: string) => void
  isLoading: boolean
}

const DirectEventJoin = ({ eventCode, onJoinSuccess, onError, isLoading }: DirectEventJoinProps) => {
  const [userName, setUserName] = useState('')
  const [event, setEvent] = useState<Event | null>(null)
  const [validating, setValidating] = useState(true)
  const [error, setError] = useState('')

  // Validate event code on mount
  useEffect(() => {
    const validateEvent = async () => {
      try {
        console.log(`🔍 Validating event code: ${eventCode}`)
        
        const foundEvent = await findEventByCode(eventCode)
        if (!foundEvent) {
          onError('Event not found. Please check the code and try again.')
          return
        }

        const isFull = await isEventFull(foundEvent.id)
        if (isFull) {
          onError('This event is full. No more participants can join.')
          return
        }

        setEvent(foundEvent)
        console.log(`✅ Event validated: ${foundEvent.title}`)
      } catch (error) {
        console.error('❌ Error validating event:', error)
        onError('Failed to validate event. Please try again.')
      } finally {
        setValidating(false)
      }
    }

    validateEvent()
  }, [eventCode, onError])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!userName.trim()) {
      setError('Please enter your name')
      return
    }

    if (userName.trim().length < 2) {
      setError('Name must be at least 2 characters')
      return
    }

    if (!event) {
      setError('Event information not available')
      return
    }

    try {
      console.log(`🚀 Joining event ${eventCode} as ${userName.trim()}`)
      
      // Join the event
      const participantId = await joinEvent(event.id, userName.trim())
      
      // Create session
      const session: EventSession = {
        eventId: event.id,
        eventCode: event.event_code,
        participantId,
        userName: userName.trim(),
        eventTitle: event.title
      }
      
      // Save session
      saveEventSession(session)
      
      console.log('✅ Successfully joined event!')
      onJoinSuccess(session)
      
    } catch (error) {
      console.error('❌ Error joining event:', error)
      setError('Failed to join event. Please try again.')
    }
  }

  if (validating) {
    return (
      <div className="min-h-screen bg-surface-primary flex items-center justify-center p-4">
        <div className="text-center animate-fade-in">
          <div className="relative mb-8">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-surface-hover border-t-primary-500 mx-auto"></div>
          </div>
          <h2 className="text-text-primary font-light text-xl mb-3 tracking-wide">Validating Event</h2>
          <p className="text-text-tertiary font-light">Checking event code: {eventCode}</p>
        </div>
      </div>
    )
  }

  if (!event) {
    return null // Error will be handled by parent
  }

  return (
    <div className="min-h-screen bg-surface-primary relative overflow-hidden">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-surface-primary via-surface-secondary to-surface-tertiary opacity-80"></div>

      {/* Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md relative z-10 animate-fade-in">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mb-6 relative">
              <img
                src="/alnlogowhite.png"
                alt="About Last Night Logo"
                className="w-48 h-auto mx-auto drop-shadow-2xl"
              />
            </div>
            <h1 className="text-text-primary text-xl font-light mb-2 tracking-wide">
              🎉 Join Event
            </h1>
            <p className="text-text-tertiary text-sm font-light tracking-wider mb-2">
              You're joining: <span className="text-primary-400 font-medium">{event.title}</span>
            </p>
            <p className="text-text-tertiary text-xs font-light">
              Event Code: <span className="font-mono text-green-400">{eventCode}</span>
            </p>
          </div>

          {/* Join Form */}
          <div className="card-elevated p-8 mb-6 animate-slide-up">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="userName" className="block text-sm font-medium text-text-primary mb-3 tracking-wide">
                  Your Name *
                </label>
                <input
                  type="text"
                  id="userName"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="input-field text-base py-4 font-light"
                  placeholder="Enter your name"
                  disabled={isLoading}
                  autoComplete="given-name"
                  autoFocus
                />
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                  <p className="text-red-400 text-sm font-medium">{error}</p>
                </div>
              )}

              <button
                type="submit"
                className="btn-primary w-full py-4 text-base font-medium tracking-wide"
                disabled={isLoading || !userName.trim()}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></div>
                    Joining Event...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-xl">🚀</span>
                    Join {event.title}
                  </div>
                )}
              </button>
            </form>
          </div>

          {/* Event Info */}
          <div className="card-elevated p-6 animate-slide-up" style={{ animationDelay: '200ms' }}>
            <h3 className="text-text-primary font-medium mb-4 tracking-wide">Event Details</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-text-tertiary">Type:</span>
                <span className="text-text-primary capitalize">{event.event_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-tertiary">Max Participants:</span>
                <span className="text-text-primary">{event.max_participants}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-tertiary">Photos per Person:</span>
                <span className="text-text-primary">{event.max_photos_per_user}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-tertiary">Status:</span>
                <span className={`capitalize ${
                  event.status === 'waiting' ? 'text-yellow-400' :
                  event.status === 'active' ? 'text-green-400' :
                  'text-gray-400'
                }`}>
                  {event.status}
                </span>
              </div>
            </div>
          </div>

          {/* Back to Main */}
          <div className="text-center mt-6">
            <a
              href="/"
              className="text-text-tertiary hover:text-text-primary text-sm font-light tracking-wide transition-colors"
            >
              ← Back to Main Page
            </a>
          </div>
        </div>
      </div>

      {/* Ambient lighting effects */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-orange-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>
    </div>
  )
}

export default DirectEventJoin
