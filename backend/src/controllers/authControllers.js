const db = require('../config/db');
const bcrypt = require('bcryptjs');

exports.register = (req, res) => {
	const nome_completo = req.body.nome_completo || req.body.nome;
	let id_unidade = req.body.id_unidade || req.body.unidade;
	const { email, senha } = req.body;

	if(!nome_completo || !id_unidade || !email || !senha) {
		return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
	}

	// Resolver unidade se necessário
	if (isNaN(Number(id_unidade))) {
		const nomeUnidade = id_unidade;
		db.query('SELECT id_unidade FROM unidades WHERE nome_unidade = ?', [nomeUnidade], (uErr, uRes) => {
			if (uErr) {
				console.error('DB SELECT UNIDADE ERROR:', uErr);
				return res.status(500).json({ message: 'Erro ao verificar unidade.' });
			}
			if (!uRes || uRes.length === 0) {
				return res.status(400).json({ message: 'Unidade informada não encontrada.' });
			}
			id_unidade = uRes[0].id_unidade;
			createUser();
		});
	} else {
		id_unidade = Number(id_unidade);
		createUser();
	}

	function createUser() {
		// ===== NOVA LÓGICA: Verificar se é o primeiro usuário =====
		db.query('SELECT COUNT(*) as total FROM usuarios', (countErr, countResult) => {
			if (countErr) {
				console.error('DB COUNT ERROR:', countErr);
				return res.status(500).json({ message: 'Erro ao verificar usuários.' });
			}

			const totalUsuarios = countResult[0].total;
			// Se não existe nenhum usuário, este será o Administrador
			const tipo_usuario = totalUsuarios === 0 ? 'Administrador' : 'Funcionario';

			// Hash da senha
			bcrypt.hash(senha, 10, (hashErr, hashedPassword) => {
				if (hashErr) {
					console.error('BCRYPT HASH ERROR:', hashErr);
					return res.status(500).json({ message: 'Erro ao criptografar senha.' });
				}

				// Inserir usuário com o tipo_usuario definido
				db.query(
					'INSERT INTO usuarios (nome_completo, id_unidade, email, senha, tipo_usuario) VALUES (?, ?, ?, ?, ?)',
					[nome_completo, id_unidade, email, hashedPassword, tipo_usuario],
					(err, result) => {
						if(err) {
							console.error('DB INSERT ERROR:', err);
							if (err.code === 'ER_DUP_ENTRY') {
								return res.status(409).json({ message: 'Email já cadastrado.' });
							}
							return res.status(500).json({ message: 'Erro ao registrar usuário.' });
						}

						return res.status(201).json({
							message: totalUsuarios === 0 
								? 'Primeiro usuário criado como Administrador!' 
								: 'Usuário registrado com sucesso!',
							usuario: {
								id: result.insertId,
								nome_completo,
								id_unidade,
								email,
								tipo_usuario
							}
						});
					}
				);
			});
		});
	}
};

exports.login = async (req, res) => {
	const { email, senha } = req.body;

	db.query('SELECT * FROM usuarios WHERE email = ?', [email], (err, results) => {
		if(err) {
			console.error('DB SELECT ERROR:', err);
			return res.status(500).json({ message: 'Erro no servidor.' });
		}
		if(!results || results.length === 0) {
			return res.status(401).json({ message: 'Credenciais inválidas.' });
		}

		const usuario = results[0];

		bcrypt.compare(senha, usuario.senha, (compareErr, isMatch) => {
			if (compareErr) {
				console.error('BCRYPT ERROR:', compareErr);
				return res.status(500).json({ message: 'Erro no servidor.' });
			}
			if (!isMatch) {
				return res.status(401).json({ message: 'Credenciais inválidas.' });
			}

			res.status(200).json({
				message: 'Login bem-sucedido!',
				usuario: {
					id: usuario.id_usuario,
					nome_completo: usuario.nome_completo,
					id_unidade: usuario.id_unidade,
					email: usuario.email,
					tipo_usuario: usuario.tipo_usuario
				}
			});
		});
	});
};

// =====================================================
// BUSCAR USUÁRIO POR ID
// =====================================================
exports.getUsuario = (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ message: 'ID do usuário é obrigatório.' });
    }

    db.query(
        'SELECT id_usuario, nome_completo, email, id_unidade, tipo_usuario, criado_em FROM usuarios WHERE id_usuario = ?',
        [id],
        (err, results) => {
            if (err) {
                console.error('DB SELECT ERROR:', err);
                return res.status(500).json({ message: 'Erro ao buscar usuário.' });
            }

            if (!results || results.length === 0) {
                return res.status(404).json({ message: 'Usuário não encontrado.' });
            }

            res.status(200).json(results[0]);
        }
    );
};

// =====================================================
// ATUALIZAR PERFIL DO USUÁRIO
// =====================================================
exports.updatePerfil = (req, res) => {
    const { id } = req.params;
    const { nome_completo, email, id_unidade, senha_atual, nova_senha } = req.body;

    if (!id) {
        return res.status(400).json({ message: 'ID do usuário é obrigatório.' });
    }

    if (!nome_completo || !email || !id_unidade) {
        return res.status(400).json({ message: 'Nome, email e unidade são obrigatórios.' });
    }

    // Buscar usuário atual
    db.query('SELECT * FROM usuarios WHERE id_usuario = ?', [id], (err, results) => {
        if (err) {
            console.error('DB SELECT ERROR:', err);
            return res.status(500).json({ message: 'Erro ao buscar usuário.' });
        }

        if (!results || results.length === 0) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        const usuario = results[0];

        // Se está tentando alterar a senha
        if (senha_atual && nova_senha) {
            // Validar senha atual
            bcrypt.compare(senha_atual, usuario.senha, (compareErr, isMatch) => {
                if (compareErr) {
                    console.error('BCRYPT ERROR:', compareErr);
                    return res.status(500).json({ message: 'Erro ao validar senha.' });
                }

                if (!isMatch) {
                    return res.status(401).json({ message: 'Senha atual incorreta.' });
                }

                // Hash da nova senha
                bcrypt.hash(nova_senha, 10, (hashErr, hashedPassword) => {
                    if (hashErr) {
                        console.error('BCRYPT HASH ERROR:', hashErr);
                        return res.status(500).json({ message: 'Erro ao criptografar nova senha.' });
                    }

                    // Atualizar com nova senha
                    atualizarDados(hashedPassword);
                });
            });
        } else {
            // Atualizar sem alterar senha
            atualizarDados(usuario.senha);
        }

        function atualizarDados(senhaFinal) {
            db.query(
                'UPDATE usuarios SET nome_completo = ?, email = ?, id_unidade = ?, senha = ? WHERE id_usuario = ?',
                [nome_completo, email, id_unidade, senhaFinal, id],
                (updateErr, result) => {
                    if (updateErr) {
                        console.error('DB UPDATE ERROR:', updateErr);
                        
                        if (updateErr.code === 'ER_DUP_ENTRY') {
                            return res.status(409).json({ message: 'Email já cadastrado por outro usuário.' });
                        }
                        
                        return res.status(500).json({ message: 'Erro ao atualizar perfil.' });
                    }

                    if (result.affectedRows === 0) {
                        return res.status(404).json({ message: 'Usuário não encontrado.' });
                    }

                    res.status(200).json({
                        message: 'Perfil atualizado com sucesso!',
                        usuario: {
                            id: id,
                            nome_completo,
                            email,
                            id_unidade,
                            tipo_usuario: usuario.tipo_usuario
                        }
                    });
                }
            );
        }
    });
};