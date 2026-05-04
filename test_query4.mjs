import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const env = fs.readFileSync('.env', 'utf8')
const getEnv = (key) => env.split('\n').find(line => line.startsWith(key))?.split('=')[1]?.replace(/"/g, '')?.trim()

const supabaseUrl = getEnv('VITE_SUPABASE_URL')
const supabaseKey = getEnv('VITE_SUPABASE_PUBLISHABLE_KEY')
const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
  const { data, error } = await supabase.from("contracts").select("id, clients:client_id (full_name)").limit(1);
  console.log("Error:", error);
  console.log("Data count:", data);
}
test()
