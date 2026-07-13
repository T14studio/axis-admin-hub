import { createClient } from '@supabase/supabase-js'

// Using the keys from hostinger_deploy.env (hocrbyevkaothhnxptem)
const supabaseUrl = 'https://hocrbyevkaothhnxptem.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhvY3JieWV2a2FvdGhobnhwdGVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0MjQ5MzAsImV4cCI6MjA5MTAwMDkzMH0.EvYGvUppmLCVBAhGMPxp8ggvrTE7v23XjZxdAMxjH8k'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkExistence() {
  const { data, error } = await supabase.auth.signUp({
    email: 'eticahostservidor@gmail.com',
    password: 'temporaryPassword123!'
  })
  
  if (error) {
    if (error.message.includes('already registered')) {
      console.log('USER_EXISTS_IN_HOCR')
    } else {
      console.log('ERROR:', error.message)
    }
  } else {
    console.log('USER_CREATED_IN_HOCR')
  }
}

checkExistence()
