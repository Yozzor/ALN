import { useState } from 'react'
import { type EventType } from '../lib/supabase'

interface EventCreationProps {
  onCreateEvent: (eventData: EventCreationData) => void
  onBack: () => void
  isLoading: boolean
}

export interface EventCreationData {
  title: string
  description?: string
  event_type: EventType
  max_participants: number
  max_photos_per_user: number
  duration_minutes: number
  created_by: string
}

const EventCreation = ({ onCreateEvent, onBack, isLoading }: EventCreationProps) => {
  const [formData, setFormData] = useState<EventCreationData>({
    title: '',
    description: '',
    event_type: 'wedding',
    max_participants: 50,
    max_photos_per_user: 10,
    duration_minutes: 480, // 8 hours default
    created_by: ''
  })
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim()) {
      setError('Please enter an event title')
      return
    }

    if (!formData.created_by.trim()) {
      setError('Please enter your name as event organizer')
      return
    }

    if (formData.created_by.trim().length < 2) {
      setError('Organizer name must be at least 2 characters')
      return
    }

    setError('')
    onCreateEvent({
      ...formData,
      title: formData.title.trim(),
      description: formData.description?.trim(),
      created_by: formData.created_by.trim()
    })
  }

  const eventTypeOptions = [
    { value: 'wedding', label: '💒 Wedding', description: 'Wedding celebration' },
    { value: 'party', label: '🎉 Party', description: 'Birthday, celebration' },
    { value: 'festival', label: '🎪 Festival', description: 'Music, arts festival' },
    { value: 'corporate', label: '🏢 Corporate', description: 'Company event' },
    { value: 'other', label: '🎯 Other', description: 'Custom event type' }
  ]

  const durationOptions = [
    { value: 30, label: '30 minutes' },
    { value: 60, label: '1 hour' },
    { value: 120, label: '2 hours' },
    { value: 240, label: '4 hours' },
    { value: 480, label: '8 hours' },
    { value: 720, label: '12 hours' },
    { value: 1440, label: '1 day' },
    { value: 2880, label: '2 days' },
    { value: 4320, label: '3 days' }
  ]

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/3 w-72 h-72 bg-primary-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/3 w-72 h-72 bg-accent-orange-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="w-full max-w-lg relative z-10 animate-fade-in">
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
            Create New Event
          </h1>
          <p className="text-text-tertiary text-sm font-light tracking-wider">
            Set up your private photo event
          </p>
        </div>

        {/* Creation Form */}
        <div className="card-elevated p-8 mb-6 animate-slide-up">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Event Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-text-primary mb-3 tracking-wide">
                Event Title *
              </label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="input-field text-base py-4 font-light"
                placeholder="Sarah & John's Wedding"
                disabled={isLoading}
                autoFocus
              />
            </div>

            {/* Organizer Name */}
            <div>
              <label htmlFor="createdBy" className="block text-sm font-medium text-text-primary mb-3 tracking-wide">
                Your Name (Organizer) *
              </label>
              <input
                type="text"
                id="createdBy"
                value={formData.created_by}
                onChange={(e) => setFormData(prev => ({ ...prev, created_by: e.target.value }))}
                className="input-field text-base py-4 font-light"
                placeholder="Enter your name"
                disabled={isLoading}
              />
            </div>

            {/* Event Type */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-3 tracking-wide">
                Event Type
              </label>
              <div className="grid grid-cols-1 gap-2">
                {eventTypeOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, event_type: option.value as EventType }))}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      formData.event_type === option.value
                        ? 'border-primary-500 bg-primary-500/10'
                        : 'border-surface-secondary hover:border-surface-hover'
                    }`}
                    disabled={isLoading}
                  >
                    <div className="font-medium text-text-primary">{option.label}</div>
                    <div className="text-sm text-text-tertiary">{option.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Duration */}
            <div>
              <label htmlFor="duration" className="block text-sm font-medium text-text-primary mb-3 tracking-wide">
                Event Duration
              </label>
              <select
                id="duration"
                value={formData.duration_minutes}
                onChange={(e) => setFormData(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) }))}
                className="input-field text-base py-4"
                disabled={isLoading}
              >
                {durationOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Advanced Settings */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="maxParticipants" className="block text-sm font-medium text-text-primary mb-3 tracking-wide">
                  Max Guests
                </label>
                <input
                  type="number"
                  id="maxParticipants"
                  value={formData.max_participants}
                  onChange={(e) => setFormData(prev => ({ ...prev, max_participants: parseInt(e.target.value) || 50 }))}
                  className="input-field text-base py-4"
                  min="5"
                  max="500"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label htmlFor="maxPhotos" className="block text-sm font-medium text-text-primary mb-3 tracking-wide">
                  Photos/Person
                </label>
                <input
                  type="number"
                  id="maxPhotos"
                  value={formData.max_photos_per_user}
                  onChange={(e) => setFormData(prev => ({ ...prev, max_photos_per_user: parseInt(e.target.value) || 10 }))}
                  className="input-field text-base py-4"
                  min="1"
                  max="50"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-text-primary mb-3 tracking-wide">
                Description (Optional)
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="input-field text-base py-4 font-light resize-none"
                rows={3}
                placeholder="Special instructions or details for guests..."
                disabled={isLoading}
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm font-light">
                {error}
              </p>
            )}

            <div className="space-y-3">
              <button
                type="submit"
                disabled={isLoading || !formData.title.trim() || !formData.created_by.trim()}
                className="btn-primary w-full text-base py-4 font-medium tracking-wide"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                    Creating event...
                  </div>
                ) : (
                  'Create Event'
                )}
              </button>

              <button
                type="button"
                onClick={onBack}
                disabled={isLoading}
                className="w-full bg-surface-secondary hover:bg-surface-hover text-text-primary py-4 rounded-xl transition-colors font-medium tracking-wide"
              >
                Back
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default EventCreation
