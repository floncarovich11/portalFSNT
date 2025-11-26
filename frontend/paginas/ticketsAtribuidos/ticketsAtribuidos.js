import * as tiApi from '../../api/tiApi.js';

// =====================================================
// VARIÁVEIS GLOBAIS
// =====================================================
let todosTickets = [];
let ticketAtual = null;
let usuarioLogado = null;

// DOM (serão inicializados no DOMContentLoaded)
let tbody;
let filtroBusca;
let filtroStatus;
let filtroPrioridade;
let modal;
let viewResumo;
let viewDescricao;
let viewSolicitante;
let viewTipo;
let editStatus;
let editPrioridade;
let editObservacoes;

// =====================================================
// INICIALIZAÇÃO
// =====================================================
document.addEventListener('DOMContentLoaded', () => {
    // Seleções do DOM (apenas depois do load)
    tbody = document.getElementById('tickets-tbody');
    filtroBusca = document.getElementById('filtro-busca');
    filtroStatus = document.getElementById('filtro-status');
    filtroPrioridade = document.getElementById('filtro-prioridade');
    modal = document.getElementById('modal-ticket');
    viewResumo = document.getElementById('view-resumo');
    viewDescricao = document.getElementById('view-descricao');
    viewSolicitante = document.getElementById('view-solicitante');
    viewTipo = document.getElementById('view-tipo');
    editStatus = document.getElementById('edit-status');
    editPrioridade = document.getElementById('edit-prioridade');
    editObservacoes = document.getElementById('edit-observacoes');

    // Manter aparência normal, mas impedir abertura/edição pelo técnico
    if (editPrioridade) {
        editPrioridade.classList.add('no-arrow-select');
        // Evita abrir o dropdown com clique
        editPrioridade.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
        });
        // Evita abrir/alterar via teclado (setas, espaço, enter)
        editPrioridade.addEventListener('keydown', (e) => {
            const blocked = ['ArrowDown', 'ArrowUp', 'Enter', ' ', 'Spacebar'];
            if (blocked.includes(e.key)) e.preventDefault();
        });
        // Se receber foco por qualquer motivo, remove foco imediatamente
        editPrioridade.addEventListener('focus', () => editPrioridade.blur());
        editPrioridade.title = 'Prioridade definida pelo sistema';
    }

    verificarAutenticacao();
    inicializarEventos();
    carregarTickets();
});

// =====================================================
// VERIFICAR AUTENTICAÇÃO
// =====================================================
function verificarAutenticacao() {
    const usuarioStorage = localStorage.getItem('usuario');

    if (!usuarioStorage) {
        console.error('❌ Usuário não autenticado');
        alert('Você precisa fazer login primeiro!');
        window.location.href = '../login/login.html';
        return;
    }

    try {
        usuarioLogado = JSON.parse(usuarioStorage);

        // Normalizar id
        if (usuarioLogado.id && !usuarioLogado.id_usuario) {
            usuarioLogado.id_usuario = usuarioLogado.id;
        }

        console.log('✅ Usuário autenticado:', usuarioLogado);
        console.log('🔑 ID do usuário:', usuarioLogado.id_usuario);

        if (usuarioLogado.tipo_usuario !== 'TI') {
            alert('Acesso negado! Apenas técnicos de TI podem acessar esta página.');
            window.location.href = '../login/login.html';
            return;
        }
    } catch (error) {
        console.error('❌ Erro ao parsear usuário:', error);
        localStorage.removeItem('usuario');
        window.location.href = '../login/login.html';
    }
}

// =====================================================
// INICIALIZAR EVENTOS
// =====================================================
function inicializarEventos() {
    if (filtroBusca) filtroBusca.addEventListener('input', aplicarFiltros);
    if (filtroStatus) filtroStatus.addEventListener('change', aplicarFiltros);
    if (filtroPrioridade) filtroPrioridade.addEventListener('change', aplicarFiltros);

    // Fechar modal ao clicar fora
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) fecharModal();
        });
    }

    // fechar com Esc
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (modal && (modal.classList.contains('active') || modal.style.display === 'block')) {
                fecharModal();
            }
        }
    });
}

// =====================================================
// CARREGAR TICKETS DO TÉCNICO
// =====================================================
async function carregarTickets() {
    try {
        if (!usuarioLogado || !usuarioLogado.id_usuario) {
            console.warn('Usuário não inicializado ainda - revalidando...');
            verificarAutenticacao();
            if (!usuarioLogado || !usuarioLogado.id_usuario) return;
        }

        console.log('🔄 Carregando tickets do técnico:', usuarioLogado.id_usuario);

        mostrarLoading(true);

        const response = await tiApi.listarMeusChamados(usuarioLogado.id_usuario);

        console.log('✅ Tickets recebidos:', response);

        todosTickets = response.chamados || [];

        renderizarTickets(todosTickets);

    } catch (error) {
        console.error('❌ Erro ao carregar tickets:', error);
        mostrarErro('Erro ao carregar tickets. Tente novamente.');
    } finally {
        mostrarLoading(false);
    }
}

