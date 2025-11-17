// =====================================================
// PERFIL.JS - INTEGRAÇÃO COMPLETA
// =====================================================

import { getUsuario, updatePerfil } from '../../api/authApi.js';

// Polyfill leve/fallback para Swal (evita ReferenceError durante carregamento)
// Não sobrescreve Swal real, apenas garante que existirá um objeto com métodos mínimos.
if (typeof window !== 'undefined' && typeof window.Swal === 'undefined') {
    window.Swal = {
        fire: (opts = {}) => {
            // Se for confirm dialog, usar confirm() síncrono e retornar um Promise compatível
            if (opts.showCancelButton) {
                const msg = (opts.title ? opts.title + '\n\n' : '') + (opts.text || '');
                const confirmed = confirm(msg);
                return Promise.resolve({ isConfirmed: !!confirmed });
            }
            // Caso simples: alert para erros/infos
            const msg = (opts.title ? opts.title + '\n\n' : '') + (opts.text || '');
            alert(msg);
            return Promise.resolve({});
        },
        showLoading: () => {},
        close: () => {}
    };
}

// Variáveis globais
let usuarioAtual = null;
let unidades = [];

// =====================================================
// INICIALIZAÇÃO
// =====================================================
document.addEventListener('DOMContentLoaded', async () => {
    // Verificar se usuário está logado
    const usuarioLogado = JSON.parse(localStorage.getItem('usuario'));
    
    if (!usuarioLogado || !usuarioLogado.id) {
        Swal.fire({
            icon: 'warning',
            title: 'Acesso negado',
            text: 'Você precisa estar logado para acessar esta página.',
            confirmButtonText: 'Ir para Login'
        }).then(() => {
            window.location.href = '/frontend/pages/login/login.html';
        });
        return;
    }

    // Carregar dados
    await carregarUnidades();
    await carregarDadosUsuario(usuarioLogado.id);
    
    // Event listeners
    document.getElementById('btnSalvar').addEventListener('click', salvarAlteracoes);
    document.getElementById('btnCancelar').addEventListener('click', cancelarAlteracoes);
    // Listener para sair
    const btnSair = document.getElementById('btnSair');
    if (btnSair) btnSair.addEventListener('click', logout);
    
    // Atualizar avatar quando nome mudar
    document.getElementById('nome').addEventListener('input', atualizarAvatarPreview);
});

// =====================================================
// CARREGAR UNIDADES
// =====================================================
async function carregarUnidades() {
    try {
        const response = await fetch('http://localhost:3000/unidades');
        
        if (!response.ok) {
            // tentar extrair mensagem de erro do corpo
            let errMsg = 'Erro ao carregar unidades';
            try {
                const errData = await response.json();
                if (errData && errData.message) errMsg = errData.message;
            } catch (e) {}
            throw new Error(errMsg);
         }
         
        const data = await response.json();
        console.log('Resposta /unidades (bruta):', data);
        
        // Normalizar formatos possíveis: array direto, ou { unidades: [...] }, ou { data: [...] }
        if (Array.isArray(data)) {
            unidades = data;
        } else if (Array.isArray(data.unidades)) {
            unidades = data.unidades;
        } else if (Array.isArray(data.data)) {
            unidades = data.data;
        } else {
            // se não reconhecido, tentar extrair valores de objeto como fallback
            unidades = Object.values(data).flat ? Object.values(data).flat() : [];
        }
        
        // Garantir que unidades é array
        if (!Array.isArray(unidades)) unidades = [];
         
         const selectUnidade = document.getElementById('unidade');
         selectUnidade.innerHTML = '<option value="">Selecione uma unidade</option>';
         
         unidades.forEach(unidade => {
             const option = document.createElement('option');
             option.value = unidade.id_unidade;
             option.textContent = unidade.nome_unidade;
             selectUnidade.appendChild(option);
         });
         
         console.log('Unidades carregadas:', unidades);
     } catch (error) {
         console.error('Erro ao carregar unidades:', error);
        // Usar Swal se disponível, caso contrário fallback para alert()
        if (window.Swal && typeof window.Swal.fire === 'function') {
            Swal.fire({
                icon: 'error',
                title: 'Erro',
                text: error.message || 'Não foi possível carregar as unidades.'
            });
        } else {
            alert('Erro: ' + (error.message || 'Não foi possível carregar as unidades'));
        }
     }
}

