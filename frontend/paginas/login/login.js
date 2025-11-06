document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;

    try {
        const response = await fetch('http://localhost:3000/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, senha })
        });

        const data = await response.json();

        if (response.ok) {
            console.log('✅ Login bem-sucedido:', data);
            
            // Verificar se o backend retornou os dados do usuário
            if (data.usuario) {
                console.log('💾 Salvando usuário no localStorage:', data.usuario);
                
                // Salvar no localStorage
                localStorage.setItem('usuario', JSON.stringify(data.usuario));
                
                // VERIFICAR se salvou corretamente
                const usuarioSalvo = localStorage.getItem('usuario');
                console.log('✔️ Verificação - Usuário salvo:', usuarioSalvo);
                
                if (!usuarioSalvo) {
                    alert('Erro ao salvar dados do usuário. Tente novamente.');
                    return;
                }
                
                // Pequeno delay para garantir que salvou
                setTimeout(() => {
                    console.log('🔄 Redirecionando...');
                    window.location.href = '../abrirTicket/abrirTicket.html';
                }, 100);
                
            } else {
                console.error('❌ Backend não retornou dados do usuário:', data);
                alert('Erro: Dados do usuário não foram retornados pelo servidor.');
            }
        } else {
            alert(data.message || 'Erro ao fazer login');
        }
    } catch (error) {
        console.error('💥 Erro:', error);
        alert('Erro ao conectar com o servidor');
    }
});