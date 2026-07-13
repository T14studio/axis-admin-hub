import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const env = fs.readFileSync('.env', 'utf8')
const getEnv = (key) => env.split('\n').find(line => line.startsWith(key))?.split('=')[1]?.replace(/"/g, '')?.trim()

const supabaseUrl = getEnv('VITE_SUPABASE_URL')
const supabaseKey = getEnv('VITE_SUPABASE_PUBLISHABLE_KEY')

const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
  const { data, error } = await supabase
      .from("contracts")
      .select(`
        id, contract_number, client_id, client_cpf, contract_type, start_date, end_date, status, value, created_at,
        clients (
          full_name
        )
      `)
      .order("created_at", { ascending: false });
  console.log("Error:", error);
  console.log("Data count:", data?.length);
}
test()
