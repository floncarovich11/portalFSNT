const API_URL = 'http://localhost:3000/configuracoes';

function getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': 'Bearer ' + token } : {})
    };
}

// =====================================================
// TIPOS DE SOLICITAÇÃO
// =====================================================

// Listar todos os tipos
export const listarTipos = async () => {
    try {
        const res = await fetch(`${API_URL}/tipos`);
        if (!res.ok) throw new Error('Erro ao listar tipos de solicitação');
        return await res.json();
    } catch (error) {
        console.error('Erro ao listar tipos:', error);
        throw error;
    }
};

// Adicionar novo tipo
export const adicionarTipo = async (dadosTipo) => {
    try {
        const res = await fetch(`${API_URL}/tipos`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(dadosTipo)
        });
        
        const data = await res.json();
        
        if (!res.ok) {
            throw new Error(data.message || 'Erro ao adicionar tipo');
        }
        
        return data;
    } catch (error) {
        console.error('Erro ao adicionar tipo:', error);
        throw error;
    }
};

// Editar tipo existente
export const editarTipo = async (idTipo, dadosTipo) => {
    try {
        const res = await fetch(`${API_URL}/tipos/${idTipo}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(dadosTipo)
        });
        
        const data = await res.json();
        
        if (!res.ok) {
            throw new Error(data.message || 'Erro ao editar tipo');
        }
        
        return data;
    } catch (error) {
        console.error('Erro ao editar tipo:', error);
        throw error;
    }
};

// Deletar tipo
export const deletarTipo = async (idTipo) => {
    try {
        const res = await fetch(`${API_URL}/tipos/${idTipo}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        
        const data = await res.json();
        
        if (!res.ok) {
            throw new Error(data.message || 'Erro ao deletar tipo');
        }
        
        return data;
    } catch (error) {
        console.error('Erro ao deletar tipo:', error);
        throw error;
    }
};

// =====================================================
// UNIDADES
// =====================================================

// Listar todas as unidades
export const listarUnidades = async () => {
    try {
        const res = await fetch(`${API_URL}/unidades`);
        if (!res.ok) throw new Error('Erro ao listar unidades');
        return await res.json();
    } catch (error) {
        console.error('Erro ao listar unidades:', error);
        throw error;
    }
};

// Adicionar nova unidade
export const adicionarUnidade = async (dadosUnidade) => {
    try {
        const res = await fetch(`${API_URL}/unidades`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(dadosUnidade)
        });
        
        const data = await res.json();
        
        if (!res.ok) {
            throw new Error(data.message || 'Erro ao adicionar unidade');
        }
        
        return data;
    } catch (error) {
        console.error('Erro ao adicionar unidade:', error);
        throw error;
    }
};

// Editar unidade existente
export const editarUnidade = async (idUnidade, dadosUnidade) => {
    try {
        const res = await fetch(`${API_URL}/unidades/${idUnidade}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(dadosUnidade)
        });
        
        const data = await res.json();
        
        if (!res.ok) {
            throw new Error(data.message || 'Erro ao editar unidade');
        }
        
        return data;
    } catch (error) {
        console.error('Erro ao editar unidade:', error);
        throw error;
    }
};

// Deletar unidade
export const deletarUnidade = async (idUnidade) => {
    try {
        const res = await fetch(`${API_URL}/unidades/${idUnidade}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        
        const data = await res.json();
        
        if (!res.ok) {
            throw new Error(data.message || 'Erro ao deletar unidade');
        }
        
        return data;
    } catch (error) {
        console.error('Erro ao deletar unidade:', error);
        throw error;
    }
};