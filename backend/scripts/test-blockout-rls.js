#!/usr/bin/env node

/**
 * Script de diagnóstico para testar criação de bloqueios com RLS
 * Verifica se SUPABASE_SERVICE_ROLE está configurado corretamente em produção
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE;

console.log('\n🔍 DIAGNÓSTICO DE RLS PARA BLOQUEIOS\n');
console.log('📋 Configuração Supabase:');
console.log('   SUPABASE_URL:', supabaseUrl ? '✅ Configurada' : '❌ NÃO configurada');
console.log('   SUPABASE_KEY:', supabaseKey ? '✅ Configurada' : '❌ NÃO configurada');
console.log('   SUPABASE_SERVICE_ROLE:', supabaseServiceRole ? '✅ Configurada' : '❌ NÃO configurada');

if (!supabaseUrl || !supabaseKey) {
  console.error('\n❌ Erro: SUPABASE_URL ou SUPABASE_KEY não configuradas!');
  process.exit(1);
}

if (!supabaseServiceRole) {
  console.error('\n❌ CRÍTICO: SUPABASE_SERVICE_ROLE não configurada!');
  console.error('   Isso causará erro "violates row-level security policy"');
  console.error('\n   SOLUÇÃO:');
  console.error('   1. Acesse https://app.supabase.com/project/_/settings/api');
  console.error('   2. Copie a SERVICE ROLE KEY');
  console.error('   3. Configure em produção:');
  console.error('      export SUPABASE_SERVICE_ROLE="seu_service_role_key"');
  process.exit(1);
}

// Testar conexão com service role
async function testServiceRoleConnection() {
  console.log('\n🔗 Testando conexão com SERVICE_ROLE...\n');

  try {
    const adminClient = createClient(supabaseUrl, supabaseServiceRole, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      }
    });

    // Tentar inserir um bloqueio de teste
    const testBlockout = {
      blockout_date: '2026-04-15',
      blockout_start_date: '2026-04-15',
      blockout_end_date: '2026-04-15',
      shift: 'matutino',
      blockout_type: 'maintenance',
      observation: 'Teste de RLS - pode deletar',
      color: '#FF0000',
      created_by: '00000000-0000-0000-0000-000000000000' // UUID dummy
    };

    console.log('📝 Tentando inserir bloqueio de teste:');
    console.log('   ', JSON.stringify(testBlockout, null, 2));

    const { data, error } = await adminClient
      .from('calendar_blockouts')
      .insert([testBlockout])
      .select();

    if (error) {
      console.error('\n❌ ERRO ao inserir com SERVICE_ROLE:');
      console.error('   Código:', error.code);
      console.error('   Mensagem:', error.message);
      console.error('   Details:', error.details);
      console.error('   Hint:', error.hint);
      
      if (error.message.includes('row-level security')) {
        console.error('\n🔴 Problema: Política RLS está bloqueando service_role!');
        console.error('   SOLUÇÃO em Supabase:');
        console.error('   1. Vá para tabela calendar_blockouts');
        console.error('   2. Edite as políticas RLS');
        console.error('   3. Remova a policy "Only admins can create blockouts"');
        console.error('   4. Service role sempre contorna RLS quando não há sessão de usuário');
      }
      
      process.exit(1);
    }

    console.log('\n✅ SUCESSO! Bloqueio inserido com SERVICE_ROLE:');
    console.log('   ID:', data[0].id);

    // Deletar o bloqueio de teste
    console.log('\n🗑️  Deletando bloqueio de teste...');
    const { error: deleteError } = await adminClient
      .from('calendar_blockouts')
      .delete()
      .eq('id', data[0].id);

    if (deleteError) {
      console.error('❌ Erro ao deletar:', deleteError.message);
      process.exit(1);
    }

    console.log('✅ Bloqueio deletado com sucesso');
    console.log('\n🟢 Tudo funcionando corretamente!\n');

  } catch (error) {
    console.error('\n❌ Erro durante teste:', error.message);
    console.error('   Stack:', error.stack);
    process.exit(1);
  }
}

testServiceRoleConnection();
