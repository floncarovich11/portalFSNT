const db = require('../config/db');

const verificarAdmin = (req, res, next) => {
	// Buscar id_usuario tanto no query (GET) quanto no body (POST)
	const id_usuario = req.query.id_usuario || req.body.id_usuario;
	
	if (!id_usuario) {
		return res.status(401).json({ message: 'Usuário não autenticado.' });
	}
	
	db.query(
		'SELECT tipo_usuario FROM usuarios WHERE id_usuario = ? AND ativo = TRUE',
		[id_usuario],
		(err, results) => {
			if (err) {
				console.error('❌ Erro no banco de dados:', err);
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