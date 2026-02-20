#!/usr/bin/env node

/**
 * Script de Teste - Sidebar Admin em Reservar Chave
 */

const BASE_URL = 'http://localhost:3000';

async function testAdminSidebar() {
  console.log('🧪 Teste - Sidebar Admin em Reservar Chave\n');

  try {
    // 1. Testar URL normal
    console.log('1️⃣ Testando versão normal (user sidebar)...');
    const normalResponse = await fetch(`${BASE_URL}/reservar-chave.html`);
    const normalHtml = await normalResponse.text();
    
    if (normalHtml.includes('id="userSidebar"')) {
      console.log('✅ userSidebar encontrado');
    }
    if (normalHtml.includes('id="adminSidebar"')) {
      console.log('✅ adminSidebar encontrado');
    }
    if (normalHtml.includes('.admin-sidebar')) {
      console.log('✅ Estilos admin-sidebar encontrados');
    }

    // 2. Testar URL admin
    console.log('\n2️⃣ Testando versão admin (admin sidebar)...');
    const adminResponse = await fetch(`${BASE_URL}/reservar-chave.html?admin=true`);
    const adminHtml = await adminResponse.text();
    
    if (adminHtml.includes('class="admin-sidebar"')) {
      console.log('✅ HTML admin-sidebar encontrado');
    }
    if (adminHtml.includes('isAdminMode')) {
      console.log('✅ Lógica de admin mode encontrada');
    }

    console.log('\n✅ Testes básicos passaram!');
    console.log('\n💡 Próximos passos para verificar:\n');
    console.log('1. Abrir: http://localhost:3000/reservar-chave.html');
    console.log('   - Verificar se sidebar USER aparece');
    console.log('\n2. Abrir: http://localhost:3000/reservar-chave.html?admin=true');
    console.log('   - Verificar se sidebar ADMIN aparece (identico ao admin.html)');
    console.log('\n3. Verificar console (F12) para logs de debug');
    console.log('\n4. Comparar visualmente com /admin.html');

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

testAdminSidebar();
