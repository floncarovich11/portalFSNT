document.getElementById('cadastroForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const nome = document.getElementById('nome').value.trim();
    const unidade = document.getElementById('unidade').value; // agora vem do select (1..4)
    const email = document.getElementById('email').value.trim();
    const senha = document.getElementById('senha').value;
    const confirmarSenha = document.getElementById('confirmarSenha').value;

    // Validação simples
    if (senha !== confirmarSenha) {
        alert('As senhas não coincidem.');
        return;
    }

    if (!nome || !unidade || !email || !senha) {
        alert('Por favor, preencha todos os campos.');
        return;
    }

    // validar unidade selecionada
    if (!['1','2','3','4'].includes(unidade)) {
        alert('Selecione uma unidade válida.');
        return;
    }
    
    try {
        // chamar endpoint do backend
        const response = await fetch('http://localhost:3000/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            // enviar nome_completo e id_unidade (ou unidade como string; backend resolve)
            body: JSON.stringify({ nome: nome, unidade: Number(unidade), email, senha })
        });

        const data = await response.json();

        if (response.ok) {
            alert('Cadastro realizado com sucesso!');
            // redirecionar para página de login local (arquivo estático)
            window.location.href = '../login/login.html';
        } else {
            alert(data.message || 'Erro ao cadastrar. Tente novamente.');
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao conectar com o servidor.');
    }
});

// Nenhuma mudança de style; preservado como está
