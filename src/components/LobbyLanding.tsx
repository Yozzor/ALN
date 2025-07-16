import { useState } from 'react'

interface LobbyLandingProps {
  onJoinEvent: (eventCode: string, userName: string) => void
  onCreateEvent: () => void
  isLoading: boolean
  prefilledEventCode?: string
}

const LobbyLanding = ({ onJoinEvent, onCreateEvent, isLoading, prefilledEventCode }: LobbyLandingProps) => {
  const [mode, setMode] = useState<'select' | 'join'>(prefilledEventCode ? 'join' : 'select')
  const [eventCode, setEventCode] = useState(prefilledEventCode || '')
  const [userName, setUserName] = useState('')
  const [error, setError] = useState('')

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!eventCode.trim()) {
      setError('Please enter an event code')
      return
    }

    if (eventCode.trim().length !== 6) {
      setError('Event code must be 6 characters')
      return
    }

    if (!userName.trim()) {
      setError('Please enter your name')
      return
    }

    if (userName.trim().length < 2) {
      setError('Name must be at least 2 characters')
      return
    }

    setError('')
    onJoinEvent(eventCode.trim().toUpperCase(), userName.trim())
  }

  const handleBack = () => {
    setMode('select')
    setEventCode('')
    setUserName('')
    setError('')
  }

  if (mode === 'join') {
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
            <h1 className="text-text-primary text-xl font-light mb-2 tracking-wide">
              {prefilledEventCode ? '🔗 Join Event' : 'Join Event'}
            </h1>
            <p className="text-text-tertiary text-sm font-light tracking-wider">
              {prefilledEventCode ? 'Event code detected! Enter your name to join.' : 'Enter your event code to join'}
            </p>
          </div>

          {/* Join Form */}
          <div className="card-elevated p-8 mb-6 animate-slide-up">
            <form onSubmit={handleJoinSubmit} className="space-y-6">
              <div>
                <label htmlFor="eventCode" className="block text-sm font-medium text-text-primary mb-3 tracking-wide">
                  Event Code {prefilledEventCode && <span className="text-green-400">✓ Detected</span>}
                </label>
                <input
                  type="text"
                  id="eventCode"
                  value={eventCode}
                  onChange={(e) => setEventCode(e.target.value.toUpperCase())}
                  className={`input-field text-center text-lg py-4 font-mono tracking-widest ${
                    prefilledEventCode ? 'border-green-500 bg-green-500/10' : ''
                  }`}
                  placeholder="ABC123"
                  maxLength={6}
                  disabled={isLoading}
                  autoComplete="off"
                  autoFocus={!prefilledEventCode}
                />
              </div>

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
                  autoFocus={!!prefilledEventCode}
                />
              </div>

              {error && (
                <p className="text-red-400 text-sm font-light">
                  {error}
                </p>
              )}

              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={isLoading || !eventCode.trim() || !userName.trim()}
                  className="btn-primary w-full text-base py-4 font-medium tracking-wide"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                      Joining event...
                    </div>
                  ) : (
                    'Join Event'
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleBack}
                  disabled={isLoading}
                  className="w-full bg-surface-secondary hover:bg-surface-hover text-text-primary py-4 rounded-xl transition-colors font-medium tracking-wide"
                >
                  Back
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    )
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
        <div className="text-center mb-12">
          <div className="mb-10 relative">
            <img
              src="/alnlogowhite.png"
              alt="About Last Night Logo"
              className="w-64 h-auto mx-auto drop-shadow-2xl"
            />
          </div>
          <h1 className="text-text-primary text-xl font-light mb-3 tracking-wide">
            Wedding Photo Events
          </h1>
          <p className="text-text-tertiary text-sm font-light tracking-wider uppercase">
            Private Event Platform
          </p>
        </div>

        {/* Action Cards */}
        <div className="space-y-4 mb-10">
          {/* Join Event Card */}
          <button
            onClick={() => setMode('join')}
            disabled={isLoading}
            className="w-full card-elevated p-8 hover:bg-surface-hover/30 transition-all duration-300 text-left group"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">🔑</span>
                  <h3 className="text-lg font-medium text-text-primary tracking-wide">Join Event</h3>
                </div>
                <p className="text-text-secondary text-sm font-light leading-relaxed">
                  Enter a 6-character event code to join an existing wedding or event
                </p>
              </div>
              <span className="text-text-tertiary group-hover:text-text-primary transition-colors text-xl">→</span>
            </div>
          </button>

          {/* Create Event Card */}
          <button
            onClick={onCreateEvent}
            disabled={isLoading}
            className="w-full card-elevated p-8 hover:bg-surface-hover/30 transition-all duration-300 text-left group"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">➕</span>
                  <h3 className="text-lg font-medium text-text-primary tracking-wide">Create Event</h3>
                </div>
                <p className="text-text-secondary text-sm font-light leading-relaxed">
                  Start a new private event and get a shareable code for your guests
                </p>
              </div>
              <span className="text-text-tertiary group-hover:text-text-primary transition-colors text-xl">→</span>
            </div>
          </button>
        </div>

        {/* Features */}
        <div className="space-y-3 mb-10">
          <div className="glass rounded-xl p-6">
            <h3 className="font-medium text-text-primary mb-2 tracking-wide">🔒 Private Events</h3>
            <p className="text-text-tertiary text-sm font-light leading-relaxed">
              Each event is completely isolated with its own photos and voting
            </p>
          </div>

          <div className="glass rounded-xl p-6">
            <h3 className="font-medium text-text-primary mb-2 tracking-wide">📱 Easy Sharing</h3>
            <p className="text-text-tertiary text-sm font-light leading-relaxed">
              Share event codes or QR codes with guests for instant access
            </p>
          </div>

          <div className="glass rounded-xl p-6">
            <h3 className="font-medium text-text-primary mb-2 tracking-wide">🏆 Live Voting</h3>
            <p className="text-text-tertiary text-sm font-light leading-relaxed">
              Real-time photo competitions with award categories
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-text-muted text-xs font-light tracking-wider">
            Premium event photo platform
          </p>
        </div>
      </div>
    </div>
  )
}

export default LobbyLanding