// =====================================================
// CARREGAR DADOS DO USUÁRIO
// =====================================================
async function carregarDadosUsuario(idUsuario) {
    try {
        // Mostrar loading
        document.getElementById('nomeUsuario').textContent = 'Carregando...';
        
        // Buscar dados do usuário
        usuarioAtual = await getUsuario(idUsuario);
        
        // Preencher campos do formulário
        document.getElementById('nome').value = usuarioAtual.nome_completo;
        document.getElementById('email').value = usuarioAtual.email;
        document.getElementById('unidade').value = usuarioAtual.id_unidade;
        
        // Atualizar header do perfil
        document.getElementById('nomeUsuario').textContent = usuarioAtual.nome_completo;
        document.getElementById('emailUsuario').textContent = usuarioAtual.email;
        document.getElementById('tipoUsuario').textContent = usuarioAtual.tipo_usuario;
        
        // Aplicar cor ao badge de tipo
        const badgeTipo = document.getElementById('tipoUsuario');
        if (usuarioAtual.tipo_usuario === 'Administrador') {
            badgeTipo.style.background = '#dc3545';
        } else if (usuarioAtual.tipo_usuario === 'TI') {
            badgeTipo.style.background = '#ffc107';
            badgeTipo.style.color = '#000';
        } else {
            badgeTipo.style.background = '#28a745';
        }
        
        // Atualizar avatar com iniciais
        atualizarAvatar(usuarioAtual.nome_completo);
        
        console.log('Dados do usuário carregados:', usuarioAtual);
    } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
        Swal.fire({
            icon: 'error',
            title: 'Erro',
            text: error.message || 'Não foi possível carregar seus dados.'
        });
    }
}

// =====================================================
// SALVAR ALTERAÇÕES
// =====================================================
async function salvarAlteracoes() {
    try {
        // Obter valores dos campos
        const nome = document.getElementById('nome').value.trim();
        const email = document.getElementById('email').value.trim();
        const unidade = document.getElementById('unidade').value;
        const senhaAtual = document.getElementById('senhaAtual').value;
        const novaSenha = document.getElementById('novaSenha').value;
        const confirmarSenha = document.getElementById('confirmarSenha').value;
        
        // Validações básicas
        if (!nome || !email || !unidade) {
            Swal.fire({
                icon: 'warning',
                title: 'Campos obrigatórios',
                text: 'Por favor, preencha nome, email e unidade.'
            });
            return;
        }
        
        // Validar email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            Swal.fire({
                icon: 'warning',
                title: 'Email inválido',
                text: 'Por favor, insira um email válido.'
            });
            return;
        }
        
        // Preparar dados para atualização
        const dadosAtualizacao = {
            nome_completo: nome,
            email: email,
            id_unidade: parseInt(unidade)
        };
        
        // Se usuário preencheu campos de senha
        if (senhaAtual || novaSenha || confirmarSenha) {
            // Validar se todos os campos de senha foram preenchidos
            if (!senhaAtual || !novaSenha || !confirmarSenha) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Senha incompleta',
                    text: 'Para alterar a senha, preencha todos os campos de senha.'
                });
                return;
            }
            
            // Validar se nova senha tem no mínimo 6 caracteres
            if (novaSenha.length < 6) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Senha muito curta',
                    text: 'A nova senha deve ter no mínimo 6 caracteres.'
                });
                return;
            }
            
            // Validar se senhas coincidem
            if (novaSenha !== confirmarSenha) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Senhas não coincidem',
                    text: 'A nova senha e a confirmação devem ser iguais.'
                });
                return;
            }
            
            // Adicionar senhas aos dados
            dadosAtualizacao.senha_atual = senhaAtual;
            dadosAtualizacao.nova_senha = novaSenha;
        }
        
        // Confirmar alterações
        const confirmacao = await Swal.fire({
            title: 'Confirmar alterações?',
            text: 'Deseja realmente salvar as alterações no seu perfil?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sim, salvar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#007bff'
        });
        
        if (!confirmacao.isConfirmed) {
            return;
        }
        
        // Mostrar loading
        Swal.fire({
            title: 'Salvando...',
            text: 'Por favor, aguarde.',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
        
        // Enviar atualização
        const usuarioLogado = JSON.parse(localStorage.getItem('usuario'));
        const resultado = await updatePerfil(usuarioLogado.id, dadosAtualizacao);
        
        // Atualizar localStorage com novos dados
        const usuarioAtualizado = {
            ...usuarioLogado,
            nome_completo: resultado.usuario.nome_completo,
            email: resultado.usuario.email,
            id_unidade: resultado.usuario.id_unidade
        };
        localStorage.setItem('usuario', JSON.stringify(usuarioAtualizado));
        
        // Limpar campos de senha
        document.getElementById('senhaAtual').value = '';
        document.getElementById('novaSenha').value = '';
        document.getElementById('confirmarSenha').value = '';
        
        // Recarregar dados
        await carregarDadosUsuario(usuarioLogado.id);
        
        // Mostrar sucesso
        Swal.fire({
            icon: 'success',
            title: 'Sucesso!',
            text: resultado.message || 'Perfil atualizado com sucesso!',
            confirmButtonText: 'OK'
        });
        
    } catch (error) {
        console.error('Erro ao salvar alterações:', error);
        Swal.fire({
            icon: 'error',
            title: 'Erro ao salvar',
            text: error.message || 'Não foi possível salvar as alterações.'
        });
    }
}

