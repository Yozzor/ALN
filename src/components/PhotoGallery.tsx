import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { usePhotoSession } from '../hooks/usePhotoSession'

interface Photo {
  url: string
  fileName: string
  size: number
  uploadedAt: string
  userName: string
}

interface PhotoGalleryProps {
  currentUser?: string | null
}

const PhotoGallery = ({ currentUser }: PhotoGalleryProps) => {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAllUsers, setShowAllUsers] = useState(false)

  // Get user from URL params or session data
  const [searchParams] = useSearchParams()
  const urlUser = searchParams.get('user')
  const { userName: sessionUserName } = usePhotoSession()
  const activeUserName = currentUser || urlUser || sessionUserName

  useEffect(() => {
    fetchPhotos()
  }, [showAllUsers, activeUserName])

  const fetchPhotos = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/photos')

      if (!response.ok) {
        throw new Error(`Failed to fetch photos: ${response.status}`)
      }

      const result = await response.json()
      let allPhotos = result.photos || []

      // Filter photos by current user unless showing all users
      if (!showAllUsers && activeUserName) {
        allPhotos = allPhotos.filter((photo: Photo) => photo.userName === activeUserName)
      }

      setPhotos(allPhotos)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load photos')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-primary flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="relative mb-8">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-surface-hover border-t-primary-500 mx-auto"></div>
          </div>
          <h2 className="text-text-primary font-light text-xl mb-3 tracking-wide">Photo Gallery</h2>
          <p className="text-text-tertiary font-light">Loading your memories...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-surface-primary flex items-center justify-center p-6">
        <div className="card-elevated p-10 max-w-md animate-fade-in">
          <div className="text-center">
            <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center mx-auto mb-6">
              <div className="w-6 h-6 bg-red-400 rounded opacity-60"></div>
            </div>
            <h3 className="text-text-primary font-light text-xl mb-4 tracking-wide">Error Loading Photos</h3>
            <p className="text-red-400 text-sm mb-8 bg-red-500/10 rounded-lg p-4 font-light">{error}</p>
            <button
              onClick={fetchPhotos}
              className="btn-primary"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-primary relative overflow-hidden">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-surface-primary via-surface-secondary to-surface-tertiary opacity-80"></div>

      {/* Ambient lighting effects */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-orange-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Header */}
      <div className="relative z-10 glass border-b border-border-primary/30 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="animate-slide-up">
              <h1 className="text-text-primary font-light text-2xl mb-4 tracking-wide">
                Photo Gallery
              </h1>
              <p className="text-text-tertiary text-sm font-light">
                {showAllUsers
                  ? `${photos.length} photos from all users`
                  : activeUserName
                    ? `${photos.length} photos by ${activeUserName}`
                    : `${photos.length} photos uploaded`
                }
              </p>
            </div>

            {/* Toggle Button */}
            {activeUserName && (
              <button
                onClick={() => setShowAllUsers(!showAllUsers)}
                className="btn-secondary flex items-center gap-3 font-medium tracking-wide"
              >
                <div className="w-4 h-4 bg-text-primary opacity-60 rounded-sm"></div>
                {showAllUsers ? 'My Photos' : 'All Photos'}
              </button>
            )}
          </div>

          {/* Back to App Link */}
          <div>
            <a
              href="/"
              className="inline-flex items-center text-primary-400 hover:text-primary-300 transition-all duration-300
                         hover:-translate-x-1 group font-light tracking-wide"
            >
              <span className="mr-2 group-hover:mr-3 transition-all duration-300">←</span>
              Back to Camera
            </a>
          </div>
        </div>
      </div>

      {/* Photos Grid */}
      <div className="relative z-10 max-w-6xl mx-auto p-6">
        {photos.length === 0 ? (
          <div className="text-center py-24 animate-fade-in">
            <div className="w-16 h-16 bg-surface-hover rounded-2xl flex items-center justify-center mx-auto mb-8 border border-border-primary">
              <div className="w-8 h-8 bg-text-primary rounded opacity-20"></div>
            </div>
            <h3 className="text-text-primary font-light text-xl mb-6 tracking-wide">
              {showAllUsers ? 'No Photos Yet' : activeUserName ? `No Photos by ${activeUserName}` : 'No Photos Yet'}
            </h3>
            <p className="text-text-tertiary text-base mb-10 max-w-md mx-auto font-light leading-relaxed">
              {showAllUsers
                ? 'Photos uploaded through the app will appear here'
                : activeUserName
                  ? 'Take some photos with the camera to see them here'
                  : 'Photos uploaded through the app will appear here'
              }
            </p>
            {!showAllUsers && activeUserName && (
              <button
                onClick={() => setShowAllUsers(true)}
                className="btn-ghost font-light tracking-wide"
              >
                View all users' photos →
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {photos.map((photo, index) => (
              <div
                key={index}
                className="card hover:card-elevated transition-all duration-300 overflow-hidden group
                           hover:-translate-y-2 hover:shadow-glow animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="relative overflow-hidden">
                  <img
                    src={photo.url}
                    alt={`Photo by ${photo.userName}`}
                    className="w-full h-56 object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent
                                  opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <div className="p-5">
                  <div className="flex items-center mb-3">
                    <div className="w-6 h-6 bg-surface-hover rounded-full flex items-center justify-center mr-3 border border-border-primary">
                      <div className="w-3 h-3 bg-text-primary rounded-full opacity-40"></div>
                    </div>
                    <p className="text-text-primary font-medium text-sm truncate tracking-wide">
                      {photo.userName}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-text-tertiary text-xs font-light">
                      {new Date(photo.uploadedAt).toLocaleDateString()}
                    </p>
                    <p className="text-text-tertiary text-xs font-light">
                      {new Date(photo.uploadedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-text-tertiary text-xs font-light">
                      {Math.round(photo.size / 1024)}KB
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Refresh Button */}
      <div className="fixed bottom-8 right-8 z-50">
        <button
          onClick={fetchPhotos}
          className="group bg-surface-card hover:bg-surface-hover border border-border-primary
                     text-text-primary p-4 rounded-xl shadow-premium hover:shadow-premium-lg transition-all duration-300
                     hover:-translate-y-1 active:translate-y-0 backdrop-blur-sm"
          title="Refresh photos"
        >
          <div className="w-5 h-5 bg-text-primary opacity-60 rounded-sm group-hover:rotate-180 transition-transform duration-500"></div>
        </button>
      </div>
    </div>
  )
}

export default PhotoGallery
