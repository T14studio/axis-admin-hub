import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://kubfzjfjvovbdlqchhgh.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1YmZ6amZqdm92YmRscWNoaGdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5NTkzMzgsImV4cCI6MjA4OTUzNTMzOH0.5hgkP6ges3FyMwvmgEZMDFzVNwksNP-l6moUkm8jmvc'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkColumns() {
  console.log("Checking tables structure...");

  const tables = ['contracts', 'clients', 'properties'];

  for (const table of tables) {
    console.log(`\nInspecting table: ${table}`);
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .limit(1);

    if (error) {
      console.error(`Error fetching from ${table}:`, error.message);
      if (error.message.includes('column')) {
        console.log(`Hint: ${error.message}`);
      }
    } else {
      if (data && data.length > 0) {
        console.log(`Columns in ${table}:`, Object.keys(data[0]));
      } else {
        console.log(`No data in ${table} to inspect columns, or select * failed without error message.`);
      }
    }
  }
}

checkColumns()
