const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/login', authController.loginInstructor);
router.post('/admin-login', authController.loginAdmin);
router.post('/logout', authController.logout);

module.exports = router;
