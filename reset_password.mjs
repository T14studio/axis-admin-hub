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

async function resetPassword() {
  const userId = process.argv[2];
  const newPassword = process.argv[3];

  if (!userId || !newPassword) {
    console.error("USO: node reset_password.mjs <USER_ID> <NOVA_SENHA>");
    process.exit(1);
  }

  console.log(`Tentando atualizar a senha para o usuário: ${userId}...`);

  const { data, error } = await supabase.auth.admin.updateUserById(
    userId,
    { password: newPassword }
  );

  if (error) {
    console.error("ERRO ao atualizar senha:", error.message);
  } else {
    console.log("SUCESSO: A senha do usuário foi alterada com sucesso!");
    console.log("ID do Usuário:", data.user.id);
    console.log("Email:", data.user.email);
  }
}

resetPassword();
