import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://cfostxiiynlfgoxtfpva.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmb3N0eGlpeW5sZmdveHRmcHZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4ODE2MDMsImV4cCI6MjA5MTQ1NzYwM30.Khip9bKIcDXk4i2NlkTY3tNUoreW7JyNYLknWFR7Zoc'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkUser() {
  const { data, error } = await supabase
    .from('admin_users')
    .select('*')
    .eq('email', 'eticahostservidor@gmail.com')
    .maybeSingle()

  if (error) {
    console.error('Error:', error)
  } else {
    console.log('User Found:', data)
  }
}

checkUser()
