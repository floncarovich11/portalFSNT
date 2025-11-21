const express = require('express');
const router = express.Router();
const { 
	// Tipos de Solicitação
	listarTipos,
	adicionarTipo,
	editarTipo,
	deletarTipo,
	// Unidades
	listarUnidades,
	adicionarUnidade,
	editarUnidade,
	deletarUnidade
} = require('../controllers/configuracoesController');

// =====================================================
// ROTAS - TIPOS DE SOLICITAÇÃO (SEM AUTENTICAÇÃO)
// =====================================================
router.get('/tipos', listarTipos);
router.post('/tipos', adicionarTipo);
router.put('/tipos/:id_tipo', editarTipo);
router.delete('/tipos/:id_tipo', deletarTipo);

// =====================================================
// ROTAS - UNIDADES (SEM AUTENTICAÇÃO)
// =====================================================
router.get('/unidades', listarUnidades);
router.post('/unidades', adicionarUnidade);
router.put('/unidades/:id_unidade', editarUnidade);
router.delete('/unidades/:id_unidade', deletarUnidade);

module.exports = router;