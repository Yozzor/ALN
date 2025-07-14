import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { usePhotoSession } from '../hooks/usePhotoSession'
import { supabase } from '../lib/supabase'

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

// Award categories for voting
const AWARD_CATEGORIES = [
  { id: 'most_emotional', label: 'Most Emotional', emoji: '😭', color: 'from-blue-500 to-purple-500' },
  { id: 'silliest_picture', label: 'Silliest Picture', emoji: '😂', color: 'from-yellow-500 to-orange-500' },
  { id: 'most_creative', label: 'Most Creative', emoji: '🎨', color: 'from-purple-500 to-pink-500' },
  { id: 'best_group_photo', label: 'Best Group Photo', emoji: '👥', color: 'from-green-500 to-teal-500' },
  { id: 'most_romantic', label: 'Most Romantic', emoji: '💕', color: 'from-pink-500 to-red-500' },
  { id: 'funniest_moment', label: 'Funniest Moment', emoji: '🕺', color: 'from-orange-500 to-yellow-500' },
  { id: 'best_candid', label: 'Best Candid', emoji: '📸', color: 'from-teal-500 to-blue-500' },
  { id: 'most_artistic', label: 'Most Artistic', emoji: '🎭', color: 'from-indigo-500 to-purple-500' },
  { id: 'best_dance_move', label: 'Best Dance Move', emoji: '💃', color: 'from-red-500 to-pink-500' },
  { id: 'most_memorable', label: 'Most Memorable', emoji: '⭐', color: 'from-amber-500 to-yellow-500' }
] as const

