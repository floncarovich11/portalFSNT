const express = require('express');
const router = express.Router();
const {
    createTicket,
    getAllTickets,
    getTicketById,
    getTicketsByUser,
    updateTicketStatus,
    assignTechnician,
    addComment,
    getTicketHistory,
    deleteTicket
} = require('../controllers/ticketsController');

// Criar novo chamado
router.post('/', createTicket);

// Listar todos os chamados
router.get('/', getAllTickets);

// Buscar chamado por ID
router.get('/:id', getTicketById);

// Buscar chamados por usuário
router.get('/user/:id_usuario', getTicketsByUser);

// Atualizar status do chamado
router.put('/:id/status', updateTicketStatus);

// Atribuir técnico ao chamado
router.put('/:id/atribuir', assignTechnician);

// Adicionar comentário ao chamado
router.post('/:id/comment', addComment);

// Buscar histórico do chamado
router.get('/:id/history', getTicketHistory);

// Deletar chamado (apenas admin)
router.delete('/:id', deleteTicket);

module.exports = router;