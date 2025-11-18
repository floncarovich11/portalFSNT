import { 
    listarChamados, 
    atribuirTecnico, 
    atualizarStatus, 
    atualizarPrioridade,  // ✅ Importar nova função
    deletarChamado 
} from '../../api/ticketsApi.js';

const CURRENT_USER_ID = 1; // ajuste conforme seu contexto (usuário logado)

let chamados = []; // cache
let tecnicos = [];
let ticketAtual = null;

// DOM
const tbody = document.getElementById('tickets-tbody');
const filtroBusca = document.getElementById('filtro-busca');
const filtroStatus = document.getElementById('filtro-status');
const modal = document.getElementById('modal-editar');
const editResumo = document.getElementById('edit-resumo');
const editSolicitante = document.getElementById('edit-solicitante');
const editStatus = document.getElementById('edit-status');
const editPrioridade = document.getElementById('edit-prioridade');
const editTecnico = document.getElementById('edit-tecnico');
const editObservacoes = document.getElementById('edit-observacoes');

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    carregarTecnicos();
    carregarChamados();
    filtroBusca.addEventListener('input', aplicarFiltros);
    filtroStatus.addEventListener('change', aplicarFiltros);
});

// Carregar chamados do backend
async function carregarChamados() {
    try {
        const res = await listarChamados(); // { chamados: [...] }
        chamados = res.chamados || [];
        renderizarTabela(chamados);
    } catch (err) {
        console.error('Erro ao carregar chamados:', err);
        tbody.innerHTML = '<tr><td colspan="7">Erro ao carregar chamados.</td></tr>';
    }
}

// Carregar técnicos do backend (rota /tickets/tecnicos)
async function carregarTecnicos() {
    try {
        const res = await fetch('http://localhost:3000/tickets/tecnicos');
        if (!res.ok) throw new Error('Erro ao buscar técnicos');
        const data = await res.json();
        tecnicos = data.tecnicos || [];
        preencherTecnicosNoModal();
    } catch (err) {
        console.error('Erro ao carregar técnicos:', err);
    }
}

// Renderizar tabela de chamados
function renderizarTabela(lista) {
    if (!lista || lista.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7">Nenhum chamado encontrado.</td></tr>';
        return;
    }

    tbody.innerHTML = lista.map(c => {
        // Determinar tipo/ícone (mesma lógica usada em dashboardADM.js)
        const tipoSolicitacao = (c.tipo_solicitacao || c.nome_tipo || '-');
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

        // ✅ Adicionar classes de prioridade para estilização
        const prioridadeClass = (c.prioridade || '').toLowerCase().replace('é', 'e');

        return `
        <tr data-id="${c.id_chamado}">
            <td>
                <div class="tipo-icon" style="display:flex;align-items:center;gap:8px;">
                    ${tipoIcon}
                    <span class="tipo-text">${escapeHtml(tipoSolicitacao)}</span>
                </div>
            </td>
            <td title="${escapeHtml(c.descricao || '')}">${escapeHtml(c.resumo || '')}</td>
            <td>${escapeHtml(c.nome_solicitante || '')}</td>
            <td>${escapeHtml(c.tecnico_responsavel || 'Não atribuído')}</td>
            <td><span class="badge-prioridade prioridade-${prioridadeClass}">${escapeHtml(c.prioridade || '')}</span></td>
            <td><span class="badge-status">${escapeHtml(c.status_chamado || '')}</span></td>
            <td>
                <button class="btn-edit" data-id="${c.id_chamado}" title="Editar chamado">
                    <i class="fa-solid fa-pen-to-square"></i>
                    Editar
                </button>
                <button class="btn-delete" data-id="${c.id_chamado}" title="Deletar chamado">
                    <i class="fa-solid fa-trash"></i>
                    Deletar
                </button>
            </td>
        </tr>
    `;
    }).join('');

    document.querySelectorAll('.btn-edit').forEach(btn => btn.addEventListener('click', abrirModalHandler));
    document.querySelectorAll('.btn-delete').forEach(btn => btn.addEventListener('click', deletarHandler));
}

// Filtros (client-side)
function aplicarFiltros() {
    const termo = (filtroBusca.value || '').toLowerCase().trim();
    const status = filtroStatus.value;

    const filtrados = chamados.filter(c => {
        const concat = `${c.resumo || ''} ${c.descricao || ''} ${c.nome_solicitante || ''} ${c.tecnico_responsavel || ''} ${(c.tipo_solicitacao || c.nome_tipo || '')}`.toLowerCase();
        const matchTermo = termo === '' || concat.includes(termo);
        const matchStatus = !status || c.status_chamado === status;
        return matchTermo && matchStatus;
    });

    renderizarTabela(filtrados);
}

