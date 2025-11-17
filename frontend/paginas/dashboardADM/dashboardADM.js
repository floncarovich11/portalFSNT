// Importar as funções da API
import { listarChamados } from '../../api/ticketsApi.js';

// Função para buscar estatísticas gerais
async function carregarEstatisticas() {
    try {
        const data = await listarChamados();
        console.log('📊 Dados recebidos da API:', data); // DEBUG
        
        const chamados = data.chamados;
        console.log('📋 Total de chamados:', chamados.length); // DEBUG
        console.log('🔍 Exemplo de chamado:', chamados[0]); // DEBUG - Ver estrutura

        // Calcular estatísticas
        const total = chamados.length;
        const pendentes = chamados.filter(c => c.status_chamado === 'Aberto').length;
        const emAndamento = chamados.filter(c => c.status_chamado === 'Em Andamento').length;
        const concluidos = chamados.filter(c => c.status_chamado === 'Resolvido').length;

        console.log('📈 Estatísticas:', { total, pendentes, emAndamento, concluidos }); // DEBUG

        // Atualizar os cards
        document.getElementById('total-tickets').textContent = total;
        document.getElementById('pendentes').textContent = pendentes;
        document.getElementById('em-andamento').textContent = emAndamento;
        document.getElementById('concluidos').textContent = concluidos;

        return chamados;
    } catch (error) {
        console.error('❌ Erro ao carregar estatísticas:', error);
        mostrarErro('Erro ao carregar dados do dashboard. Verifique se o servidor está rodando.');
        return [];
    }
}

// Função para mostrar mensagem de erro
function mostrarErro(mensagem) {
    const dashboardContainer = document.querySelector('.dashboard-container');
    
    // Remover erro anterior se existir
    const erroAnterior = dashboardContainer.querySelector('.erro-dashboard');
    if (erroAnterior) erroAnterior.remove();
    
    const erroDiv = document.createElement('div');
    erroDiv.className = 'erro-dashboard';
    erroDiv.style.cssText = `
        background-color: #fee;
        border: 1px solid #fcc;
        color: #c33;
        padding: 15px;
        border-radius: 8px;
        margin-bottom: 20px;
        text-align: center;
    `;
    erroDiv.textContent = mensagem;
    dashboardContainer.insertBefore(erroDiv, dashboardContainer.firstChild);
}

// Função para carregar chamados por setor
async function carregarChamadosPorSetor(chamados) {
    try {
        console.log('📊 Carregando gráfico de setores...'); // DEBUG
        
        // Contar chamados por unidade
        const contagemPorSetor = {};
        
        chamados.forEach(chamado => {
            const setor = chamado.nome_unidade || 'Sem setor';
            contagemPorSetor[setor] = (contagemPorSetor[setor] || 0) + 1;
        });

        console.log('🏢 Contagem por setor:', contagemPorSetor); // DEBUG

        // Verificar se há dados
        if (Object.keys(contagemPorSetor).length === 0) {
            const barChart = document.getElementById('bar-chart');
            barChart.innerHTML = '<p style="text-align: center; color: #666;">Nenhum dado disponível</p>';
            return;
        }

        // Pegar os 4 setores com mais chamados
        const setoresOrdenados = Object.entries(contagemPorSetor)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 4);

        // Encontrar o valor máximo para normalizar as barras
        const maxChamados = Math.max(...setoresOrdenados.map(s => s[1]), 1); // Mínimo 1

        // Atualizar o gráfico de barras
        const barChart = document.getElementById('bar-chart');
        barChart.innerHTML = '';
        barChart.style.display = 'flex';
        barChart.style.alignItems = 'flex-end';
        barChart.style.justifyContent = 'space-around';
        barChart.style.height = '200px';
        barChart.style.gap = '10px';

        setoresOrdenados.forEach(([setor, quantidade]) => {
            const porcentagem = (quantidade / maxChamados) * 100;
            
            const barContainer = document.createElement('div');
            barContainer.style.cssText = `
                flex: 1;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 8px;
                height: 100%;
            `;

            const barWrapper = document.createElement('div');
            barWrapper.style.cssText = `
                flex: 1;
                width: 100%;
                display: flex;
                align-items: flex-end;
                justify-content: center;
            `;

            const bar = document.createElement('div');
            bar.style.cssText = `
                width: 100%;
                height: ${porcentagem}%;
                background: #398414;
                border-radius: 4px 4px 0 0;
                transition: all 0.3s ease;
                cursor: pointer;
            `;
            bar.title = `${setor}: ${quantidade} chamados`;
            
            bar.addEventListener('mouseenter', () => {
                bar.style.background = '#2a6610';
                bar.style.transform = 'scaleY(1.05)';
            });
            
            bar.addEventListener('mouseleave', () => {
                bar.style.background = '#398414';
                bar.style.transform = 'scaleY(1)';
            });

            const label = document.createElement('span');
            label.style.cssText = `
                font-size: 11px;
                color: #666;
                text-align: center;
                word-break: break-word;
                max-width: 100%;
            `;
            label.textContent = setor.length > 15 ? setor.substring(0, 15) + '...' : setor;

            const count = document.createElement('span');
            count.style.cssText = `
                font-size: 12px;
                font-weight: 600;
                color: #398414;
            `;
            count.textContent = quantidade;

            barWrapper.appendChild(bar);
            barContainer.appendChild(barWrapper);
            barContainer.appendChild(label);
            barContainer.appendChild(count);
            barChart.appendChild(barContainer);
        });

        console.log('✅ Gráfico de setores carregado'); // DEBUG

    } catch (error) {
        console.error('❌ Erro ao carregar chamados por setor:', error);
    }
}

