import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://kubfzjfjvovbdlqchhgh.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1YmZ6amZqdm92YmRscWNoaGdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5NTkzMzgsImV4cCI6MjA4OTUzNTMzOH0.5hgkP6ges3FyMwvmgEZMDFzVNwksNP-l6moUkm8jmvc'

const supabase = createClient(supabaseUrl, supabaseKey)

async function listAllAdmins() {
  const { data, error } = await supabase
    .from('admin_users')
    .select('email, name, role, active')

  if (error) {
    console.error('Error:', error)
  } else {
    console.log('All Admin Users:', data)
  }
}

listAllAdmins()