// Abrir modal para edição
function abrirModalHandler(e) {
    const id = e.currentTarget.getAttribute('data-id');
    const ticket = chamados.find(t => String(t.id_chamado) === String(id));
    if (!ticket) return alert('Chamado não encontrado.');
    
    ticketAtual = ticket;
    preencherModal(ticket);
    abrirModal();
}

// Preencher modal com dados do ticket
function preencherModal(ticket) {
    editResumo.value = ticket.resumo || '';
    editSolicitante.value = ticket.nome_solicitante || '';
    editStatus.value = ticket.status_chamado || 'Aberto';
    editPrioridade.value = ticket.prioridade || 'Média';
    editObservacoes.value = ticket.observacoes_tecnico || '';

    preencherTecnicosNoModal();

    // Selecionar técnico atual (por email se disponível na lista)
    const atual = tecnicos.find(t => 
        String(t.id_usuario) === String(ticket.id_tecnico_responsavel) || 
        t.nome_completo === ticket.tecnico_responsavel
    );
    if (atual) editTecnico.value = atual.email;
    else editTecnico.value = '';
}

function preencherTecnicosNoModal() {
    if (!editTecnico) return;
    
    const options = ['<option value="">Não atribuído</option>']
        .concat(tecnicos.map(t => 
            `<option value="${escapeHtml(t.email)}">${escapeHtml(t.nome_completo)} — ${escapeHtml(t.email)} (${escapeHtml(t.nome_unidade)})</option>`
        ))
        .join('');
    
    editTecnico.innerHTML = options;
}

function abrirModal() {
    if (!modal) return;
    modal.style.display = 'block';
}

function fecharModal() {
    if (!modal) return;
    modal.style.display = 'none';
    ticketAtual = null;
}

// ✅ Salvar edição - ATUALIZADO COM LÓGICA SEPARADA PARA PRIORIDADE
window.salvarEdicao = async function salvarEdicao() {
    if (!ticketAtual) return;

    const id = ticketAtual.id_chamado;
    const novoStatus = editStatus.value;
    const novaPrioridade = editPrioridade.value;
    const novoTecnicoEmail = editTecnico.value; // pode ser ''
    const observacoes = editObservacoes.value;

    try {
        // 1️⃣ Verificar se a PRIORIDADE mudou
        const prioridadeMudou = ticketAtual.prioridade !== novaPrioridade;
        
        // 2️⃣ Se técnico escolhido e diferente do atual -> atribuir
        if (novoTecnicoEmail && novoTecnicoEmail !== '') {
            const tecnicoAtual = tecnicos.find(t => 
                String(t.id_usuario) === String(ticketAtual.id_tecnico_responsavel)
            );
            const emailAtual = tecnicoAtual ? tecnicoAtual.email : '';
            
            if (novoTecnicoEmail !== emailAtual) {
                await atribuirTecnico(id, { 
                    email_tecnico: novoTecnicoEmail, 
                    id_usuario: CURRENT_USER_ID 
                });
            }
        }

        // 3️⃣ Atualizar STATUS (se mudou)
        const statusMudou = ticketAtual.status_chamado !== novoStatus;
        if (statusMudou || observacoes !== (ticketAtual.observacoes_tecnico || '')) {
            await atualizarStatus(id, { 
                status_chamado: novoStatus, 
                id_usuario: CURRENT_USER_ID, 
                observacoes_tecnico: observacoes 
            });
        }

        // 4️⃣ Atualizar PRIORIDADE separadamente (se mudou)
        if (prioridadeMudou) {
            await atualizarPrioridade(id, novaPrioridade, CURRENT_USER_ID);
        }

        // 5️⃣ Recarregar dados e fechar modal
        await carregarChamados();
        fecharModal();
        alert('Alterações salvas com sucesso!');
        
    } catch (err) {
        console.error('Erro ao salvar edição:', err);
        alert('Erro ao salvar alterações. Veja o console para mais detalhes.');
    }
};

// Deletar chamado
async function deletarHandler(e) {
    const id = e.currentTarget.getAttribute('data-id');
    if (!confirm('Deseja realmente deletar este chamado?')) return;

    try {
        await deletarChamado(id);
        await carregarChamados();
        alert('Chamado deletado.');
    } catch (err) {
        console.error('Erro ao deletar chamado:', err);
        alert('Erro ao deletar chamado.');
    }
}

// Fechar modal ao clicar fora
window.fecharModal = fecharModal;
window.addEventListener('click', (ev) => {
    if (ev.target === modal) fecharModal();
});

// Utilitário para evitar XSS na exibição
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}