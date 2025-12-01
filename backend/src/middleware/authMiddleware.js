const db = require('../config/db');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'CHANGE_THIS_SECRET';

// Verifica e valida o token JWT. Anexa decoded em req.user
const verificarToken = (req, res, next) => {
	const authHeader = req.headers['authorization'] || req.headers['Authorization'];
	if (!authHeader) {
		return res.status(401).json({ message: 'Token não fornecido.' });
	}

	const parts = authHeader.split(' ');
	if (parts.length !== 2 || parts[0] !== 'Bearer') {
		return res.status(401).json({ message: 'Formato de token inválido.' });
	}

	const token = parts[1];

	jwt.verify(token, JWT_SECRET, (err, decoded) => {
		if (err) {
			return res.status(401).json({ message: 'Token inválido ou expirado.' });
		}
		// anexar usuário decodificado para uso posterior
		req.user = decoded;
		next();
	});
};

// Verifica se o usuário (do token) é Administrador e está ativo no DB
const verificarAdmin = (req, res, next) => {
	// Primeiro garantir que o token foi verificado
	const proceed = () => {
		const id_usuario = req.user && req.user.id_usuario;
		if (!id_usuario) return res.status(401).json({ message: 'Usuário inválido no token.' });

		db.query('SELECT tipo_usuario, ativo FROM usuarios WHERE id_usuario = ?', [id_usuario], (err, results) => {
			if (err) {
				console.error('DB ERROR verificarAdmin:', err);
				return res.status(500).json({ message: 'Erro no servidor.' });
			}
			if (!results || results.length === 0) {
				return res.status(404).json({ message: 'Usuário não encontrado.' });
			}
			const usuario = results[0];
			if (!usuario.ativo) return res.status(403).json({ message: 'Usuário inativo.' });
			if (usuario.tipo_usuario !== 'Administrador') {
				return res.status(403).json({ message: 'Acesso negado. Apenas administradores.' });
			}
			next();
		});
	};

	if (req.user) {
		return proceed();
	}
	// Se token não foi verificado antes, chamar verificarToken primeiro
	verificarToken(req, res, (err) => {
		if (err) return; // já respondeu
		proceed();
	});
};

// Verifica se o usuário é TI ou Administrador
const verificarTI = (req, res, next) => {
	const proceed = () => {
		const id_usuario = req.user && req.user.id_usuario;
		if (!id_usuario) return res.status(401).json({ message: 'Usuário inválido no token.' });

		db.query('SELECT tipo_usuario, ativo FROM usuarios WHERE id_usuario = ?', [id_usuario], (err, results) => {
			if (err) {
				console.error('DB ERROR verificarTI:', err);
				return res.status(500).json({ message: 'Erro no servidor.' });
			}
			if (!results || results.length === 0) {
				return res.status(404).json({ message: 'Usuário não encontrado.' });
			}
			const usuario = results[0];
			if (!usuario.ativo) return res.status(403).json({ message: 'Usuário inativo.' });
			if (usuario.tipo_usuario !== 'TI' && usuario.tipo_usuario !== 'Administrador') {
				return res.status(403).json({ message: 'Acesso negado. Apenas técnicos de TI.' });
			}
			next();
		});
	};

	if (req.user) {
		return proceed();
	}
	verificarToken(req, res, (err) => {
		if (err) return;
		proceed();
	});
};

module.exports = { verificarToken, verificarAdmin, verificarTI };