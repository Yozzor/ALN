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

// Floating emoji animation interface
interface FloatingEmoji {
  id: string
  emoji: string
  x: number
  y: number
  delay: number
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
  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmoji[]>([])
  const [votedPhotoUrls, setVotedPhotoUrls] = useState<Set<string>>(new Set())

  // Get user from URL params or session data
  const [searchParams] = useSearchParams()
  const urlUser = searchParams.get('user')
  const { userName: sessionUserName } = usePhotoSession()
  const activeUserName = currentUser || urlUser || sessionUserName

  // Block access if no user name is available
  if (!activeUserName) {
    return (
      <div className="min-h-screen bg-surface-primary flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-surface-card rounded-2xl p-8 border border-border-primary shadow-premium text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-2xl">🚫</span>
            </div>
            <h2 className="text-xl font-semibold text-text-primary mb-2">Access Restricted</h2>
            <p className="text-text-secondary">
              You need to set your name first to access the gallery.
            </p>
          </div>
          <a
            href="/"
            className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700
                       text-white px-6 py-3 rounded-xl font-medium tracking-wide transition-all duration-300
                       hover:shadow-lg hover:-translate-y-0.5 inline-flex items-center gap-2"
          >
            <span className="text-lg">👤</span>
            Set Your Name
          </a>
        </div>
      </div>
    )
  }

  useEffect(() => {
    fetchPhotos()
  }, [showAllUsers, activeUserName])

