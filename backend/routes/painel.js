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

    // Criar arquivo PDF de teste bem pequeno
    const testContent = Buffer.from('%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]>>endobj xref 0 4 0000000000 65535 f 0000000009 00000 n 0000000058 00000 n 0000000115 00000 n trailer<</Size 4/Root 1 0 R>>startxref 190 %%EOF');
    
    const filename = `debug_test_${Date.now()}.pdf`;
    console.log(`   Arquivo: ${filename}`);
    console.log(`   Tamanho: ${testContent.length} bytes`);

    const { data, error } = await supabase.storage
      .from(process.env.SUPABASE_BUCKET || 'painel-media')
      .upload(`painel/${filename}`, testContent, {
        contentType: 'application/pdf',
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
          fullError: JSON.stringify(error)
        },
        debug_info: {
          bucket: process.env.SUPABASE_BUCKET,
          url: process.env.SUPABASE_URL,
          has_key: !!process.env.SUPABASE_KEY,
          has_service_role: !!process.env.SUPABASE_SERVICE_ROLE
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
      error: error.message
    });
  }
});

module.exports = router;
