interface GameOverScreenProps {
  userName: string
  totalPhotos: number
  onRestart: () => void
}

const GameOverScreen = ({ userName, totalPhotos, onRestart }: GameOverScreenProps) => {
  return (
    <div className="min-h-screen bg-surface-primary relative overflow-hidden">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-surface-primary via-surface-secondary to-surface-tertiary opacity-80"></div>

      {/* Ambient lighting effects */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-orange-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-lg text-center animate-fade-in">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="mb-10">
              <img
                src="/alnlogowhite.png"
                alt="About Last Night Logo"
                className="w-64 h-auto mx-auto drop-shadow-2xl"
              />
            </div>
            <h1 className="text-text-primary text-xl font-light mb-3 tracking-wide">
              Session Complete
            </h1>
            <p className="text-text-tertiary text-sm font-light tracking-wider uppercase">
              Thank you for capturing memories
            </p>
          </div>

          {/* Main Message */}
          <div className="card-elevated p-10 mb-10 animate-slide-up">
            <h2 className="text-2xl font-light text-text-primary mb-6 tracking-wide">
              That's a Wrap, {userName}!
            </h2>

            <div className="w-16 h-16 bg-surface-hover rounded-2xl flex items-center justify-center mx-auto mb-8 border border-border-primary">
              <div className="w-8 h-8 bg-text-primary rounded opacity-20"></div>
            </div>

            <div className="bg-surface-hover rounded-xl p-6 mb-8 border border-border-primary">
              <div className="text-2xl font-light text-text-primary mb-2">
                {totalPhotos}
              </div>
              <div className="text-sm text-text-tertiary font-light tracking-wide">
                Photos captured
              </div>
            </div>

            <div className="space-y-4 text-sm text-text-tertiary font-light">
              <div className="flex items-center justify-center">
                <div className="w-3 h-3 bg-green-400 rounded-full mr-3 opacity-60"></div>
                All photos saved to secure storage
              </div>
              <div className="flex items-center justify-center">
                <div className="w-3 h-3 bg-blue-400 rounded-full mr-3 opacity-60"></div>
                Organized under your name
              </div>
              <div className="flex items-center justify-center">
                <div className="w-3 h-3 bg-purple-400 rounded-full mr-3 opacity-60"></div>
                Ready for the happy couple
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-6">
            <button
              onClick={onRestart}
              className="btn-primary w-full text-base py-4 font-medium tracking-wide"
            >
              Start New Session
            </button>

            <div className="glass rounded-xl p-6">
              <p className="text-text-secondary text-sm mb-3 font-light">
                Want to take more photos?
              </p>
              <p className="text-text-tertiary text-xs font-light leading-relaxed">
                Start a new session with a different name to get 10 more photos
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-10 grid grid-cols-3 gap-4">
            <div className="glass rounded-xl p-4 text-center">
              <div className="w-8 h-8 bg-text-primary opacity-20 rounded mx-auto mb-2"></div>
              <div className="text-xs text-text-tertiary font-light">Photos</div>
              <div className="text-sm text-text-primary font-medium">{totalPhotos}</div>
            </div>

            <div className="glass rounded-xl p-4 text-center">
              <div className="w-8 h-8 bg-text-primary opacity-20 rounded mx-auto mb-2"></div>
              <div className="text-xs text-text-tertiary font-light">Efficiency</div>
              <div className="text-sm text-text-primary font-medium">100%</div>
            </div>

            <div className="glass rounded-xl p-4 text-center">
              <div className="w-8 h-8 bg-text-primary opacity-20 rounded mx-auto mb-2"></div>
              <div className="text-xs text-text-tertiary font-light">Mission</div>
              <div className="text-sm text-text-primary font-medium">Complete</div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-12">
            <p className="text-text-muted text-xs font-light tracking-wider">
              Thank you for capturing these precious moments
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default GameOverScreen
