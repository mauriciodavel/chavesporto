#!/usr/bin/env node
require('dotenv').config();
const supabase = require('./config/supabase');

async function main() {
  try {
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('key_history')
      .update({ email_first_alert_sent_at: now })
      .eq('status', 'active')
      .is('email_first_alert_sent_at', null);
    
    console.log('✅ Atualizado com sucesso');
  } catch (err) {
    console.error('❌', err.message);
  }
  process.exit(0);
}

main();
