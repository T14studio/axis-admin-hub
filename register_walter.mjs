import { createClient } from '@supabase/supabase-js';

const email = 'waltermontoi4@gmail.com';
const password = '@!RapeimperiodoBrasilMajestade1822#$';

const projects = [
  {
    name: 'project_1',
    url: 'https://kubfzjfjvovbdlqchhgh.supabase.co',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1YmZ6amZqdm92YmRscWNoaGdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5NTkzMzgsImV4cCI6MjA4OTUzNTMzOH0.5hgkP6ges3FyMwvmgEZMDFzVNwksNP-l6moUkm8jmvc'
  },
  {
    name: 'project_2',
    url: 'https://cfostxiiynlfgoxtfpva.supabase.co',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmb3N0eGlpeW5sZmdveHRmcHZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4ODE2MDMsImV4cCI6MjA5MTQ1NzYwM30.Khip9bKIcDXk4i2NlkTY3tNUoreW7JyNYLknWFR7Zoc'
  }
];

async function registerAll() {
  for (const proj of projects) {
    console.log(`\n--- Trying to register on ${proj.name} (${proj.url}) ---`);
    const supabase = createClient(proj.url, proj.key);
    
    // First, try to sign up
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: 'Walter Montoi'
        }
      }
    });

    if (signUpError) {
      console.log(`Sign Up Error on ${proj.name}:`, signUpError.message);
    } else {
      console.log(`Sign Up Success on ${proj.name}! User ID:`, signUpData.user?.id);
      console.log(`Requires confirmation? ${signUpData.user?.identities?.length === 0 ? 'Yes' : 'Maybe no'}`);
    }

    // Try to login just in case it already exists or was created successfully
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (signInError) {
      console.log(`Sign In Error on ${proj.name}:`, signInError.message);
    } else {
      console.log(`Sign In SUCCESS on ${proj.name}! Session established.`);
    }
  }
}

registerAll();
