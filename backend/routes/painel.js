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

module.exports = router;
