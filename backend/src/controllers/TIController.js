const db = require('../config/db');

// Listar chamados atribuídos a um técnico específico
exports.listarMeusChamados = (req, res) => {
	const { id_tecnico } = req.params;

	if (!id_tecnico) {
		return res.status(400).json({ message: 'ID do técnico é obrigatório.' });
	}

	db.query(
		`SELECT 
			c.id_chamado,
			c.resumo,
			c.descricao,
			c.status_chamado,
			c.prioridade,
			c.data_abertura,
			c.data_atualizacao,
			c.data_conclusao,
			c.observacoes_tecnico,
			u.nome_completo AS nome_solicitante,
			u.email AS email_solicitante,
			un.nome_unidade,
			ts.nome_tipo AS tipo_solicitacao,
			(SELECT COUNT(*) FROM anexos_chamado WHERE id_chamado = c.id_chamado) AS total_anexos
		FROM chamados c
		INNER JOIN usuarios u ON c.id_usuario = u.id_usuario
		INNER JOIN unidades un ON c.id_unidade = un.id_unidade
		INNER JOIN tipos_solicitacao ts ON c.id_tipo_solicitacao = ts.id_tipo
		WHERE c.id_tecnico_responsavel = ?
		ORDER BY 
			FIELD(c.status_chamado, 'Em Andamento', 'Aguardando Resposta', 'Aberto', 'Resolvido', 'Cancelado'),
			FIELD(c.prioridade, 'Urgente', 'Alta', 'Média', 'Baixa'),
			c.data_abertura DESC`,
		[id_tecnico],
		(err, results) => {
			if (err) {
				console.error('DB ERROR:', err);
				return res.status(500).json({ message: 'Erro ao listar chamados.' });
			}

			res.status(200).json({
				total: results.length,
				chamados: results
			});
		}
	);
};

// Atualizar status e observações de um chamado
exports.atualizarChamado = (req, res) => {
	const { id_chamado } = req.params;
	const { status_chamado, observacoes_tecnico, id_tecnico } = req.body;

	// Validações
	if (!status_chamado && observacoes_tecnico === undefined) {
		return res.status(400).json({ 
			message: 'É necessário fornecer status_chamado ou observacoes_tecnico para atualizar.' 
		});
	}

	const statusValidos = ['Aberto', 'Em Andamento', 'Aguardando Resposta', 'Resolvido', 'Cancelado'];
	if (status_chamado && !statusValidos.includes(status_chamado)) {
		return res.status(400).json({ 
			message: 'Status inválido. Use: Aberto, Em Andamento, Aguardando Resposta, Resolvido ou Cancelado.' 
		});
	}

	// Verificar se o chamado existe
	db.query(
		'SELECT id_chamado, status_chamado, id_tecnico_responsavel FROM chamados WHERE id_chamado = ?',
		[id_chamado],
		(err, results) => {
			if (err) {
				console.error('DB ERROR:', err);
				return res.status(500).json({ message: 'Erro ao buscar chamado.' });
			}

			if (!results || results.length === 0) {
				return res.status(404).json({ message: 'Chamado não encontrado.' });
			}

			const chamado = results[0];

			// Preparar atualização
			let updateQuery = 'UPDATE chamados SET ';
			let updateValues = [];
			let updateFields = [];

			if (status_chamado) {
				updateFields.push('status_chamado = ?');
				updateValues.push(status_chamado);
			}

			if (observacoes_tecnico !== undefined) {
				updateFields.push('observacoes_tecnico = ?');
				updateValues.push(observacoes_tecnico);
			}

			// Se mudou para Resolvido, definir data_conclusao
			if (status_chamado === 'Resolvido') {
				updateFields.push('data_conclusao = NOW()');
			}

			updateQuery += updateFields.join(', ');
			updateQuery += ' WHERE id_chamado = ?';
			updateValues.push(id_chamado);

			// Executar atualização
			db.query(updateQuery, updateValues, (updateErr) => {
				if (updateErr) {
					console.error('DB UPDATE ERROR:', updateErr);
					return res.status(500).json({ message: 'Erro ao atualizar chamado.' });
				}

				// Registrar no histórico se mudou o status e temos id_tecnico
				if (status_chamado && status_chamado !== chamado.status_chamado && id_tecnico) {
					const descricaoAcao = `Status alterado de "${chamado.status_chamado}" para "${status_chamado}"`;
					
					db.query(
						`INSERT INTO historico_chamado 
						(id_chamado, id_usuario, tipo_acao, descricao_acao, status_anterior, status_novo) 
						VALUES (?, ?, 'Mudanca_Status', ?, ?, ?)`,
						[id_chamado, id_tecnico, descricaoAcao, chamado.status_chamado, status_chamado],
						(histErr) => {
							if (histErr) {
								console.error('Erro ao registrar histórico:', histErr);
							}
						}
					);
				}

				res.status(200).json({
					message: 'Chamado atualizado com sucesso!',
					chamado: {
						id_chamado: parseInt(id_chamado),
						status_chamado: status_chamado || chamado.status_chamado,
						observacoes_tecnico: observacoes_tecnico !== undefined ? observacoes_tecnico : null
					}
				});
			});
		}
	);
};

// Visualizar detalhes completos de um chamado específico
exports.visualizarChamado = (req, res) => {
	const { id_chamado } = req.params;

	db.query(
		`SELECT 
			c.id_chamado,
			c.resumo,
			c.descricao,
			c.status_chamado,
			c.prioridade,
			c.data_abertura,
			c.data_atualizacao,
			c.data_conclusao,
			c.observacoes_tecnico,
			u.nome_completo AS nome_solicitante,
			u.email AS email_solicitante,
			un.nome_unidade,
			ts.nome_tipo AS tipo_solicitacao,
			t.nome_completo AS tecnico_responsavel
		FROM chamados c
		INNER JOIN usuarios u ON c.id_usuario = u.id_usuario
		INNER JOIN unidades un ON c.id_unidade = un.id_unidade
		INNER JOIN tipos_solicitacao ts ON c.id_tipo_solicitacao = ts.id_tipo
		LEFT JOIN usuarios t ON c.id_tecnico_responsavel = t.id_usuario
		WHERE c.id_chamado = ?`,
		[id_chamado],
		(err, results) => {
			if (err) {
				console.error('DB ERROR:', err);
				return res.status(500).json({ message: 'Erro ao buscar chamado.' });
			}

			if (!results || results.length === 0) {
				return res.status(404).json({ message: 'Chamado não encontrado.' });
			}

			// Buscar anexos do chamado
			db.query(
				'SELECT id_anexo, nome_arquivo, caminho_arquivo, tipo_arquivo, enviado_em FROM anexos_chamado WHERE id_chamado = ?',
				[id_chamado],
				(anexoErr, anexos) => {
					if (anexoErr) {
						console.error('Erro ao buscar anexos:', anexoErr);
					}

					// Buscar histórico do chamado
					db.query(
						`SELECT 
							h.id_historico,
							h.tipo_acao,
							h.descricao_acao,
							h.status_anterior,
							h.status_novo,
							h.criado_em,
							u.nome_completo AS usuario_acao
						FROM historico_chamado h
						INNER JOIN usuarios u ON h.id_usuario = u.id_usuario
						WHERE h.id_chamado = ?
						ORDER BY h.criado_em DESC`,
						[id_chamado],
						(histErr, historico) => {
							if (histErr) {
								console.error('Erro ao buscar histórico:', histErr);
							}

							res.status(200).json({
								chamado: results[0],
								anexos: anexos || [],
								historico: historico || []
							});
						}
					);
				}
			);
		}
	);
};