import { createClient } from '@supabase/supabase-js'
import * as path from 'path'

const projects = [
  {
    name: "Env Project",
    url: "https://kubfzjfjvovbdlqchhgh.supabase.co",
    key: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1YmZ6amZqdm92YmRscWNoaGdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5NTkzMzgsImV4cCI6MjA4OTUzNTMzOH0.5hgkP6ges3FyMwvmgEZMDFzVNwksNP-l6moUkm8jmvc"
  },
  {
    name: "ListUsers Project",
    url: "https://cfostxiiynlfgoxtfpva.supabase.co",
    key: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmb3N0eGlpeW5sZmdveHRmcHZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4ODE2MDMsImV4cCI6MjA5MTQ1NzYwM30.Khip9bKIcDXk4i2NlkTY3tNUoreW7JyNYLknWFR7Zoc"
  }
]

async function checkProjects() {
  const email = 'eticahostservidor@gmail.com'
  const passwords = ['Axis@2024', 'Axis1234', 'AxisImobiliaria@2024', 'eticahost', '123456', 'admin123', 'Axis2024!', 'financeiro2023']
  
  const project = projects[0] // Env Project
  console.log(`\n--- Checking project: ${project.name} (${project.url}) ---`)
  const supabase = createClient(project.url, project.key)
  
  for (const password of passwords) {
    console.log(`Trying password: ${password}`)
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (authError) {
      console.error(`Auth Error: ${authError.message}`)
    } else {
      console.log(`Auth Success! Password is: ${password}`)
      console.log(`User ID: ${authData.user?.id}`)
      
      const { data: adminData, error: adminError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('user_id', authData.user?.id)
        .maybeSingle()
        
      if (adminError) {
        console.error(`Admin Table Error: ${adminError.message}`)
      } else if (!adminData) {
        console.log('User NOT found in admin_users table')
      } else {
        console.log('Admin User Data:', adminData)
      }
      return
    }
  }
}

checkProjects()