const PhotoGallery = ({ currentUser }: PhotoGalleryProps) => {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAllUsers, setShowAllUsers] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [viewMode, setViewMode] = useState<'gallery' | 'voting'>('gallery')
  const [currentVotingPhoto, setCurrentVotingPhoto] = useState<Photo | null>(null)

  // Get user from URL params or session data
  const [searchParams] = useSearchParams()
  const urlUser = searchParams.get('user')
  const { userName: sessionUserName } = usePhotoSession()
  const activeUserName = currentUser || urlUser || sessionUserName

  useEffect(() => {
    fetchPhotos()
  }, [showAllUsers, activeUserName])

  // Get random photo for voting
  const getRandomVotingPhoto = () => {
    if (photos.length === 0) return null
    const randomIndex = Math.floor(Math.random() * photos.length)
    return photos[randomIndex]
  }

  // Start voting mode
  const startVoting = () => {
    setViewMode('voting')
    setCurrentVotingPhoto(getRandomVotingPhoto())
  }

  // Vote for a photo
  const voteForPhoto = async (photoUrl: string, category: string) => {
    try {
      console.log(`🗳️ Voting for photo: ${photoUrl} in category: ${category}`)

      // TODO: Save vote to Supabase when event system is implemented
      // For now, just log the vote

      // Show next random photo
      setCurrentVotingPhoto(getRandomVotingPhoto())

      // Show success feedback
      // TODO: Add toast notification

    } catch (error) {
      console.error('Failed to vote:', error)
    }
  }

  // Skip photo without voting
  const skipPhoto = () => {
    setCurrentVotingPhoto(getRandomVotingPhoto())
  }

  // Keyboard navigation for modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedPhoto) return

      switch (e.key) {
        case 'Escape':
          setSelectedPhoto(null)
          break
        case 'ArrowLeft':
          e.preventDefault()
          const currentIndex = photos.findIndex(p => p.url === selectedPhoto.url)
          const prevIndex = currentIndex > 0 ? currentIndex - 1 : photos.length - 1
          setSelectedPhoto(photos[prevIndex])
          break
        case 'ArrowRight':
          e.preventDefault()
          const nextIndex = photos.findIndex(p => p.url === selectedPhoto.url)
          const nextIdx = nextIndex < photos.length - 1 ? nextIndex + 1 : 0
          setSelectedPhoto(photos[nextIdx])
          break
      }
    }

    if (selectedPhoto) {
      document.addEventListener('keydown', handleKeyDown)
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [selectedPhoto, photos])

  const downloadPhoto = async (photo: Photo) => {
    try {
      // Fetch the image as blob
      const response = await fetch(photo.url)
      const blob = await response.blob()

      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = photo.fileName || `photo-${photo.userName}-${new Date(photo.uploadedAt).toISOString().split('T')[0]}.jpg`

      // Trigger download
      document.body.appendChild(link)
      link.click()

      // Cleanup
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to download photo:', error)
      alert('Failed to download photo. Please try again.')
    }
  }

  const fetchPhotos = async () => {
    try {
      setLoading(true)
      setError(null)

      // Use existing Vercel Blob API for now
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
      console.error('Error fetching photos:', err)
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

            {/* Control Panel */}
            <div className="flex items-center gap-4">
              {/* View Mode Toggle */}
              {activeUserName && viewMode === 'gallery' && (
                <div className="flex bg-surface-card rounded-xl border border-border-primary overflow-hidden">
                  <button
                    onClick={() => setShowAllUsers(false)}
                    className={`px-4 py-2 text-sm font-medium tracking-wide transition-all duration-300 ${
                      !showAllUsers
                        ? 'bg-primary-500 text-white'
                        : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                    }`}
                  >
                    My Photos
                  </button>
                  <button
                    onClick={() => setShowAllUsers(true)}
                    className={`px-4 py-2 text-sm font-medium tracking-wide transition-all duration-300 ${
                      showAllUsers
                        ? 'bg-primary-500 text-white'
                        : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                    }`}
                  >
                    All Photos
                  </button>
                </div>
              )}

              {/* Start Voting Button */}
              {viewMode === 'gallery' && photos.length > 0 && (
                <button
                  onClick={startVoting}
                  className="btn-primary flex items-center gap-3 font-medium tracking-wide"
                >
                  <span className="text-lg">🗳️</span>
                  Start Voting
                </button>
              )}

              {/* Back to Gallery Button */}
              {viewMode === 'voting' && (
                <button
                  onClick={() => setViewMode('gallery')}
                  className="btn-secondary flex items-center gap-3 font-medium tracking-wide"
                >
                  <span className="text-lg">📸</span>
                  Back to Gallery
                </button>
              )}
            </div>
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
                <div
                  className="relative overflow-hidden cursor-pointer"
                  onClick={() => setSelectedPhoto(photo)}
                >
                  <img
                    src={photo.url}
                    alt={`Photo by ${photo.userName}`}
                    className="w-full h-56 object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent
                                  opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                  {/* Hover overlay with actions */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="flex gap-3">
                      {/* View button */}
                      <div className="bg-black/50 backdrop-blur-sm rounded-full p-3 hover:bg-black/70 transition-colors">
                        <div className="w-5 h-5 bg-white rounded opacity-80"></div>
                      </div>

                      {/* Download button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          downloadPhoto(photo)
                        }}
                        className="bg-black/50 backdrop-blur-sm rounded-full p-3 hover:bg-black/70 transition-colors"
                        title="Download photo"
                      >
                        <div className="w-5 h-5 relative">
                          {/* Download icon */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-3 h-3 border-2 border-white border-t-0 border-l-0 rotate-45 translate-y-[-2px]"></div>
                            <div className="absolute w-0.5 h-3 bg-white top-1"></div>
                            <div className="absolute bottom-0 w-4 h-0.5 bg-white"></div>
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>
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

      {/* Voting Interface */}
      {viewMode === 'voting' && currentVotingPhoto && (
        <div className="fixed inset-0 bg-black z-[90] flex flex-col">
          {/* Voting Photo */}
          <div className="flex-1 relative flex items-center justify-center p-4">
            <img
              src={currentVotingPhoto.url}
              alt={`Photo by ${currentVotingPhoto.userName}`}
              className="max-w-full max-h-full object-contain rounded-lg"
            />

            {/* Photo Info Overlay */}
            <div className="absolute top-6 left-6 right-6 flex justify-between items-start">
              <div className="bg-black/70 backdrop-blur-sm rounded-xl p-4">
                <p className="text-white font-medium">Photo by {currentVotingPhoto.userName}</p>
                <p className="text-white/70 text-sm">{new Date(currentVotingPhoto.uploadedAt).toLocaleDateString()}</p>
              </div>

              {/* Skip Button */}
              <button
                onClick={skipPhoto}
                className="bg-black/70 backdrop-blur-sm rounded-xl p-3 text-white hover:bg-black/80 transition-colors"
                title="Skip this photo"
              >
                <span className="text-xl">⏭️</span>
              </button>
            </div>
          </div>

          {/* Award Category Buttons */}
          <div className="bg-black/90 backdrop-blur-sm p-6">
            <div className="max-w-4xl mx-auto">
              <h3 className="text-white text-center mb-6 font-medium">Vote for this photo:</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {AWARD_CATEGORIES.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => voteForPhoto(currentVotingPhoto.url, category.id)}
                    className={`bg-gradient-to-r ${category.color} hover:scale-105 active:scale-95
                               text-white font-medium py-3 px-4 rounded-xl transition-all duration-200
                               shadow-lg hover:shadow-xl flex flex-col items-center gap-2`}
                  >
                    <span className="text-2xl">{category.emoji}</span>
                    <span className="text-xs text-center leading-tight">{category.label}</span>
                  </button>
                ))}
              </div>

              {/* Quick Actions */}
              <div className="flex justify-center gap-4 mt-6">
                <button
                  onClick={skipPhoto}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Skip Photo
                </button>
                <button
                  onClick={() => voteForPhoto(currentVotingPhoto.url, 'most_memorable')}
                  className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:scale-105 text-white px-6 py-2 rounded-lg transition-all duration-200 font-medium"
                >
                  ⭐ Quick Vote
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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

      {/* Photo Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-4xl max-h-full w-full h-full flex items-center justify-center">
            {/* Top action buttons */}
            <div className="absolute top-4 right-4 z-10 flex gap-3">
              {/* Download button */}
              <button
                onClick={() => downloadPhoto(selectedPhoto)}
                className="bg-black/50 hover:bg-black/70 text-white p-3 rounded-full
                           transition-all duration-300 hover:scale-110"
                title="Download photo"
              >
                <div className="w-6 h-6 relative">
                  {/* Download icon */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-white border-t-0 border-l-0 rotate-45 translate-y-[-2px]"></div>
                    <div className="absolute w-0.5 h-4 bg-white top-1"></div>
                    <div className="absolute bottom-0 w-5 h-0.5 bg-white"></div>
                  </div>
                </div>
              </button>

              {/* Close button */}
              <button
                onClick={() => setSelectedPhoto(null)}
                className="bg-black/50 hover:bg-black/70 text-white p-3 rounded-full
                           transition-all duration-300 hover:scale-110"
                title="Close"
              >
                <div className="w-6 h-6 relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-4 h-0.5 bg-white rotate-45 absolute"></div>
                    <div className="w-4 h-0.5 bg-white -rotate-45 absolute"></div>
                  </div>
                </div>
              </button>
            </div>

            {/* Photo */}
            <div
              className="relative max-w-full max-h-full"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={selectedPhoto.url}
                alt={`Photo by ${selectedPhoto.userName}`}
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              />

              {/* Photo info overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 rounded-b-lg">
                <div className="text-white">
                  <h3 className="font-medium text-lg mb-2">Photo by {selectedPhoto.userName}</h3>
                  <div className="flex items-center gap-4 text-sm text-white/80">
                    <span>📅 {new Date(selectedPhoto.uploadedAt).toLocaleDateString()}</span>
                    <span>📁 {(selectedPhoto.size / 1024).toFixed(1)} KB</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation arrows (if you want to add next/prev functionality later) */}
            <div className="absolute left-4 top-1/2 -translate-y-1/2">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  const currentIndex = photos.findIndex(p => p.url === selectedPhoto.url)
                  const prevIndex = currentIndex > 0 ? currentIndex - 1 : photos.length - 1
                  setSelectedPhoto(photos[prevIndex])
                }}
                className="bg-black/50 hover:bg-black/70 text-white p-3 rounded-full
                           transition-all duration-300 hover:scale-110"
                title="Previous photo"
              >
                <div className="w-6 h-6 flex items-center justify-center">
                  <div className="w-3 h-3 border-l-2 border-t-2 border-white rotate-[-45deg]"></div>
                </div>
              </button>
            </div>

            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  const currentIndex = photos.findIndex(p => p.url === selectedPhoto.url)
                  const nextIndex = currentIndex < photos.length - 1 ? currentIndex + 1 : 0
                  setSelectedPhoto(photos[nextIndex])
                }}
                className="bg-black/50 hover:bg-black/70 text-white p-3 rounded-full
                           transition-all duration-300 hover:scale-110"
                title="Next photo"
              >
                <div className="w-6 h-6 flex items-center justify-center">
                  <div className="w-3 h-3 border-r-2 border-t-2 border-white rotate-45"></div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PhotoGallery
