import { meusChamados } from '../../api/ticketsApi.js';
import { getCurrentUserFromToken } from '../../api/authApi.js';

document.addEventListener('DOMContentLoaded', async () => {
    console.log('📄 Página Meus Tickets carregada.');

    const usuario = getCurrentUserFromToken();
    console.log('👤 Usuário (do token):', usuario);

    const idUsuario = usuario && (usuario.id_usuario || usuario.id);
    if (!idUsuario) {
        alert('Usuário não autenticado. Faça login novamente.');
        window.location.href = '../login/login.html';
        return;
    }

    const tbody = document.getElementById('tickets-tbody');
    if (!tbody) {
        console.error('❌ Elemento #tickets-tbody não encontrado no HTML.');
        return;
    }

    try {
        console.log(`🔍 Buscando tickets do usuário ID ${idUsuario}...`);

        const data = await meusChamados(idUsuario); // usa auth headers

        console.log('📦 Tickets recebidos:', data);

        const tickets = Array.isArray(data) ? data : data.chamados || [];

        tbody.innerHTML = '';

        if (tickets.length === 0) {
            tbody.innerHTML = `
                <tr><td colspan="6" style="text-align:center;">Nenhum ticket encontrado.</td></tr>
            `;
            return;
        }

        tickets.forEach(ticket => {
            const tr = document.createElement('tr');

            // Ícone conforme tipo da solicitação
            // Detectar ícone pelo tipo da solicitação
            const tipo = (ticket.tipo_solicitacao || '').toLowerCase();
            const tipoIcon =
                tipo.includes('computador') ? '<i class="fa-solid fa-computer"></i>' :
                tipo.includes('impressora') ? '<i class="fa-solid fa-print"></i>' :
                tipo.includes('rede') || tipo.includes('internet') ? '<i class="fa-solid fa-wifi"></i>' :
                tipo.includes('software') || tipo.includes('sistema') ? '<i class="fa-solid fa-code"></i>' :
                tipo.includes('hardware') ? '<i class="fa-solid fa-microchip"></i>' :
                tipo.includes('e-mail') || tipo.includes('email') ? '<i class="fa-solid fa-envelope"></i>' :
                tipo.includes('telefonia') || tipo.includes('telefone') ? '<i class="fa-solid fa-phone"></i>' :
                '<i class="fa-solid fa-ticket"></i>';


            // Status com classe de cor correta
            const status = (ticket.status_chamado || '').toLowerCase();
            const statusClass =
                status === 'aberto' ? 'status-aberto' :
                status === 'em andamento' ? 'status-em-andamento' :
                status === 'aguardando resposta' ? 'status-aguardando' :
                status === 'resolvido' ? 'status-resolvido' :
                status === 'cancelado' ? 'status-cancelado' :
                'status-desconhecido';

            tr.innerHTML = `
                <td>
                    <div class="tipo-icon">${tipoIcon}</div>
                </td>
                <td>${ticket.resumo || 'Sem título'}</td>
                <td><span class="status-badge ${statusClass}">${ticket.status_chamado || 'Desconhecido'}</span></td>
                <td>${ticket.nome_solicitante || usuario.nome_completo || 'Desconhecido'}</td>
                <td>${ticket.tecnico_responsavel || 'Aguardando'}</td>
                <td>${ticket.prioridade || 'Normal'}</td>
            `;

            tbody.appendChild(tr);
        });

    } catch (error) {
        console.error('💥 Erro ao buscar tickets:', error);
        alert('Erro ao buscar tickets. Verifique sua conexão ou tente novamente.');
    }
});
