import { useState, useEffect } from 'react'
import { supabase, type Event } from '../lib/supabase'
import { updateEventStatus } from '../lib/eventUtils'

interface EventParticipant {
  id: string
  user_name: string
  photos_taken: number
  is_active: boolean
  joined_at: string
}

interface EventAdminProps {
  event: Event
  currentUserName: string
  onBack: () => void
  onEventEnded: () => void
}

const EventAdmin = ({ event, currentUserName, onBack, onEventEnded }: EventAdminProps) => {
  const [participants, setParticipants] = useState<EventParticipant[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [error, setError] = useState('')

  // Check if current user is the event creator
  const isCreator = event.created_by === currentUserName

  useEffect(() => {
    if (isCreator) {
      fetchParticipants()
    }
  }, [event.id, isCreator])

  const fetchParticipants = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('event_participants')
        .select('*')
        .eq('event_id', event.id)
        .order('joined_at', { ascending: false })

      if (error) throw error
      setParticipants(data || [])
    } catch (error) {
      console.error('Error fetching participants:', error)
      setError('Failed to load participants')
    } finally {
      setLoading(false)
    }
  }

  const kickParticipant = async (participantId: string, userName: string) => {
    if (!confirm(`Are you sure you want to kick ${userName} from the event?`)) {
      return
    }

    try {
      setActionLoading(participantId)
      
      const { error } = await supabase
        .from('event_participants')
        .update({ is_active: false })
        .eq('id', participantId)

      if (error) throw error
      
      // Refresh participants list
      await fetchParticipants()
      
    } catch (error) {
      console.error('Error kicking participant:', error)
      setError('Failed to kick participant')
    } finally {
      setActionLoading(null)
    }
  }

  const endEvent = async () => {
    if (!confirm('Are you sure you want to end this event? This action cannot be undone.')) {
      return
    }

    try {
      setActionLoading('end-event')
      
      await updateEventStatus(event.id, 'completed')
      onEventEnded()
      
    } catch (error) {
      console.error('Error ending event:', error)
      setError('Failed to end event')
    } finally {
      setActionLoading(null)
    }
  }

  const startEvent = async () => {
    try {
      setActionLoading('start-event')

      await updateEventStatus(event.id, 'active')

      // Update local event state instead of reloading
      event.status = 'active'
      event.started_at = new Date().toISOString()

      console.log('✅ Event started successfully!')

    } catch (error) {
      console.error('Error starting event:', error)
      setError('Failed to start event')
    } finally {
      setActionLoading(null)
    }
  }

  if (!isCreator) {
    return (
      <div className="min-h-screen bg-surface-primary flex items-center justify-center p-4">
        <div className="card-elevated p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="text-2xl">🚫</span>
          </div>
          <h2 className="text-xl font-semibold text-text-primary mb-2">Access Denied</h2>
          <p className="text-text-secondary mb-6">
            Only the event creator can access admin tools.
          </p>
          <button
            onClick={onBack}
            className="btn-secondary"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-primary p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="card-elevated p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={onBack}
              className="text-text-tertiary hover:text-text-primary transition-colors"
            >
              ← Back to Event
            </button>
            <div className="text-center">
              <h1 className="text-2xl font-light text-text-primary tracking-wide">Event Admin</h1>
              <p className="text-text-tertiary text-sm">{event.title}</p>
            </div>
            <div className="w-20"></div> {/* Spacer for centering */}
          </div>

          {/* Event Status & Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-text-primary">{participants.filter(p => p.is_active).length}</div>
              <div className="text-text-tertiary text-sm">Active Participants</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold capitalize ${
                event.status === 'waiting' ? 'text-yellow-400' :
                event.status === 'active' ? 'text-green-400' :
                'text-gray-400'
              }`}>
                {event.status}
              </div>
              <div className="text-text-tertiary text-sm">Event Status</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-text-primary">{event.max_participants}</div>
              <div className="text-text-tertiary text-sm">Max Participants</div>
            </div>
          </div>

          {/* Event Controls */}
          <div className="flex gap-3 mt-6 justify-center">
            {event.status === 'waiting' && (
              <button
                onClick={startEvent}
                disabled={actionLoading === 'start-event'}
                className="btn-primary"
              >
                {actionLoading === 'start-event' ? 'Starting...' : '🚀 Start Event'}
              </button>
            )}
            
            {event.status !== 'completed' && (
              <button
                onClick={endEvent}
                disabled={actionLoading === 'end-event'}
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-medium transition-colors"
              >
                {actionLoading === 'end-event' ? 'Ending...' : '🛑 End Event'}
              </button>
            )}
          </div>
        </div>

        {/* Participants List */}
        <div className="card-elevated p-6">
          <h2 className="text-xl font-light text-text-primary mb-6 tracking-wide">Participants</h2>
          
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
              <p className="text-red-400 text-sm font-medium">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-surface-hover border-t-primary-500 mx-auto mb-4"></div>
              <p className="text-text-tertiary">Loading participants...</p>
            </div>
          ) : participants.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-surface-hover rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl">👥</span>
              </div>
              <p className="text-text-tertiary">No participants yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {participants.map((participant) => (
                <div
                  key={participant.id}
                  className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${
                    participant.is_active
                      ? 'bg-surface-card border-border-primary'
                      : 'bg-surface-hover border-border-secondary opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${
                      participant.is_active ? 'bg-green-400' : 'bg-gray-400'
                    }`}></div>
                    <div>
                      <div className="font-medium text-text-primary">
                        {participant.user_name}
                        {participant.user_name === currentUserName && (
                          <span className="text-primary-400 text-sm ml-2">(You)</span>
                        )}
                        {participant.user_name === event.created_by && (
                          <span className="text-yellow-400 text-sm ml-2">(Creator)</span>
                        )}
                      </div>
                      <div className="text-text-tertiary text-sm">
                        {participant.photos_taken} photos • Joined {new Date(participant.joined_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  
                  {participant.is_active && participant.user_name !== currentUserName && (
                    <button
                      onClick={() => kickParticipant(participant.id, participant.user_name)}
                      disabled={actionLoading === participant.id}
                      className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
                    >
                      {actionLoading === participant.id ? 'Kicking...' : 'Kick'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default EventAdmin