// =====================================================
// CANCELAR ALTERAÇÕES
// =====================================================
async function cancelarAlteracoes() {
    const confirmacao = await Swal.fire({
        title: 'Cancelar alterações?',
        text: 'Todas as alterações não salvas serão perdidas.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sim, cancelar',
        cancelButtonText: 'Continuar editando',
        confirmButtonColor: '#dc3545'
    });
    
    if (confirmacao.isConfirmed) {
        // Recarregar dados originais
        const usuarioLogado = JSON.parse(localStorage.getItem('usuario'));
        await carregarDadosUsuario(usuarioLogado.id);
        
        // Limpar campos de senha
        document.getElementById('senhaAtual').value = '';
        document.getElementById('novaSenha').value = '';
        document.getElementById('confirmarSenha').value = '';
        
        Swal.fire({
            icon: 'info',
            title: 'Cancelado',
            text: 'As alterações foram descartadas.',
            timer: 2000,
            showConfirmButton: false
        });
    }
}

// =====================================================
// LOGOUT
// =====================================================
function logout() {
    // Usar Swal se disponível, caso contrário fallback com confirm
    const ask = () => {
        if (window.Swal && typeof window.Swal.fire === 'function') {
            return Swal.fire({
                title: 'Sair',
                text: 'Deseja realmente sair da sua conta?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Sim, sair',
                cancelButtonText: 'Cancelar',
                confirmButtonColor: '#dc3545'
            });
        } else {
            const confirmed = confirm('Deseja realmente sair da sua conta?');
            return Promise.resolve({ isConfirmed: !!confirmed });
        }
    };

    ask().then(result => {
        if (result.isConfirmed) {
            // Remover dados do usuário e redirecionar
            localStorage.removeItem('usuario');
            // mostrar feedback rápido antes do redirect (opcional)
            if (window.Swal && typeof window.Swal.fire === 'function') {
                Swal.fire({
                    icon: 'success',
                    title: 'Desconectado',
                    text: 'Você foi deslogado.',
                    timer: 900,
                    showConfirmButton: false
                }).then(() => {
                    window.location.href = '/frontend/paginas/login/login.html';
                });
            } else {
                alert('Você foi deslogado.');
                window.location.href = '/frontend/paginas/login/login.html';
            }
        }
    });
}

// =====================================================
// FUNÇÕES DE AVATAR (simples, evitam erro de runtime)
// =====================================================
function atualizarAvatar(nome) {
    try {
        const avatarContainer = document.querySelector('.avatar-section .avatar-info');
        if (!avatarContainer) return;

        const initials = (nome || '')
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map(n => n[0].toUpperCase())
            .join('') || '?';

        let avatarEl = document.getElementById('avatarInitials');
        if (!avatarEl) {
            avatarEl = document.createElement('div');
            avatarEl.id = 'avatarInitials';
            // estilo inline mínimo para garantir visual sem depender do CSS externo
            avatarEl.style.display = 'inline-flex';
            avatarEl.style.alignItems = 'center';
            avatarEl.style.justifyContent = 'center';
            avatarEl.style.width = '64px';
            avatarEl.style.height = '64px';
            avatarEl.style.borderRadius = '50%';
            avatarEl.style.background = '#007bff';
            avatarEl.style.color = '#fff';
            avatarEl.style.fontWeight = '700';
            avatarEl.style.marginRight = '12px';
            avatarEl.style.fontSize = '20px';
            avatarEl.style.flex = '0 0 auto';
            avatarContainer.insertBefore(avatarEl, avatarContainer.firstChild);
        }

        avatarEl.textContent = initials;
    } catch (err) {
        console.warn('Erro ao atualizar avatar:', err);
    }
}

function atualizarAvatarPreview(e) {
    const nome = typeof e === 'string' ? e : (e?.target?.value || '');
    atualizarAvatar(nome);
}