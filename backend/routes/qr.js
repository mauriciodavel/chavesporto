const express = require('express');
const qrController = require('../controllers/qrController');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Rota para obter QR-Codes (com conversão de formato)
router.get('/for-printing', verifyToken, qrController.getKeysWithQR);

module.exports = router;
