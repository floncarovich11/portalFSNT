import * as configApi from '../../api/configuracoesApi.js';

// =====================================================
// VARIÁVEIS GLOBAIS
// =====================================================
let modoAtual = 'adicionar'; // 'adicionar' ou 'editar'
let tipoAtual = null; // Para edição de tipo
let unidadeAtual = null; // Para edição de unidade
let acaoExclusao = null; // Função a ser executada na confirmação

// =====================================================
// INICIALIZAÇÃO
// =====================================================
document.addEventListener('DOMContentLoaded', () => {
    carregarTipos();
    carregarUnidades();
});

// =====================================================
// TIPOS DE SOLICITAÇÃO
// =====================================================

// Carregar e exibir tipos
async function carregarTipos() {
    try {
        const response = await configApi.listarTipos();
        const tbody = document.getElementById('tipos-tbody');
        
        if (!response.tipos || response.tipos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 20px;">Nenhuma categoria cadastrada</td></tr>';
            return;
        }
        
        tbody.innerHTML = response.tipos.map(tipo => `
            <tr>
                <td><strong>${tipo.nome_tipo}</strong></td>
                <td>${tipo.descricao || '-'}</td>
                <td>
                    <span class="status-badge ${tipo.ativo ? 'badge-ativo' : 'badge-inativo'}">
                        ${tipo.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                </td>
                <td>
                    <button class="btn-edit" onclick="abrirModalTipo('editar', ${tipo.id_tipo})">
                        <i class="fa-solid fa-pen"></i>
                        Editar
                    </button>
                    <button class="btn-delete" onclick="confirmarExclusaoTipo(${tipo.id_tipo}, '${tipo.nome_tipo}')">
                        <i class="fa-solid fa-trash"></i>
                        Excluir
                    </button>
                </td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('Erro ao carregar tipos:', error);
        mostrarMensagem('Erro ao carregar categorias', 'error');
    }
}

// Abrir modal de tipo
window.abrirModalTipo = async (modo, idTipo = null) => {
    modoAtual = modo;
    tipoAtual = idTipo;
    
    const modal = document.getElementById('modal-tipo');
    const titulo = document.getElementById('modal-tipo-titulo');
    const ativoGroup = document.getElementById('tipo-ativo-group');
    
    // Limpar campos
    document.getElementById('tipo-nome').value = '';
    document.getElementById('tipo-descricao').value = '';
    document.getElementById('tipo-ativo').value = '1';
    
    if (modo === 'adicionar') {
        titulo.textContent = 'Adicionar Categoria';
        ativoGroup.style.display = 'none';
    } else {
        titulo.textContent = 'Editar Categoria';
        ativoGroup.style.display = 'block';
        
        // Carregar dados do tipo
        try {
            const response = await configApi.listarTipos();
            const tipo = response.tipos.find(t => t.id_tipo === idTipo);
            
            if (tipo) {
                document.getElementById('tipo-nome').value = tipo.nome_tipo;
                document.getElementById('tipo-descricao').value = tipo.descricao || '';
                document.getElementById('tipo-ativo').value = tipo.ativo ? '1' : '0';
            }
        } catch (error) {
            console.error('Erro ao carregar tipo:', error);
            mostrarMensagem('Erro ao carregar dados', 'error');
            return;
        }
    }
    
    modal.style.display = 'flex';
};

// Fechar modal de tipo
window.fecharModalTipo = () => {
    document.getElementById('modal-tipo').style.display = 'none';
};

// Salvar tipo
window.salvarTipo = async () => {
    const nome = document.getElementById('tipo-nome').value.trim();
    const descricao = document.getElementById('tipo-descricao').value.trim();
    const ativo = document.getElementById('tipo-ativo').value === '1';
    
    if (!nome) {
        mostrarMensagem('Nome da categoria é obrigatório', 'error');
        return;
    }
    
    try {
        const dados = {
            nome_tipo: nome,
            descricao: descricao || null
        };
        
        if (modoAtual === 'editar') {
            dados.ativo = ativo;
            await configApi.editarTipo(tipoAtual, dados);
            mostrarMensagem('Categoria atualizada com sucesso!', 'success');
        } else {
            await configApi.adicionarTipo(dados);
            mostrarMensagem('Categoria adicionada com sucesso!', 'success');
        }
        
        fecharModalTipo();
        carregarTipos();
        
    } catch (error) {
        console.error('Erro ao salvar tipo:', error);
        mostrarMensagem(error.message || 'Erro ao salvar categoria', 'error');
    }
};

// Confirmar exclusão de tipo
window.confirmarExclusaoTipo = (idTipo, nomeTipo) => {
    const modal = document.getElementById('modal-confirmar');
    const mensagem = document.getElementById('mensagem-confirmacao');
    
    mensagem.textContent = `Tem certeza que deseja excluir a categoria "${nomeTipo}"? Esta ação não pode ser desfeita.`;
    
    acaoExclusao = async () => {
        try {
            await configApi.deletarTipo(idTipo);
            mostrarMensagem('Categoria excluída com sucesso!', 'success');
            fecharModalConfirmar();
            carregarTipos();
        } catch (error) {
            console.error('Erro ao excluir tipo:', error);
            mostrarMensagem(error.message || 'Erro ao excluir categoria', 'error');
        }
    };
    
    modal.style.display = 'flex';
};

// =====================================================
// UNIDADES
// =====================================================

// Carregar e exibir unidades
async function carregarUnidades() {
    try {
        const response = await configApi.listarUnidades();
        const tbody = document.getElementById('unidades-tbody');
        
        if (!response.unidades || response.unidades.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; padding: 20px;">Nenhum setor cadastrado</td></tr>';
            return;
        }
        
        tbody.innerHTML = response.unidades.map(unidade => `
            <tr>
                <td><strong>${unidade.nome_unidade}</strong></td>
                <td>${formatarData(unidade.criado_em)}</td>
                <td>
                    <button class="btn-edit" onclick="abrirModalUnidade('editar', ${unidade.id_unidade})">
                        <i class="fa-solid fa-pen"></i>
                        Editar
                    </button>
                    <button class="btn-delete" onclick="confirmarExclusaoUnidade(${unidade.id_unidade}, '${unidade.nome_unidade}')">
                        <i class="fa-solid fa-trash"></i>
                        Excluir
                    </button>
                </td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('Erro ao carregar unidades:', error);
        mostrarMensagem('Erro ao carregar setores', 'error');
    }
}

// Abrir modal de unidade
window.abrirModalUnidade = async (modo, idUnidade = null) => {
    modoAtual = modo;
    unidadeAtual = idUnidade;
    
    const modal = document.getElementById('modal-unidade');
    const titulo = document.getElementById('modal-unidade-titulo');
    
    // Limpar campo
    document.getElementById('unidade-nome').value = '';
    
    if (modo === 'adicionar') {
        titulo.textContent = 'Adicionar Setor';
    } else {
        titulo.textContent = 'Editar Setor';
        
        // Carregar dados da unidade
        try {
            const response = await configApi.listarUnidades();
            const unidade = response.unidades.find(u => u.id_unidade === idUnidade);
            
            if (unidade) {
                document.getElementById('unidade-nome').value = unidade.nome_unidade;
            }
        } catch (error) {
            console.error('Erro ao carregar unidade:', error);
            mostrarMensagem('Erro ao carregar dados', 'error');
            return;
        }
    }
    
    modal.style.display = 'flex';
};

// Fechar modal de unidade
window.fecharModalUnidade = () => {
    document.getElementById('modal-unidade').style.display = 'none';
};

// Salvar unidade
window.salvarUnidade = async () => {
    const nome = document.getElementById('unidade-nome').value.trim();
    
    if (!nome) {
        mostrarMensagem('Nome do setor é obrigatório', 'error');
        return;
    }
    
    try {
        const dados = { nome_unidade: nome };
        
        if (modoAtual === 'editar') {
            await configApi.editarUnidade(unidadeAtual, dados);
            mostrarMensagem('Setor atualizado com sucesso!', 'success');
        } else {
            await configApi.adicionarUnidade(dados);
            mostrarMensagem('Setor adicionado com sucesso!', 'success');
        }
        
        fecharModalUnidade();
        carregarUnidades();
        
    } catch (error) {
        console.error('Erro ao salvar unidade:', error);
        mostrarMensagem(error.message || 'Erro ao salvar setor', 'error');
    }
};

// Confirmar exclusão de unidade
window.confirmarExclusaoUnidade = (idUnidade, nomeUnidade) => {
    const modal = document.getElementById('modal-confirmar');
    const mensagem = document.getElementById('mensagem-confirmacao');
    
    mensagem.textContent = `Tem certeza que deseja excluir o setor "${nomeUnidade}"? Esta ação não pode ser desfeita.`;
    
    acaoExclusao = async () => {
        try {
            await configApi.deletarUnidade(idUnidade);
            mostrarMensagem('Setor excluído com sucesso!', 'success');
            fecharModalConfirmar();
            carregarUnidades();
        } catch (error) {
            console.error('Erro ao excluir unidade:', error);
            mostrarMensagem(error.message || 'Erro ao excluir setor', 'error');
        }
    };
    
    modal.style.display = 'flex';
};

// =====================================================
// MODAL DE CONFIRMAÇÃO
// =====================================================

window.fecharModalConfirmar = () => {
    document.getElementById('modal-confirmar').style.display = 'none';
    acaoExclusao = null;
};

window.confirmarExclusao = () => {
    if (acaoExclusao) {
        acaoExclusao();
    }
};

// =====================================================
// UTILITÁRIOS
// =====================================================

// Formatar data
function formatarData(dataISO) {
    const data = new Date(dataISO);
    return data.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

// Mostrar mensagem de feedback
function mostrarMensagem(texto, tipo) {
    // Criar elemento de mensagem
    const mensagem = document.createElement('div');
    mensagem.className = `message ${tipo}`;
    mensagem.textContent = texto;
    
    // Adicionar ao topo do container
    const container = document.querySelector('.config-container');
    container.insertBefore(mensagem, container.firstChild);
    
    // Exibir mensagem
    mensagem.style.display = 'block';
    
    // Remover após 4 segundos
    setTimeout(() => {
        mensagem.style.opacity = '0';
        setTimeout(() => mensagem.remove(), 300);
    }, 4000);
}

// Fechar modais ao clicar fora
window.onclick = (event) => {
    const modalTipo = document.getElementById('modal-tipo');
    const modalUnidade = document.getElementById('modal-unidade');
    const modalConfirmar = document.getElementById('modal-confirmar');
    
    if (event.target === modalTipo) {
        fecharModalTipo();
    }
    if (event.target === modalUnidade) {
        fecharModalUnidade();
    }
    if (event.target === modalConfirmar) {
        fecharModalConfirmar();
    }
};