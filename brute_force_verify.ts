import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://cfostxiiynlfgoxtfpva.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmb3N0eGlpeW5sZmdveHRmcHZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4ODE2MDMsImV4cCI6MjA5MTQ1NzYwM30.Khip9bKIcDXk4i2NlkTY3tNUoreW7JyNYLknWFR7Zoc'

const supabase = createClient(supabaseUrl, supabaseKey)

const passwords = ['Axis@2024', 'Axis1234', 'AxisImobiliaria@2024', 'eticahost', '123456', 'admin123', 'Axis2024!']

async function tryLogin() {
  for (const pw of passwords) {
    console.log(`Trying password: ${pw}`)
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'eticahostservidor@gmail.com',
      password: pw
    })
    
    if (!error) {
      console.log(`SUCCESS! Password is: ${pw}`)
      console.log('User data:', data.user)
      return
    } else {
      console.log(`Failed: ${error.message}`)
    }
  }
  console.log('All guesses failed.')
}

tryLogin()
