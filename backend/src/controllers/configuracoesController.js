const db = require('../config/db');

// =====================================================
// TIPOS DE SOLICITAÇÃO
// =====================================================

// Listar todos os tipos de solicitação
exports.listarTipos = (req, res) => {
	db.query(
		`SELECT 
			id_tipo, 
			nome_tipo, 
			descricao, 
			ativo, 
			criado_em
		FROM tipos_solicitacao
		ORDER BY nome_tipo ASC`,
		(err, results) => {
			if (err) {
				console.error('DB ERROR:', err);
				return res.status(500).json({ message: 'Erro ao listar tipos de solicitação.' });
			}
			res.status(200).json({
				total: results.length,
				tipos: results
			});
		}
	);
};

// Adicionar novo tipo de solicitação
exports.adicionarTipo = (req, res) => {
	const { nome_tipo, descricao } = req.body;

	if (!nome_tipo || nome_tipo.trim() === '') {
		return res.status(400).json({ message: 'Nome do tipo é obrigatório.' });
	}

	// Verificar se já existe um tipo com este nome
	db.query(
		'SELECT id_tipo FROM tipos_solicitacao WHERE nome_tipo = ?',
		[nome_tipo.trim()],
		(err, results) => {
			if (err) {
				console.error('DB ERROR:', err);
				return res.status(500).json({ message: 'Erro ao verificar tipo existente.' });
			}

			if (results.length > 0) {
				return res.status(400).json({ message: 'Já existe um tipo de solicitação com este nome.' });
			}

			// Inserir novo tipo
			db.query(
				'INSERT INTO tipos_solicitacao (nome_tipo, descricao) VALUES (?, ?)',
				[nome_tipo.trim(), descricao || null],
				(insertErr, insertResult) => {
					if (insertErr) {
						console.error('DB INSERT ERROR:', insertErr);
						return res.status(500).json({ message: 'Erro ao adicionar tipo de solicitação.' });
					}

					res.status(201).json({
						message: 'Tipo de solicitação adicionado com sucesso!',
						tipo: {
							id_tipo: insertResult.insertId,
							nome_tipo: nome_tipo.trim(),
							descricao: descricao || null,
							ativo: true
						}
					});
				}
			);
		}
	);
};

// Editar tipo de solicitação existente
exports.editarTipo = (req, res) => {
	const { id_tipo } = req.params;
	const { nome_tipo, descricao, ativo } = req.body;

	if (!nome_tipo || nome_tipo.trim() === '') {
		return res.status(400).json({ message: 'Nome do tipo é obrigatório.' });
	}

	// Verificar se o tipo existe
	db.query(
		'SELECT id_tipo FROM tipos_solicitacao WHERE id_tipo = ?',
		[id_tipo],
		(err, results) => {
			if (err) {
				console.error('DB ERROR:', err);
				return res.status(500).json({ message: 'Erro ao buscar tipo.' });
			}

			if (results.length === 0) {
				return res.status(404).json({ message: 'Tipo de solicitação não encontrado.' });
			}

			// Verificar se outro tipo já usa este nome
			db.query(
				'SELECT id_tipo FROM tipos_solicitacao WHERE nome_tipo = ? AND id_tipo != ?',
				[nome_tipo.trim(), id_tipo],
				(checkErr, checkResults) => {
					if (checkErr) {
						console.error('DB ERROR:', checkErr);
						return res.status(500).json({ message: 'Erro ao verificar nome duplicado.' });
					}

					if (checkResults.length > 0) {
						return res.status(400).json({ message: 'Já existe outro tipo com este nome.' });
					}

					// Atualizar tipo
					db.query(
						'UPDATE tipos_solicitacao SET nome_tipo = ?, descricao = ?, ativo = ? WHERE id_tipo = ?',
						[nome_tipo.trim(), descricao || null, ativo !== undefined ? ativo : true, id_tipo],
						(updateErr) => {
							if (updateErr) {
								console.error('DB UPDATE ERROR:', updateErr);
								return res.status(500).json({ message: 'Erro ao atualizar tipo.' });
							}

							res.status(200).json({
								message: 'Tipo de solicitação atualizado com sucesso!',
								tipo: {
									id_tipo: parseInt(id_tipo),
									nome_tipo: nome_tipo.trim(),
									descricao: descricao || null,
									ativo: ativo !== undefined ? ativo : true
								}
							});
						}
					);
				}
			);
		}
	);
};

// Deletar tipo de solicitação
exports.deletarTipo = (req, res) => {
	const { id_tipo } = req.params;

	// Verificar se existem chamados usando este tipo
	db.query(
		'SELECT COUNT(*) as total FROM chamados WHERE id_tipo_solicitacao = ?',
		[id_tipo],
		(err, results) => {
			if (err) {
				console.error('DB ERROR:', err);
				return res.status(500).json({ message: 'Erro ao verificar dependências.' });
			}

			if (results[0].total > 0) {
				return res.status(400).json({ 
					message: 'Não é possível deletar este tipo pois existem chamados vinculados a ele.',
					chamados_vinculados: results[0].total
				});
			}

			// Deletar tipo
			db.query(
				'DELETE FROM tipos_solicitacao WHERE id_tipo = ?',
				[id_tipo],
				(deleteErr, deleteResult) => {
					if (deleteErr) {
						console.error('DB DELETE ERROR:', deleteErr);
						return res.status(500).json({ message: 'Erro ao deletar tipo.' });
					}

					if (deleteResult.affectedRows === 0) {
						return res.status(404).json({ message: 'Tipo de solicitação não encontrado.' });
					}

					res.status(200).json({
						message: 'Tipo de solicitação deletado com sucesso!'
					});
				}
			);
		}
	);
};

