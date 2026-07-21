const { createClient } = require('@supabase/supabase-js');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question) {
  return new Promise(resolve => rl.question(question, resolve));
}

async function main() {
  console.log('=== Criar Usuario Admin no Supabase ===\n');

  const url = process.env.SUPABASE_URL || await ask('SUPABASE_URL (ex: https://xxx.supabase.co): ');
  const serviceKey = process.env.SUPABASE_SERVICE_KEY || await ask('SUPABASE_SERVICE_ROLE_KEY (Settings > API > service_role): ');
  const email = process.env.ADMIN_EMAIL || await ask('Email do admin (ex: wellington.s@galvanizacaoraitz.com.br): ');
  const password = process.env.ADMIN_PASSWORD || await ask('Senha (min 6 caracteres): ');

  if (!url || !serviceKey || !email || !password) {
    console.error('\nTodos os campos sao obrigatorios.');
    process.exit(1);
  }

  if (password.length < 6) {
    console.error('\nSenha deve ter no minimo 6 caracteres.');
    process.exit(1);
  }

  console.log(`\nCriando usuario: ${email}...`);

  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      name: 'Wellington Augusto',
      role: 'admin',
      department: 'Infraestrutura de TI',
    },
  });

  if (error) {
    console.error('\nErro:', error.message);
    process.exit(1);
  }

  console.log('\nUsuario criado com sucesso!');
  console.log(`  ID:      ${data.user.id}`);
  console.log(`  Email:   ${data.user.email}`);
  console.log(`  Role:    admin`);
  console.log(`\nCopie este UUID para substituir PASTE_YOUR_ADMIN_UUID_HERE nos arquivos SQL:`);
  console.log(`\n  ${data.user.id}\n`);

  rl.close();
}

main().catch(err => {
  console.error('Erro inesperado:', err.message);
  process.exit(1);
});
