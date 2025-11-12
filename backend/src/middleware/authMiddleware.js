const verificarAdmin = (req, res, next) => {
	// Assumindo que você vai passar o usuário logado via req.body ou session
	// Ajuste conforme sua implementação de autenticação
	const { id_usuario } = req.body; // ou req.session.userId, req.user.id, etc

	if (!id_usuario) {
		return res.status(401).json({ message: 'Usuário não autenticado.' });
	}

	const db = require('../config/db');
	db.query(
		'SELECT tipo_usuario FROM usuarios WHERE id_usuario = ?',
		[id_usuario],
		(err, results) => {
			if (err) {
				console.error('DB ERROR:', err);
				return res.status(500).json({ message: 'Erro no servidor.' });
			}

			if (!results || results.length === 0) {
				return res.status(404).json({ message: 'Usuário não encontrado.' });
			}

			const usuario = results[0];

			if (usuario.tipo_usuario !== 'Administrador') {
				return res.status(403).json({ 
					message: 'Acesso negado. Apenas administradores podem realizar esta ação.' 
				});
			}

			// Usuário é admin, pode prosseguir
			next();
		}
	);
};

module.exports = { verificarAdmin };