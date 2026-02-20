#!/usr/bin/env node

/**
 * Script para popular todos os domingos de 2026 como bloqueios automáticos
 * Uso: node populate-sundays.js
 */

require('dotenv').config();
const supabase = require('../config/supabase');

const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

async function populateSundays() {
  try {
    console.log('📅 Iniciando processo de bloqueio de domingos...\n');

    // Gerar todas as datas de domingo de 2026
    const sundays = [];
    
    // Usar UTC para evitar problemas de timezone
    let currentDate = new Date('2026-01-01T00:00:00Z');
    const endDate = new Date('2026-12-31T23:59:59Z');

    // Iterar por todas as datas do ano
    while (currentDate <= endDate) {
      // Verificar se é domingo (getUTCDay() === 0)
      if (currentDate.getUTCDay() === 0) {
        const dateString = currentDate.toISOString().split('T')[0];
        sundays.push(dateString);
        console.log(`   ✅ Encontrado: ${dateString} (${dayNames[currentDate.getUTCDay()]})`);
      }
      currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }

    console.log(`\n✅ Total: ${sundays.length} domingos encontrados em 2026`);
    console.log(`   Primeiro: ${sundays[0]}`);
    console.log(`   Último: ${sundays[sundays.length - 1]}\n`);

    // Obter um admin para criar os bloqueios
    const { data: admins, error: adminError } = await supabase
      .from('instructors')
      .select('id')
      .eq('role', 'admin')
      .limit(1);

    if (adminError || !admins || admins.length === 0) {
      throw new Error('Nenhum admin encontrado no banco de dados');
    }

    const adminId = admins[0].id;
    console.log(`👤 Usando admin: ${adminId}\n`);

    // Preparar dados para inserção
    const blockoutData = sundays.map(sunday => ({
      blockout_date: sunday,
      blockout_start_date: sunday,
      blockout_end_date: sunday,
      shift: null,
      blockout_type: 'national_holiday',
      observation: 'Domingo - Estabelecimento fechado',
      color: null,
      created_by: adminId
    }));

    // Inserir em lotes de 10 para evitar timeout
    const batchSize = 10;
    let inserted = 0;
    let skipped = 0;

    for (let i = 0; i < blockoutData.length; i += batchSize) {
      const batch = blockoutData.slice(i, i + batchSize);
      
      console.log(`📝 Inserindo lote ${Math.floor(i / batchSize) + 1}/${Math.ceil(blockoutData.length / batchSize)}...`);

      try {
        const { data, error } = await supabase.admin
          .from('calendar_blockouts')
          .insert(batch)
          .select();

        if (error) {
          if (error.message.includes('duplicate')) {
            console.log(`   ⚠️  Alguns domingos já existem, pulando...`);
            skipped += batch.length;
          } else {
            throw error;
          }
        } else {
          inserted += data?.length || 0;
          console.log(`   ✅ ${data?.length || 0} registros inseridos`);
        }
      } catch (batchError) {
        console.error(`   ❌ Erro no lote:`, batchError.message);
      }

      // Pequeno delay entre lotes
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`\n✅ Processo concluído!`);
    console.log(`   Total inseridos: ${inserted}`);
    console.log(`   Total pulados: ${skipped}`);
    console.log(`   Total domingos: ${sundays.length}`);

  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  populateSundays().then(() => {
    console.log('\n✨ Domingos bloqueados com sucesso!');
    process.exit(0);
  });
}

module.exports = { populateSundays };