// =====================================================
// RENDERIZAR TICKETS NA TABELA
// =====================================================
function renderizarTickets(tickets) {
    if (!tbody) return;

    if (!tickets || tickets.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 2rem; color: #666;">
                    <i class="fa-solid fa-inbox" style="font-size: 2rem; margin-bottom: 0.5rem; display: block;"></i>
                    Nenhum ticket encontrado
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = tickets.map(ticket => {
        // Determinar ícone do tipo de solicitação
        const tipoSolicitacao = (ticket.tipo_solicitacao || ticket.nome_tipo || '-');
        const tipo = String(tipoSolicitacao).toLowerCase();
        const tipoIcon =
            tipo.includes('computador') ? '<i class="fa-solid fa-desktop"></i>' :
            tipo.includes('impressora') ? '<i class="fa-solid fa-print"></i>' :
            tipo.includes('rede') || tipo.includes('internet') ? '<i class="fa-solid fa-wifi"></i>' :
            tipo.includes('software') || tipo.includes('sistema') ? '<i class="fa-solid fa-code"></i>' :
            tipo.includes('hardware') ? '<i class="fa-solid fa-microchip"></i>' :
            tipo.includes('e-mail') || tipo.includes('email') ? '<i class="fa-solid fa-envelope"></i>' :
            tipo.includes('telefonia') || tipo.includes('telefone') ? '<i class="fa-solid fa-phone"></i>' :
            '<i class="fa-solid fa-ticket"></i>';

        // Classes CSS para prioridade e status
        const prioridadeClass = String((ticket.prioridade || 'Média')).toLowerCase().replace('é', 'e');
        const statusClass = String((ticket.status_chamado || 'Aberto')).toLowerCase().replace(/ /g, '-');

        return `
            <tr data-id="${ticket.id_chamado}">
                <td>
                    <div class="tipo-icon" style="display:flex;align-items:center;gap:8px;">
                        ${tipoIcon}
                        <span class="tipo-text">${escapeHtml(tipoSolicitacao)}</span>
                    </div>
                </td>
                <td title="${escapeHtml(ticket.descricao || '')}">
                    <strong>${escapeHtml(ticket.resumo || '')}</strong>
                </td>
                <td>${escapeHtml(ticket.nome_solicitante || '')}</td>
                <td>${escapeHtml(ticket.nome_unidade || '')}</td>
                <td>
                    <span class="badge-prioridade prioridade-${prioridadeClass}">${escapeHtml(ticket.prioridade || '')}</span>
                </td>
                <td>
                    <span class="badge-status badge-${statusClass}">${escapeHtml(ticket.status_chamado || '')}</span>
                </td>
                <td>${formatarData(ticket.data_abertura)}</td>
                <td>
                    <button class="btn-edit" data-id="${ticket.id_chamado}" title="Visualizar/Editar" onclick="visualizarTicket(${ticket.id_chamado})">
                        <i class="fa-solid fa-pen-to-square"></i> Editar
                    </button>
                    ${ticket.status_chamado !== 'Resolvido' && ticket.status_chamado !== 'Cancelado' ? `
                        
                        
                    ` : ''}
                </td>
            </tr>
        `;
    }).join('');
}

// =====================================================
// VISUALIZAR TICKET (ABRIR MODAL)
// =====================================================
window.visualizarTicket = async function(idChamado) {
    try {
        console.log('🔍 Visualizando ticket:', idChamado);

        mostrarLoading(true);

        const response = await tiApi.visualizarChamado(idChamado);
        ticketAtual = response.chamado;

        if (!ticketAtual) {
            mostrarErro('Detalhes do ticket não encontrados.');
            return;
        }

        console.log('✅ Detalhes do ticket:', ticketAtual);

        // Preencher campos do modal (usar elementos já selecionados)
        if (viewResumo) viewResumo.value = ticketAtual.resumo || '';
        if (viewDescricao) viewDescricao.value = ticketAtual.descricao || '';
        if (viewSolicitante) viewSolicitante.value = `${ticketAtual.nome_solicitante || '-'}${ticketAtual.email_solicitante ? ' (' + ticketAtual.email_solicitante + ')' : ''}`;
        if (viewTipo) viewTipo.value = ticketAtual.tipo_solicitacao || '';
        if (editStatus) editStatus.value = ticketAtual.status_chamado || 'Aberto';
        if (editPrioridade) editPrioridade.value = ticketAtual.prioridade || 'Média';
        if (editObservacoes) editObservacoes.value = ticketAtual.observacoes_tecnico || '';

        // Abrir modal (compatível com CSS que usa display:none)
        if (modal) {
            modal.classList.add('active');
            modal.style.display = 'flex';
        }

    } catch (error) {
        console.error('❌ Erro ao visualizar ticket:', error);
        mostrarErro('Erro ao carregar detalhes do ticket.');
    } finally {
        mostrarLoading(false);
    }
};

// =====================================================
// SALVAR ALTERAÇÕES
// =====================================================
window.salvarAlteracoes = async function() {
    if (!ticketAtual) {
        mostrarErro('Nenhum ticket selecionado.');
        return;
    }

    try {
        const novoStatus = editStatus ? editStatus.value : (ticketAtual.status_chamado || '');
        const novaPrioridade = editPrioridade ? editPrioridade.value : (ticketAtual.prioridade || '');
        const novasObservacoes = editObservacoes ? editObservacoes.value : (ticketAtual.observacoes_tecnico || '');

        console.log('💾 Salvando alterações:', {
            id_chamado: ticketAtual.id_chamado,
            status_chamado: novoStatus,
            prioridade: novaPrioridade,
            observacoes_tecnico: novasObservacoes
        });

        mostrarLoading(true);

        // Atualizar via API (preserva id_tecnico como o técnico logado)
        await tiApi.atualizarChamado(ticketAtual.id_chamado, {
            status_chamado: novoStatus,
            observacoes_tecnico: novasObservacoes,
            id_tecnico: usuarioLogado.id_usuario
        });

        console.log('✅ Ticket atualizado com sucesso!');

        mostrarSucesso('Ticket atualizado com sucesso!');

        fecharModal();

        // Recarregar tickets
        await carregarTickets();

    } catch (error) {
        console.error('❌ Erro ao salvar alterações:', error);
        mostrarErro('Erro ao salvar alterações. Tente novamente.');
    } finally {
        mostrarLoading(false);
    }
};

// =====================================================
// RESOLVER RÁPIDO
// =====================================================
window.resolverRapido = async function(idChamado) {
    if (!confirm('Tem certeza que deseja marcar este ticket como Resolvido?')) {
        return;
    }

    try {
        console.log('✅ Resolvendo ticket:', idChamado);

        mostrarLoading(true);

        await tiApi.resolverChamado(idChamado, null, usuarioLogado.id_usuario);

        console.log('✅ Ticket resolvido com sucesso!');

        mostrarSucesso('Ticket resolvido com sucesso!');

        // Recarregar tickets
        await carregarTickets();

    } catch (error) {
        console.error('❌ Erro ao resolver ticket:', error);
        mostrarErro('Erro ao resolver ticket. Tente novamente.');
    } finally {
        mostrarLoading(false);
    }
};

// =====================================================
// FECHAR MODAL
// =====================================================
window.fecharModal = function() {
    if (modal) {
        modal.classList.remove('active');
        modal.style.display = 'none';
    }
    ticketAtual = null;

    // Garantir que qualquer indicador de loading seja removido ao fechar o modal
    // (por exemplo, quando o usuário abre o modal e fecha sem salvar)
    mostrarLoading(false);
};

// =====================================================
// APLICAR FILTROS
// =====================================================
function aplicarFiltros() {
    const busca = (filtroBusca && filtroBusca.value ? filtroBusca.value.toLowerCase() : '');
    const status = (filtroStatus && filtroStatus.value ? filtroStatus.value : '');
    const prioridade = (filtroPrioridade && filtroPrioridade.value ? filtroPrioridade.value : '');

    const ticketsFiltrados = todosTickets.filter(ticket => {
        const resumo = (ticket.resumo || '').toLowerCase();
        const descricao = (ticket.descricao || '').toLowerCase();
        const solicitante = (ticket.nome_solicitante || '').toLowerCase();

        const matchBusca = !busca ||
            resumo.includes(busca) ||
            descricao.includes(busca) ||
            solicitante.includes(busca);

        const matchStatus = !status || ticket.status_chamado === status;
        const matchPrioridade = !prioridade || ticket.prioridade === prioridade;

        return matchBusca && matchStatus && matchPrioridade;
    });

    renderizarTickets(ticketsFiltrados);
}

// =====================================================
// FUNÇÕES AUXILIARES
// =====================================================
function formatarData(dataString) {
    if (!dataString) return '-';

    const data = new Date(dataString);
    if (isNaN(data.getTime())) return '-';

    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const ano = data.getFullYear();
    const hora = String(data.getHours()).padStart(2, '0');
    const min = String(data.getMinutes()).padStart(2, '0');

    return `${dia}/${mes}/${ano} ${hora}:${min}`;
}

function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function mostrarLoading(show) {
    if (!tbody) return;

    if (show) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 2rem;">
                    <i class="fa-solid fa-spinner fa-spin" style="font-size: 2rem; color: #398414;"></i>
                    <p style="margin-top: 0.5rem; color: #666;">Carregando tickets...</p>
                </td>
            </tr>
        `;
    } else {
        // Limpa o indicador de loading. Se já tivermos tickets em memória, re-renderiza-os;
        // caso contrário limpa o tbody.
        if (Array.isArray(todosTickets) && todosTickets.length > 0) {
            renderizarTickets(todosTickets);
        } else {
            tbody.innerHTML = '';
        }
    }
}

function mostrarErro(mensagem) {
    alert('❌ ' + mensagem);
}

function mostrarSucesso(mensagem) {
    alert('✅ ' + mensagem);
}
