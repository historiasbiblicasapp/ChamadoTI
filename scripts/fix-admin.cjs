const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://jksoxzsbnshogfmzaleb.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OLD_ID = '946dae83-62d5-4382-b497-45c8917f1d0c';
const EMAIL = 'wellington.s@galvanizacaoraitz.com.br';
const PASSWORD = 'Admin@123456';

if (!SERVICE_KEY) {
  console.error('Defina SUPABASE_SERVICE_ROLE_KEY:');
  console.error('  $env:SUPABASE_SERVICE_ROLE_KEY="sua-chave"');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log('=== Fix Admin User via Management API ===\n');

  // Step 1: List existing users to find current state
  console.log('1. Listando usuarios existentes...');
  const { data: users, error: listErr } = await supabase.auth.admin.listUsers();
  if (listErr) {
    console.error(`   ERRO ao listar: ${JSON.stringify(listErr)}`);
    process.exit(1);
  }
  
  const existing = users.users.find(u => u.email === EMAIL);
  let NEW_ID;
  
  if (existing) {
    console.log(`   Usuario ja existe: ${existing.id}`);
    NEW_ID = existing.id;
    
    // Update password to ensure it works
    console.log('   Atualizando senha...');
    const { error: updErr } = await supabase.auth.admin.updateUserById(NEW_ID, {
      password: PASSWORD,
      user_metadata: {
        full_name: 'Wellington Augusto',
        role: 'admin',
        department: 'Infraestrutura de TI',
      },
      email_confirm: true,
    });
    if (updErr) {
      console.error(`   ERRO update: ${JSON.stringify(updErr)}`);
    } else {
      console.log('   Senha e metadata atualizados.');
    }
  } else {
    // Create new user
    console.log('   Criando novo usuario...');
    const { data, error } = await supabase.auth.admin.createUser({
      email: EMAIL,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: {
        full_name: 'Wellington Augusto',
        role: 'admin',
        department: 'Infraestrutura de TI',
      },
    });
    if (error) {
      console.error(`   ERRO criar: ${JSON.stringify(error)}`);
      process.exit(1);
    }
    NEW_ID = data.user.id;
    console.log(`   Novo UUID: ${NEW_ID}`);
  }
  console.log(`   Novo UUID: ${NEW_ID}`);
  console.log(`   Confirmado: ${data.user.confirmed_at ? 'Sim' : 'Nao'}`);

  // Step 2: Create profile
  console.log('\n2. Criando profile...');
  const { error: profErr } = await supabase
    .from('profiles')
    .upsert({
      id: NEW_ID,
      full_name: 'Wellington Augusto',
      role: 'admin',
    }, { onConflict: 'id' });

  if (profErr) {
    console.error(`   ERRO profile: ${profErr.message}`);
    process.exit(1);
  }
  console.log('   Profile criado com role admin.');

  // Step 3: Migrate tickets (only if UUID changed)
  if (NEW_ID !== OLD_ID) {
    console.log('\n3. Migrando tickets...');
    const { error: reqErr } = await supabase
      .from('tickets')
      .update({ requester_id: NEW_ID })
      .eq('requester_id', OLD_ID);
    if (reqErr) console.log(`   Aviso requester: ${reqErr.message}`);
    else console.log('   requester_id: OK');

    const { error: assErr } = await supabase
      .from('tickets')
      .update({ assigned_to: NEW_ID })
      .eq('assigned_to', OLD_ID);
    if (assErr) console.log(`   Aviso assigned: ${assErr.message}`);
    else console.log('   assigned_to: OK');

    // Step 4: Delete old profile
    console.log('\n4. Removendo profile antigo...');
    const { error: delProfErr } = await supabase
      .from('profiles')
      .delete()
      .eq('id', OLD_ID);
    if (delProfErr) console.log(`   Aviso: ${delProfErr.message}`);
    else console.log('   Profile antigo removido.');

    // Step 5: Delete old auth user
    console.log('\n5. Removendo auth user antigo...');
    const { error: delErr } = await supabase.auth.admin.deleteUser(OLD_ID);
    if (delErr) console.log(`   Aviso: ${delErr.message}`);
    else console.log('   Auth user antigo removido.');
  } else {
    console.log('\n3. UUID nao mudou, tickets ja estao corretos.');
  }

  console.log('\n========================================');
  console.log('CONCLUIDO! Teste o login:');
  console.log(`  Email: ${EMAIL}`);
  console.log(`  Senha: ${PASSWORD}`);
  console.log(`  UUID:  ${NEW_ID}`);
  console.log('========================================');
}

main().catch(err => {
  console.error('Erro inesperado:', err.message);
  process.exit(1);
});
