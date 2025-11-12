const db = require('../config/db');

// Listar todos os usuários
exports.listarUsuarios = (req, res) => {
	db.query(
		`SELECT 
			u.id_usuario, 
			u.nome_completo, 
			u.email, 
			u.tipo_usuario, 
			u.ativo,
			un.nome_unidade,
			u.criado_em
		FROM usuarios u
		INNER JOIN unidades un ON u.id_unidade = un.id_unidade
		ORDER BY u.criado_em DESC`,
		(err, results) => {
			if (err) {
				console.error('DB ERROR:', err);
				return res.status(500).json({ message: 'Erro ao listar usuários.' });
			}

			res.status(200).json({
				total: results.length,
				usuarios: results
			});
		}
	);
};

// Promover usuário a TI (técnico)
exports.promoverTecnico = (req, res) => {
	const { email } = req.body;

	if (!email) {
		return res.status(400).json({ message: 'Email é obrigatório.' });
	}

	// Buscar usuário pelo email
	db.query(
		'SELECT id_usuario, nome_completo, tipo_usuario FROM usuarios WHERE email = ?',
		[email],
		(err, results) => {
			if (err) {
				console.error('DB ERROR:', err);
				return res.status(500).json({ message: 'Erro ao buscar usuário.' });
			}

			if (!results || results.length === 0) {
				return res.status(404).json({ message: 'Usuário não encontrado com este email.' });
			}

			const usuario = results[0];

			// Não permitir alterar administrador
			if (usuario.tipo_usuario === 'Administrador') {
				return res.status(400).json({ 
					message: 'Não é possível alterar o tipo de um Administrador.' 
				});
			}

			// Verificar se já é TI
			if (usuario.tipo_usuario === 'TI') {
				return res.status(400).json({ 
					message: 'Este usuário já é um técnico de TI.' 
				});
			}

			// Atualizar para TI
			db.query(
				'UPDATE usuarios SET tipo_usuario = ? WHERE id_usuario = ?',
				['TI', usuario.id_usuario],
				(updateErr) => {
					if (updateErr) {
						console.error('DB UPDATE ERROR:', updateErr);
						return res.status(500).json({ message: 'Erro ao promover usuário.' });
					}

					res.status(200).json({
						message: `${usuario.nome_completo} foi promovido a Técnico de TI com sucesso!`,
						usuario: {
							id: usuario.id_usuario,
							nome: usuario.nome_completo,
							email: email,
							tipo_usuario: 'TI'
						}
					});
				}
			);
		}
	);
};

// Remover status de TI (voltar para Funcionario)
exports.removerTecnico = (req, res) => {
	const { email } = req.body;

	if (!email) {
		return res.status(400).json({ message: 'Email é obrigatório.' });
	}

	db.query(
		'SELECT id_usuario, nome_completo, tipo_usuario FROM usuarios WHERE email = ?',
		[email],
		(err, results) => {
			if (err) {
				console.error('DB ERROR:', err);
				return res.status(500).json({ message: 'Erro ao buscar usuário.' });
			}

			if (!results || results.length === 0) {
				return res.status(404).json({ message: 'Usuário não encontrado.' });
			}

			const usuario = results[0];

			if (usuario.tipo_usuario === 'Administrador') {
				return res.status(400).json({ 
					message: 'Não é possível alterar o tipo de um Administrador.' 
				});
			}

			if (usuario.tipo_usuario === 'Funcionario') {
				return res.status(400).json({ 
					message: 'Este usuário já é um Funcionário comum.' 
				});
			}

			// Atualizar para Funcionario
			db.query(
				'UPDATE usuarios SET tipo_usuario = ? WHERE id_usuario = ?',
				['Funcionario', usuario.id_usuario],
				(updateErr) => {
					if (updateErr) {
						console.error('DB UPDATE ERROR:', updateErr);
						return res.status(500).json({ message: 'Erro ao atualizar usuário.' });
					}

					res.status(200).json({
						message: `${usuario.nome_completo} voltou a ser Funcionário comum.`,
						usuario: {
							id: usuario.id_usuario,
							nome: usuario.nome_completo,
							email: email,
							tipo_usuario: 'Funcionario'
						}
					});
				}
			);
		}
	);
};