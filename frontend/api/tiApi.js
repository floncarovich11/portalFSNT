const API_URL = 'http://localhost:3000/ti';

// =====================================================
// LISTAR CHAMADOS ATRIBUÍDOS AO TÉCNICO
// =====================================================
export const listarMeusChamados = async (idTecnico) => {
    try {
        const res = await fetch(`${API_URL}/chamados/${idTecnico}`);
        
        if (!res.ok) {
            const errBody = await res.json().catch(() => ({}));
            throw new Error(errBody.message || 'Erro ao listar chamados');
        }
        
        return await res.json();
    } catch (error) {
        console.error('Erro ao listar chamados do técnico:', error);
        throw error;
    }
};

// =====================================================
// VISUALIZAR DETALHES COMPLETOS DE UM CHAMADO
// =====================================================
export const visualizarChamado = async (idChamado) => {
    try {
        const res = await fetch(`${API_URL}/chamado/${idChamado}`);
        
        if (!res.ok) {
            const errBody = await res.json().catch(() => ({}));
            throw new Error(errBody.message || 'Erro ao visualizar chamado');
        }
        
        return await res.json();
    } catch (error) {
        console.error('Erro ao visualizar chamado:', error);
        throw error;
    }
};

// =====================================================
// ATUALIZAR STATUS E OBSERVAÇÕES DO CHAMADO
// =====================================================
export const atualizarChamado = async (idChamado, dados) => {
    try {
        const res = await fetch(`${API_URL}/chamado/${idChamado}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });
        
        if (!res.ok) {
            const errBody = await res.json().catch(() => ({}));
            throw new Error(errBody.message || 'Erro ao atualizar chamado');
        }
        
        return await res.json();
    } catch (error) {
        console.error('Erro ao atualizar chamado:', error);
        throw error;
    }
};

// =====================================================
// ATUALIZAR APENAS O STATUS DO CHAMADO
// =====================================================
export const atualizarStatus = async (idChamado, statusChamado, idTecnico) => {
    try {
        const res = await fetch(`${API_URL}/chamado/${idChamado}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                status_chamado: statusChamado,
                id_tecnico: idTecnico
            })
        });
        
        if (!res.ok) {
            const errBody = await res.json().catch(() => ({}));
            throw new Error(errBody.message || 'Erro ao atualizar status');
        }
        
        return await res.json();
    } catch (error) {
        console.error('Erro ao atualizar status:', error);
        throw error;
    }
};

// =====================================================
// ATUALIZAR APENAS AS OBSERVAÇÕES DO CHAMADO
// =====================================================
export const atualizarObservacoes = async (idChamado, observacoesTecnico, idTecnico) => {
    try {
        const res = await fetch(`${API_URL}/chamado/${idChamado}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                observacoes_tecnico: observacoesTecnico,
                id_tecnico: idTecnico
            })
        });
        
        if (!res.ok) {
            const errBody = await res.json().catch(() => ({}));
            throw new Error(errBody.message || 'Erro ao atualizar observações');
        }
        
        return await res.json();
    } catch (error) {
        console.error('Erro ao atualizar observações:', error);
        throw error;
    }
};

// =====================================================
// RESOLVER CHAMADO (ATALHO PARA MUDAR STATUS PARA RESOLVIDO)
// =====================================================
export const resolverChamado = async (idChamado, observacoes, idTecnico) => {
    try {
        const dados = {
            status_chamado: 'Resolvido',
            id_tecnico: idTecnico
        };
        
        if (observacoes) {
            dados.observacoes_tecnico = observacoes;
        }
        
        const res = await fetch(`${API_URL}/chamado/${idChamado}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });
        
        if (!res.ok) {
            const errBody = await res.json().catch(() => ({}));
            throw new Error(errBody.message || 'Erro ao resolver chamado');
        }
        
        return await res.json();
    } catch (error) {
        console.error('Erro ao resolver chamado:', error);
        throw error;
    }
};

// =====================================================
// INICIAR ATENDIMENTO (ATALHO PARA MUDAR STATUS PARA EM ANDAMENTO)
// =====================================================
export const iniciarAtendimento = async (idChamado, idTecnico) => {
    try {
        const res = await fetch(`${API_URL}/chamado/${idChamado}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                status_chamado: 'Em Andamento',
                id_tecnico: idTecnico
            })
        });
        
        if (!res.ok) {
            const errBody = await res.json().catch(() => ({}));
            throw new Error(errBody.message || 'Erro ao iniciar atendimento');
        }
        
        return await res.json();
    } catch (error) {
        console.error('Erro ao iniciar atendimento:', error);
        throw error;
    }
};

// =====================================================
// AGUARDAR RESPOSTA DO SOLICITANTE (ATALHO PARA AGUARDANDO RESPOSTA)
// =====================================================
export const aguardarResposta = async (idChamado, observacoes, idTecnico) => {
    try {
        const dados = {
            status_chamado: 'Aguardando Resposta',
            id_tecnico: idTecnico
        };
        
        if (observacoes) {
            dados.observacoes_tecnico = observacoes;
        }
        
        const res = await fetch(`${API_URL}/chamado/${idChamado}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });
        
        if (!res.ok) {
            const errBody = await res.json().catch(() => ({}));
            throw new Error(errBody.message || 'Erro ao mudar para aguardando resposta');
        }
        
        return await res.json();
    } catch (error) {
        console.error('Erro ao mudar para aguardando resposta:', error);
        throw error;
    }
};