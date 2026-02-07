require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Variáveis de ambiente Supabase não configuradas');
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
