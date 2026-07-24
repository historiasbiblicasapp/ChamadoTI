const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://edhadvmmlsvrncirnkov.supabase.co';

// COLE AQUI SUA SERVICE_ROLE_KEY (NÃO A ANON KEY)
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkaGFkdm1tbHN2cm5jaXJua292Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDUzMTEyMywiZXhwIjoyMTAwMTA3MTIzfQ.faPWuyIc8qDC08zeioPzsUtwlXmyi5-rX07IBL0AyNg';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function main() {
    const email = process.argv[2];
    const password = process.argv[3];

    if (!email || !password) {
        console.log('Uson: node reset-password.js email novaSenha');
        process.exit(1);
    }

    const { data, error } = await supabase.auth.admin.listUsers();

    if (error) {
        console.error('Erro ao listar usuários:', error.message);
        process.exit(1);
    }

    const user = data.users.find(u => u.email === email);

    if (!user) {
        console.log('Usuário não encontrado.');
        process.exit(1);
    }

    const { error: updateError } =
        await supabase.auth.admin.updateUserById(user.id, {
            password,
            email_confirm: true
        });

    if (updateError) {
        console.error('Erro ao alterar senha:', updateError.message);
        process.exit(1);
    }

    console.log('Senha alterada com sucesso!');
}

main();