import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || ''
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || ''

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
