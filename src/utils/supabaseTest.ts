import { supabase } from '../lib/supabase'

// Test Supabase connection and database setup
export async function testSupabaseConnection() {
  try {
    console.log('🔍 Testing Supabase connection...')

    // Debug: Log Supabase configuration
    console.log('🔧 Supabase URL:', import.meta.env.VITE_SUPABASE_URL)
    console.log('🔧 Supabase Key (first 20 chars):', import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 20) + '...')
    console.log('🔧 Expected URL: https://getikieipnbjliyopiiq.supabase.co')
    console.log('🔧 URL Match:', import.meta.env.VITE_SUPABASE_URL === 'https://getikieipnbjliyopiiq.supabase.co')

    // Check if environment variables are missing
    if (!import.meta.env.VITE_SUPABASE_URL) {
      console.error('❌ VITE_SUPABASE_URL is missing!')
      return false
    }
    if (!import.meta.env.VITE_SUPABASE_ANON_KEY) {
      console.error('❌ VITE_SUPABASE_ANON_KEY is missing!')
      return false
    }
    
    // Test 1: Basic connection with raw query
    console.log('🔍 Testing basic table access...')
    const { data: rawData, error: rawError } = await supabase
      .from('events')
      .select('*')
      .limit(1)

    if (rawError) {
      console.error('❌ Raw events query failed:', rawError)
      console.error('❌ Error details:', JSON.stringify(rawError, null, 2))
      return false
    }

    console.log('✅ Raw events query successful!')
    console.log('📊 Raw data:', rawData)
    
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

    // Test: Check which Supabase project we're actually connected to
    console.log('🔍 Checking Supabase project connection...')
    const { data: projectInfo } = await supabase
      .from('award_categories')
      .select('id, name')
      .limit(1)

    if (projectInfo && projectInfo.length > 0) {
      console.log('📋 Connected to project with award category:', projectInfo[0])
    }
    
    // Test 3: Test event table access with minimal query first
    console.log('🔍 Testing events table with minimal query...')
    const { error: countError } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      console.error('❌ Events table count failed:', countError)
      return false
    }

    console.log('✅ Events table count successful!')

    // Test 4: Test specific columns one by one to isolate the issue
    console.log('🔍 Testing individual columns...')

    // Test id column
    const { error: idError } = await supabase
      .from('events')
      .select('id')
      .limit(1)

    if (idError) {
      console.error('❌ ID column test failed:', idError)
      return false
    }
    console.log('✅ ID column accessible')

    // Test title column specifically
    const { error: titleError } = await supabase
      .from('events')
      .select('title')
      .limit(1)

    if (titleError) {
      console.error('❌ Title column test failed:', titleError)
      return false
    }
    console.log('✅ Title column accessible')

    // Test event_code column
    const { error: codeError } = await supabase
      .from('events')
      .select('event_code')
      .limit(1)

    if (codeError) {
      console.error('❌ Event code column test failed:', codeError)
      return false
    }
    console.log('✅ Event code column accessible')

    // Test all columns together
    const { data: existingEvents, error: eventsError } = await supabase
      .from('events')
      .select('id, title, event_code, status')
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
