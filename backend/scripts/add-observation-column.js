#!/usr/bin/env node
/**
 * Script para adicionar coluna observation na tabela key_history
 * Supabase não suporta DDL direto, então precisa usar RPC ou SQL
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function addObservationColumn() {
  console.log('🔧 Adicionando coluna observation à tabela key_history...\n');

  try {
    // Usar RPC para executar SQL
    const { data, error } = await supabase.rpc('add_observation_column');

    if (error) {
      console.log('❌ Erro ao executar RPC:', error.message);
      console.log('\n📝 Tentando adição manual via SQL...\n');
      
      // Se RPC falhar, tentar direto com SQL
      const { data: sqlData, error: sqlError } = await supabase.rpc(
        'exec_sql',
        {
          sql_query: `
            ALTER TABLE key_history 
            ADD COLUMN IF NOT EXISTS observation TEXT DEFAULT NULL;
          `
        }
      );

      if (sqlError) {
        console.log('⚠️  RPC exec_sql não disponível');
        console.log('\n📋 Para adicionar a coluna manualmente:');
        console.log('1. Acesse Supabase: https://supabase.com');
        console.log('2. SQL Editor → Nova query');
        console.log('3. Cole o seguinte SQL:');
        console.log(`
ALTER TABLE key_history 
ADD COLUMN IF NOT EXISTS observation TEXT DEFAULT NULL;
        `);
        console.log('4. Execute (Ctrl+Enter)');
        console.log('\n✅ Após adicionar, rode este script novamente para validar');
        return;
      }
    }

    console.log('✅ Coluna observation adicionada com sucesso!\n');

    // Validate if column exists
    console.log('🔍 Validando coluna...\n');
    const { data: columns, error: validateError } = await supabase
      .from('key_history')
      .select()
      .limit(1)
      .then(result => ({
        data: result.data ? Object.keys(result.data[0] || {}) : [],
        error: result.error
      }));

    if (validateError) {
      console.log('Validação realizada via teste de escrita...');
    }

    // Test insert with observation
    console.log('✍️  Testando inserção com observation...\n');
    
    const testObservation = `Teste de coluna observation - ${new Date().toISOString()}`;
    
    const { data: insertData, error: insertError } = await supabase
      .from('key_history')
      .insert([{
        key_id: 'test-key-123',
        instructor_id: 'test-instructor',
        withdrawn_at: new Date().toISOString(),
        status: 'active',
        observation: testObservation
      }]);

    if (insertError) {
      if (insertError.message?.includes('duplicate key')) {
        console.log('⚠️  Chave de teste já existe, testando atualização...');
        
        // Try update instead
        const { error: updateError } = await supabase
          .from('key_history')
          .update({ observation: testObservation })
          .eq('key_id', 'test-key-123')
          .eq('instructor_id', 'test-instructor');

        if (updateError) {
          console.log('❌ Erro ao atualizar:', updateError.message);
          return;
        }
        console.log('✅ Observação atualizada com sucesso!');
      } else {
        console.log('❌ Erro ao inserir:', insertError.message);
        return;
      }
    } else {
      console.log('✅ Observação inserida com sucesso!');
      
      // Delete test record
      await supabase
        .from('key_history')
        .delete()
        .eq('key_id', 'test-key-123');
    }

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║     ✅ COLUNA OBSERVATION ADICIONADA E VALIDADA!          ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log('👉 Próximas etapas:');
    console.log('1. Reiniciar backend: npm run dev');
    console.log('2. Testar devolução de chave');
    console.log('3. Verificar que observation está sendo salva');

  } catch (error) {
    console.error('❌ Erro inesperado:', error.message);
    console.log('\n💡 Dica: Se o Supabase não tiver RPC configurado, adicione manualmente via SQL Editor');
  }
}

addObservationColumn();
