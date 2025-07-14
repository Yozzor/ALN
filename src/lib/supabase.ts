import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

// Database types (will be generated from Supabase)
export interface Database {
  public: {
    Tables: {
      events: {
        Row: {
          id: string
          title: string
          description: string | null
          event_code: string
          event_type: 'wedding' | 'festival' | 'party' | 'corporate' | 'other'
          max_participants: number
          max_photos_per_user: number
          duration_minutes: number
          status: 'waiting' | 'active' | 'voting' | 'completed'
          created_at: string
          started_at: string | null
          ended_at: string | null
          created_by: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          event_code: string
          event_type: 'wedding' | 'festival' | 'party' | 'corporate' | 'other'
          max_participants?: number
          max_photos_per_user?: number
          duration_minutes?: number
          status?: 'waiting' | 'active' | 'voting' | 'completed'
          created_at?: string
          started_at?: string | null
          ended_at?: string | null
          created_by: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          event_code?: string
          event_type?: 'wedding' | 'festival' | 'party' | 'corporate' | 'other'
          max_participants?: number
          max_photos_per_user?: number
          duration_minutes?: number
          status?: 'waiting' | 'active' | 'voting' | 'completed'
          created_at?: string
          started_at?: string | null
          ended_at?: string | null
          created_by?: string
        }
      }
      event_participants: {
        Row: {
          id: string
          event_id: string
          user_name: string
          joined_at: string
          photos_taken: number
          is_active: boolean
        }
        Insert: {
          id?: string
          event_id: string
          user_name: string
          joined_at?: string
          photos_taken?: number
          is_active?: boolean
        }
        Update: {
          id?: string
          event_id?: string
          user_name?: string
          joined_at?: string
          photos_taken?: number
          is_active?: boolean
        }
      }
      event_photos: {
        Row: {
          id: string
          event_id: string
          participant_id: string
          photo_url: string
          file_name: string
          uploaded_at: string
          votes_count: number
          award_categories: string[]
        }
        Insert: {
          id?: string
          event_id: string
          participant_id: string
          photo_url: string
          file_name: string
          uploaded_at?: string
          votes_count?: number
          award_categories?: string[]
        }
        Update: {
          id?: string
          event_id?: string
          participant_id?: string
          photo_url?: string
          file_name?: string
          uploaded_at?: string
          votes_count?: number
          award_categories?: string[]
        }
      }
      photo_votes: {
        Row: {
          id: string
          photo_id: string
          voter_participant_id: string
          award_category: string
          voted_at: string
        }
        Insert: {
          id?: string
          photo_id: string
          voter_participant_id: string
          award_category: string
          voted_at?: string
        }
        Update: {
          id?: string
          photo_id?: string
          voter_participant_id?: string
          award_category?: string
          voted_at?: string
        }
      }
    }
  }
}

export type Event = Database['public']['Tables']['events']['Row']
export type EventInsert = Database['public']['Tables']['events']['Insert']
export type EventUpdate = Database['public']['Tables']['events']['Update']

export type EventParticipant = Database['public']['Tables']['event_participants']['Row']
export type EventParticipantInsert = Database['public']['Tables']['event_participants']['Insert']

export type EventPhoto = Database['public']['Tables']['event_photos']['Row']
export type EventPhotoInsert = Database['public']['Tables']['event_photos']['Insert']

export type PhotoVote = Database['public']['Tables']['photo_votes']['Row']
export type PhotoVoteInsert = Database['public']['Tables']['photo_votes']['Insert']

// Award categories
export const AWARD_CATEGORIES = [
  'most_emotional',
  'silliest_picture', 
  'most_creative',
  'best_group_photo',
  'most_romantic',
  'funniest_moment',
  'best_candid',
  'most_artistic',
  'best_dance_move',
  'most_memorable'
] as const

export type AwardCategory = typeof AWARD_CATEGORIES[number]

// Event types
export const EVENT_TYPES = [
  'wedding',
  'festival', 
  'party',
  'corporate',
  'other'
] as const

export type EventType = typeof EVENT_TYPES[number]
