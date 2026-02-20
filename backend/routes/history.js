const express = require('express');
const router = express.Router();
const historyController = require('../controllers/historyController');
const { verifyToken, verifyAdmin } = require('../middleware/auth');

router.get('/', verifyToken, historyController.getHistory);
router.get('/keys/:keyId', verifyToken, historyController.getHistoryByKey);
router.get('/instructors/:instructorId', verifyToken, historyController.getHistoryByInstructor);
router.get('/my-late-returns', verifyToken, historyController.getMyLateReturns);
router.get('/late-returns', verifyToken, verifyAdmin, historyController.getLateReturns);

module.exports = router;
