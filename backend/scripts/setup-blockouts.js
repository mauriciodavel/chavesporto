#!/usr/bin/env node

/**
 * Script de Setup do Sistema de Bloqueios de Calendário
 * Executa automaticamente a criação da tabela e população de domingos
 * 
 * Uso: node setup-blockouts.js
 */

require('dotenv').config();
const supabase = require('../config/supabase');
const fs = require('fs');
const path = require('path');

async function setupBlockouts() {
  try {
    console.log('🚀 Iniciando setup do sistema de bloqueios de calendário...\n');

    // Passo 1: Executar o SQL para criar a tabela
    console.log('📋 Passo 1: Criando tabela de bloqueios...');
    const sqlPath = path.join(__dirname, '../..', 'database', '003_create_calendar_blockouts.sql');
    
    if (!fs.existsSync(sqlPath)) {
      throw new Error(`Arquivo SQL não encontrado: ${sqlPath}`);
    }

    const sqlContent = fs.readFileSync(sqlPath, 'utf-8');
    
    // Dividir por comentários e statements
    const statements = sqlContent
      .split('--')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('=') && !s.startsWith('DROP') && !s.startsWith('DELETE'));

    console.log('   ⚠️  Aviso: Execute manualmente o SQL em Supabase console');
    console.log('   📍 Caminho: database/003_create_calendar_blockouts.sql');
    console.log('   ℹ️  Ou aguarde a próxima versão com suporte automático\n');

    // Passo 2: Verificar se a tabela existe
    console.log('📋 Passo 2: Verificando se a tabela existe...');
    
    try {
      const { data, error } = await supabase
        .from('calendar_blockouts')
        .select('id', { count: 'exact', head: true });

      if (error && error.code === 'PGRST116') {
        console.log('   ❌ Tabela não encontrada. Você precisa executar o SQL primeiro.\n');
        console.log('   📝 Para criar a tabela, execute manualmente:');
        console.log('      1. Abra Supabase Dashboard');
        console.log('      2. Vá para SQL Editor');
        console.log('      3. Copie o conteúdo de database/003_create_calendar_blockouts.sql');
        console.log('      4. Execute o SQL\n');
        return false;
      } else if (error) {
        throw error;
      }
      
      console.log('   ✅ Tabela calendar_blockouts encontrada\n');
    } catch (error) {
      console.error('   ❌ Erro ao verificar tabela:', error.message);
      return false;
    }

    // Passo 3: Popular domingos
    console.log('📋 Passo 3: Populando domingos...');
    
    const { populateSundays } = require('./populate-sundays');
    const result = await populateSundays();

    if (!result) {
      console.log('   ⚠️  Não foi possível popular domingos');
      return false;
    }

    console.log('   ✅ Domingos populados com sucesso\n');

    // Passo 4: Listar bloqueios criados
    console.log('📋 Passo 4: Verificando bloqueios criados...');
    
    try {
      const { data: blockouts, error, count } = await supabase
        .from('calendar_blockouts')
        .select('*', { count: 'exact' })
        .eq('blockout_type', 'national_holiday');

      if (error) throw error;

      console.log(`   ✅ Total de bloqueios: ${count || 0}`);
      console.log(`   ✅ Domingos bloqueados: ${blockouts?.length || 0}\n`);
    } catch (error) {
      console.error('   ❌ Erro ao consultar bloqueios:', error.message);
    }

    console.log('✨ Setup completo!\n');
    console.log('🎉 Próximos passos:');
    console.log('   1. Acesse http://localhost:3000/admin.html');
    console.log('   2. Clique em "🔒 Bloqueios" para gerenciar bloqueios');
    console.log('   3. Crie novos bloqueios conforme necessário\n');

    return true;

  } catch (error) {
    console.error('❌ Erro durante setup:', error.message);
    console.error('\nPara resolver:');
    console.error('  1. Verifique se .env está configurado corretamente');
    console.error('  2. Verify credentials do Supabase');
    console.error('  3. Certifique-se que a tabela foi criada manualmente se necessário');
    return false;
  }
}

// Executar setup
if (require.main === module) {
  setupBlockouts().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { setupBlockouts };
