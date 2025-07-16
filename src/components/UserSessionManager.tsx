import { useState, useEffect } from 'react'
import { getEventSession, switchToUserSession, type EventSession } from '../lib/eventUtils'

interface UserSessionManagerProps {
  eventCode: string
  onUserSelected: (session: EventSession) => void
  onNewUser: () => void
}

interface SavedUserSession {
  userName: string
  sessionKey: string
  lastUsed: number
}

const UserSessionManager = ({ eventCode, onUserSelected, onNewUser }: UserSessionManagerProps) => {
  const [savedUsers, setSavedUsers] = useState<SavedUserSession[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSavedUsers()
  }, [eventCode])

  const loadSavedUsers = () => {
    try {
      const users: SavedUserSession[] = []
      
      // Scan localStorage for user sessions for this event
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith(`aln-event-session-${eventCode}-`)) {
          try {
            const sessionData = localStorage.getItem(key)
            if (sessionData) {
              const session = JSON.parse(sessionData)
              users.push({
                userName: session.userName,
                sessionKey: key,
                lastUsed: session.createdAt || 0
              })
            }
          } catch (error) {
            console.error('Error parsing saved session:', error)
          }
        }
      }
      
      // Sort by last used (most recent first)
      users.sort((a, b) => b.lastUsed - a.lastUsed)
      setSavedUsers(users)
      
    } catch (error) {
      console.error('Error loading saved users:', error)
    } finally {
      setLoading(false)
    }
  }

  const selectUser = (userName: string) => {
    const success = switchToUserSession(eventCode, userName)
    if (success) {
      const session = getEventSession()
      if (session) {
        onUserSelected(session)
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-primary flex items-center justify-center p-4">
        <div className="text-center animate-fade-in">
          <div className="relative mb-8">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-surface-hover border-t-primary-500 mx-auto"></div>
          </div>
          <h2 className="text-text-primary font-light text-xl mb-3 tracking-wide">Loading Sessions</h2>
          <p className="text-text-tertiary font-light">Checking for existing users...</p>
        </div>
      </div>
    )
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
              👥 Select User
            </h1>
            <p className="text-text-tertiary text-sm font-light tracking-wider mb-2">
              Event: <span className="text-primary-400 font-medium">{eventCode}</span>
            </p>
            <p className="text-text-tertiary text-xs font-light">
              Multiple users detected on this device
            </p>
          </div>

          {/* Saved Users */}
          {savedUsers.length > 0 && (
            <div className="card-elevated p-6 mb-6 animate-slide-up">
              <h3 className="text-text-primary font-medium mb-4 tracking-wide">Continue as:</h3>
              <div className="space-y-3">
                {savedUsers.map((user) => (
                  <button
                    key={user.sessionKey}
                    onClick={() => selectUser(user.userName)}
                    className="w-full p-4 bg-surface-card hover:bg-surface-hover border border-border-primary
                               rounded-xl transition-all duration-300 hover:-translate-y-0.5 text-left
                               hover:shadow-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-text-primary">{user.userName}</div>
                        <div className="text-text-tertiary text-sm">
                          Last used: {new Date(user.lastUsed).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-primary-400">
                        <span className="text-lg">👤</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* New User */}
          <div className="card-elevated p-6 animate-slide-up" style={{ animationDelay: '200ms' }}>
            <button
              onClick={onNewUser}
              className="w-full p-4 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700
                         text-white rounded-xl font-medium tracking-wide transition-all duration-300
                         hover:shadow-lg hover:-translate-y-0.5 flex items-center justify-center gap-3"
            >
              <span className="text-xl">➕</span>
              Join as New User
            </button>
          </div>

          {/* Info */}
          <div className="text-center mt-6">
            <p className="text-text-tertiary text-xs font-light">
              Each user gets their own photo collection and session
            </p>
          </div>

          {/* Back to Main */}
          <div className="text-center mt-4">
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

export default UserSessionManager