// Função para carregar chamados por técnico
async function carregarChamadosPorTecnico(chamados) {
    try {
        console.log('🥧 Carregando gráfico de pizza...'); // DEBUG
        
        // Contar chamados ativos por técnico
        const contagemPorTecnico = {};
        
        chamados.forEach(chamado => {
            // Apenas chamados não concluídos
            if (chamado.status_chamado !== 'Resolvido' && chamado.status_chamado !== 'Cancelado') {
                const tecnico = chamado.nome_tecnico || chamado.tecnico_responsavel || 'Não atribuído';
                contagemPorTecnico[tecnico] = (contagemPorTecnico[tecnico] || 0) + 1;
            }
        });
        
        console.log('👨‍💻 Contagem por técnico:', contagemPorTecnico); // DEBUG
        
        // Pegar os 3 técnicos com mais chamados
        const tecnicosOrdenados = Object.entries(contagemPorTecnico)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3);
        
        const chartContainer = document.getElementById('pie-chart').parentElement;
        const pieChart = document.getElementById('pie-chart');
        
        // Limpar conteúdo anterior
        const wrapperAnterior = chartContainer.querySelector('.pie-chart-wrapper');
        if (wrapperAnterior) wrapperAnterior.remove();
        
        if (tecnicosOrdenados.length === 0) {
            pieChart.style.background = '#e0e0e0';
            pieChart.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #666;">Nenhum chamado ativo</div>';
            console.log('⚠️ Nenhum técnico com chamados ativos'); // DEBUG
            return;
        }
        
        const total = tecnicosOrdenados.reduce((sum, [, qtd]) => sum + qtd, 0);
        
        // Cores para o gráfico
        const cores = ['#398414', '#6ba83e', '#9bc96e'];
        
        let graus = 0;
        const gradientes = [];
        const legendaItens = [];
        
        tecnicosOrdenados.forEach(([tecnico, quantidade], index) => {
            const porcentagem = (quantidade / total) * 100;
            const grausSetor = (porcentagem / 100) * 360;
            const inicio = graus;
            graus += grausSetor;
            
            console.log(`  ${tecnico}: ${quantidade} (${porcentagem.toFixed(1)}%) - ${inicio}° a ${graus}°`); // DEBUG
            
            gradientes.push(`${cores[index]} ${inicio}deg ${graus}deg`);
            
            // Adicionar item à legenda
            legendaItens.push({
                cor: cores[index],
                tecnico: tecnico,
                quantidade: quantidade,
                porcentagem: porcentagem.toFixed(1)
            });
        });
        
        // Aplicar o gráfico
        pieChart.style.background = `conic-gradient(${gradientes.join(', ')})`;
        pieChart.innerHTML = ''; // Limpar texto interno
        
        // Criar wrapper para colocar gráfico e legenda lado a lado
        const wrapper = document.createElement('div');
        wrapper.className = 'pie-chart-wrapper';
        wrapper.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 30px;
            margin-top: 10px;
        `;
        
        // Mover o gráfico para dentro do wrapper
        const pieChartClone = pieChart.cloneNode(true);
        pieChart.style.display = 'none'; // Esconder o original
        wrapper.appendChild(pieChartClone);
        
        // Criar legenda
        const legenda = document.createElement('div');
        legenda.className = 'legenda-pizza';
        legenda.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 12px;
        `;
        
        legendaItens.forEach(item => {
            const itemLegenda = document.createElement('div');
            itemLegenda.style.cssText = `
                display: flex;
                align-items: center;
                gap: 10px;
                font-size: 14px;
            `;
            
            itemLegenda.innerHTML = `
                <div style="
                    width: 18px;
                    height: 18px;
                    background-color: ${item.cor};
                    border-radius: 3px;
                    flex-shrink: 0;
                "></div>
                <div style="
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                ">
                    <span style="color: #333; font-weight: 500; font-size: 13px;">${item.tecnico}</span>
                    <span style="color: #666; font-size: 12px;">
                        ${item.quantidade} chamados (${item.porcentagem}%)
                    </span>
                </div>
            `;
            
            legenda.appendChild(itemLegenda);
        });
        
        wrapper.appendChild(legenda);
        
        // Adicionar wrapper após o título do gráfico
        chartContainer.appendChild(wrapper);
        
        console.log('✅ Gráfico de pizza carregado com legenda ao lado'); // DEBUG
        
    } catch (error) {
        console.error('❌ Erro ao carregar chamados por técnico:', error);
    }
}

