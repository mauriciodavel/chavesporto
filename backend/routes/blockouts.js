// routes/blockouts.js
const express = require('express');
const router = express.Router();
const blockoutController = require('../controllers/blockoutController');
const auth = require('../middleware/auth');

/**
 * @route GET /api/blockouts
 * @desc Listar todos os bloqueios
 * @access Public
 */
router.get('/', blockoutController.getAllBlockouts);

/**
 * @route GET /api/blockouts/color-map
 * @desc Obter mapa de cores padrão
 * @access Public
 */
router.get('/color-map', blockoutController.getColorMap);

/**
 * @route GET /api/blockouts/date/:date
 * @desc Verificar bloqueios para uma data específica
 * @access Public
 * @query shift - (opcional) turno específico
 */
router.get('/date/:date', blockoutController.getBlockoutsForDate);

/**
 * @route GET /api/blockouts/date-range
 * @desc Obter bloqueios para um período
 * @access Public
 * @query start - Data inicial (YYYY-MM-DD)
 * @query end - Data final (YYYY-MM-DD)
 */
router.get('/date-range', blockoutController.getBlockoutsForDateRange);

/**
 * @route POST /api/blockouts
 * @desc Criar novo bloqueio
 * @access Admin only
 * @body {
 *   blockout_date ou blockout_start_date + blockout_end_date,
 *   shift (opcional),
 *   blockout_type (required),
 *   observation (required),
 *   color (opcional)
 * }
 */
router.post('/', auth.verifyToken, auth.verifyAdmin, blockoutController.createBlockout);

/**
 * @route PUT /api/blockouts/:id
 * @desc Atualizar bloqueio
 * @access Admin only
 */
router.put('/:id', auth.verifyToken, auth.verifyAdmin, blockoutController.updateBlockout);

/**
 * @route DELETE /api/blockouts/:id
 * @desc Deletar bloqueio
 * @access Admin only
 */
router.delete('/:id', auth.verifyToken, auth.verifyAdmin, blockoutController.deleteBlockout);

module.exports = router;
