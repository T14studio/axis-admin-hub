import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://kubfzjfjvovbdlqchhgh.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1YmZ6amZqdm92YmRscWNoaGdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5NTkzMzgsImV4cCI6MjA4OTUzNTMzOH0.5hgkP6ges3FyMwvmgEZMDFzVNwksNP-l6moUkm8jmvc'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkAuth() {
  console.log("Checking session...");
  // Note: We can't list Auth users with the anon key, 
  // but we can try to sign in or check the admin_users table for that email.
  const { data, error } = await supabase
    .from('admin_users')
    .select('*')
    .eq('email', 'eticahostservidor@gmail.com')
    .maybeSingle()

  if (error) {
    console.error('Error fetching admin_user:', error)
  } else {
    console.log('Admin User in DB:', data)
  }
}

checkAuth()
