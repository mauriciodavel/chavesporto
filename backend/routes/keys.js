const express = require('express');
const router = express.Router();
const keyController = require('../controllers/keyController');
const { verifyToken, verifyAdmin } = require('../middleware/auth');

router.get('/all', verifyToken, keyController.getAllKeysUnfiltered);
router.get('/', verifyToken, keyController.getAllKeys);
router.get('/:id', verifyToken, keyController.getKeyById);
router.post('/by-qr', verifyToken, keyController.getKeyByQRCode);

router.post('/', verifyToken, verifyAdmin, keyController.createKey);
router.put('/:id', verifyToken, verifyAdmin, keyController.updateKey);
router.delete('/:id', verifyToken, verifyAdmin, keyController.deleteKey);

router.post('/:id/withdraw', verifyToken, keyController.withdrawKey);
router.post('/:id/return', verifyToken, keyController.returnKey);

module.exports = router;
