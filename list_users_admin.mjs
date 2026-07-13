import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("ERRO: As variáveis SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY precisam estar definidas.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function listUsers() {
  console.log("Conectando ao Supabase e buscando usuários...");
  const { data, error } = await supabase.auth.admin.listUsers();
  
  if (error) {
    console.error("Erro ao listar usuários:", error.message);
    return;
  }

  const users = data.users.map(u => ({
    id: u.id,
    email: u.email,
    created_at: u.created_at,
    last_sign_in_at: u.last_sign_in_at,
    email_confirmed_at: u.email_confirmed_at
  }));

  // Ordenar por data de criação (mais antigos primeiro)
  users.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

  console.table(users);
}

listUsers();
