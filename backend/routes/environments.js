// ============================================
// ENVIRONMENT ROUTES
// ============================================

const express = require('express');
const router = express.Router();
const environmentController = require('../controllers/environmentController');

// Public endpoints - sem autenticação necessária
router.get('/', environmentController.getEnvironments);
router.get('/weekly-availability', environmentController.getWeeklyAvailability);

module.exports = router;
