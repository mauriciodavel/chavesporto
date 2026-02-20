#!/usr/bin/env node

/**
 * Script para deletar bloqueios errados de segunda-feira
 * Mantém apenas os domingos
 */

require('dotenv').config();
const supabase = require('../config/supabase');

async function cleanupWrongBlockouts() {
  try {
    console.log('🗑️  Iniciando limpeza de bloqueios incorretos...\n');

    // Buscar todos os bloqueios automatizados de domingos
    const { data: blockouts, error: fetchError } = await supabase.admin
      .from('calendar_blockouts')
      .select('*')
      .eq('blockout_type', 'national_holiday')
      .eq('observation', 'Domingo - Estabelecimento fechado')
      .order('blockout_date', { ascending: true });

    if (fetchError) throw fetchError;

    if (!blockouts || blockouts.length === 0) {
      console.log('✅ Nenhum bloqueio encontrado');
      return;
    }

    console.log(`📊 Total de bloqueios encontrados: ${blockouts.length}\n`);

    // Verificar quais são realmente domingos e quais não são
    let correctDomingos = [];
    let wrongDates = [];
    const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

    blockouts.forEach(blockout => {
      const date = new Date(blockout.blockout_date + 'T00:00:00Z');
      const dayNum = date.getUTCDay();
      const dayName = dayNames[dayNum];

      if (dayNum === 0) {
        correctDomingos.push(blockout);
        console.log(`✅ ${blockout.blockout_date} (${dayName}) - CORRETO`);
      } else {
        wrongDates.push(blockout.id);
        console.log(`❌ ${blockout.blockout_date} (${dayName}) - ERRADO`);
      }
    });

    console.log(`\n📈 Resumo:`);
    console.log(`   Domingos corretos: ${correctDomingos.length}`);
    console.log(`   Datas erradas: ${wrongDates.length}\n`);

    if (wrongDates.length > 0) {
      console.log(`🗑️  Deletando ${wrongDates.length} bloqueios errados...\n`);

      // Deletar em lotes
      const batchSize = 10;
      let deleted = 0;

      for (let i = 0; i < wrongDates.length; i += batchSize) {
        const batch = wrongDates.slice(i, i + batchSize);
        
        const { error: deleteError } = await supabase.admin
          .from('calendar_blockouts')
          .delete()
          .in('id', batch);

        if (deleteError) throw deleteError;

        deleted += batch.length;
        console.log(`   ✅ ${deleted}/${wrongDates.length} deletados`);
      }

      console.log(`\n✅ Limpeza concluída!`);
    } else {
      console.log(`✅ Todos os bloqueios estão corretos!`);
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

cleanupWrongBlockouts();
