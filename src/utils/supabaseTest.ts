import { supabase } from '../lib/supabase'

// Test Supabase connection and database setup
export async function testSupabaseConnection() {
  try {
    console.log('🔍 Testing Supabase connection...')
    
    // Test 1: Basic connection
    const { error } = await supabase
      .from('events')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('❌ Supabase connection failed:', error)
      return false
    }
    
    console.log('✅ Supabase connection successful!')
    
    // Test 2: Check if award_categories table exists and has data
    const { data: categories, error: categoriesError } = await supabase
      .from('award_categories')
      .select('*')
      .limit(5)
    
    if (categoriesError) {
      console.error('❌ Award categories table error:', categoriesError)
      return false
    }
    
    console.log('✅ Award categories table accessible!')
    console.log('📊 Sample categories:', categories)
    
    // Test 3: Test event table access (read-only test to avoid cache issues)
    const { data: existingEvents, error: eventsError } = await supabase
      .from('events')
      .select('id, title, event_code, created_by')
      .limit(1)

    if (eventsError) {
      console.error('❌ Events table access failed:', eventsError)
      return false
    }

    console.log('✅ Events table accessible!')
    if (existingEvents && existingEvents.length > 0) {
      console.log('📋 Sample event:', existingEvents[0])
    }

    console.log('🎉 All Supabase tests passed!')
    return true
    
  } catch (error) {
    console.error('💥 Unexpected error during Supabase test:', error)
    return false
  }
}

// Generate a random 6-character event code
export function generateEventCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// Check if an event code is available
export async function isEventCodeAvailable(code: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('events')
    .select('id')
    .eq('event_code', code)
    .single()
  
  // If no data found, the code is available
  return !data && error?.code === 'PGRST116'
}

// Generate a unique event code
export async function generateUniqueEventCode(): Promise<string> {
  let attempts = 0
  const maxAttempts = 10
  
  while (attempts < maxAttempts) {
    const code = generateEventCode()
    const isAvailable = await isEventCodeAvailable(code)
    
    if (isAvailable) {
      return code
    }
    
    attempts++
  }
  
  throw new Error('Failed to generate unique event code after multiple attempts')
}
