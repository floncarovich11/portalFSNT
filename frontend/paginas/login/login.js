document.addEventListener('DOMContentLoaded', async () => {
	// carregar módulo de autenticação dinamicamente para evitar "import outside module"
	let authApi;
	try {
		authApi = await import('../../api/authApi.js');
	} catch (err) {
		console.error('Falha ao carregar authApi:', err);
		alert('Erro interno: não foi possível carregar recursos de autenticação.');
		return;
	}

	const loginForm = document.getElementById('loginForm');
	if (!loginForm) {
		console.error('Elemento #loginForm não encontrado no DOM.');
		return;
	}

	loginForm.addEventListener('submit', async (e) => {
		e.preventDefault();

		const emailEl = document.getElementById('email');
		const senhaEl = document.getElementById('senha');

		if (!emailEl || !senhaEl) {
			alert('Campos de login não encontrados.');
			return;
		}

		const email = emailEl.value;
		const senha = senhaEl.value;

		try {
			const data = await authApi.login({ email, senha }); // retorna { token, usuario? }

			if (data && data.token) {
				// salvar apenas o token
				localStorage.setItem('token', data.token);
				// NÃO salvar data.usuario no localStorage para proteger dados do usuário

				// decodificar token para obter tipo e redirecionar
				const payload = authApi.parseJwt(data.token) || {};
				const tipoUsuario = payload.tipo_usuario || payload.tipoUsuario || (data.usuario && data.usuario.tipo_usuario) || 'Funcionario';

				let destino = '../abrirTicket/abrirTicket.html';
				switch(tipoUsuario) {
					case 'Administrador': destino = '../dashboardADM/dashboardADM.html'; break;
					case 'TI': destino = '../dashboardTI/dashboardTI.html'; break;
					case 'Funcionario': destino = '../abrirTicket/abrirTicket.html'; break;
					default: destino = '../abrirTicket/abrirTicket.html';
				}

				setTimeout(() => window.location.href = destino, 100);
			} else {
				alert('Resposta inválida do servidor ao autenticar.');
			}
		} catch (error) {
			console.error('Erro ao fazer login:', error);
			alert(error.message || 'Erro ao conectar com o servidor');
		}
	});
});