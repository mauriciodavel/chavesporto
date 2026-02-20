const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

router.post('/login', authController.loginInstructor);
router.post('/admin-login', authController.loginAdmin);
router.post('/logout', authController.logout);
router.post('/change-password', verifyToken, authController.changePassword);
router.post('/forgot-password/instructor', authController.forgotPasswordInstructor);
router.post('/forgot-password/admin', authController.forgotPasswordAdmin);
router.post('/verify-reset-token', authController.verifyResetToken);
router.post('/reset-password', authController.resetPassword);

module.exports = router;
