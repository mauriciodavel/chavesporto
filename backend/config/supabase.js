require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Variáveis de ambiente Supabase não configuradas');
}

// Cliente com anon key para operações de usuário final
const supabase = createClient(supabaseUrl, supabaseKey);

// Cliente com service_role key para bypass de RLS (operações administrativas backend)
const supabaseAdmin = supabaseServiceRole
  ? createClient(supabaseUrl, supabaseServiceRole)
  : supabase; // Fallback se service_role não estiver configurada

module.exports = supabase;
module.exports.admin = supabaseAdmin;
