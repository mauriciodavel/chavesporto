#!/usr/bin/env node

/**
 * Script para verificar quais domingos foram bloqueados
 */

require('dotenv').config();
const supabase = require('../config/supabase');

async function checkBlockouts() {
  try {
    console.log('🔍 Verificando bloqueios inseridos...\n');

    const { data: blockouts, error } = await supabase
      .from('calendar_blockouts')
      .select('blockout_date')
      .eq('blockout_type', 'national_holiday')
      .eq('observation', 'Domingo - Estabelecimento fechado')
      .order('blockout_date', { ascending: true })
      .limit(20);

    if (error) throw error;

    console.log(`📊 Primeiros 20 bloqueios:\n`);

    const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

    blockouts.forEach(blockout => {
      const date = new Date(blockout.blockout_date + 'T00:00:00Z');
      const dayNum = date.getUTCDay();
      const dayName = dayNames[dayNum];
      const status = dayNum === 0 ? '✅' : '❌';

      console.log(`${status} ${blockout.blockout_date} (${dayName})`);
    });

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

checkBlockouts();
