#!/usr/bin/env node
// Adicionar coluna 'observation' à tabela key_history

require('dotenv').config({path: './backend/.env'});
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function addObservationColumn() {
  try {
    console.log('🔄 Verificando coluna observation...\n');

    // Tentar inserir um registro COM observation para forçar a criação
    const testId = require('uuid').v4();
    const { data, error } = await supabase
      .from('key_history')
      .insert({
        id: testId,
        key_id: '00000000-0000-0000-0000-000000000001',
        instructor_id: '00000000-0000-0000-0000-000000000001',
        withdrawn_at: new Date().toISOString(),
        status: 'active',
        observation: 'Teste de coluna'
      })
      .select();

    if (error) {
      if (error.message.includes('observation')) {
        console.log('❌ Erro: Coluna observation não existe');
        console.log('Você precisa executar SQL manualmente no Supabase:\n');
        console.log(`
ALTER TABLE key_history ADD COLUMN IF NOT EXISTS observation TEXT;
        `);
      } else {
        console.log('Erro ao insert:', error);
      }
    } else {
      console.log('✅ Coluna observation existe!');
      console.log('Dados:', data);
      
      // Deletar registro de teste
      await supabase
        .from('key_history')
        .delete()
        .eq('id', testId);
    }
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

addObservationColumn();
