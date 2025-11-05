const db = require('../config/db');

// Criar novo chamado
exports.createTicket = (req, res) => {
    const {
        id_usuario,
        id_unidade,
        id_tipo_solicitacao,
        resumo,
        descricao,
        prioridade
    } = req.body;

    // Validação dos campos obrigatórios
    if (!id_usuario || !id_unidade || !id_tipo_solicitacao || !resumo || !descricao) {
        return res.status(400).json({ 
            message: 'Campos obrigatórios: id_usuario, id_unidade, id_tipo_solicitacao, resumo, descricao' 
        });
    }

    // Prioridade padrão é 'Média' se não for informada
    const prioridadeFinal = prioridade || 'Média';

    db.query(
        'INSERT INTO chamados (id_usuario, id_unidade, id_tipo_solicitacao, resumo, descricao, prioridade) VALUES (?, ?, ?, ?, ?, ?)',
        [id_usuario, id_unidade, id_tipo_solicitacao, resumo, descricao, prioridadeFinal],
        (err, result) => {
            if (err) {
                console.error('DB INSERT CHAMADO ERROR:', err);
                return res.status(500).json({ message: 'Erro ao criar chamado.' });
            }

            // Registrar no histórico
            db.query(
                'INSERT INTO historico_chamado (id_chamado, id_usuario, tipo_acao, descricao_acao) VALUES (?, ?, ?, ?)',
                [result.insertId, id_usuario, 'Mudanca_Status', 'Chamado criado'],
                (histErr) => {
                    if (histErr) console.error('Erro ao registrar histórico:', histErr);
                }
            );

            return res.status(201).json({
                message: 'Chamado criado com sucesso!',
                chamado: {
                    id_chamado: result.insertId,
                    resumo,
                    descricao,
                    status: 'Aberto',
                    prioridade: prioridadeFinal
                }
            });
        }
    );
};

// Listar todos os chamados
exports.getAllTickets = (req, res) => {
    db.query('SELECT * FROM vw_chamados_completos ORDER BY data_abertura DESC', (err, results) => {
        if (err) {
            console.error('DB SELECT CHAMADOS ERROR:', err);
            return res.status(500).json({ message: 'Erro ao buscar chamados.' });
        }
        return res.status(200).json({ chamados: results });
    });
};

// Buscar chamado por ID
exports.getTicketById = (req, res) => {
    const { id } = req.params;

    db.query('SELECT * FROM vw_chamados_completos WHERE id_chamado = ?', [id], (err, results) => {
        if (err) {
            console.error('DB SELECT CHAMADO ERROR:', err);
            return res.status(500).json({ message: 'Erro ao buscar chamado.' });
        }

        if (!results || results.length === 0) {
            return res.status(404).json({ message: 'Chamado não encontrado.' });
        }

        return res.status(200).json({ chamado: results[0] });
    });
};

// Buscar chamados por usuário
exports.getTicketsByUser = (req, res) => {
    const { id_usuario } = req.params;

    db.query(
        'SELECT * FROM vw_chamados_completos WHERE id_chamado IN (SELECT id_chamado FROM chamados WHERE id_usuario = ?) ORDER BY data_abertura DESC',
        [id_usuario],
        (err, results) => {
            if (err) {
                console.error('DB SELECT CHAMADOS BY USER ERROR:', err);
                return res.status(500).json({ message: 'Erro ao buscar chamados do usuário.' });
            }
            return res.status(200).json({ chamados: results });
        }
    );
};

// Atualizar status do chamado
exports.updateTicketStatus = (req, res) => {
    const { id } = req.params;
    const { status_chamado, id_usuario, observacoes_tecnico } = req.body;

    if (!status_chamado || !id_usuario) {
        return res.status(400).json({ message: 'Status e ID do usuário são obrigatórios.' });
    }

    // Validar status
    const statusValidos = ['Aberto', 'Em Andamento', 'Aguardando Resposta', 'Resolvido', 'Cancelado'];
    if (!statusValidos.includes(status_chamado)) {
        return res.status(400).json({ message: 'Status inválido.' });
    }

    // Buscar status anterior
    db.query('SELECT status_chamado FROM chamados WHERE id_chamado = ?', [id], (err, results) => {
        if (err) {
            console.error('DB SELECT STATUS ERROR:', err);
            return res.status(500).json({ message: 'Erro ao verificar status anterior.' });
        }

        if (!results || results.length === 0) {
            return res.status(404).json({ message: 'Chamado não encontrado.' });
        }

        const statusAnterior = results[0].status_chamado;

        // Preparar query de atualização
        let query = 'UPDATE chamados SET status_chamado = ?';
        let params = [status_chamado];

        // Se for resolvido ou cancelado, adicionar data de conclusão
        if (status_chamado === 'Resolvido' || status_chamado === 'Cancelado') {
            query += ', data_conclusao = NOW()';
        }

        // Se houver observações do técnico
        if (observacoes_tecnico) {
            query += ', observacoes_tecnico = ?';
            params.push(observacoes_tecnico);
        }

        query += ' WHERE id_chamado = ?';
        params.push(id);

        db.query(query, params, (updateErr) => {
            if (updateErr) {
                console.error('DB UPDATE CHAMADO ERROR:', updateErr);
                return res.status(500).json({ message: 'Erro ao atualizar status do chamado.' });
            }

            // Registrar no histórico
            db.query(
                'INSERT INTO historico_chamado (id_chamado, id_usuario, tipo_acao, descricao_acao, status_anterior, status_novo) VALUES (?, ?, ?, ?, ?, ?)',
                [id, id_usuario, 'Mudanca_Status', `Status alterado de ${statusAnterior} para ${status_chamado}`, statusAnterior, status_chamado],
                (histErr) => {
                    if (histErr) console.error('Erro ao registrar histórico:', histErr);
                }
            );

            return res.status(200).json({
                message: 'Status do chamado atualizado com sucesso!',
                status_anterior: statusAnterior,
                status_novo: status_chamado
            });
        });
    });
};

