const { execSync } = require('child_process');

const vars = {
  VITE_SUPABASE_URL: 'https://cnawymsaozndrfbuysar.supabase.co',
  VITE_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNuYXd5bXNhb3puZHJmYnV5c2FyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ4MjExMjEsImV4cCI6MjEwMDM5NzEyMX0.DSvS327bhe4QJ64R5KdiT8SgxKHB3pci0VvyS2stvd4'
};

for (const [name, value] of Object.entries(vars)) {
  try {
    execSync(`vercel env rm ${name} production --yes`, { stdio: 'ignore' });
  } catch {}
  const input = `${value}\n`;
  const proc = require('child_process').spawnSync('vercel', ['env', 'add', name, 'production', '--yes'], {
    input,
    encoding: 'utf8',
    shell: true,
    stdio: ['pipe', 'inherit', 'inherit']
  });
  console.log(`${name}:`, proc.status === 0 ? 'ok' : 'failed');
}
