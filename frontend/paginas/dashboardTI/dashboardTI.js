import * as tiApi from '../../api/tiApi.js';
import { getCurrentUserFromToken } from '../../api/authApi.js';

// ===================================
// CONFIGURAÇÕES E ESTADO GLOBAL
// ===================================
let idTecnicoLogado = null;
let chamados = [];

console.log('📂 Script dashboardTI.js carregado');

// ===================================
// INICIALIZAÇÃO
// ===================================
document.addEventListener('DOMContentLoaded', async () => {
    // Pegar dados do usuário do token
    const usuarioPayload = getCurrentUserFromToken();
    if (!usuarioPayload) {
        console.error('Usuário não identificado - redirecionando para login');
        window.location.href = '../login/login.html';
        return;
    }

    try {
        const usuario = usuarioPayload;
        idTecnicoLogado = usuario.id_usuario || usuario.id || usuario.idUsuario || usuario.user_id;

        if (!idTecnicoLogado) {
            console.error('❌ ID do técnico não encontrado no token');
            alert('Erro ao identificar usuário. Por favor, faça login novamente.');
            window.location.href = '../login/login.html';
            return;
        }

        const tipoUsuario = usuario.tipo_usuario || usuario.tipo || usuario.tipoUsuario;
        if (tipoUsuario !== 'TI' && tipoUsuario !== 'Administrador') {
            alert('Acesso negado. Você não tem permissão para acessar esta página.');
            window.location.href = '../login/login.html';
            return;
        }

        await carregarDashboard();
    } catch (error) {
        console.error('Erro ao processar dados do usuário:', error);
        alert('Erro ao carregar dados do usuário. Por favor, faça login novamente.');
        window.location.href = '../login/login.html';
    }
});

// ===================================
// CARREGAR DADOS DO DASHBOARD
// ===================================
async function carregarDashboard() {
    try {
        console.log('🔄 Carregando dashboard para técnico ID:', idTecnicoLogado);
        mostrarLoading();
        
        // Buscar chamados do técnico
        console.log('📡 Fazendo requisição para API...');
        const response = await tiApi.listarMeusChamados(idTecnicoLogado);
        console.log('✅ Resposta da API:', response);
        
        chamados = response.chamados || [];
        console.log(`📊 Total de chamados encontrados: ${chamados.length}`);
        
        if (chamados.length === 0) {
            console.log('⚠️ Nenhum chamado encontrado para este técnico');
            mostrarEstadoVazio();
            return;
        }

        console.log('🎨 Processando dados e atualizando interface...');
        // Processar dados e atualizar interface
        atualizarChamadosPorStatus();
        atualizarChamadosPorUnidade();
        atualizarChamadosPorPrioridade();
        
        console.log('✅ Dashboard carregado com sucesso!');
        esconderLoading();
        
    } catch (error) {
        console.error('❌ Erro ao carregar dashboard:', error);
        mostrarErro('Erro ao carregar dados do dashboard: ' + error.message);
    }
}

