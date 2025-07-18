import { supabase, type Event, type EventInsert, type EventParticipantInsert } from './supabase'

// Generate a random 6-character event code
export const generateEventCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// Check if event code is unique
export const isEventCodeUnique = async (code: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('events')
      .select('id')
      .eq('event_code', code)
      .single()

    if (error && error.code === 'PGRST116') {
      // No rows found - code is unique
      return true
    }

    return false
  } catch (error) {
    console.error('Error checking event code uniqueness:', error)
    return false
  }
}

// Generate a unique event code
export const generateUniqueEventCode = async (): Promise<string> => {
  let attempts = 0
  const maxAttempts = 10

  while (attempts < maxAttempts) {
    const code = generateEventCode()
    const isUnique = await isEventCodeUnique(code)
    
    if (isUnique) {
      return code
    }
    
    attempts++
  }

  throw new Error('Failed to generate unique event code after multiple attempts')
}

// Create a new event
export const createEvent = async (eventData: Omit<EventInsert, 'event_code'>): Promise<Event> => {
  try {
    const eventCode = await generateUniqueEventCode()
    
    const { data, error } = await supabase
      .from('events')
      .insert({
        ...eventData,
        event_code: eventCode,
        status: 'waiting'
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return data
  } catch (error) {
    console.error('Error creating event:', error)
    throw error
  }
}

// Find event by code
export const findEventByCode = async (code: string): Promise<Event | null> => {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('event_code', code.toUpperCase())
      .single()

    if (error && error.code === 'PGRST116') {
      // No rows found
      return null
    }

    if (error) {
      throw error
    }

    return data
  } catch (error) {
    console.error('Error finding event by code:', error)
    throw error
  }
}

// Join an event as a participant
export const joinEvent = async (eventId: string, userName: string): Promise<string> => {
  try {
    // Check if user already exists in this event
    const { data: existingParticipant } = await supabase
      .from('event_participants')
      .select('id')
      .eq('event_id', eventId)
      .eq('user_name', userName)
      .single()

    if (existingParticipant) {
      return existingParticipant.id
    }

    // Create new participant
    const participantData: EventParticipantInsert = {
      event_id: eventId,
      user_name: userName,
      photos_taken: 0,
      is_active: true
    }

    const { data, error } = await supabase
      .from('event_participants')
      .insert(participantData)
      .select()
      .single()

    if (error) {
      throw error
    }

    return data.id
  } catch (error) {
    console.error('Error joining event:', error)
    throw error
  }
}

// Get event participants count
export const getEventParticipantsCount = async (eventId: string): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('event_participants')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .eq('is_active', true)

    if (error) {
      throw error
    }

    return count || 0
  } catch (error) {
    console.error('Error getting participants count:', error)
    return 0
  }
}

// Check if event is full
export const isEventFull = async (eventId: string): Promise<boolean> => {
  try {
    const { data: event } = await supabase
      .from('events')
      .select('max_participants')
      .eq('id', eventId)
      .single()

    if (!event) return true

    const participantsCount = await getEventParticipantsCount(eventId)
    return participantsCount >= event.max_participants
  } catch (error) {
    console.error('Error checking if event is full:', error)
    return true
  }
}

// Update event status
export const updateEventStatus = async (eventId: string, status: Event['status']): Promise<void> => {
  try {
    const updateData: any = { status }
    
    if (status === 'active') {
      updateData.started_at = new Date().toISOString()
    } else if (status === 'completed') {
      updateData.ended_at = new Date().toISOString()
    }

    const { error } = await supabase
      .from('events')
      .update(updateData)
      .eq('id', eventId)

    if (error) {
      throw error
    }
  } catch (error) {
    console.error('Error updating event status:', error)
    throw error
  }
}

// Session management
export interface EventSession {
  eventId: string
  eventCode: string
  participantId: string
  userName: string
  eventTitle: string
}

// Generate user-specific storage key
const getUserSessionKey = (eventCode: string, userName: string): string => {
  return `aln-event-session-${eventCode}-${userName.toLowerCase().replace(/[^a-z0-9]/g, '')}`
}

const getUserVotingKey = (eventCode: string, userName: string): string => {
  return `aln-voted-photos-${eventCode}-${userName.toLowerCase().replace(/[^a-z0-9]/g, '')}`
}

export const saveEventSession = (session: EventSession): void => {
  const sessionKey = getUserSessionKey(session.eventCode, session.userName)
  localStorage.setItem(sessionKey, JSON.stringify(session))

  // Also save a reference to the current active session
  localStorage.setItem('aln-current-session-key', sessionKey)

  console.log(`💾 Saved session for ${session.userName} in event ${session.eventCode}`)
}

export const getEventSession = (): EventSession | null => {
  try {
    // Get the current active session key
    const currentSessionKey = localStorage.getItem('aln-current-session-key')
    if (!currentSessionKey) {
      return null
    }

    const saved = localStorage.getItem(currentSessionKey)
    if (!saved) {
      // Clean up invalid reference
      localStorage.removeItem('aln-current-session-key')
      return null
    }

    const session = JSON.parse(saved)
    console.log(`📱 Retrieved session for ${session.userName} in event ${session.eventCode}`)
    return session
  } catch (error) {
    console.error('Error getting event session:', error)
    return null
  }
}

export const clearEventSession = (): void => {
  const currentSessionKey = localStorage.getItem('aln-current-session-key')
  if (currentSessionKey) {
    localStorage.removeItem(currentSessionKey)
    localStorage.removeItem('aln-current-session-key')

    // Extract event code and user name to clear voting history
    const session = getEventSession()
    if (session) {
      const votingKey = getUserVotingKey(session.eventCode, session.userName)
      localStorage.removeItem(votingKey)
    }
  }

  console.log('🗑️ Cleared current event session')
}

// Switch to a specific user session
export const switchToUserSession = (eventCode: string, userName: string): boolean => {
  const sessionKey = getUserSessionKey(eventCode, userName)
  const saved = localStorage.getItem(sessionKey)

  if (saved) {
    localStorage.setItem('aln-current-session-key', sessionKey)
    console.log(`🔄 Switched to session for ${userName} in event ${eventCode}`)
    return true
  }

  return false
}
