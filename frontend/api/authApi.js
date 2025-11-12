// =====================================================
// API DE AUTENTICAÇÃO - PORTAL FSNT
// =====================================================

const API_BASE_URL = 'http://localhost:3000';

// =====================================================
// LOGIN
// =====================================================
export const login = async (credentials) => {
    try {
        const res = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials)
        });
        
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || 'Erro no login');
        }
        
        return await res.json();
    } catch (error) {
        console.error('Erro ao fazer login:', error);
        throw error;
    }
};

// =====================================================
// REGISTRO
// =====================================================
export const register = async (userData) => {
    try {
        const res = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || 'Erro ao registrar usuário');
        }
        
        return await res.json();
    } catch (error) {
        console.error('Erro ao registrar usuário:', error);
        throw error;
    }
};

// =====================================================
// BUSCAR DADOS DO USUÁRIO
// =====================================================
export const getUsuario = async (idUsuario) => {
    try {
        console.log('Buscando usuário ID:', idUsuario);
        
        const res = await fetch(`${API_BASE_URL}/auth/usuario/${idUsuario}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || 'Erro ao buscar usuário');
        }
        
        const data = await res.json();
        console.log('Usuário carregado:', data);
        return data;
    } catch (error) {
        console.error('Erro ao buscar usuário:', error);
        throw error;
    }
};

// =====================================================
// ATUALIZAR PERFIL
// =====================================================
export const updatePerfil = async (idUsuario, dadosAtualizacao) => {
    try {
        console.log('Atualizando perfil ID:', idUsuario, dadosAtualizacao);
        
        const res = await fetch(`${API_BASE_URL}/auth/perfil/${idUsuario}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosAtualizacao)
        });
        
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || 'Erro ao atualizar perfil');
        }
        
        const data = await res.json();
        console.log('Perfil atualizado:', data);
        return data;
    } catch (error) {
        console.error('Erro ao atualizar perfil:', error);
        throw error;
    }
};