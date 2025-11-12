const express = require('express');
const router = express.Router();
const { register, login, getUsuario, updatePerfil } = require('../controllers/authControllers');

router.post('/register', register);
router.post('/login', login);

router.get('/usuario/:id', getUsuario);
router.put('/perfil/:id', updatePerfil);


module.exports = router;