// ===================================
// ATUALIZAR CHAMADOS POR STATUS
// ===================================
function atualizarChamadosPorStatus() {
    // Todos os status possíveis do banco de dados
    const statusCount = {
        'Aberto': 0,
        'Em Andamento': 0,
        'Aguardando Resposta': 0,
        'Resolvido': 0,
        'Cancelado': 0
    };

    // Contar chamados por status
    chamados.forEach(chamado => {
        if (statusCount.hasOwnProperty(chamado.status_chamado)) {
            statusCount[chamado.status_chamado]++;
        }
    });

    // Calcular máximo para as barras
    const maxCount = Math.max(...Object.values(statusCount), 1); // Mínimo 1 para evitar divisão por zero

    // Cores para cada status
    const statusConfig = {
        'Aberto': { color: 'bar-aberto', label: 'Aberto' },
        'Em Andamento': { color: 'bar-em-andamento', label: 'Em Andamento' },
        'Aguardando Resposta': { color: 'bar-aguardando', label: 'Aguardando Resposta' },
        'Resolvido': { color: 'bar-resolvido', label: 'Resolvido' },
        'Cancelado': { color: 'bar-cancelado', label: 'Cancelado' }
    };

    // Gerar HTML das barras
    const barsHTML = Object.entries(statusConfig).map(([status, config]) => {
        const count = statusCount[status];
        return `
            <div class="bar-item">
                <span class="bar-label">${config.label}</span>
                <div class="bar-wrapper">
                    <div class="bar ${config.color}" style="width: ${calcularPorcentagem(count, maxCount)}%;">
                        <span class="bar-value">${count}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    document.querySelector('.main-grid .card:first-child .bar-list').innerHTML = barsHTML;
}

// ===================================
// ATUALIZAR CHAMADOS POR UNIDADE
// ===================================
function atualizarChamadosPorUnidade() {
    const unidadesCount = {};

    // Contar chamados por unidade
    chamados.forEach(chamado => {
        const unidade = chamado.nome_unidade || 'Sem unidade';
        unidadesCount[unidade] = (unidadesCount[unidade] || 0) + 1;
    });

    // Ordenar unidades por quantidade (decrescente)
    const unidadesOrdenadas = Object.entries(unidadesCount)
        .sort((a, b) => b[1] - a[1]);

    const maxCount = Math.max(...Object.values(unidadesCount));

    // Cores para as barras (tons de verde)
    const cores = ['bar-sede', 'bar-filial1', 'bar-filial2'];

    // Gerar HTML das barras
    const barsHTML = unidadesOrdenadas.map(([unidade, count], index) => `
        <div class="bar-item">
            <span class="bar-label">${unidade}</span>
            <div class="bar-wrapper">
                <div class="bar ${cores[index % cores.length]}" style="width: ${calcularPorcentagem(count, maxCount)}%;">
                    <span class="bar-value">${count}</span>
                </div>
            </div>
        </div>
    `).join('');

    document.querySelector('.main-grid .card:last-child .bar-list').innerHTML = barsHTML;
}

// ===================================
// ATUALIZAR CHAMADOS POR PRIORIDADE
// ===================================
function atualizarChamadosPorPrioridade() {
    // Todas as prioridades possíveis do banco de dados
    const prioridadeCount = {
        'Baixa': 0,
        'Média': 0,
        'Alta': 0,
        'Urgente': 0
    };

    // Contar chamados por prioridade
    chamados.forEach(chamado => {
        if (prioridadeCount.hasOwnProperty(chamado.prioridade)) {
            prioridadeCount[chamado.prioridade]++;
        }
    });

    const total = Object.values(prioridadeCount).reduce((a, b) => a + b, 0);

    if (total === 0) {
        // Mostrar gráfico vazio
        const pieChart = document.getElementById('pieChart');
        pieChart.style.background = '#e0e0e0';
        
        document.querySelector('.legend').innerHTML = `
            <p style="text-align: center; color: #999;">Nenhum chamado</p>
        `;
        return;
    }

    // Configuração de cores para cada prioridade
    const prioridadeConfig = {
        'Urgente': { color: '#dc3545', angle: 0 },   // Vermelho
        'Alta': { color: '#fd7e14', angle: 0 },      // Laranja
        'Média': { color: '#ffc107', angle: 0 },     // Amarelo
        'Baixa': { color: '#28a745', angle: 0 }      // Verde
    };

    // Calcular ângulos para o gráfico de pizza
    let currentAngle = 0;
    const gradientParts = [];

    ['Urgente', 'Alta', 'Média', 'Baixa'].forEach(prioridade => {
        const count = prioridadeCount[prioridade];
        const percentage = (count / total) * 360;
        
        if (count > 0) {
            const endAngle = currentAngle + percentage;
            gradientParts.push(`${prioridadeConfig[prioridade].color} ${currentAngle}deg ${endAngle}deg`);
            currentAngle = endAngle;
        }
    });

    // Atualizar gráfico de pizza
    const pieChart = document.getElementById('pieChart');
    pieChart.style.background = `conic-gradient(${gradientParts.join(', ')})`;

    // Atualizar legenda com valores e porcentagens
    const legendHTML = `
        <div class="legend-item">
            <div class="legend-color" style="background-color: #dc3545;"></div>
            <span>Urgente (${prioridadeCount['Urgente']} - ${((prioridadeCount['Urgente'] / total) * 100).toFixed(0)}%)</span>
        </div>
        <div class="legend-item">
            <div class="legend-color" style="background-color: #fd7e14;"></div>
            <span>Alta (${prioridadeCount['Alta']} - ${((prioridadeCount['Alta'] / total) * 100).toFixed(0)}%)</span>
        </div>
        <div class="legend-item">
            <div class="legend-color" style="background-color: #ffc107;"></div>
            <span>Média (${prioridadeCount['Média']} - ${((prioridadeCount['Média'] / total) * 100).toFixed(0)}%)</span>
        </div>
        <div class="legend-item">
            <div class="legend-color" style="background-color: #28a745;"></div>
            <span>Baixa (${prioridadeCount['Baixa']} - ${((prioridadeCount['Baixa'] / total) * 100).toFixed(0)}%)</span>
        </div>
    `;

    document.querySelector('.legend').innerHTML = legendHTML;
}

// ===================================
// FUNÇÕES AUXILIARES
// ===================================
function calcularPorcentagem(valor, maximo) {
    if (maximo === 0) return 0;
    const percentual = (valor / maximo) * 100;
    return Math.max(percentual, 15); // Mínimo de 15% para visualização
}

function mostrarLoading() {
    const container = document.querySelector('.dashboard-container');
    const loadingHTML = `
        <div class="loading">
            <i class="fas fa-spinner fa-spin fa-3x"></i>
            <p>Carregando dashboard...</p>
        </div>
    `;
    
    // Esconder cards enquanto carrega
    const cards = container.querySelectorAll('.card, .main-grid');
    cards.forEach(card => card.style.display = 'none');
    
    // Adicionar loading
    if (!container.querySelector('.loading')) {
        container.insertAdjacentHTML('beforeend', loadingHTML);
    }
}

function esconderLoading() {
    const loading = document.querySelector('.loading');
    if (loading) {
        loading.remove();
    }
    
    // Mostrar cards novamente
    const container = document.querySelector('.dashboard-container');
    const cards = container.querySelectorAll('.card, .main-grid');
    cards.forEach(card => card.style.display = '');
}

function mostrarEstadoVazio() {
    esconderLoading();
    
    const mainGrid = document.querySelector('.main-grid');
    const prioridadeCard = document.querySelector('.prioridade-card');
    
    mainGrid.innerHTML = `
        <div class="card empty-state" style="grid-column: 1 / -1;">
            <i class="fas fa-inbox fa-3x" style="color: #ccc; margin-bottom: 20px;"></i>
            <h3>Nenhum chamado atribuído</h3>
            <p>Você não possui chamados atribuídos no momento.</p>
        </div>
    `;
    
    if (prioridadeCard) {
        prioridadeCard.style.display = 'none';
    }
}

function mostrarErro(mensagem) {
    esconderLoading();
    
    const mainGrid = document.querySelector('.main-grid');
    mainGrid.innerHTML = `
        <div class="card empty-state" style="grid-column: 1 / -1;">
            <i class="fas fa-exclamation-triangle fa-3x" style="color: #f44336; margin-bottom: 20px;"></i>
            <h3>Erro ao carregar dashboard</h3>
            <p>${mensagem}</p>
            <button onclick="location.reload()" class="btn-primary" style="margin-top: 20px;">
                <i class="fas fa-redo"></i> Tentar novamente
            </button>
        </div>
    `;
}

// ===================================
// AUTO-ATUALIZAÇÃO
// ===================================
// Atualizar dashboard a cada 5 minutos
setInterval(() => {
    if (idTecnicoLogado) {
        console.log('🔄 Atualizando dashboard automaticamente...');
        carregarDashboard();
    }
}, 5 * 60 * 1000);