// Função para carregar últimos chamados
async function carregarUltimosChamados(chamados) {
    try {
        console.log('📋 Carregando últimos chamados...'); // DEBUG
        
        const tbody = document.getElementById('ultimos-chamados');
        tbody.innerHTML = '';
        
        // Pegar os 6 últimos chamados
        const ultimosChamados = chamados.slice(0, 6);
        
        if (ultimosChamados.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #666;">Nenhum chamado encontrado</td></tr>';
            return;
        }

        ultimosChamados.forEach((chamado, index) => {
            console.log(`  Chamado ${index + 1}:`, chamado); // DEBUG - ver estrutura completa
            
            const row = document.createElement('tr');
            row.style.cursor = 'pointer';
            row.onclick = () => {
                window.location.href = `detalhesChamado.html?id=${chamado.id_chamado}`;
            };

            // Tipo da solicitação
            const tipoSolicitacao = chamado.tipo_solicitacao || chamado.nome_tipo || 'N/A';
            
            // Detectar ícone pelo tipo da solicitação (igual ao meusTickets)
            const tipo = tipoSolicitacao.toLowerCase();
            const tipoIcon =
                tipo.includes('computador') ? '<i class="fa-solid fa-desktop"></i>' :
                tipo.includes('impressora') ? '<i class="fa-solid fa-print"></i>' :
                tipo.includes('rede') || tipo.includes('internet') ? '<i class="fa-solid fa-wifi"></i>' :
                tipo.includes('software') || tipo.includes('sistema') ? '<i class="fa-solid fa-code"></i>' :
                tipo.includes('hardware') ? '<i class="fa-solid fa-microchip"></i>' :
                tipo.includes('e-mail') || tipo.includes('email') ? '<i class="fa-solid fa-envelope"></i>' :
                tipo.includes('telefonia') || tipo.includes('telefone') ? '<i class="fa-solid fa-phone"></i>' :
                '<i class="fa-solid fa-ticket"></i>';
            
            // Nome do solicitante
            const nomeSolicitante = chamado.nome_solicitante || 
                                   chamado.nome_completo || 
                                   chamado.nome_usuario || 
                                   'Não identificado';
            
            // Nome do técnico
            const nomeTecnico = chamado.tecnico_responsavel || 
                               chamado.nome_tecnico || 
                               chamado.nome_completo_tecnico || 
                               'Não atribuído';
            
            row.innerHTML = `
                <td>
                    <div class="tipo-icon">${tipoIcon}</div>
                </td>
                <td>${chamado.resumo || 'Sem resumo'}</td>
                <td>${nomeSolicitante}</td>
                <td>${nomeTecnico}</td>
            `;
            
            tbody.appendChild(row);
        });
        
        console.log('✅ Últimos chamados carregados'); // DEBUG
        
    } catch (error) {
        console.error('❌ Erro ao carregar últimos chamados:', error);
    }
}

// Função principal para carregar todos os dados
async function carregarDashboard() {
    try {
        console.log('🚀 Iniciando carregamento do dashboard...'); // DEBUG

        // Buscar todos os chamados
        const chamados = await carregarEstatisticas();

        if (chamados && chamados.length > 0) {
            // Carregar os gráficos e tabela
            await Promise.all([
                carregarChamadosPorSetor(chamados),
                carregarChamadosPorTecnico(chamados),
                carregarUltimosChamados(chamados)
            ]);
        } else {
            console.log('⚠️ Nenhum chamado encontrado.');
        }

        console.log('✅ Dashboard carregado com sucesso!'); // DEBUG
    } catch (error) {
        console.error('❌ Erro ao carregar dashboard:', error);
    }
}

// Função para atualizar dashboard periodicamente
function iniciarAtualizacaoAutomatica() {
    console.log('🔄 Atualização automática ativada (30s)');
    setInterval(carregarDashboard, 30000);
}

// Carregar dashboard quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM carregado, iniciando dashboard...');
    carregarDashboard();
    iniciarAtualizacaoAutomatica();
});

// Exportar funções para uso externo se necessário
export {
    carregarDashboard,
    carregarEstatisticas,
    carregarChamadosPorSetor,
    carregarChamadosPorTecnico,
    carregarUltimosChamados
};