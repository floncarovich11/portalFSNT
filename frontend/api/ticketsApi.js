const API_URL = 'http://localhost:3000/tickets';

function getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': 'Bearer ' + token } : {})
    };
}

// Criar chamado
export const criarChamado = async (dadosChamado) => {
    try {
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(dadosChamado)  
        });
        
        const data = await res.json();
        
        if (!res.ok) {
            throw new Error(data.message || 'Erro ao criar chamado');
        }
        
        return data;
    } catch (error) {
        console.error('Erro ao criar chamado:', error);
        throw error;
    }
};

// Listar todos os chamados
export const listarChamados = async () => {
    try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error('Erro ao listar chamados');
        return await res.json();
    } catch (error) {
        console.error('Erro ao listar chamados:', error);
        throw error;
    }
};

// Buscar chamado por ID
export const buscarChamado = async (id) => {
    try {
        const res = await fetch(`${API_URL}/${id}`, { headers: getAuthHeaders() }); // add auth
        if (!res.ok) throw new Error('Erro ao buscar chamado');
        return await res.json();
    } catch (error) {
        console.error('Erro ao buscar chamado:', error);
        throw error;
    }
};

// Buscar chamados por usuário
export const meusChamados = async (idUsuario) => {
    try {
        const res = await fetch(`${API_URL}/user/${idUsuario}`, { headers: getAuthHeaders() }); // add auth
        if (!res.ok) throw new Error('Erro ao buscar seus chamados');
        return await res.json();
    } catch (error) {
        console.error('Erro ao buscar seus chamados:', error);
        throw error;
    }
};

// Atualizar status do chamado
export const atualizarStatus = async (id, dados) => {
    try {
        const res = await fetch(`${API_URL}/${id}/status`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(dados)
        });
        if (!res.ok) throw new Error('Erro ao atualizar status');
        return await res.json();
    } catch (error) {
        console.error('Erro ao atualizar status:', error);
        throw error;
    }
};

// Atribuir técnico
export const atribuirTecnico = async (id, dados) => {
    try {
        const res = await fetch(`${API_URL}/${id}/atribuir`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(dados)
        });
        if (!res.ok) throw new Error('Erro ao atribuir técnico');
        return await res.json();
    } catch (error) {
        console.error('Erro ao atribuir técnico:', error);
        throw error;
    }
};

// Adicionar comentário
export const adicionarComentario = async (id, idUsuario, comentario) => {
    try {
        const res = await fetch(`${API_URL}/${id}/comment`, { // ✅ Corrigido
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_usuario: idUsuario, comentario })
        });
        if (!res.ok) throw new Error('Erro ao adicionar comentário');
        return await res.json();
    } catch (error) {
        console.error('Erro ao adicionar comentário:', error);
        throw error;
    }
};

// Ver histórico do chamado
export const verHistorico = async (id) => {
    try {
        const res = await fetch(`${API_URL}/${id}/history`); // ✅ Corrigido
        if (!res.ok) throw new Error('Erro ao buscar histórico');
        return await res.json();
    } catch (error) {
        console.error('Erro ao buscar histórico:', error);
        throw error;
    }
};

// Deletar chamado
export const deletarChamado = async (id) => {
    try {
        const res = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        if (!res.ok) throw new Error('Erro ao deletar chamado');
        return await res.json();
    } catch (error) {
        console.error('Erro ao deletar chamado:', error);
        throw error;
    }
};

// Buscar tipos de solicitação
export const buscarTiposSolicitacao = async () => {
    try {
        const res = await fetch(`${API_URL}/tipos-solicitacao`, { headers: getAuthHeaders() });
        if (!res.ok) throw new Error('Erro ao buscar tipos de solicitação');
        return await res.json();
    } catch (error) {
        console.error('Erro ao buscar tipos de solicitação:', error);
        throw error;
    }
};

// Buscar unidades
export const buscarUnidades = async () => {
    try {
        const res = await fetch('http://localhost:3000/unidades');
        if (!res.ok) throw new Error('Erro ao buscar unidades');
        return await res.json();
    } catch (error) {
        console.error('Erro ao buscar unidades:', error);
        throw error;
    }
};

// Listar técnicos disponíveis
export const listarTecnicos = async () => {
    try {
        const res = await fetch(`${API_URL}/tecnicos`);
        if (!res.ok) throw new Error('Erro ao listar técnicos');
        return await res.json();
    } catch (error) {
        console.error('Erro ao listar técnicos:', error);
        throw error;
    }
};

// Atualizar prioridade do chamado
export const atualizarPrioridade = async (idChamado, novaPrioridade, idUsuario) => {
    try {
        const res = await fetch(`${API_URL}/${idChamado}/prioridade`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ 
                nova_prioridade: novaPrioridade,
                id_usuario: idUsuario 
            })
        });
        
        if (!res.ok) {
            const errBody = await res.json().catch(() => ({}));
            throw new Error(errBody.message || 'Erro ao atualizar prioridade');
        }
        
        return await res.json();
    } catch (error) {
        console.error('Erro ao atualizar prioridade:', error);
        throw error;
    }
};