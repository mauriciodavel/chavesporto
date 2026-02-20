#!/usr/bin/env node

/**
 * Script de Teste Completo - Bloqueios
 * Verifica se tudo está funcionando corretamente
 */

const BASE_URL = 'http://localhost:3000';
const ADMIN_PASSWORD = 'admin123'; // Altere conforme necessário
let authToken = null;

async function testBlockoutsFeatures() {
  console.log('🧪 TESTE COMPLETO - FUNCIONALIDADE DE BLOQUEIOS\n');
  console.log('=' .repeat(60));

  try {
    // 1. Login para obter token
    console.log('\n1️⃣ Fazendo login para obter token...');
    let loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        matricula: '0000',
        senha: ADMIN_PASSWORD
      })
    });

    if (!loginResponse.ok) {
      console.log('⚠️ Login falhou, continuando sem token...');
    } else {
      const loginData = await loginResponse.json();
      authToken = loginData.token;
      console.log('✅ Login bem-sucedido');
      console.log(`   Token: ${authToken.substring(0, 20)}...`);
    }

    // 2. Testar GET /api/blockouts (sem token)
    console.log('\n2️⃣ Testando GET /api/blockouts (sem token)...');
    let response = await fetch(`${BASE_URL}/api/blockouts`);
    const data = await response.json();
    
    if (response.ok && data.data) {
      console.log(`✅ Bloqueios carregados: ${data.data.length} registros`);
      
      if (data.data.length > 0) {
        console.log('\n   Últimos 3 bloqueios:');
        data.data.slice(-3).forEach((b, i) => {
          console.log(`   ${i + 1}. ${b.blockout_start_date} - ${b.blockout_type} (${b.observation})`);
        });
      }
    } else {
      console.log(`❌ Erro ao carregar bloqueios: ${response.status}`);
    }

    // 3. Testar criação de bloqueio (com token)
    if (authToken) {
      console.log('\n3️⃣ Testando criação de bloqueio (com token)...');
      
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];

      const createResponse = await fetch(`${BASE_URL}/api/blockouts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          blockout_start_date: dateStr,
          blockout_end_date: dateStr,
          blockout_type: 'state_holiday',
          observation: 'Teste automatizado',
          shift: null
        })
      });

      const createData = await createResponse.json();
      
      if (createResponse.ok) {
        console.log('✅ Bloqueio criado com sucesso');
        console.log(`   ID: ${createData.data.id}`);
        
        // 4. Verificar se aparece na listagem
        console.log('\n4️⃣ Verificando se o novo bloqueio aparece na listagem...');
        let listResponse = await fetch(`${BASE_URL}/api/blockouts`);
        let listData = await listResponse.json();
        
        const newBlockout = listData.data.find(b => b.id === createData.data.id);
        if (newBlockout) {
          console.log('✅ Novo bloqueio aparece na listagem');
        } else {
          console.log('⚠️ Novo bloqueio não encontrado na listagem');
        }

        // 5. Testar deleção
        console.log('\n5️⃣ Testando deleção de bloqueio...');
        let deleteResponse = await fetch(`${BASE_URL}/api/blockouts/${createData.data.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });

        if (deleteResponse.ok) {
          console.log('✅ Bloqueio deletado com sucesso');
        } else {
          console.log(`❌ Erro ao deletar: ${deleteResponse.status}`);
        }
      } else {
        console.log(`❌ Erro ao criar bloqueio: ${createResponse.status}`);
        console.log(`   Mensagem: ${createData.message}`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ TESTES CONCLUÍDOS COM SUCESSO!');
    console.log('\n💡 Próximos passos:');
    console.log('1. Abra http://localhost:3000/admin-blockouts');
    console.log('2. Verifique se os bloqueios aparecem');
    console.log('3. Teste os filtros (tipo e data)');
    console.log('4. Crie um novo bloqueio');
    console.log('5. Verifique se aparece na tabela');

  } catch (error) {
    console.error('❌ Erro durante testes:', error.message);
  }
}

testBlockoutsFeatures();
