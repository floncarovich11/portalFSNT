const express = require('express');
const router = express.Router();
const { 
	listarMeusChamados,
	atualizarChamado,
	visualizarChamado
} = require('../controllers/TIController');

const { verificarToken, verificarTI } = require('../middleware/authMiddleware');

// Rotas para técnicos de TI
router.get('/chamados/:id_tecnico', verificarToken, verificarTI, listarMeusChamados);
router.get('/chamado/:id_chamado', verificarToken, verificarTI, visualizarChamado);
router.put('/chamado/:id_chamado', verificarToken, verificarTI, atualizarChamado);

module.exports = router;