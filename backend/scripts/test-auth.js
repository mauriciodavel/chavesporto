// Script para testar a autenticação
require('dotenv').config();
const supabase = require('../config/supabase');
const bcrypt = require('bcrypt');

async function testAuth() {
  try {
    console.log('\n📋 TESTE DE AUTENTICAÇÃO\n');
    
    // Teste 1: Verificar conexão com Supabase
    console.log('1️⃣  Testando conexão com Supabase...');
    const { data: users, error: connError } = await supabase
      .from('instructors')
      .select('count')
      .limit(1);
    
    if (connError) {
      console.log('❌ ERRO na conexão:', connError.message);
      return;
    }
    console.log('✅ Conexão com Supabase OK\n');

    // Teste 2: Buscar admin
    console.log('2️⃣  Buscando usuário admin (matrícula: 0000)...');
    const { data: instructor, error: searchError } = await supabase
      .from('instructors')
      .select('id, matricula, name, email, password, role')
      .eq('matricula', '0000')
      .single();
    
    if (searchError) {
      console.log('❌ ERRO ao buscar admin:', searchError.message);
      console.log('\n💡 Dica: Execute o SQL no Supabase Dashboard para criar o admin');
      return;
    }
    
    if (!instructor) {
      console.log('❌ Admin não encontrado no banco');
      return;
    }
    
    console.log('✅ Admin encontrado:');
    console.log('   Matrícula:', instructor.matricula);
    console.log('   Nome:', instructor.name);
    console.log('   Email:', instructor.email);
    console.log('   Role:', instructor.role);
    console.log('   Hash (primeiros 20 chars):', instructor.password.substring(0, 20) + '...\n');

    // Teste 3: Verificar hash da senha
    console.log('3️⃣  Testando comparação de senha...');
    const testPassword = 'admin123';
    const passwordMatch = await bcrypt.compare(testPassword, instructor.password);
    
    if (passwordMatch) {
      console.log('✅ Senha "admin123" está CORRETA!\n');
    } else {
      console.log('❌ Senha "admin123" está INCORRETA!\n');
      console.log('💡 Hash no banco:', instructor.password);
      return;
    }

    // Teste 4: Simular login
    console.log('4️⃣  Simulando login via API...');
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        matricula: '0000',
        password: 'admin123'
      })
    });

    const result = await response.json();
    
    if (response.ok && result.success) {
      console.log('✅ LOGIN SUCESSO!');
      console.log('   Token:', result.token.substring(0, 50) + '...');
      console.log('   Usuário:', result.user.name);
      console.log('   Role:', result.user.role);
    } else {
      console.log('❌ ERRO no login:', result.message);
    }

    console.log('\n' + '='.repeat(50));
    console.log('🎉 TESTE COMPLETO\n');

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }

  process.exit(0);
}

testAuth();
