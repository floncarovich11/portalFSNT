const express = require('express');
const router = express.Router();
const { verificarAdmin } = require('../middleware/authMiddleware');
const { 
	listarUsuarios, 
	promoverTecnico, 
	removerTecnico 
} = require('../controllers/adminController');

// Todas as rotas aqui exigem que o usuário seja Administrador
router.get('/usuarios', verificarAdmin, listarUsuarios);
router.post('/promover-tecnico', verificarAdmin, promoverTecnico);
router.post('/remover-tecnico', verificarAdmin, removerTecnico);

module.exports = router;