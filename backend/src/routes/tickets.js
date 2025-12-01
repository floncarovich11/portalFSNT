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

const { verificarToken, verificarAdmin, verificarTI } = require('../middleware/authMiddleware');

// Criar novo chamado (usuários autenticados)
router.post('/', verificarToken, createTicket);

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

// Listar técnicos disponíveis (apenas usuários autenticados)
router.get('/tecnicos', verificarToken, getTechnicians);

// Listar todos os chamados (pode ser público/ajustar se desejar) - manter público para dashboard ADM
router.get('/', getAllTickets);

// Buscar chamados por usuário (apenas o próprio usuário ou admin) - exigir token
router.get('/user/:id_usuario', verificarToken, getTicketsByUser);

// Atualizar status do chamado (usuários autenticados)
router.put('/:id/status', verificarToken, updateTicketStatus);

// Atualizar prioridade do chamado (rota original) (usuários autenticados)
router.put('/:id_chamado/prioridade', verificarToken, updateTicketPriority);

// Atribuir técnico ao chamado (TI/Admin)
router.put('/:id/atribuir', verificarToken, verificarTI, assignTechnician);

// Adicionar comentário ao chamado (autenticado)
router.post('/:id/comment', verificarToken, addComment);

// Buscar histórico do chamado (autenticado)
router.get('/:id/history', verificarToken, getTicketHistory);

// Deletar chamado (apenas admin)
router.delete('/:id', verificarToken, verificarAdmin, deleteTicket);

module.exports = router;