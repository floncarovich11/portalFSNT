// ===================================
// IMPORTAR API DE ADMINISTRAÇÃO
// ===================================
import { 
    listarFuncionarios, 
    listarTecnicos,
    promoverTecnico,
    removerTecnico  
} from '../../api/adminApi.js';

// ===================================
// INICIALIZAÇÃO
// ===================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 Página de acessos carregada');
    inicializarAbas();
    carregarUsuarios();
    carregarTecnicos();
    inicializarBotaoAdicionarTecnico();
    inicializarBotaoRemoverTecnico();
});

// ===================================
// CONTROLE DAS ABAS
// ===================================
function inicializarAbas() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            button.classList.add('active');
            
            const tabId = button.getAttribute('data-tab');
            document.getElementById(`${tabId}-tab`).classList.add('active');
            
            console.log(`📑 Aba ativa: ${tabId}`);
        });
    });
}

// ===================================
// FUNÇÃO AUXILIAR - MOSTRAR LOADING
// ===================================
function mostrarLoading(tbodyId) {
    const tbody = document.getElementById(tbodyId);
    tbody.innerHTML = `
        <tr>
            <td colspan="3" style="text-align: center; padding: 40px; color: #666;">
                <i class="fas fa-spinner fa-spin" style="font-size: 24px; color: #398414;"></i>
                <p style="margin-top: 10px;">Carregando dados...</p>
            </td>
        </tr>
    `;
}

// ===================================
// FUNÇÃO AUXILIAR - MOSTRAR ERRO
// ===================================
function mostrarErro(tbodyId, mensagem) {
    const tbody = document.getElementById(tbodyId);
    tbody.innerHTML = `
        <tr>
            <td colspan="3" style="text-align: center; padding: 40px; color: #c62828;">
                <i class="fas fa-exclamation-triangle" style="font-size: 24px;"></i>
                <p style="margin-top: 10px; font-weight: 500;">${mensagem}</p>
                <button onclick="location.reload()" style="margin-top: 15px; padding: 10px 24px; background: #398414; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: 500; transition: background 0.3s;">
                    <i class="fas fa-redo" style="margin-right: 6px;"></i> Tentar Novamente
                </button>
            </td>
        </tr>
    `;
}

// ===================================
// FUNÇÃO AUXILIAR - MENSAGEM VAZIA
// ===================================
function mostrarVazio(tbodyId, mensagem) {
    const tbody = document.getElementById(tbodyId);
    tbody.innerHTML = `
        <tr>
            <td colspan="3" style="text-align: center; padding: 40px; color: #666;">
                <i class="fas fa-inbox" style="font-size: 24px; opacity: 0.5;"></i>
                <p style="margin-top: 10px;">${mensagem}</p>
            </td>
        </tr>
    `;
}

// ===================================
// FORMATAR DATA
// ===================================
function formatarData(dataString) {
    if (!dataString) return 'N/A';
    
    const data = new Date(dataString);
    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const ano = data.getFullYear();
    
    return `${dia}/${mes}/${ano}`;
}

// ===================================
// CARREGAR USUÁRIOS (FUNCIONÁRIOS)
// ===================================
async function carregarUsuarios() {
    const tbodyId = 'usuarios-tbody';
    
    try {
        console.log('👥 Carregando funcionários do banco de dados...');
        mostrarLoading(tbodyId);
        
        const data = await listarFuncionarios();
        
        const tbody = document.getElementById(tbodyId);
        tbody.innerHTML = '';
        
        if (!data.usuarios || data.usuarios.length === 0) {
            mostrarVazio(tbodyId, 'Nenhum funcionário cadastrado');
            return;
        }
        
        data.usuarios.forEach(usuario => {
            const row = document.createElement('tr');
            row.style.cursor = 'pointer';
            
            row.onclick = () => {
                console.log('Usuário selecionado:', usuario);
                // Você pode adicionar ação ao clicar (ex: abrir modal com detalhes)
            };
            
            row.innerHTML = `
                <td>${usuario.nome_completo}</td>
                <td>${usuario.email}</td>
                <td>${usuario.nome_unidade}</td>
            `;
            
            tbody.appendChild(row);
        });
        
        console.log(`✅ ${data.total} funcionário(s) carregado(s)`);
        
    } catch (error) {
        console.error('❌ Erro ao carregar funcionários:', error);
        mostrarErro(tbodyId, error.message || 'Erro ao carregar funcionários. Verifique sua conexão.');
    }
}

