import { supabase, Event, EventInsert, EventParticipant, AWARD_CATEGORIES } from './supabase'

/**
 * Generate a 6-character event code
 */
export function generateEventCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * Check if an event code is unique
 */
export async function isEventCodeUnique(code: string): Promise<boolean> {
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
}

/**
 * Generate a unique 6-character event code
 */
export async function generateUniqueEventCode(): Promise<string> {
  let code: string
  let isUnique = false
  let attempts = 0
  const maxAttempts = 10

  do {
    code = generateEventCode()
    isUnique = await isEventCodeUnique(code)
    attempts++
  } while (!isUnique && attempts < maxAttempts)

  if (!isUnique) {
    throw new Error('Failed to generate unique event code after multiple attempts')
  }

  return code
}

/**
 * Create a new event
 */
export async function createEvent(eventData: Omit<EventInsert, 'event_code' | 'created_by'>): Promise<Event> {
  const eventCode = await generateUniqueEventCode()
  
  const { data, error } = await supabase
    .from('events')
    .insert({
      ...eventData,
      event_code: eventCode,
      created_by: 'anonymous', // For now, we'll use anonymous until we add proper auth
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create event: ${error.message}`)
  }

  return data
}

/**
 * Get event by code
 */
export async function getEventByCode(code: string): Promise<Event | null> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('event_code', code.toUpperCase())
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null // Event not found
    }
    throw new Error(`Failed to get event: ${error.message}`)
  }

  return data
}

/**
 * Join an event as a participant
 */
export async function joinEvent(eventId: string, userName: string): Promise<EventParticipant> {
  // Check if user already joined
  const { data: existing } = await supabase
    .from('event_participants')
    .select('*')
    .eq('event_id', eventId)
    .eq('user_name', userName)
    .single()

  if (existing) {
    return existing
  }

  // Add new participant
  const { data, error } = await supabase
    .from('event_participants')
    .insert({
      event_id: eventId,
      user_name: userName,
      photos_taken: 0,
      is_active: true
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to join event: ${error.message}`)
  }

  return data
}

/**
 * Get event participants
 */
export async function getEventParticipants(eventId: string): Promise<EventParticipant[]> {
  const { data, error } = await supabase
    .from('event_participants')
    .select('*')
    .eq('event_id', eventId)
    .eq('is_active', true)
    .order('joined_at', { ascending: true })

  if (error) {
    throw new Error(`Failed to get participants: ${error.message}`)
  }

  return data || []
}

/**
 * Update event status
 */
export async function updateEventStatus(eventId: string, status: Event['status']): Promise<void> {
  const updates: any = { status }
  
  if (status === 'active') {
    updates.started_at = new Date().toISOString()
  } else if (status === 'completed') {
    updates.ended_at = new Date().toISOString()
  }

  const { error } = await supabase
    .from('events')
    .update(updates)
    .eq('id', eventId)

  if (error) {
    throw new Error(`Failed to update event status: ${error.message}`)
  }
}

/**
 * Check if event is full
 */
export async function isEventFull(eventId: string): Promise<boolean> {
  const [event, participants] = await Promise.all([
    supabase.from('events').select('max_participants').eq('id', eventId).single(),
    supabase.from('event_participants').select('id').eq('event_id', eventId).eq('is_active', true)
  ])

  if (event.error || participants.error) {
    throw new Error('Failed to check event capacity')
  }

  return (participants.data?.length || 0) >= event.data.max_participants
}

/**
 * Subscribe to event changes
 */
export function subscribeToEvent(eventId: string, callback: (event: Event) => void) {
  return supabase
    .channel(`event-${eventId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'events',
        filter: `id=eq.${eventId}`
      },
      (payload) => {
        callback(payload.new as Event)
      }
    )
    .subscribe()
}

/**
 * Subscribe to event participants changes
 */
export function subscribeToEventParticipants(eventId: string, callback: (participants: EventParticipant[]) => void) {
  return supabase
    .channel(`participants-${eventId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'event_participants',
        filter: `event_id=eq.${eventId}`
      },
      async () => {
        // Refetch all participants when any change occurs
        const participants = await getEventParticipants(eventId)
        callback(participants)
      }
    )
    .subscribe()
}

/**
 * Get award categories with display names
 */
export function getAwardCategoriesWithLabels() {
  return AWARD_CATEGORIES.map(category => ({
    value: category,
    label: category.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }))
}
