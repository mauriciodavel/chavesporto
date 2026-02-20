// ============================================
// RESERVATION ROUTES
// Rotas para Sistema de Reservas de Chaves
// ============================================

const express = require('express');
const router = express.Router();
const { verifyToken, verifyAdmin } = require('../middleware/auth');
const controller = require('../controllers/reservationController');

// ============================================
// ROTAS PROTEGIDAS (requer autenticação)
// ============================================

// 1. POST /api/reservations - Criar reserva
router.post('/', verifyToken, (req, res) => controller.createReservation(req, res));

// 2. GET /api/reservations - Listar reservas
router.get('/', verifyToken, (req, res) => controller.listReservations(req, res));

// 6. GET /api/reservations/keys/availability/:key_id - Verificar disponibilidade
router.get('/keys/availability/:key_id', verifyToken, (req, res) => controller.checkAvailability(req, res));

// 7. POST /api/reservations/permissions - Criar permissão (ADMIN)
router.post('/permissions', verifyToken, verifyAdmin, (req, res) => controller.createPermission(req, res));

// 8. POST /api/reservations/maintenance - Criar manutenção (ADMIN)
router.post('/maintenance', verifyToken, verifyAdmin, (req, res) => controller.createMaintenance(req, res));

// 11. POST /api/reservations/blockout - Criar bloqueio de ambiente (ADMIN)
router.post('/blockout', verifyToken, verifyAdmin, (req, res) => controller.createEnvironmentBlockout(req, res));

// ROTAS COM SUFIXOS ESPECÍFICOS (ANTES DAS ROTAS COM :id)
// 4. PATCH /api/reservations/:id/approve - Aprovar (ADMIN)
router.patch('/:id/approve', verifyToken, verifyAdmin, (req, res) => controller.approveReservation(req, res));

// 5. PATCH /api/reservations/:id/reject - Rejeitar (ADMIN)
router.patch('/:id/reject', verifyToken, verifyAdmin, (req, res) => controller.rejectReservation(req, res));

// 5b. DELETE /api/reservations/:id/cancel - Cancelar por usuário (owner)
router.delete('/:id/cancel', verifyToken, (req, res) => controller.cancelReservation(req, res));

// 9. PATCH /api/reservations/:id - Atualizar (ADMIN)
router.patch('/:id', verifyToken, verifyAdmin, (req, res) => controller.updateReservation(req, res));

// 10. DELETE /api/reservations/:id - Deletar (ADMIN)
router.delete('/:id', verifyToken, verifyAdmin, (req, res) => controller.deleteReservation(req, res));

// 3. GET /api/reservations/:id - Obter detalhe (POR ÚLTIMO)
router.get('/:id', verifyToken, (req, res) => controller.getReservation(req, res));

module.exports = router;
