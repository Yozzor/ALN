import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { usePhotoSession } from '../hooks/usePhotoSession'
import { getEventSession } from '../lib/eventUtils'
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

// Floating emoji animation interface
interface FloatingEmoji {
  id: string
  emoji: string
  x: number
  y: number
  delay: number
  driftX: number // Horizontal drift for bubble effect
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
  const [viewMode, setViewMode] = useState<'gallery' | 'voting' | 'awards'>('gallery')
  const [currentVotingPhoto, setCurrentVotingPhoto] = useState<Photo | null>(null)
  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmoji[]>([])
  const [votedPhotoUrls, setVotedPhotoUrls] = useState<Set<string>>(new Set())
  const [isVoting, setIsVoting] = useState(false) // Prevent rapid clicking
  const [observationTimer, setObservationTimer] = useState(0) // 3-second observation timer
  const [canVote, setCanVote] = useState(false) // Whether user can vote (after observation)

  // Admin and event state management
  const [isEventCreator, setIsEventCreator] = useState(false)
  const [eventState, setEventState] = useState<'not_started' | 'countdown' | 'active' | 'ended'>('not_started')
  const [eventData, setEventData] = useState<any>(null)
  const [showStartConfirmation, setShowStartConfirmation] = useState(false)

  // Real-time countdown state
  const [timeRemaining, setTimeRemaining] = useState<number>(0) // seconds remaining
  const [countdownActive, setCountdownActive] = useState(false)
  const [showEventStartNotification, setShowEventStartNotification] = useState(false)

  // Awards state
  const [awardWinners, setAwardWinners] = useState<any[]>([])
  const [loadingAwards, setLoadingAwards] = useState(false)

  // Get user and event from URL params or session data
  const [searchParams] = useSearchParams()
  const urlUser = searchParams.get('user')
  const urlEventCode = searchParams.get('event')
  const { userName: sessionUserName } = usePhotoSession()
  const activeUserName = currentUser || urlUser || sessionUserName

  // Get event information
  const eventSession = getEventSession()
  const currentEventCode = urlEventCode || eventSession?.eventCode

  // Generate user-specific voting key
  const getUserVotingKey = (eventCode: string, userName: string): string => {
    return `aln-voted-photos-${eventCode}-${userName.toLowerCase().replace(/[^a-z0-9]/g, '')}`
  }

