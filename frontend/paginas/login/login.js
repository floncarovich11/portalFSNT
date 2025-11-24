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
                
                // ========================================
                // REDIRECIONAMENTO BASEADO NO TIPO DE USUÁRIO
                // ========================================
                const tipoUsuario = data.usuario.tipo_usuario;
                console.log('🔍 Tipo de usuário:', tipoUsuario);
                
                let destino = '';
                
                switch(tipoUsuario) {
                    case 'Administrador':
                        destino = '../dashboardADM/dashboardADM.html';
                        console.log('👑 Redirecionando para Dashboard do Administrador');
                        break;
                    
                    case 'TI':
                        destino = '../dashboardTI/dashboardTI.html';
                        console.log('💻 Redirecionando para Dashboard de TI');
                        break;
                    
                    case 'Funcionario':
                        destino = '../abrirTicket/abrirTicket.html';
                        console.log('👤 Redirecionando para Abrir Ticket (Funcionário)');
                        break;
                    
                    default:
                        // Se o tipo não for reconhecido, redireciona para uma página padrão
                        destino = '../abrirTicket/abrirTicket.html';
                        console.log('⚠️ Tipo de usuário não reconhecido, redirecionando para página padrão');
                }
                
                // Pequeno delay para garantir que salvou
                setTimeout(() => {
                    console.log('🔄 Redirecionando para:', destino);
                    window.location.href = destino;
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