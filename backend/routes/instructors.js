const express = require('express');
const router = express.Router();
const instructorController = require('../controllers/instructorController');
const { verifyToken, verifyAdmin } = require('../middleware/auth');

router.get('/', verifyToken, verifyAdmin, instructorController.getAllInstructors);
router.post('/', verifyToken, verifyAdmin, instructorController.createInstructor);
router.put('/:id', verifyToken, verifyAdmin, instructorController.updateInstructor);
router.put('/:id/toggle-status', verifyToken, verifyAdmin, instructorController.toggleInstructorStatus);
router.delete('/:id', verifyToken, verifyAdmin, instructorController.deleteInstructor);

module.exports = router;