  // Format time remaining for display
  const formatTimeRemaining = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`
    } else {
      return `${secs}s`
    }
  }

  // Load user-specific voted photos from database
  useEffect(() => {
    if (currentEventCode && activeUserName) {
      loadUserVotes()
    }
  }, [currentEventCode, activeUserName])

  // Load user votes from Supabase
  const loadUserVotes = async () => {
    try {
      if (!currentEventCode || !activeUserName) return

      // Get event and participant IDs
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('id')
        .eq('event_code', currentEventCode)
        .single()

      if (eventError || !eventData) return

      const { data: participantData, error: participantError } = await supabase
        .from('event_participants')
        .select('id')
        .eq('event_id', eventData.id)
        .eq('user_name', activeUserName)
        .single()

      if (participantError || !participantData) return

      // Get all votes by this user in this event
      const { data: votes, error: votesError } = await supabase
        .from('photo_votes')
        .select(`
          photo_id,
          event_photos!inner(photo_url, event_id)
        `)
        .eq('voter_participant_id', participantData.id)
        .eq('event_photos.event_id', eventData.id)

      if (votesError) {
        console.error('❌ Error loading user votes:', votesError)
        return
      }

      // Extract photo URLs that user has voted on
      const votedUrls = new Set<string>()
      votes?.forEach((vote: any) => {
        if (vote.event_photos?.photo_url) {
          votedUrls.add(vote.event_photos.photo_url)
        }
      })

      setVotedPhotoUrls(votedUrls)
      console.log(`📊 Loaded ${votedUrls.size} voted photos for ${activeUserName} in event ${currentEventCode}`)

      // Also save to localStorage for backup
      const votingKey = getUserVotingKey(currentEventCode, activeUserName)
      localStorage.setItem(votingKey, JSON.stringify([...votedUrls]))

    } catch (error) {
      console.error('❌ Error loading user votes:', error)
    }
  }

  // Block access if no user name or event is available
  if (!activeUserName || !currentEventCode) {
    return (
      <div className="min-h-screen bg-surface-primary flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-surface-card rounded-2xl p-8 border border-border-primary shadow-premium text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-2xl">🚫</span>
            </div>
            <h2 className="text-xl font-semibold text-text-primary mb-2">Access Restricted</h2>
            <p className="text-text-secondary">
              {!activeUserName
                ? "You need to join an event first to access the gallery."
                : "No event information found. Please join an event first."
              }
            </p>
          </div>
          <a
            href="/"
            className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700
                       text-white px-6 py-3 rounded-xl font-medium tracking-wide transition-all duration-300
                       hover:shadow-lg hover:-translate-y-0.5 inline-flex items-center gap-2"
          >
            <span className="text-lg">🏠</span>
            Join an Event
          </a>
        </div>
      </div>
    )
  }

  useEffect(() => {
    if (currentEventCode) {
      fetchPhotos()
      fetchEventData()
      setupRealtimeSubscription()
    }

    return () => {
      // Cleanup subscription on unmount
      supabase.removeAllChannels()
    }
  }, [showAllUsers, activeUserName, currentEventCode])

  // Initialize with first random photo when photos are loaded
  useEffect(() => {
    if (photos.length > 0 && !currentVotingPhoto && viewMode === 'voting') {
      const firstPhoto = getRandomVotingPhoto()
      setCurrentVotingPhoto(firstPhoto)
      if (firstPhoto) {
        startObservationTimer()
      }
    }
  }, [photos, viewMode])

  // Start observation timer when currentVotingPhoto changes (but not during voting process)
  useEffect(() => {
    if (currentVotingPhoto && !isVoting && viewMode === 'voting') {
      startObservationTimer()
    }
  }, [currentVotingPhoto])

  // Countdown timer effect - updates every second when active
  useEffect(() => {
    if (!countdownActive || timeRemaining <= 0) return

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        const newTime = prev - 1
        if (newTime <= 0) {
          setCountdownActive(false)
          // Event will be ended by calculateTimeRemaining function
        }
        return Math.max(0, newTime)
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [countdownActive, timeRemaining])

  // Get random photo for voting (excluding already voted photos)
  const getRandomVotingPhoto = (excludeUrls?: Set<string>) => {
    if (photos.length === 0) {
      console.log('📷 No photos available for voting')
      return null
    }

    // Use provided excludeUrls or fall back to current votedPhotoUrls
    const urlsToExclude = excludeUrls || votedPhotoUrls

    // Filter out photos that have already been voted on
    const unvotedPhotos = photos.filter(photo => !urlsToExclude.has(photo.url))
    console.log(`📷 Total photos: ${photos.length}, Voted: ${urlsToExclude.size}, Unvoted: ${unvotedPhotos.length}`)

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
    const firstPhoto = getRandomVotingPhoto()
    setCurrentVotingPhoto(firstPhoto)
    if (firstPhoto) {
      startObservationTimer()
    }
  }

  // Start observation timer for new photo
  const startObservationTimer = () => {
    setCanVote(false)
    setObservationTimer(3) // 3 seconds

    const timer = setInterval(() => {
      setObservationTimer(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          setCanVote(true) // Enable voting after 3 seconds
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  // Vote for a photo with observation timer and debouncing
  const voteForPhoto = async (photoUrl: string, category: string) => {
    // Prevent voting during observation period or while already voting
    if (!canVote || isVoting) {
      console.log('🚫 Vote blocked - observation period or already voting')
      return
    }

    try {
      setIsVoting(true)
      console.log(`🗳️ Voting for photo: ${photoUrl} in category: ${category}`)

      // Save vote to Supabase database
      const voteSuccess = await saveVoteToDatabase(photoUrl, category)

      if (voteSuccess) {
        // Mark this photo as voted locally for UI updates
        let updatedVotedUrls: Set<string> = new Set()
        if (currentEventCode && activeUserName) {
          setVotedPhotoUrls(prev => {
            updatedVotedUrls = new Set([...prev, photoUrl])
            const votingKey = getUserVotingKey(currentEventCode, activeUserName)
            localStorage.setItem(votingKey, JSON.stringify([...updatedVotedUrls]))
            console.log(`📊 Saved vote for ${activeUserName} in event ${currentEventCode}`)
            return updatedVotedUrls
          })
        }

        // Find the category to get the emoji
        const selectedCategory = AWARD_CATEGORIES.find(cat => cat.id === category)
        if (selectedCategory) {
          // Trigger floating emoji animation
          createFloatingEmojis(selectedCategory.emoji)
        }

        // Show next random photo after animation starts
        setTimeout(() => {
          // Pass the updated voted URLs to ensure we don't show the same photo again
          const nextPhoto = getRandomVotingPhoto(updatedVotedUrls)
          setCurrentVotingPhoto(nextPhoto)
          setIsVoting(false) // Re-enable voting

          // Start observation timer for next photo
          if (nextPhoto) {
            startObservationTimer()
          }
        }, 1500) // Increased delay to see animation better
      } else {
        setIsVoting(false) // Re-enable voting on error
      }

    } catch (error) {
      console.error('Failed to vote:', error)
      setIsVoting(false) // Re-enable voting on error
    }
  }

  // Skip photo without voting
  const skipPhoto = () => {
    const nextPhoto = getRandomVotingPhoto()
    setCurrentVotingPhoto(nextPhoto)
    if (nextPhoto) {
      startObservationTimer()
    }
  }

  // Refresh voting list (fetch new photos but keep voted history)
  const refreshVotingList = async () => {
    console.log('🔄 Refreshing photo list (keeping voted history)')
    await fetchPhotos()
    // After photos are fetched, get a new random photo
    setTimeout(() => {
      const newPhoto = getRandomVotingPhoto()
      setCurrentVotingPhoto(newPhoto)
      if (!newPhoto) {
        console.log('📷 Still no new photos to vote on after refresh')
      }
    }, 100)
  }

  // Admin function to start the event
  const startEvent = async () => {
    if (!isEventCreator || !eventData || !currentEventCode) {
      console.error('❌ Not authorized to start event')
      return
    }

    try {
      console.log('🚀 Starting event countdown...')

      const now = new Date()
      const countdownStartTime = now.toISOString()

      // Update event state to countdown
      const { error } = await supabase
        .from('events')
        .update({
          event_state: 'countdown',
          countdown_start_time: countdownStartTime,
          event_started_at: countdownStartTime
        })
        .eq('event_code', currentEventCode)

      if (error) {
        console.error('❌ Failed to start event:', error)
        alert('Failed to start event. Please try again.')
        return
      }

      console.log('✅ Event started successfully!')
      setEventState('countdown')
      setShowStartConfirmation(false)

      // Calculate initial time remaining
      calculateTimeRemaining({
        countdown_start_time: countdownStartTime,
        duration_minutes: eventData.duration_minutes,
        event_state: 'countdown'
      })

    } catch (error) {
      console.error('❌ Error starting event:', error)
      alert('Failed to start event. Please try again.')
    }
  }

  // End the event when countdown finishes
  // Save vote to Supabase database
  const saveVoteToDatabase = async (photoUrl: string, category: string): Promise<boolean> => {
    try {
      if (!currentEventCode || !activeUserName) {
        console.error('❌ Missing event code or user name for voting')
        return false
      }

      // Get event and participant IDs
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('id')
        .eq('event_code', currentEventCode)
        .single()

      if (eventError || !eventData) {
        console.error('❌ Event not found for voting:', eventError)
        return false
      }

      const { data: participantData, error: participantError } = await supabase
        .from('event_participants')
        .select('id')
        .eq('event_id', eventData.id)
        .eq('user_name', activeUserName)
        .single()

      if (participantError || !participantData) {
        console.error('❌ Participant not found for voting:', participantError)
        return false
      }

      // Get photo ID from URL
      const { data: photoData, error: photoError } = await supabase
        .from('event_photos')
        .select('id')
        .eq('photo_url', photoUrl)
        .eq('event_id', eventData.id)
        .single()

      if (photoError || !photoData) {
        console.error('❌ Photo not found for voting:', photoError)
        return false
      }

      // Save the vote
      const { error: voteError } = await supabase
        .from('photo_votes')
        .insert({
          event_id: eventData.id,
          photo_id: photoData.id,
          voter_participant_id: participantData.id,
          award_category: category,
          category: category // Keep both for compatibility
        })

      if (voteError) {
        // Check if it's a duplicate vote error
        if (voteError.code === '23505') { // Unique constraint violation
          console.log('⚠️ User already voted on this photo in this category')
          alert('You have already voted on this photo in this category!')
          return false
        }
        console.error('❌ Failed to save vote:', voteError)
        return false
      }

      console.log(`✅ Vote saved to database: ${category} for photo ${photoData.id}`)
      return true

    } catch (error) {
      console.error('❌ Error saving vote to database:', error)
      return false
    }
  }

  const endEvent = async (eventId: string) => {
    try {
      console.log('🏁 Ending event...')

      const { error } = await supabase
        .from('events')
        .update({
          event_state: 'ended',
          event_ended_at: new Date().toISOString()
        })
        .eq('id', eventId)

      if (error) {
        console.error('❌ Failed to end event:', error)
        return
      }

      console.log('✅ Event ended successfully!')
      setEventState('ended')
      setCountdownActive(false)

      // Calculate and show awards
      await calculateAwardWinners()
      setViewMode('awards')

    } catch (error) {
      console.error('❌ Error ending event:', error)
    }
  }

  // Calculate award winners from vote data
  const calculateAwardWinners = async () => {
    try {
      setLoadingAwards(true)
      console.log('🏆 Calculating award winners...')

      if (!currentEventCode) return

      // Get event ID
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('id')
        .eq('event_code', currentEventCode)
        .single()

      if (eventError || !eventData) {
        console.error('❌ Event not found for awards:', eventError)
        return
      }

      // Get vote counts by category and photo FOR THIS EVENT ONLY
      const { data: voteData, error: voteError } = await supabase
        .from('photo_votes')
        .select(`
          award_category,
          photo_id,
          event_photos!inner(
            photo_url,
            file_name,
            uploaded_at,
            event_id,
            event_participants!inner(user_name)
          )
        `)
        .eq('event_photos.event_id', eventData.id)

      if (voteError) {
        console.error('❌ Error fetching vote data:', voteError)
        return
      }

      // Group votes by category and count them
      const categoryWinners: any[] = []

      AWARD_CATEGORIES.forEach(category => {
        const categoryVotes = voteData?.filter(vote => vote.award_category === category.id) || []

        // Count votes per photo
        const voteCounts: { [photoId: string]: { count: number, photo: any } } = {}

        categoryVotes.forEach(vote => {
          if (!voteCounts[vote.photo_id]) {
            voteCounts[vote.photo_id] = {
              count: 0,
              photo: vote.event_photos
            }
          }
          voteCounts[vote.photo_id].count++
        })

        // Find winner(s) - photos with highest vote count
        const maxVotes = Math.max(...Object.values(voteCounts).map(v => v.count), 0)
        const winners = Object.values(voteCounts).filter(v => v.count === maxVotes && v.count > 0)

        if (winners.length > 0) {
          categoryWinners.push({
            category,
            winners: winners.map(w => ({
              ...w.photo,
              voteCount: w.count
            })),
            maxVotes
          })
        }
      })

      setAwardWinners(categoryWinners)
      console.log(`🏆 Calculated ${categoryWinners.length} category winners`)

    } catch (error) {
      console.error('❌ Error calculating award winners:', error)
    } finally {
      setLoadingAwards(false)
    }
  }

  // Create floating emoji animation with smooth staggered fade-ins
  const createFloatingEmojis = (emoji: string) => {
    console.log(`🎆 Creating floating emojis for: ${emoji}`)
    const newEmojis: FloatingEmoji[] = []
    const emojiCount = 12 + Math.floor(Math.random() * 6) // 12-17 emojis

    for (let i = 0; i < emojiCount; i++) {
      // Create more natural distribution across screen width
      const xPos = 10 + Math.random() * 80 // Keep emojis within 10-90% of screen width

      // Random horizontal drift for bubble effect (-25px to +25px)
      const drift = (Math.random() * 50 - 25)

      // Staggered delays for smooth individual fade-ins (0-2000ms spread)
      const baseDelay = i * 150 // Base stagger
      const randomDelay = Math.random() * 200 // Add randomness

      newEmojis.push({
        id: `${Date.now()}-${i}`,
        emoji,
        x: xPos, // Random x position (10-90%)
        y: 0, // Start from bottom of screen (bottom: 0%)
        delay: baseDelay + randomDelay, // Smooth staggered delays
        driftX: drift // Horizontal drift for bubble effect
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
    }, 5000) // Increased to match longer animation duration
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

  // Setup real-time subscription for event updates
  const setupRealtimeSubscription = () => {
    if (!currentEventCode) return

    console.log(`🔄 Setting up realtime subscription for event: ${currentEventCode}`)

    const channel = supabase
      .channel(`event-${currentEventCode}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'events',
          filter: `event_code=eq.${currentEventCode}`
        },
        (payload) => {
          console.log('🔄 Event update received:', payload)
          handleEventUpdate(payload.new)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  // Handle real-time event updates
  const handleEventUpdate = (updatedEvent: any) => {
    console.log('📡 Processing event update:', updatedEvent)

    setEventData(updatedEvent)
    const newEventState = updatedEvent.event_state || 'not_started'
    setEventState(newEventState)

    // If event just started, show notification to all users
    if (newEventState === 'countdown' && eventState !== 'countdown') {
      setShowEventStartNotification(true)
      setTimeout(() => setShowEventStartNotification(false), 5000) // Hide after 5 seconds
    }

    // If event just ended, force ALL users to awards ceremony
    if (newEventState === 'ended' && eventState !== 'ended') {
      console.log('🏁 Event ended! Forcing all users to awards ceremony...')
      calculateAwardWinners()
      setViewMode('awards')
      setCountdownActive(false)
    }

    // Calculate time remaining if countdown is active
    if (newEventState === 'countdown' && updatedEvent.countdown_start_time) {
      calculateTimeRemaining(updatedEvent)
    }
  }

  // Calculate remaining time for countdown
  const calculateTimeRemaining = (event: any) => {
    if (!event.countdown_start_time || !event.duration_minutes) return

    const startTime = new Date(event.countdown_start_time).getTime()
    const durationMs = event.duration_minutes * 60 * 1000 // Convert minutes to milliseconds
    const endTime = startTime + durationMs
    const now = Date.now()

    const remaining = Math.max(0, endTime - now)
    const remainingSeconds = Math.floor(remaining / 1000)

    setTimeRemaining(remainingSeconds)
    setCountdownActive(remainingSeconds > 0)

    console.log(`⏰ Time remaining: ${remainingSeconds} seconds`)

    // If time is up, mark event as ended
    if (remainingSeconds <= 0 && event.event_state === 'countdown') {
      endEvent(event.id)
    }
  }

  const fetchEventData = async () => {
    try {
      if (!currentEventCode || !activeUserName) return

      console.log(`🎯 Fetching event data for: ${currentEventCode}`)

      // Get event details including creator and state
      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('event_code', currentEventCode)
        .single()

      if (eventError || !event) {
        console.error('Event not found:', eventError)
        return
      }

      setEventData(event)
      setEventState(event.event_state || 'not_started')

      // Check if current user is the event creator
      const isCreator = event.created_by === activeUserName
      setIsEventCreator(isCreator)

      console.log(`👑 User ${activeUserName} is event creator: ${isCreator}`)
      console.log(`📊 Event state: ${event.event_state || 'not_started'}`)

    } catch (error) {
      console.error('Error fetching event data:', error)
    }
  }

  const fetchPhotos = async () => {
    try {
      setLoading(true)
      setError(null)

      if (!currentEventCode) {
        setError('No event selected')
        return
      }

      console.log(`📸 Fetching photos for event: ${currentEventCode}`)

      // First, get the event ID from the event code
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('id')
        .eq('event_code', currentEventCode)
        .single()

      if (eventError || !eventData) {
        console.error('Event not found:', eventError)
        setError('Event not found')
        return
      }

      // Then fetch photos for this event from Supabase
      let query = supabase
        .from('event_photos')
        .select(`
          id,
          photo_url,
          file_name,
          file_size,
          uploaded_at,
          event_participants!inner(user_name)
        `)
        .eq('event_id', eventData.id)

      // Filter by user if not showing all users
      if (!showAllUsers && activeUserName) {
        query = query.eq('event_participants.user_name', activeUserName)
      }

      const { data: photosData, error: photosError } = await query

      if (photosError) {
        console.error('Error fetching photos:', photosError)
        setError('Failed to load photos from event')
        return
      }

      // Transform Supabase data to match our Photo interface
      const transformedPhotos: Photo[] = (photosData || []).map((photo: any) => ({
        url: photo.photo_url,
        fileName: photo.file_name,
        size: photo.file_size || 0,
        uploadedAt: photo.uploaded_at,
        userName: photo.event_participants.user_name
      }))

      console.log(`📸 Found ${transformedPhotos.length} photos for event ${currentEventCode}`)
      setPhotos(transformedPhotos)
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

      {/* Minimal Countdown Indicator - Fixed Position */}
      {eventState === 'countdown' && countdownActive && (
        <div className="fixed top-4 right-4 z-50 bg-green-500/20 backdrop-blur-sm border border-green-500/30 rounded-full px-3 py-1.5 shadow-lg">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-green-400 text-sm">⏰</span>
            <span className="text-white font-mono font-medium">{formatTimeRemaining(timeRemaining)}</span>
          </div>
        </div>
      )}

      {/* Header - COMPLETELY REWRITTEN FOR MOBILE */}
      <div className="relative z-10 glass border-b border-border-primary/30 p-4">
        <div className="max-w-4xl mx-auto">

          {/* Simple Mobile-First Layout */}
          <div className="space-y-4">

            {/* Title Row */}
            <div className="text-center">
              <h1 className="text-text-primary font-light text-xl sm:text-2xl tracking-wide">
                Event Gallery
              </h1>
            </div>

            {/* Event Info Row */}
            <div className="text-center space-y-1">
              <p className="text-primary-400 font-medium text-sm">Event: {currentEventCode}</p>
              <p className="text-text-tertiary text-xs">
                {showAllUsers
                  ? `${photos.length} photos from all participants`
                  : activeUserName
                    ? `${photos.length} photos by ${activeUserName}`
                    : `${photos.length} photos uploaded`
                }
              </p>
            </div>

            {/* Event Ended Banner */}
            {eventState === 'ended' && (
              <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-lg p-3">
                <div className="text-center space-y-2">
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-xl">🏆</span>
                    <p className="text-purple-400 font-semibold">Event Completed!</p>
                  </div>
                  <button
                    onClick={() => {
                      calculateAwardWinners()
                      setViewMode('awards')
                    }}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700
                               text-white px-4 py-2 rounded-lg font-medium transition-all duration-300
                               hover:shadow-lg flex items-center justify-center gap-2"
                  >
                    <span>🏆</span>
                    View Awards
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Control Panel - SIMPLIFIED MOBILE LAYOUT */}
      <div className="relative z-10 bg-surface-secondary/50 border-b border-border-primary/20 p-4">
        <div className="max-w-4xl mx-auto space-y-3">

          {/* View Mode Toggle */}
          {activeUserName && viewMode === 'gallery' && (
            <div className="flex justify-center">
              <div className="flex bg-surface-card rounded-lg border border-border-primary overflow-hidden">
                <button
                  onClick={() => setShowAllUsers(false)}
                  className={`px-3 py-2 text-sm font-medium transition-all duration-300 ${
                    !showAllUsers
                      ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                  }`}
                >
                  My Photos
                </button>
                <button
                  onClick={() => setShowAllUsers(true)}
                  className={`px-3 py-2 text-sm font-medium transition-all duration-300 ${
                    showAllUsers
                      ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                  }`}
                >
                  All Photos
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons - STACKED ON MOBILE */}
          <div className="space-y-2">
            {/* Admin Controls */}
            {isEventCreator && eventState === 'not_started' && (
              <button
                onClick={() => setShowStartConfirmation(true)}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700
                           text-white px-4 py-2.5 rounded-lg font-medium transition-all duration-300
                           flex items-center justify-center gap-2"
              >
                <span>🚀</span>
                Start Event
              </button>
            )}

            {/* Admin Test Button */}
            {isEventCreator && eventState !== 'ended' && (
              <button
                onClick={() => {
                  if (eventData?.id) {
                    endEvent(eventData.id)
                  }
                }}
                className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700
                           text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300
                           flex items-center justify-center gap-2"
              >
                <span>🏁</span>
                Test End Event
              </button>
            )}

            {/* Start Voting Button */}
            {viewMode === 'gallery' && photos.length > 0 && (
              <button
                onClick={startVoting}
                className="w-full bg-gradient-to-r from-accent-orange-500 to-accent-orange-600 hover:from-accent-orange-600 hover:to-accent-orange-700
                           text-white px-4 py-2.5 rounded-lg font-medium transition-all duration-300
                           flex items-center justify-center gap-2"
              >
                <span>🗳️</span>
                Start Voting
              </button>
            )}

            {/* Back to Gallery Button */}
            {viewMode === 'voting' && (
              <button
                onClick={() => setViewMode('gallery')}
                className="w-full bg-surface-card hover:bg-surface-hover border border-border-primary text-text-primary
                           px-4 py-2.5 rounded-lg font-medium transition-all duration-300
                           flex items-center justify-center gap-2"
              >
                <span>📸</span>
                Back to Gallery
              </button>
            )}
          </div>

        </div>
      </div>

          {/* Back to App Link */}
          <div className="text-center pt-2">
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center text-primary-400 hover:text-primary-300 transition-all duration-300
                         hover:-translate-x-1 group font-medium tracking-wide text-sm"
            >
              <span className="mr-2 group-hover:mr-3 transition-all duration-300">←</span>
              Back to Camera
            </button>
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

          {/* Observation Timer */}
          {!canVote && observationTimer > 0 && (
            <div className="flex-shrink-0 bg-black/90 backdrop-blur-sm p-4 border-b border-gray-800">
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-3">
                  <p className="text-white text-sm font-medium mb-2">
                    📸 Take a moment to observe this photo
                  </p>
                  <p className="text-gray-300 text-xs">
                    Voting available in {observationTimer} second{observationTimer !== 1 ? 's' : ''}
                  </p>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-full progress-bar"
                    key={currentVotingPhoto.url} // Reset animation on new photo
                  />
                </div>
              </div>
            </div>
          )}

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
                    disabled={!canVote || isVoting}
                    className={`bg-gradient-to-r ${category.color}
                               ${canVote && !isVoting
                                 ? 'hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl'
                                 : 'opacity-50 cursor-not-allowed'
                               }
                               text-white font-medium py-4 px-3 rounded-xl transition-all duration-200
                               flex flex-col items-center gap-1 min-h-[80px]`}
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
                  Check for New Photos
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

      {/* Awards Ceremony */}
      {viewMode === 'awards' && (
        <div className="fixed inset-0 bg-gradient-to-br from-purple-900 via-black to-blue-900 z-[90] overflow-y-auto">
          {/* Awards Header */}
          <div className="text-center py-12 px-4">
            <div className="animate-fade-in">
              <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 mb-4">
                🏆 AWARDS CEREMONY 🏆
              </h1>
              <p className="text-xl text-white/80 mb-2">Event: {currentEventCode}</p>
              <p className="text-lg text-white/60">Celebrating the best moments captured!</p>
            </div>
          </div>

          {/* Loading State */}
          {loadingAwards && (
            <div className="text-center py-20">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-yellow-400 border-t-transparent mx-auto mb-4"></div>
              <p className="text-white text-xl">Calculating winners...</p>
            </div>
          )}

          {/* Award Categories */}
          {!loadingAwards && awardWinners.length > 0 && (
            <div className="max-w-6xl mx-auto px-4 pb-20">
              {awardWinners.map((award, index) => (
                <div
                  key={award.category.id}
                  className="mb-16 animate-slide-up"
                  style={{ animationDelay: `${index * 200}ms` }}
                >
                  {/* Category Header */}
                  <div className="text-center mb-8">
                    <div className="text-6xl mb-4">{award.category.emoji}</div>
                    <h2 className="text-3xl font-bold text-white mb-2">{award.category.label}</h2>
                    <p className="text-white/60">{award.maxVotes} vote{award.maxVotes !== 1 ? 's' : ''}</p>
                  </div>

                  {/* Winners */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {award.winners.map((winner: any, winnerIndex: number) => (
                      <div
                        key={winner.photo_url}
                        className={`relative group ${
                          award.winners.length > 1 && winnerIndex > 0
                            ? 'opacity-75 scale-95'
                            : ''
                        }`}
                      >
                        {/* Winner Badge */}
                        {award.winners.length > 1 && winnerIndex > 0 && (
                          <div className="absolute -top-4 -right-4 z-10 bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                            😅 Runner-up!
                          </div>
                        )}

                        {award.winners.length === 1 || winnerIndex === 0 ? (
                          <div className="absolute -top-4 -right-4 z-10 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                            👑 WINNER!
                          </div>
                        ) : null}

                        {/* Photo Card */}
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl overflow-hidden border border-white/20 hover:border-white/40 transition-all duration-300 hover:scale-105">
                          <img
                            src={winner.photo_url}
                            alt={`Winner by ${winner.user_name}`}
                            className="w-full h-64 object-cover"
                          />
                          <div className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-white font-semibold">{winner.user_name}</p>
                                <p className="text-white/60 text-sm">
                                  {new Date(winner.uploaded_at).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-yellow-400 font-bold text-lg">{winner.voteCount}</p>
                                <p className="text-white/60 text-sm">votes</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Back to Gallery Button */}
              <div className="text-center mt-16">
                <button
                  onClick={() => setViewMode('gallery')}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700
                             text-white font-bold py-4 px-8 rounded-xl transition-all duration-300
                             shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                  📸 View Full Gallery
                </button>
              </div>
            </div>
          )}

          {/* No Winners State */}
          {!loadingAwards && awardWinners.length === 0 && (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🤷‍♂️</div>
              <h2 className="text-2xl text-white mb-4">No votes yet!</h2>
              <p className="text-white/60 mb-8">Looks like nobody voted during this event.</p>
              <button
                onClick={() => setViewMode('gallery')}
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl"
              >
                Back to Gallery
              </button>
            </div>
          )}
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
            animationDelay: `${emoji.delay}ms`,
            '--drift-x': `${emoji.driftX}px`
          } as React.CSSProperties & { '--drift-x': string }}
        >
          <div className="text-4xl drop-shadow-lg">
            {emoji.emoji}
          </div>
        </div>
      ))}

      {/* Start Event Confirmation Dialog */}
      {showStartConfirmation && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-surface-card rounded-2xl p-8 max-w-md w-full border border-border-primary shadow-premium animate-fade-in">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl">🚀</span>
              </div>
              <h3 className="text-xl font-semibold text-text-primary mb-2">Start Event Countdown?</h3>
              <p className="text-text-secondary">
                This will start the {eventData?.duration_minutes ? Math.floor(eventData.duration_minutes / 60) : '?'}-hour countdown for all participants.
                Once started, users will have the full duration to upload photos and vote.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowStartConfirmation(false)}
                className="flex-1 px-4 py-3 bg-surface-hover hover:bg-surface-tertiary text-text-secondary hover:text-text-primary
                           rounded-xl transition-all duration-200 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={startEvent}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700
                           text-white rounded-xl transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
              >
                Start Now! 🎉
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Event Starting Soon Notification */}
      {showEventStartNotification && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[200] animate-slide-down">
          <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-6 py-4 rounded-xl shadow-xl border border-white/20">
            <div className="flex items-center gap-3">
              <span className="text-2xl animate-bounce">🚀</span>
              <div>
                <p className="font-semibold">Event Started!</p>
                <p className="text-sm opacity-90">The countdown has begun! Start uploading and voting!</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PhotoGallery
