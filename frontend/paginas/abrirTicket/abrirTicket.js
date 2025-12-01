// Caminho correto: sobe 2 níveis (abrirTicket -> paginas -> frontend) e entra em api
import { criarChamado, buscarTiposSolicitacao, buscarUnidades } from '../../api/ticketsApi.js';
import { getCurrentUserFromToken } from '../../api/authApi.js';

// Elementos do DOM
const selectUnidade = document.getElementById('unidade');
const selectSolicitacao = document.getElementById('solicitacao');
const inputResumo = document.getElementById('resumo');
const textareaDescricao = document.getElementById('descricao');
const btnEnviar = document.querySelector('.enviar');
const btnCancelar = document.querySelector('.cancelar');

// Estado da aplicação
let usuarioLogado = null;

// Inicialização
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🔍 Página carregada, verificando token...');
    
    // Verificar se o usuário está logado apenas via token
    const usuario = getCurrentUserFromToken();
    if (!usuario || !usuario.id_usuario) {
        alert('Você precisa estar logado para abrir um ticket!');
        console.error('❌ Redirecionando para login...');
        window.location.href = '/frontend/paginas/login/login.html';
        return;
    }
    usuarioLogado = usuario;
    console.log('✅ Usuário autenticado via token:', usuarioLogado);
    
    // Carregar dados dos selects
    await carregarUnidades();
    await carregarTiposSolicitacao();

    // Adicionar event listeners
    btnEnviar.addEventListener('click', handleEnviarTicket);
    btnCancelar.addEventListener('click', handleCancelar);
});

// Carregar unidades do banco de dados
async function carregarUnidades() {
    try {
        const response = await buscarUnidades();
        
        // Limpar opções existentes (exceto a primeira)
        selectUnidade.innerHTML = '<option value="">Selecione...</option>';
        
        // Adicionar unidades
        if (response.unidades && response.unidades.length > 0) {
            response.unidades.forEach(unidade => {
                const option = document.createElement('option');
                option.value = unidade.id_unidade;
                option.textContent = unidade.nome_unidade;
                selectUnidade.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Erro ao carregar unidades:', error);
        alert('Erro ao carregar unidades. Tente novamente.');
    }
}

// Carregar tipos de solicitação do banco de dados
async function carregarTiposSolicitacao() {
    try {
        const response = await buscarTiposSolicitacao();
        
        // Limpar opções existentes (exceto a primeira)
        selectSolicitacao.innerHTML = '<option value="">Selecione...</option>';
        
        // Adicionar tipos de solicitação
        if (response.tipos && response.tipos.length > 0) {
            response.tipos.forEach(tipo => {
                const option = document.createElement('option');
                option.value = tipo.id_tipo;
                option.textContent = tipo.nome_tipo;
                selectSolicitacao.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Erro ao carregar tipos de solicitação:', error);
        alert('Erro ao carregar tipos de solicitação. Tente novamente.');
    }
}

// Validar formulário
function validarFormulario() {
    const erros = [];

    if (!selectUnidade.value) {
        erros.push('Selecione uma unidade');
        selectUnidade.style.borderColor = 'red';
    } else {
        selectUnidade.style.borderColor = '';
    }

    if (!selectSolicitacao.value) {
        erros.push('Selecione um tipo de solicitação');
        selectSolicitacao.style.borderColor = 'red';
    } else {
        selectSolicitacao.style.borderColor = '';
    }

    if (!inputResumo.value.trim()) {
        erros.push('Preencha o resumo da solicitação');
        inputResumo.style.borderColor = 'red';
    } else {
        inputResumo.style.borderColor = '';
    }

    if (!textareaDescricao.value.trim()) {
        erros.push('Descreva a solicitação');
        textareaDescricao.style.borderColor = 'red';
    } else {
        textareaDescricao.style.borderColor = '';
    }

    if (erros.length > 0) {
        alert('Por favor, corrija os seguintes erros:\n\n' + erros.join('\n'));
        return false;
    }

    return true;
}

// Handler para enviar ticket
async function handleEnviarTicket(e) {
    e.preventDefault();

    // Validar formulário
    if (!validarFormulario()) {
        return;
    }

    // Desabilitar botão para evitar duplo envio
    btnEnviar.disabled = true;
    btnEnviar.textContent = 'Enviando...';

    try {
        // Preparar dados do chamado
        const dadosChamado = {
            id_usuario: usuarioLogado.id_usuario,
            id_unidade: parseInt(selectUnidade.value),
            id_tipo_solicitacao: parseInt(selectSolicitacao.value),
            resumo: inputResumo.value.trim(),
            descricao: textareaDescricao.value.trim(),
            prioridade: 'Média' // Padrão
        };

        // DEBUG: Verificar cada campo individualmente
        console.log('=== VERIFICAÇÃO DE CAMPOS ===');
        console.log('👤 id_usuario:', dadosChamado.id_usuario, typeof dadosChamado.id_usuario);
        console.log('🏢 id_unidade:', dadosChamado.id_unidade, typeof dadosChamado.id_unidade);
        console.log('📋 id_tipo_solicitacao:', dadosChamado.id_tipo_solicitacao, typeof dadosChamado.id_tipo_solicitacao);
        console.log('📝 resumo:', dadosChamado.resumo, 'length:', dadosChamado.resumo.length);
        console.log('📄 descricao:', dadosChamado.descricao, 'length:', dadosChamado.descricao.length);
        console.log('📤 Dados completos:', dadosChamado);
        console.log('👤 Usuário logado completo:', usuarioLogado);
        
        // Verificar se algum campo está vazio/undefined/NaN
        const camposFaltando = [];
        if (!dadosChamado.id_usuario) camposFaltando.push('id_usuario');
        if (!dadosChamado.id_unidade || isNaN(dadosChamado.id_unidade)) camposFaltando.push('id_unidade');
        if (!dadosChamado.id_tipo_solicitacao || isNaN(dadosChamado.id_tipo_solicitacao)) camposFaltando.push('id_tipo_solicitacao');
        if (!dadosChamado.resumo) camposFaltando.push('resumo');
        if (!dadosChamado.descricao) camposFaltando.push('descricao');
        
        if (camposFaltando.length > 0) {
            alert('⚠️ Campos faltando ou inválidos:\n' + camposFaltando.join(', '));
            console.error('❌ Campos faltando:', camposFaltando);
            return;
        }

        // Enviar chamado
        const response = await criarChamado(dadosChamado);

        // Sucesso
        alert('Ticket criado com sucesso!\n\nNúmero do ticket: ' + response.chamado.id_chamado);
        
        // Redirecionar para página de tickets ou limpar formulário
        window.location.href = '/frontend/paginas/meusTickets/meusTickets.html';
        
    } catch (error) {
        console.error('Erro ao criar ticket:', error);
        alert('Erro ao criar ticket. Por favor, tente novamente.');
    } finally {
        // Reabilitar botão
        btnEnviar.disabled = false;
        btnEnviar.textContent = 'Enviar';
    }
}

// Handler para cancelar
function handleCancelar(e) {
    e.preventDefault();
    
    if (confirm('Deseja realmente cancelar? Todas as informações serão perdidas.')) {
        // Limpar formulário
        selectUnidade.value = '';
        selectSolicitacao.value = '';
        inputResumo.value = '';
        textareaDescricao.value = '';
        
        // Voltar para página anterior ou home
        window.history.back();
    }
}