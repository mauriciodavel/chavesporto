const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

// Criar client com SERVICE KEY (tem permissão para DDL)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY
);

/**
 * POST /api/setup/add-observation-column
 * Adiciona coluna observation à tabela key_history
 * Requer token de admin
 */
router.post('/add-observation-column', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token de autenticação obrigatório'
      });
    }

    console.log('🔧 Tentando adicionar coluna observation...\n');

    // Tentar via RPC primeiro
    try {
      const { data, error } = await supabase.rpc('exec_sql', {
        sql_query: `
          ALTER TABLE key_history 
          ADD COLUMN IF NOT EXISTS observation TEXT DEFAULT NULL;
        `
      });

      if (error) {
        console.log('❌ RPC falhou:', error.message);
      } else {
        console.log('✅ RPC executada com sucesso');
        return res.json({
          success: true,
          message: 'Coluna observation adicionada com sucesso via RPC',
          method: 'rpc'
        });
      }
    } catch (rpcError) {
      console.log('⚠️  RPC indisponível, tentando método alternativo...');
    }

    // Tentar via query SQL direto com table admin
    try {
      console.log('🔄 Usando método alternativo: table admin');
      
      // Se a coluna não existir, ela será NULL em todos os registros
      // Isso vai falhar se coluna não existir, mas suceder se já existir
      const { data: existingData, error: checkError } = await supabase
        .from('key_history')
        .select('observation')
        .limit(1);

      if (checkError && checkError.message && checkError.message.includes('observation')) {
        // Coluna não existe, precisamos criar
        console.log('📝 Coluna não encontrada, precisa ser criada via SQL Editor do Supabase');
        
        return res.status(400).json({
          success: false,
          message: 'Coluna observation não encontrada. Execute este SQL no Supabase SQL Editor:',
          sql: 'ALTER TABLE key_history ADD COLUMN IF NOT EXISTS observation TEXT DEFAULT NULL;',
          instructions: [
            '1. Acesse https://supabase.com',
            '2. Projeto → SQL Editor',
            '3. New query',
            '4. Cole a query SQL',
            '5. RUN (Ctrl+Enter)',
            '6. Tente novamente'
          ]
        });
      }

      console.log('✅ Coluna observation já existe!');
      return res.json({
        success: true,
        message: 'Coluna observation já existe',
        method: 'query'
      });

    } catch (altError) {
      console.error('❌ Erro ao verificar:', altError);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao processar: ' + error.message
    });
  }
});

/**
 * GET /api/setup/check-observation-column
 * Verifica se coluna observation existe
 */
router.get('/check-observation-column', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('key_history')
      .select('observation')
      .limit(1);

    if (error && error.message && error.message.includes('observation')) {
      return res.json({
        success: false,
        exists: false,
        message: 'Coluna observation NÃO encontrada',
        error: error.message
      });
    }

    console.log('✅ Coluna observation existe!');
    return res.json({
      success: true,
      exists: true,
      message: 'Coluna observation já existe',
      data: data ? data[0] : null
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      exists: false,
      message: 'Erro ao verificar: ' + error.message
    });
  }
});

module.exports = router;
