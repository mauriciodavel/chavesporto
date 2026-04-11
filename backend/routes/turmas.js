const express = require('express');
const router = express.Router();
const turmasController = require('../controllers/turmasController');
const { verifyToken } = require('../middleware/auth');
const { verifyAdmin } = require('../middleware/auth');

// GET - Listar todas as turmas
router.get('/', verifyToken, turmasController.getAllTurmas);

// GET - Buscar turma por ID
router.get('/:id', verifyToken, turmasController.getTurmaById);

// POST - Criar turma (apenas admin)
router.post('/', verifyToken, verifyAdmin, turmasController.createTurma);

// PUT - Atualizar turma (apenas admin)
router.put('/:id', verifyToken, verifyAdmin, turmasController.updateTurma);

// DELETE - Deletar turma (apenas admin)
router.delete('/:id', verifyToken, verifyAdmin, turmasController.deleteTurma);

module.exports = router;
