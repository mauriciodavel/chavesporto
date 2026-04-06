// ============================================
// ROTAS - PAINEL DE AMBIENTES
// ============================================

const express = require('express');
const router = express.Router();
const multer = require('multer');
const { verifyToken, verifyAdmin } = require('../middleware/auth');
const painelController = require('../controllers/painelController');

// Configurar multer para upload de mídia
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB máximo
  }
});

// ============================================
// ROTAS PÚBLICAS
// ============================================

// GET /api/painel - Obter ambientes com reservas ativas
router.get('/', painelController.getAmbientesComReservas);

// GET /api/painel/media - Listar mídias disponíveis
router.get('/media', painelController.getMediaList);

// ============================================
// ROTAS PROTEGIDAS (ADMIN)
// ============================================

// POST /api/painel/media/upload - Upload de mídia
router.post('/media/upload', verifyToken, verifyAdmin, upload.single('file'), painelController.uploadMedia);

// Error handler para multer
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.error('❌ Multer Error:', err.message);
    return res.status(400).json({
      success: false,
      message: `Erro de upload: ${err.message}`
    });
  } else if (err) {
    console.error('❌ Upload Error:', err.message);
    return res.status(400).json({
      success: false,
      message: `Erro: ${err.message}`
    });
  }
  next();
});

// DELETE /api/painel/media/:type - Deletar mídia
router.delete('/media/:type', verifyToken, verifyAdmin, painelController.deleteMedia);

// ============================================
// DEBUG ENDPOINT
// ============================================

// GET /api/painel/debug - Status das variáveis de ambiente (sem autenticação)
router.get('/debug', painelController.debugStatus);

// GET /api/painel/debug/upload-test - Teste de upload (GET - apenas mostra status e instruções)
router.get('/debug/upload-test', async (req, res) => {
  try {
    console.log('🧪 [DEBUG] GET upload-test - Mostrando instruções');
    
    res.status(200).json({
      success: true,
      message: 'Use POST para testar upload',
      usage: 'POST /api/painel/debug/upload-test',
      details: {
        method: 'POST',
        body: 'Nenhum body necessário (vazio ou {})' ,
        response: 'Retorna arquivo PNG de teste enviado para Supabase'
      },
      curl_example: 'curl -X POST https://chavesporto.vercel.app/api/painel/debug/upload-test'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro',
      error: error.message
    });
  }
});

// POST /api/painel/debug/upload-test - Teste de upload com arquivo de teste
router.post('/debug/upload-test', async (req, res) => {
  try {
    console.log('🧪 [DEBUG] Teste de upload iniciado');
    console.log(`   Modo: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   Bucket: ${process.env.SUPABASE_BUCKET || 'painel-media'}`);

    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_KEY
    );

    // Criar arquivo PNG de teste bem pequeno (1x1)
    const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const testContent = Buffer.from(pngBase64, 'base64');
    
    const filename = `debug_test_${Date.now()}.png`;
    console.log(`   Arquivo: ${filename}`);
    console.log(`   Tamanho: ${testContent.length} bytes`);
    console.log(`   MIME: image/png`);

    const { data, error } = await supabase.storage
      .from(process.env.SUPABASE_BUCKET || 'painel-media')
      .upload(`painel/${filename}`, testContent, {
        contentType: 'image/png',
        upsert: false
      });

    if (error) {
      console.error('❌ Erro no teste:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao fazer upload de teste',
        error: {
          message: error.message,
          code: error.code,
          status: error.status,
          namespace: error.namespace
        },
        debug_info: {
          bucket: process.env.SUPABASE_BUCKET,
          url: process.env.SUPABASE_URL,
          has_key: !!process.env.SUPABASE_KEY,
          has_service_role: !!process.env.SUPABASE_SERVICE_ROLE,
          allowed_types: ['image/jpeg', 'image/jpg', 'image/png', 'video/mp4']
        }
      });
    }

    // Tentar obter URL pública
    const { data: urlData } = supabase.storage
      .from(process.env.SUPABASE_BUCKET || 'painel-media')
      .getPublicUrl(`painel/${filename}`);

    console.log('✅ Upload de teste bem-sucedido!');
    console.log(`   URL: ${urlData.publicUrl}`);

    res.status(200).json({
      success: true,
      message: 'Upload de teste bem-sucedido',
      filename,
      url: urlData.publicUrl,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erro no endpoint de teste:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao executar teste',
      error: error.message,
      stack: error.stack
    });
  }
});

module.exports = router;
