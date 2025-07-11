import { useState } from 'react'

interface WelcomeScreenProps {
  onStartSession: (name: string) => void
  isLoading: boolean
}

const WelcomeScreen = ({ onStartSession, isLoading }: WelcomeScreenProps) => {
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) {
      setError('Please enter your name')
      return
    }

    if (name.trim().length < 2) {
      setError('Name must be at least 2 characters')
      return
    }

    setError('')
    onStartSession(name.trim())
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
            Wedding Photo Sharing
          </h1>
          <p className="text-text-tertiary text-sm font-light tracking-wider uppercase">
            Premium Experience
          </p>
        </div>

        {/* Welcome Card */}
        <div className="card-elevated p-10 mb-10 animate-slide-up">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-light text-text-primary mb-4 tracking-wide">
              Welcome
            </h2>
            <p className="text-text-secondary text-base font-light">
              You have <span className="text-text-primary font-medium">10 photos</span> to capture special moments
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-text-primary mb-4 tracking-wide">
                Your Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field text-base py-4 font-light"
                placeholder="Enter your name"
                disabled={isLoading}
                autoComplete="given-name"
                autoFocus
              />
              {error && (
                <p className="text-red-400 text-sm mt-3 font-light">
                  {error}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || !name.trim()}
              className="btn-primary w-full text-base py-4 font-medium tracking-wide"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                  Setting up your session...
                </div>
              ) : (
                'Begin Photo Session'
              )}
            </button>
          </form>
        </div>

        {/* Premium Features */}
        <div className="space-y-3 mb-10">
          <div className="glass rounded-xl p-6 hover:bg-surface-hover/30 transition-all duration-300">
            <h3 className="font-medium text-text-primary mb-2 tracking-wide">Limited Edition</h3>
            <p className="text-text-tertiary text-sm font-light leading-relaxed">
              Only 10 photos per person to make each shot count
            </p>
          </div>

          <div className="glass rounded-xl p-6 hover:bg-surface-hover/30 transition-all duration-300">
            <h3 className="font-medium text-text-primary mb-2 tracking-wide">Secure Storage</h3>
            <p className="text-text-tertiary text-sm font-light leading-relaxed">
              Photos automatically save to secure cloud storage
            </p>
          </div>

          <div className="glass rounded-xl p-6 hover:bg-surface-hover/30 transition-all duration-300">
            <h3 className="font-medium text-text-primary mb-2 tracking-wide">Session Persistence</h3>
            <p className="text-text-tertiary text-sm font-light leading-relaxed">
              Your progress is saved even if you close the app
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-text-muted text-xs font-light tracking-wider">
            Made for an unforgettable wedding
          </p>
        </div>
      </div>
    </div>
  )
}

export default WelcomeScreen
