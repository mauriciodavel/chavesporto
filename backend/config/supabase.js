require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Variáveis de ambiente Supabase não configuradas');
}

// Verificar se service_role está configurada (crítico para operações admin com RLS)
if (!supabaseServiceRole) {
  console.warn('\n⚠️  AVISO: SUPABASE_SERVICE_ROLE não está configurada!');
  console.warn('   - Operações admin que dependem de bypass RLS podem falhar');
  console.warn('   - Configure SUPABASE_SERVICE_ROLE no .env para produção');
  console.warn('   - Instruções: https://app.supabase.com/project/_/settings/api\n');
}

// Cliente com anon key para operações de usuário final
const supabase = createClient(supabaseUrl, supabaseKey);

// Cliente com service_role key para bypass de RLS (operações administrativas backend)
// Usa service_role quando disponível, fallback para supabase regular caso contrário
const supabaseAdmin = supabaseServiceRole
  ? createClient(supabaseUrl, supabaseServiceRole, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      }
    })
  : supabase; // Fallback se service_role não estiver configurada

module.exports = supabase;
module.exports.admin = supabaseAdmin;