// =====================================================
// UNIDADES
// =====================================================

// Listar todas as unidades
exports.listarUnidades = (req, res) => {
	db.query(
		`SELECT 
			id_unidade, 
			nome_unidade, 
			criado_em
		FROM unidades
		ORDER BY nome_unidade ASC`,
		(err, results) => {
			if (err) {
				console.error('DB ERROR:', err);
				return res.status(500).json({ message: 'Erro ao listar unidades.' });
			}
			res.status(200).json({
				total: results.length,
				unidades: results
			});
		}
	);
};

// Adicionar nova unidade
exports.adicionarUnidade = (req, res) => {
	const { nome_unidade } = req.body;

	if (!nome_unidade || nome_unidade.trim() === '') {
		return res.status(400).json({ message: 'Nome da unidade é obrigatório.' });
	}

	// Verificar se já existe uma unidade com este nome
	db.query(
		'SELECT id_unidade FROM unidades WHERE nome_unidade = ?',
		[nome_unidade.trim()],
		(err, results) => {
			if (err) {
				console.error('DB ERROR:', err);
				return res.status(500).json({ message: 'Erro ao verificar unidade existente.' });
			}

			if (results.length > 0) {
				return res.status(400).json({ message: 'Já existe uma unidade com este nome.' });
			}

			// Inserir nova unidade
			db.query(
				'INSERT INTO unidades (nome_unidade) VALUES (?)',
				[nome_unidade.trim()],
				(insertErr, insertResult) => {
					if (insertErr) {
						console.error('DB INSERT ERROR:', insertErr);
						return res.status(500).json({ message: 'Erro ao adicionar unidade.' });
					}

					res.status(201).json({
						message: 'Unidade adicionada com sucesso!',
						unidade: {
							id_unidade: insertResult.insertId,
							nome_unidade: nome_unidade.trim()
						}
					});
				}
			);
		}
	);
};

// Editar unidade existente
exports.editarUnidade = (req, res) => {
	const { id_unidade } = req.params;
	const { nome_unidade } = req.body;

	if (!nome_unidade || nome_unidade.trim() === '') {
		return res.status(400).json({ message: 'Nome da unidade é obrigatório.' });
	}

	// Verificar se a unidade existe
	db.query(
		'SELECT id_unidade FROM unidades WHERE id_unidade = ?',
		[id_unidade],
		(err, results) => {
			if (err) {
				console.error('DB ERROR:', err);
				return res.status(500).json({ message: 'Erro ao buscar unidade.' });
			}

			if (results.length === 0) {
				return res.status(404).json({ message: 'Unidade não encontrada.' });
			}

			// Verificar se outra unidade já usa este nome
			db.query(
				'SELECT id_unidade FROM unidades WHERE nome_unidade = ? AND id_unidade != ?',
				[nome_unidade.trim(), id_unidade],
				(checkErr, checkResults) => {
					if (checkErr) {
						console.error('DB ERROR:', checkErr);
						return res.status(500).json({ message: 'Erro ao verificar nome duplicado.' });
					}

					if (checkResults.length > 0) {
						return res.status(400).json({ message: 'Já existe outra unidade com este nome.' });
					}

					// Atualizar unidade
					db.query(
						'UPDATE unidades SET nome_unidade = ? WHERE id_unidade = ?',
						[nome_unidade.trim(), id_unidade],
						(updateErr) => {
							if (updateErr) {
								console.error('DB UPDATE ERROR:', updateErr);
								return res.status(500).json({ message: 'Erro ao atualizar unidade.' });
							}

							res.status(200).json({
								message: 'Unidade atualizada com sucesso!',
								unidade: {
									id_unidade: parseInt(id_unidade),
									nome_unidade: nome_unidade.trim()
								}
							});
						}
					);
				}
			);
		}
	);
};

// Deletar unidade
exports.deletarUnidade = (req, res) => {
	const { id_unidade } = req.params;

	// Verificar se existem usuários ou chamados vinculados a esta unidade
	db.query(
		`SELECT 
			(SELECT COUNT(*) FROM usuarios WHERE id_unidade = ?) as usuarios,
			(SELECT COUNT(*) FROM chamados WHERE id_unidade = ?) as chamados`,
		[id_unidade, id_unidade],
		(err, results) => {
			if (err) {
				console.error('DB ERROR:', err);
				return res.status(500).json({ message: 'Erro ao verificar dependências.' });
			}

			const totalUsuarios = results[0].usuarios;
			const totalChamados = results[0].chamados;

			if (totalUsuarios > 0 || totalChamados > 0) {
				return res.status(400).json({ 
					message: 'Não é possível deletar esta unidade pois existem registros vinculados a ela.',
					usuarios_vinculados: totalUsuarios,
					chamados_vinculados: totalChamados
				});
			}

			// Deletar unidade
			db.query(
				'DELETE FROM unidades WHERE id_unidade = ?',
				[id_unidade],
				(deleteErr, deleteResult) => {
					if (deleteErr) {
						console.error('DB DELETE ERROR:', deleteErr);
						return res.status(500).json({ message: 'Erro ao deletar unidade.' });
					}

					if (deleteResult.affectedRows === 0) {
						return res.status(404).json({ message: 'Unidade não encontrada.' });
					}

					res.status(200).json({
						message: 'Unidade deletada com sucesso!'
					});
				}
			);
		}
	);
};