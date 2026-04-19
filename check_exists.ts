import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://cfostxiiynlfgoxtfpva.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmb3N0eGlpeW5sZmdveHRmcHZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4ODE2MDMsImV4cCI6MjA5MTQ1NzYwM30.Khip9bKIcDXk4i2NlkTY3tNUoreW7JyNYLknWFR7Zoc'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkExistence() {
  const { data, error } = await supabase.auth.signUp({
    email: 'eticahostservidor@gmail.com',
    password: 'temporaryPassword123!'
  })
  
  if (error) {
    if (error.message.includes('already registered')) {
      console.log('USER_EXISTS')
    } else {
      console.log('ERROR:', error.message)
    }
  } else {
    console.log('USER_CREATED')
    // If it was created, maybe we should delete it if we had service role, but we don't.
  }
}

checkExistence()
