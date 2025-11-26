import { listarChamados } from '../../api/ticketsApi.js';

let chamados = [];

const tbody = document.getElementById
	? document.getElementById('tickets-tbody') // em alguns ambientes o script pode ser carregado antes do DOM
	: null;

document.addEventListener('DOMContentLoaded', () => {
	// Seleções seguras após DOM
	const tBodyEl = document.getElementById('tickets-tbody');
	const filtroBusca = document.getElementById('filtro-busca');
	const filtroStatus = document.getElementById('filtro-status');

	// Inicializar referências locais
	if (tBodyEl) {
		// carregar dados e ligar eventos
		carregarChamados();
		if (filtroBusca) filtroBusca.addEventListener('input', aplicarFiltros);
		if (filtroStatus) filtroStatus.addEventListener('change', aplicarFiltros);
	}
});

async function carregarChamados() {
	try {
		const res = await listarChamados(); // { chamados: [...] }
		chamados = res.chamados || [];
		renderizarTabela(chamados);
	} catch (err) {
		console.error('Erro ao carregar chamados:', err);
		const tb = document.getElementById('tickets-tbody');
		if (tb) tb.innerHTML = '<tr><td colspan="7">Erro ao carregar chamados.</td></tr>';
	}
}

function renderizarTabela(lista) {
	const tb = document.getElementById('tickets-tbody');
	if (!tb) return;

	if (!lista || lista.length === 0) {
		tb.innerHTML = '<tr><td colspan="7">Nenhum chamado encontrado.</td></tr>';
		return;
	}

	tb.innerHTML = lista.map(c => {
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
				<td>${escapeHtml(c.nome_unidade || '')}</td>
				<td>${escapeHtml(c.tecnico_responsavel || 'Não atribuído')}</td>
				<td><span class="badge-prioridade prioridade-${prioridadeClass}">${escapeHtml(c.prioridade || '')}</span></td>
				<td><span class="badge-status">${escapeHtml(c.status_chamado || '')}</span></td>
			</tr>
		`;
	}).join('');
}

function aplicarFiltros() {
	const buscaEl = document.getElementById('filtro-busca');
	const statusEl = document.getElementById('filtro-status');
	const termo = (buscaEl && buscaEl.value ? buscaEl.value.toLowerCase().trim() : '');
	const status = (statusEl && statusEl.value ? statusEl.value : '');

	const filtrados = chamados.filter(c => {
		const concat = `${c.resumo || ''} ${c.descricao || ''} ${c.nome_solicitante || ''} ${c.tecnico_responsavel || ''} ${(c.tipo_solicitacao || c.nome_tipo || '')}`.toLowerCase();
		const matchTermo = termo === '' || concat.includes(termo);
		const matchStatus = !status || c.status_chamado === status;
		return matchTermo && matchStatus;
	});

	renderizarTabela(filtrados);
}

// Utilitário para evitar XSS na exibição
function escapeHtml(str) {
	if (str === null || str === undefined) return '';
	return String(str)
		.replace(/&/g, '&amp;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;');
}