// Atribuir técnico ao chamado
exports.assignTechnician = (req, res) => {
    const { id } = req.params;
    const { id_tecnico_responsavel, id_usuario } = req.body;

    if (!id_tecnico_responsavel || !id_usuario) {
        return res.status(400).json({ message: 'ID do técnico e ID do usuário são obrigatórios.' });
    }

    // Verificar se o técnico existe e é do tipo TI ou Administrador
    db.query(
        'SELECT nome_completo, tipo_usuario FROM usuarios WHERE id_usuario = ?',
        [id_tecnico_responsavel],
        (err, results) => {
            if (err) {
                console.error('DB SELECT TECNICO ERROR:', err);
                return res.status(500).json({ message: 'Erro ao verificar técnico.' });
            }

            if (!results || results.length === 0) {
                return res.status(404).json({ message: 'Técnico não encontrado.' });
            }

            const tecnico = results[0];
            if (tecnico.tipo_usuario !== 'TI' && tecnico.tipo_usuario !== 'Administrador') {
                return res.status(403).json({ message: 'Usuário não é um técnico.' });
            }

            // Atribuir técnico ao chamado
            db.query(
                'UPDATE chamados SET id_tecnico_responsavel = ?, status_chamado = ? WHERE id_chamado = ?',
                [id_tecnico_responsavel, 'Em Andamento', id],
                (updateErr) => {
                    if (updateErr) {
                        console.error('DB UPDATE CHAMADO TECNICO ERROR:', updateErr);
                        return res.status(500).json({ message: 'Erro ao atribuir técnico.' });
                    }

                    // Registrar no histórico
                    db.query(
                        'INSERT INTO historico_chamado (id_chamado, id_usuario, tipo_acao, descricao_acao) VALUES (?, ?, ?, ?)',
                        [id, id_usuario, 'Atribuicao', `Chamado atribuído para ${tecnico.nome_completo}`],
                        (histErr) => {
                            if (histErr) console.error('Erro ao registrar histórico:', histErr);
                        }
                    );

                    return res.status(200).json({
                        message: 'Técnico atribuído com sucesso!',
                        tecnico: {
                            id: id_tecnico_responsavel,
                            nome: tecnico.nome_completo
                        }
                    });
                }
            );
        }
    );
};

// Adicionar comentário ao chamado
exports.addComment = (req, res) => {
    const { id } = req.params;
    const { id_usuario, comentario } = req.body;

    if (!id_usuario || !comentario) {
        return res.status(400).json({ message: 'ID do usuário e comentário são obrigatórios.' });
    }

    db.query(
        'INSERT INTO historico_chamado (id_chamado, id_usuario, tipo_acao, descricao_acao) VALUES (?, ?, ?, ?)',
        [id, id_usuario, 'Comentario', comentario],
        (err, result) => {
            if (err) {
                console.error('DB INSERT COMENTARIO ERROR:', err);
                return res.status(500).json({ message: 'Erro ao adicionar comentário.' });
            }

            return res.status(201).json({
                message: 'Comentário adicionado com sucesso!',
                id_historico: result.insertId
            });
        }
    );
};

// Buscar histórico do chamado
exports.getTicketHistory = (req, res) => {
    const { id } = req.params;

    db.query(
        `SELECT h.*, u.nome_completo, u.tipo_usuario 
         FROM historico_chamado h 
         INNER JOIN usuarios u ON h.id_usuario = u.id_usuario 
         WHERE h.id_chamado = ? 
         ORDER BY h.criado_em DESC`,
        [id],
        (err, results) => {
            if (err) {
                console.error('DB SELECT HISTORICO ERROR:', err);
                return res.status(500).json({ message: 'Erro ao buscar histórico.' });
            }
            return res.status(200).json({ historico: results });
        }
    );
};

// Deletar chamado (apenas admin)
exports.deleteTicket = (req, res) => {
    const { id } = req.params;

    db.query('DELETE FROM chamados WHERE id_chamado = ?', [id], (err, result) => {
        if (err) {
            console.error('DB DELETE CHAMADO ERROR:', err);
            return res.status(500).json({ message: 'Erro ao deletar chamado.' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Chamado não encontrado.' });
        }

        return res.status(200).json({ message: 'Chamado deletado com sucesso!' });
    });
};