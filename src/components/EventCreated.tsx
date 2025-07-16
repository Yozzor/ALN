import { useState } from 'react'
import QRCode from 'qrcode'
import { Event } from '../lib/supabase'

interface EventCreatedProps {
  event: Event
  onEnterEvent: (userName: string) => void
  isLoading: boolean
}

const EventCreated = ({ event, onEnterEvent, isLoading }: EventCreatedProps) => {
  const [userName, setUserName] = useState('')
  const [error, setError] = useState('')
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const [showQR, setShowQR] = useState(false)

  const handleEnterEvent = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!userName.trim()) {
      setError('Please enter your name')
      return
    }

    if (userName.trim().length < 2) {
      setError('Name must be at least 2 characters')
      return
    }

    setError('')
    onEnterEvent(userName.trim())
  }

  const generateQRCode = async () => {
    try {
      const eventUrl = `${window.location.origin}?code=${event.event_code}`
      const qrUrl = await QRCode.toDataURL(eventUrl, {
        width: 256,
        margin: 2,
        color: {
          dark: '#1a1a1a',
          light: '#ffffff'
        }
      })
      setQrCodeUrl(qrUrl)
      setShowQR(true)
    } catch (error) {
      console.error('Failed to generate QR code:', error)
    }
  }

  const copyEventCode = async () => {
    try {
      await navigator.clipboard.writeText(event.event_code)
      // Could add a toast notification here
    } catch (error) {
      console.error('Failed to copy event code:', error)
    }
  }

  const copyEventUrl = async () => {
    try {
      const eventUrl = `${window.location.origin}?code=${event.event_code}`
      await navigator.clipboard.writeText(eventUrl)
      // Could add a toast notification here
    } catch (error) {
      console.error('Failed to copy event URL:', error)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/3 w-72 h-72 bg-primary-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/3 w-72 h-72 bg-accent-orange-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

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
          <div className="text-4xl mb-4">🎉</div>
          <h1 className="text-text-primary text-xl font-light mb-2 tracking-wide">
            Event Created!
          </h1>
          <p className="text-text-tertiary text-sm font-light tracking-wider">
            Share the code with your guests
          </p>
        </div>

        {/* Event Details */}
        <div className="card-elevated p-8 mb-6 animate-slide-up">
          <div className="text-center mb-6">
            <h2 className="text-lg font-medium text-text-primary mb-2 tracking-wide">
              {event.title}
            </h2>
            <p className="text-text-secondary text-sm">
              {event.event_type.charAt(0).toUpperCase() + event.event_type.slice(1)} Event
            </p>
          </div>

          {/* Event Code */}
          <div className="bg-surface-secondary rounded-xl p-6 mb-6">
            <div className="text-center">
              <p className="text-text-tertiary text-sm mb-2 tracking-wide">Event Code</p>
              <div className="text-3xl font-mono tracking-widest text-text-primary mb-4">
                {event.event_code}
              </div>
              <button
                onClick={copyEventCode}
                className="text-primary-400 hover:text-primary-300 text-sm font-medium transition-colors"
              >
                📋 Copy Code
              </button>
            </div>
          </div>

          {/* Sharing Options */}
          <div className="space-y-3 mb-6">
            <button
              onClick={generateQRCode}
              className="w-full bg-surface-secondary hover:bg-surface-hover text-text-primary py-3 rounded-xl transition-colors font-medium"
            >
              📱 Generate QR Code
            </button>

            <button
              onClick={copyEventUrl}
              className="w-full bg-surface-secondary hover:bg-surface-hover text-text-primary py-3 rounded-xl transition-colors font-medium"
            >
              🔗 Copy Event Link
            </button>
          </div>

          {/* QR Code Display */}
          {showQR && qrCodeUrl && (
            <div className="bg-white rounded-xl p-6 mb-6 text-center">
              <img
                src={qrCodeUrl}
                alt="Event QR Code"
                className="mx-auto mb-3"
              />
              <p className="text-gray-600 text-sm">
                Scan to join event
              </p>
            </div>
          )}

          {/* Enter Event Form */}
          <div className="border-t border-surface-secondary pt-6">
            <h3 className="text-text-primary font-medium mb-4 text-center tracking-wide">
              Enter Your Event
            </h3>
            
            <form onSubmit={handleEnterEvent} className="space-y-4">
              <div>
                <label htmlFor="userName" className="block text-sm font-medium text-text-primary mb-3 tracking-wide">
                  Your Name
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
                />
              </div>

              {error && (
                <p className="text-red-400 text-sm font-light">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={isLoading || !userName.trim()}
                className="btn-primary w-full text-base py-4 font-medium tracking-wide"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                    Entering event...
                  </div>
                ) : (
                  'Enter Event'
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Event Info */}
        <div className="space-y-3">
          <div className="glass rounded-xl p-4">
            <div className="flex justify-between items-center">
              <span className="text-text-tertiary text-sm">Max Guests:</span>
              <span className="text-text-primary font-medium">{event.max_participants}</span>
            </div>
          </div>

          <div className="glass rounded-xl p-4">
            <div className="flex justify-between items-center">
              <span className="text-text-tertiary text-sm">Photos per Person:</span>
              <span className="text-text-primary font-medium">{event.max_photos_per_user}</span>
            </div>
          </div>

          <div className="glass rounded-xl p-4">
            <div className="flex justify-between items-center">
              <span className="text-text-tertiary text-sm">Duration:</span>
              <span className="text-text-primary font-medium">
                {event.duration_minutes >= 1440 
                  ? `${Math.floor(event.duration_minutes / 1440)} day${Math.floor(event.duration_minutes / 1440) > 1 ? 's' : ''}`
                  : event.duration_minutes >= 60 
                    ? `${Math.floor(event.duration_minutes / 60)} hour${Math.floor(event.duration_minutes / 60) > 1 ? 's' : ''}`
                    : `${event.duration_minutes} min`
                }
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EventCreated