  // Get random photo for voting (excluding already voted photos)
  const getRandomVotingPhoto = () => {
    if (photos.length === 0) {
      console.log('📷 No photos available for voting')
      return null
    }

    // Filter out photos that have already been voted on
    const unvotedPhotos = photos.filter(photo => !votedPhotoUrls.has(photo.url))
    console.log(`📷 Total photos: ${photos.length}, Voted: ${votedPhotoUrls.size}, Unvoted: ${unvotedPhotos.length}`)

    if (unvotedPhotos.length === 0) {
      console.log('📷 No more unvoted photos available')
      return null // No more photos to vote on
    }

    const randomIndex = Math.floor(Math.random() * unvotedPhotos.length)
    return unvotedPhotos[randomIndex]
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

      // Mark this photo as voted
      setVotedPhotoUrls(prev => new Set([...prev, photoUrl]))

      // Find the category to get the emoji
      const selectedCategory = AWARD_CATEGORIES.find(cat => cat.id === category)
      if (selectedCategory) {
        // Trigger floating emoji animation
        createFloatingEmojis(selectedCategory.emoji)
      }

      // TODO: Save vote to Supabase when event system is implemented
      // For now, just log the vote

      // Show next random photo after a short delay to see the animation
      setTimeout(() => {
        setCurrentVotingPhoto(getRandomVotingPhoto())
      }, 500)

    } catch (error) {
      console.error('Failed to vote:', error)
    }
  }

  // Skip photo without voting
  const skipPhoto = () => {
    setCurrentVotingPhoto(getRandomVotingPhoto())
  }

  // Refresh voting list (clear voted photos and fetch new ones)
  const refreshVotingList = async () => {
    setVotedPhotoUrls(new Set())
    await fetchPhotos()
    // After photos are fetched, get a new random photo
    setTimeout(() => {
      const newPhoto = getRandomVotingPhoto()
      setCurrentVotingPhoto(newPhoto)
    }, 100)
  }

  // Create floating emoji animation
  const createFloatingEmojis = (emoji: string) => {
    console.log(`🎆 Creating floating emojis for: ${emoji}`)
    const newEmojis: FloatingEmoji[] = []
    const emojiCount = 8 + Math.floor(Math.random() * 5) // 8-12 emojis

    for (let i = 0; i < emojiCount; i++) {
      newEmojis.push({
        id: `${Date.now()}-${i}`,
        emoji,
        x: Math.random() * 100, // Random x position (0-100%)
        y: 0, // Start from bottom of screen (bottom: 0%)
        delay: i * 100 // Stagger the animations
      })
    }

    console.log(`🎆 Adding ${newEmojis.length} emojis to state`)
    setFloatingEmojis(prev => {
      const updated = [...prev, ...newEmojis]
      console.log(`🎆 Total floating emojis now: ${updated.length}`)
      return updated
    })

    // Remove emojis after animation completes
    setTimeout(() => {
      console.log(`🎆 Removing emojis after animation`)
      setFloatingEmojis(prev => prev.filter(e => !newEmojis.some(ne => ne.id === e.id)))
    }, 3000)
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
      <div className="relative z-10 glass border-b border-border-primary/30 p-4 sm:p-6">
        <div className="max-w-6xl mx-auto">
          {/* Title and Photo Count - Top Section */}
          <div className="text-center mb-4 animate-slide-up">
            <h1 className="text-text-primary font-light text-2xl sm:text-3xl mb-2 tracking-wide">
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

          {/* Control Panel - Below Title */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-4">
            {/* View Mode Toggle */}
            {activeUserName && viewMode === 'gallery' && (
              <div className="flex bg-surface-card rounded-lg border border-border-primary overflow-hidden shadow-sm">
                <button
                  onClick={() => setShowAllUsers(false)}
                  className={`px-4 py-2.5 text-sm font-medium tracking-wide transition-all duration-300 ${
                    !showAllUsers
                      ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-sm'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                  }`}
                >
                  My Photos
                </button>
                <button
                  onClick={() => setShowAllUsers(true)}
                  className={`px-4 py-2.5 text-sm font-medium tracking-wide transition-all duration-300 ${
                    showAllUsers
                      ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-sm'
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
                className="bg-gradient-to-r from-accent-orange-500 to-accent-orange-600 hover:from-accent-orange-600 hover:to-accent-orange-700
                           text-white px-4 py-2.5 rounded-lg font-medium tracking-wide transition-all duration-300
                           hover:shadow-lg hover:-translate-y-0.5 flex items-center gap-2 shadow-sm whitespace-nowrap"
              >
                <span className="text-lg">🗳️</span>
                Start Voting
              </button>
            )}

            {/* Back to Gallery Button */}
            {viewMode === 'voting' && (
              <button
                onClick={() => setViewMode('gallery')}
                className="bg-surface-card hover:bg-surface-hover border border-border-primary text-text-primary
                           px-4 py-2.5 rounded-lg font-medium tracking-wide transition-all duration-300
                           hover:shadow-lg hover:-translate-y-0.5 flex items-center gap-2 shadow-sm whitespace-nowrap"
              >
                <span className="text-lg">📸</span>
                Back to Gallery
              </button>
            )}
          </div>

          {/* Back to App Link */}
          <div className="text-center">
            <a
              href="/"
              className="inline-flex items-center text-primary-400 hover:text-primary-300 transition-all duration-300
                         hover:-translate-x-1 group font-medium tracking-wide text-sm"
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
          <div className="text-center py-20 animate-fade-in">
            {/* Enhanced Camera Icon */}
            <div className="relative mx-auto mb-8 w-24 h-24">
              {/* Gradient background */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500/20 to-accent-orange-500/20 rounded-3xl blur-xl"></div>

              {/* Icon container */}
              <div className="relative w-24 h-24 bg-gradient-to-br from-surface-card to-surface-hover rounded-3xl
                              flex items-center justify-center border border-border-primary shadow-lg">
                {/* Camera Icon */}
                <div className="relative">
                  {/* Camera body */}
                  <div className="w-12 h-8 bg-gradient-to-b from-text-primary/60 to-text-primary/40 rounded-lg relative">
                    {/* Lens */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
                                    w-6 h-6 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full border-2 border-white/20">
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
                                      w-3 h-3 bg-gradient-to-br from-primary-300 to-primary-500 rounded-full"></div>
                    </div>
                    {/* Flash */}
                    <div className="absolute -top-1 left-2 w-2 h-1 bg-accent-orange-400 rounded-sm"></div>
                    {/* Viewfinder */}
                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-3 h-2 bg-text-primary/50 rounded-t"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced messaging */}
            <div className="max-w-lg mx-auto">
              <h3 className="text-text-primary font-medium text-2xl mb-4 tracking-wide">
                {showAllUsers ? 'No Photos Yet' : activeUserName ? `No Photos by ${activeUserName}` : 'No Photos Yet'}
              </h3>
              <p className="text-text-secondary text-lg mb-8 font-light leading-relaxed">
                {showAllUsers
                  ? 'Be the first to capture and share a moment! Photos uploaded through the app will appear here.'
                  : activeUserName
                    ? 'Ready to capture some amazing moments? Head to the camera and start taking photos!'
                    : 'Photos uploaded through the app will appear here. Start capturing memories!'
                }
              </p>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                {!activeUserName ? (
                  <a
                    href="/"
                    className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700
                               text-white px-8 py-3 rounded-xl font-medium tracking-wide transition-all duration-300
                               hover:shadow-lg hover:-translate-y-0.5 flex items-center gap-3"
                  >
                    <span className="text-xl">📸</span>
                    Start Taking Photos
                  </a>
                ) : !showAllUsers ? (
                  <>
                    <a
                      href="/"
                      className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700
                                 text-white px-8 py-3 rounded-xl font-medium tracking-wide transition-all duration-300
                                 hover:shadow-lg hover:-translate-y-0.5 flex items-center gap-3"
                    >
                      <span className="text-xl">📸</span>
                      Take Your First Photo
                    </a>
                    <button
                      onClick={() => setShowAllUsers(true)}
                      className="bg-surface-card hover:bg-surface-hover border border-border-primary text-text-primary
                                 px-6 py-3 rounded-xl font-medium tracking-wide transition-all duration-300
                                 hover:shadow-lg hover:-translate-y-0.5 flex items-center gap-2"
                    >
                      <span className="text-lg">👥</span>
                      View All Photos
                    </button>
                  </>
                ) : (
                  <a
                    href="/"
                    className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700
                               text-white px-8 py-3 rounded-xl font-medium tracking-wide transition-all duration-300
                               hover:shadow-lg hover:-translate-y-0.5 flex items-center gap-3"
                  >
                    <span className="text-xl">📸</span>
                    Add Your Photos
                  </a>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {photos.map((photo, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-surface-card to-surface-hover hover:from-surface-hover hover:to-surface-tertiary
                           border border-border-primary rounded-2xl overflow-hidden group transition-all duration-300
                           hover:-translate-y-2 hover:shadow-xl shadow-lg animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div
                  className="relative overflow-hidden cursor-pointer"
                  onClick={() => setSelectedPhoto(photo)}
                >
                  <img
                    src={photo.url}
                    alt={`Photo by ${photo.userName}`}
                    className="w-full h-56 object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent
                                  opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                  {/* Hover overlay with actions */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <div className="flex gap-3">
                      {/* View button */}
                      <div className="bg-white/20 backdrop-blur-md rounded-full p-3 hover:bg-white/30 transition-all duration-200
                                      border border-white/20 hover:scale-110">
                        <div className="w-5 h-5 relative">
                          {/* Eye icon */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-4 h-2.5 border-2 border-white rounded-full"></div>
                            <div className="absolute w-2 h-2 bg-white rounded-full"></div>
                          </div>
                        </div>
                      </div>

                      {/* Download button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          downloadPhoto(photo)
                        }}
                        className="bg-white/20 backdrop-blur-md rounded-full p-3 hover:bg-white/30 transition-all duration-200
                                   border border-white/20 hover:scale-110"
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
                    <div className="w-8 h-8 bg-gradient-to-br from-primary-500/20 to-accent-orange-500/20 rounded-full
                                    flex items-center justify-center mr-3 border border-border-primary">
                      <div className="w-4 h-4 bg-gradient-to-br from-primary-400 to-accent-orange-400 rounded-full"></div>
                    </div>
                    <p className="text-text-primary font-medium text-sm truncate tracking-wide">
                      {photo.userName}
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs">📅</span>
                      <p className="text-text-tertiary text-xs font-light">
                        {new Date(photo.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs">🕒</span>
                      <p className="text-text-tertiary text-xs font-light">
                        {new Date(photo.uploadedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs">📁</span>
                      <p className="text-text-tertiary text-xs font-light">
                        {Math.round(photo.size / 1024)}KB
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Voting Interface */}
      {viewMode === 'voting' && (
        currentVotingPhoto ? (
        <div className="fixed inset-0 bg-black z-[90] flex flex-col overflow-y-auto">
          {/* Voting Photo */}
          <div className="flex-shrink-0 relative flex items-center justify-center p-4 min-h-[50vh] max-h-[60vh]">
            <img
              src={currentVotingPhoto.url}
              alt={`Photo by ${currentVotingPhoto.userName}`}
              className="max-w-full max-h-full object-contain rounded-lg"
            />

            {/* Skip Button - Top Right Only */}
            <div className="absolute top-6 right-6">
              <button
                onClick={skipPhoto}
                className="bg-black/70 backdrop-blur-sm rounded-xl p-3 text-white hover:bg-black/80 transition-colors"
                title="Skip this photo"
              >
                <span className="text-xl">⏭️</span>
              </button>
            </div>
          </div>

          {/* Award Category Buttons - Scrollable */}
          <div className="flex-shrink-0 bg-black/90 backdrop-blur-sm p-4 pb-8">
            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-2 gap-3 mb-4">
                {AWARD_CATEGORIES.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => {
                      console.log(`🎯 Button clicked for category: ${category.id}`)
                      voteForPhoto(currentVotingPhoto.url, category.id)
                    }}
                    className={`bg-gradient-to-r ${category.color} hover:scale-105 active:scale-95
                               text-white font-medium py-4 px-3 rounded-xl transition-all duration-200
                               shadow-lg hover:shadow-xl flex flex-col items-center gap-1 min-h-[80px]`}
                  >
                    <span className="text-3xl">{category.emoji}</span>
                    <span className="text-xs text-center leading-tight">{category.label}</span>
                  </button>
                ))}
              </div>

              {/* Quick Actions */}
              <div className="flex justify-center gap-4">
                <button
                  onClick={skipPhoto}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors text-sm"
                >
                  Skip Photo
                </button>
              </div>
            </div>
          </div>
        </div>
        ) : (
          /* No More Photos Interface */
          <div className="fixed inset-0 bg-black z-[90] flex flex-col items-center justify-center p-8">
            <div className="text-center max-w-md">
              {/* Icon */}
              <div className="text-6xl mb-6">🎉</div>

              {/* Title */}
              <h2 className="text-2xl font-bold text-white mb-4">
                All Caught Up!
              </h2>

              {/* Message */}
              <p className="text-gray-300 mb-8 leading-relaxed">
                You've voted on all available photos for now. Check back later for new photos to vote on!
              </p>

              {/* Action Buttons */}
              <div className="space-y-4">
                <button
                  onClick={refreshVotingList}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700
                           text-white font-medium py-4 px-6 rounded-xl transition-all duration-200
                           shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
                >
                  <span className="text-xl">🔄</span>
                  Refresh & Check for New Photos
                </button>

                <button
                  onClick={() => setViewMode('gallery')}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-6 rounded-xl transition-colors"
                >
                  Back to Gallery
                </button>
              </div>
            </div>
          </div>
        )
      )}

      {/* Refresh Button */}
      <div className="fixed bottom-8 right-8 z-50">
        <button
          onClick={fetchPhotos}
          className="group bg-gradient-to-br from-surface-card to-surface-hover hover:from-surface-hover hover:to-surface-tertiary
                     border border-border-primary text-text-primary p-4 rounded-2xl shadow-lg hover:shadow-xl
                     transition-all duration-300 hover:-translate-y-1 active:translate-y-0 backdrop-blur-sm"
          title="Refresh photos"
        >
          {/* Refresh Icon */}
          <div className="relative w-5 h-5">
            <div className="absolute inset-0 border-2 border-text-primary/60 rounded-full border-t-transparent
                            group-hover:rotate-180 transition-transform duration-500"></div>
            <div className="absolute top-0 right-0 w-2 h-2 border-l-2 border-b-2 border-text-primary/60
                            rotate-45 transform translate-x-0.5 -translate-y-0.5"></div>
          </div>
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

      {/* Floating Emojis Animation */}
      {floatingEmojis.length > 0 && (() => {
        console.log(`🎆 Rendering ${floatingEmojis.length} floating emojis`)
        return null
      })()}
      {floatingEmojis.map((emoji) => (
        <div
          key={emoji.id}
          className="fixed pointer-events-none z-[200] float-up"
          style={{
            left: `${emoji.x}%`,
            bottom: `${emoji.y}%`,
            animationDelay: `${emoji.delay}ms`
          }}
        >
          <div className="text-4xl">
            {emoji.emoji}
          </div>
        </div>
      ))}
    </div>
  )
}

export default PhotoGallery