// ===================================
// CARREGAR TÉCNICOS
// ===================================
async function carregarTecnicos() {
    const tbodyId = 'tecnicos-tbody';
    
    try {
        console.log('🛠️ Carregando técnicos do banco de dados...');
        mostrarLoading(tbodyId);
        
        const data = await listarTecnicos();
        
        const tbody = document.getElementById(tbodyId);
        tbody.innerHTML = '';
        
        if (!data.usuarios || data.usuarios.length === 0) {
            mostrarVazio(tbodyId, 'Nenhum técnico cadastrado');
            return;
        }
        
        data.usuarios.forEach(tecnico => {
            const row = document.createElement('tr');
            row.style.cursor = 'pointer';
            
            row.onclick = () => {
                console.log('Técnico selecionado:', tecnico);
                // Você pode adicionar ação ao clicar (ex: abrir modal)
            };
            
            row.innerHTML = `
                <td>${tecnico.nome_completo}</td>
                <td>${tecnico.email}</td>
                <td>${tecnico.nome_unidade}</td>
            `;
            
            tbody.appendChild(row);
        });
        
        console.log(`✅ ${data.total} técnico(s) carregado(s)`);
        
    } catch (error) {
        console.error('❌ Erro ao carregar técnicos:', error);
        mostrarErro(tbodyId, error.message || 'Erro ao carregar técnicos. Verifique sua conexão.');
    }
}

// ===================================
// INICIALIZAR BOTÃO ADICIONAR TÉCNICO
// ===================================
function inicializarBotaoAdicionarTecnico() {
    const btn = document.getElementById('btn-add-tecnico');
    if (!btn) return;
    
    btn.addEventListener('click', async () => {
        const email = prompt("Digite o email do funcionário que deseja promover a Técnico:");
        
        if (!email) {
            alert("Email não informado.");
            return;
        }
        
        // Validação básica de email
        if (!email.includes('@')) {
            alert("Email inválido.");
            return;
        }
        
        try {
            const resposta = await promoverTecnico(email);
            alert(resposta.message);
            
            // Recarregar ambas as tabelas automaticamente
            carregarUsuarios();
            carregarTecnicos();
            
        } catch (error) {
            alert(error.message || "Erro ao promover técnico.");
        }
    });
}

// ===================================
// INICIALIZAR BOTÃO REMOVER TÉCNICO
// ===================================
function inicializarBotaoRemoverTecnico() {
    const btn = document.getElementById('btn-remove-tecnico');
    if (!btn) return;
    
    btn.addEventListener('click', async () => {
        const email = prompt("Digite o email do técnico que deseja remover (voltará a ser Funcionário):");
        
        if (!email) {
            alert("Email não informado.");
            return;
        }
        
        // Validação básica de email
        if (!email.includes('@')) {
            alert("Email inválido.");
            return;
        }
        
        // Confirmação adicional
        const confirmar = confirm(`Tem certeza que deseja remover o status de técnico de ${email}?\n\nEle voltará a ser um Funcionário comum.`);
        
        if (!confirmar) {
            return;
        }
        
        try {
            const resposta = await removerTecnico(email);
            alert(resposta.message);
            
            // Recarregar ambas as tabelas automaticamente
            carregarUsuarios();
            carregarTecnicos();
            
        } catch (error) {
            alert(error.message || "Erro ao remover técnico.");
        }
    });
}

// ===================================
// EXPORTAR FUNÇÕES
// ===================================
export {
    carregarUsuarios,
    carregarTecnicos
};