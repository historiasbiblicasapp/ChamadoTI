const https = require('https');

const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PROJECT_REF = 'jksoxzsbnshogfmzaleb';
const OLD_ID = '946dae83-62d5-4382-b497-45c8917f1d0c';
const EMAIL = 'wellington.s@galvanizacaoraitz.com.br';
const PASSWORD = 'Admin@123456';

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: `${PROJECT_REF}.supabase.co`,
      path: path,
      method: method,
      headers: {
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'apikey': SERVICE_KEY,
        'Content-Type': 'application/json',
      },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, data: data }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function main() {
  console.log('=== Teste Management API (HTTP direto) ===\n');

  // Test 1: Health check
  console.log('1. Testando Management API...');
  const health = await request('GET', '/auth/v1/health');
  console.log(`   Status: ${health.status}`);
  console.log(`   Response: ${JSON.stringify(health.data).substring(0, 200)}`);

  // Test 2: List users
  console.log('\n2. Listando usuarios...');
  const users = await request('GET', '/auth/v1/admin/users');
  console.log(`   Status: ${users.status}`);
  if (users.data?.users) {
    console.log(`   Usuarios encontrados: ${users.data.users.length}`);
    users.data.users.forEach(u => console.log(`   - ${u.id} / ${u.email}`));
  } else {
    console.log(`   Response: ${JSON.stringify(users.data).substring(0, 300)}`);
  }

  // Test 3: Delete old user
  if (users.status === 200) {
    console.log('\n3. Deletando usuario antigo...');
    const del = await request('DELETE', `/auth/v1/admin/users/${OLD_ID}`);
    console.log(`   Status: ${del.status}`);
    console.log(`   Response: ${JSON.stringify(del.data).substring(0, 200)}`);

    // Test 4: Create new user
    console.log('\n4. Criando novo usuario...');
    const create = await request('POST', '/auth/v1/admin/users', {
      email: EMAIL,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: {
        full_name: 'Wellington Augusto',
        role: 'admin',
      },
    });
    console.log(`   Status: ${create.status}`);
    console.log(`   Response: ${JSON.stringify(create.data).substring(0, 300)}`);
  }
}

main().catch(err => console.error('Erro:', err.message));
