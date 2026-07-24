const { createClient } = require('@supabase/supabase-js');

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_KEY;

if (!url || !serviceKey) {
  console.error('Defina VITE_SUPABASE_URL e SUPABASE_SERVICE_KEY no arquivo .env');
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const users = [
  { email: 'wellington.s@galvanizacaoraitz.com.br', name: 'Wellington Augusto', role: 'admin' },
  { email: 'analista@galvanizacaoraitz.com.br', name: 'Analista TI', role: 'analyst' },
  { email: 'coordenador@galvanizacaoraitz.com.br', name: 'Coordenador TI', role: 'admin' },
];

async function main() {
  for (const u of users) {
    console.log(`Criando usuario: ${u.email}...`);
    const { data, error } = await supabase.auth.admin.createUser({
      email: u.email,
      password: 'Raitz@2026',
      email_confirm: true,
      user_metadata: { full_name: u.name, role: u.role },
    });

    if (error) {
      console.error(`Erro em ${u.email}:`, error.message);
      continue;
    }
    console.log(`Criado com sucesso: ${u.email} | ID: ${data.user.id}`);
  }
}

main().catch(err => {
  console.error('Erro inesperado:', err.message);
  process.exit(1);
});
