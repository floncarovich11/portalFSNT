const express = require('express');
const router = express.Router();
const db = require('../config/db');
const {
    createTicket,
    getAllTickets,
    getTicketById,
    getTicketsByUser,
    updateTicketStatus,
    assignTechnician,
    addComment,
    getTicketHistory,
    deleteTicket,
    getTechnicians,
    updateTicketPriority  
} = require('../controllers/ticketsController');

// Criar novo chamado
router.post('/', createTicket);

// Buscar tipos de solicitação (DEVE VIR ANTES DAS ROTAS COM PARÂMETROS)
router.get('/tipos-solicitacao', (req, res) => {
    db.query('SELECT id_tipo, nome_tipo FROM tipos_solicitacao WHERE ativo = 1', (err, results) => {
        if (err) {
            console.error('DB SELECT TIPOS ERROR:', err);
            return res.status(500).json({ message: 'Erro ao buscar tipos de solicitação.' });
        }
        return res.status(200).json({ tipos: results });
    });
});

// Listar técnicos disponíveis
router.get('/tecnicos', getTechnicians);

// Listar todos os chamados
router.get('/', getAllTickets);

// Buscar chamados por usuário
router.get('/user/:id_usuario', getTicketsByUser);

// Atualizar status do chamado
router.put('/:id/status', updateTicketStatus);

// Atualizar prioridade do chamado (rota original)
router.put('/:id_chamado/prioridade', updateTicketPriority);

// Atribuir técnico ao chamado
router.put('/:id/atribuir', assignTechnician);

// Adicionar comentário ao chamado
router.post('/:id/comment', addComment);

// Buscar histórico do chamado
router.get('/:id/history', getTicketHistory);

// Deletar chamado (apenas admin)
router.delete('/:id', deleteTicket);

module.exports = router;