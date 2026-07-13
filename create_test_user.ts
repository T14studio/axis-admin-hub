import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || ''
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || ''

const supabase = createClient(supabaseUrl, supabaseKey)

async function createTestUser() {
  const email = 'axis_tester@gmail.com'
  const password = 'TestPassword123!'
  
  console.log(`Creating test user: ${email}`)
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: 'Test Administrator'
      }
    }
  })
  
  if (error) {
    console.error('Sign Up Error:', error.message)
  } else {
    console.log('Sign Up Success! User ID:', data.user?.id)
    console.log('Email confirmation might be required depending on project settings.')
    console.log('If confirmation is required, you might need to use a real email or disable it in Supabase.')
  }
}

createTestUser()
