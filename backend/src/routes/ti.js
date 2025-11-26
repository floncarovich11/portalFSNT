const express = require('express');
const router = express.Router();
const { 
	listarMeusChamados,
	atualizarChamado,
	visualizarChamado
} = require('../controllers/TIController');

// Rotas para técnicos de TI
router.get('/chamados/:id_tecnico', listarMeusChamados);
router.get('/chamado/:id_chamado', visualizarChamado);
router.put('/chamado/:id_chamado', atualizarChamado);

module.exports = router;