const db = require('../config/db')
const bcrypt = require('bcryptjs')

exports.register = (req, res) => {
	// aceitar tanto campos antigos (nome, unidade) quanto os corretos (nome_completo, id_unidade)
	const nome_completo = req.body.nome_completo || req.body.nome;
	let id_unidade = req.body.id_unidade || req.body.unidade;
	const { email, senha } = req.body;

	if(!nome_completo || !id_unidade || !email || !senha) {
		return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
	}

	// se id_unidade veio como string não numérica (nome da unidade), resolver para id
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
			// prosseguir com inserção usando o id obtido
			createUser();
		});
	} else {
		// já é número (ou string numérica)
		id_unidade = Number(id_unidade);
		createUser();
	}

	function createUser() {
		// hash da senha antes de inserir
		bcrypt.hash(senha, 10, (hashErr, hashedPassword) => {
			if (hashErr) {
				console.error('BCRYPT HASH ERROR:', hashErr);
				return res.status(500).json({ message: 'Erro ao criptografar senha.' });
			}

			// usar nomes de colunas do schema: nome_completo, id_unidade, email, senha
			db.query(
				'INSERT INTO usuarios (nome_completo, id_unidade, email, senha) VALUES (?, ?, ?, ?)',
				[nome_completo, id_unidade, email, hashedPassword],
				(err, result) => {
					if(err) {
						console.error('DB INSERT ERROR:', err);
						// detectar duplicidade de email
						if (err.code === 'ER_DUP_ENTRY') {
							return res.status(409).json({ message: 'Email já cadastrado.' });
						}
						return res.status(500).json({ message: 'Erro ao registrar usuário.' });
					}
					// result.insertId contém o id do usuário criado (id_usuario)
					return res.status(201).json({
						message: 'Usuário registrado com sucesso!',
						usuario: {
							id: result.insertId,
							nome_completo,
							id_unidade,
							email
						}
					});
				}
			);
		});
	}
};

exports.login = async (req, res) => {
	const { email, senha } = req.body;

	// corrigir query e parâmetros
	db.query('SELECT * FROM usuarios WHERE email = ?', [email], (err, results) => {
		if(err) {
			console.error('DB SELECT ERROR:', err);
			return res.status(500).json({ message: 'Erro no servidor.' });
		}
		if(!results || results.length === 0) {
			return res.status(401).json({ message: 'Credenciais inválidas.' });
		}
		const usuario = results[0];

		// comparar senha com hash
		bcrypt.compare(senha, usuario.senha, (compareErr, isMatch) => {
			if (compareErr) {
				console.error('BCRYPT ERROR:', compareErr);
				return res.status(500).json({ message: 'Erro no servidor.' });
			}
			if (!isMatch) {
				return res.status(401).json({ message: 'Credenciais inválidas.' });
			}
			// ajustar retorno para usar colunas do schema
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
