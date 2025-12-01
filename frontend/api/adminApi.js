// =====================================================
// API DE ADMINISTRAÇÃO - PORTAL FSNT (SEM JWT)
// =====================================================
import { getCurrentUserFromToken, getAuthHeaders } from './authApi.js';

const API_BASE_URL = 'http://localhost:3000';

// =====================================================
// AUX: obter usuário completo do localStorage
function getUsuario() {
    try {
        // agora usa o token para obter payload
        const usuario = getCurrentUserFromToken();
        return usuario || null;
    } catch (e) {
        console.error('❌ Erro ao ler token:', e);
        return null;
    }
}

// =====================================================
// AUX: obter id do usuário logado
function getUsuarioId() {
    const usuario = getUsuario();
    if (!usuario) {
        return null;
    }
    
    // Tentar diferentes formatos possíveis
    return usuario.id_usuario || usuario.id || usuario.userId || usuario.ID;
}

// =====================================================
// LISTAR TODOS OS USUÁRIOS
// =====================================================
export const listarUsuarios = async () => {
    try {
        const id = getUsuarioId();
        
        if (!id) {
            alert('Sessão expirada. Por favor, faça login novamente.');
            throw new Error('ID do usuário logado não encontrado.');
        }
        
        const res = await fetch(`${API_BASE_URL}/admin/usuarios?id_usuario=${id}`, {
            method: 'GET',
            headers: getAuthHeaders()
        });
        
        const data = await res.json();
        
        if (!res.ok) {
            throw new Error(data.message || 'Erro ao listar usuários');
        }
        
        return data;
    } catch (error) {
        console.error('❌ Erro ao listar usuários:', error);
        throw error;
    }
};

// =====================================================
// FILTRAR USUÁRIOS POR TIPO
// =====================================================
export const filtrarUsuariosPorTipo = async (tipo) => {
    try {
        const data = await listarUsuarios();
        
        if (!data || !Array.isArray(data.usuarios)) {
            return { total: 0, usuarios: [] };
        }
        
        const usuariosFiltrados = data.usuarios.filter(u => u.tipo_usuario === tipo);
        
        return { total: usuariosFiltrados.length, usuarios: usuariosFiltrados };
    } catch (error) {
        console.error(`❌ Erro ao filtrar usuários:`, error);
        throw error;
    }
};

// =====================================================
// LISTAR APENAS FUNCIONÁRIOS
// =====================================================
export const listarFuncionarios = async () => {
    return await filtrarUsuariosPorTipo('Funcionario');
};

// =====================================================
// LISTAR APENAS TÉCNICOS
// =====================================================
export const listarTecnicos = async () => {
    return await filtrarUsuariosPorTipo('TI');
};

// =====================================================
// PROMOVER USUÁRIO A TÉCNICO
// =====================================================
export const promoverTecnico = async (email) => {
    try {
        const id_usuario = getUsuarioId();
        
        if (!id_usuario) {
            alert('Sessão expirada. Por favor, faça login novamente.');
            throw new Error('ID do usuário logado não encontrado.');
        }
        
        const res = await fetch(`${API_BASE_URL}/admin/promover-tecnico`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ email, id_usuario })
        });
        
        const data = await res.json();
        
        if (!res.ok) {
            throw new Error(data.message || 'Erro ao promover usuário');
        }
        
        return data;
    } catch (error) {
        console.error('❌ Erro ao promover usuário:', error);
        throw error;
    }
};

// =====================================================
// REMOVER STATUS DE TÉCNICO
// =====================================================
export const removerTecnico = async (email) => {
    try {
        const id_usuario = getUsuarioId();
        
        if (!id_usuario) {
            alert('Sessão expirada. Por favor, faça login novamente.');
            throw new Error('ID do usuário logado não encontrado.');
        }
        
        const res = await fetch(`${API_BASE_URL}/admin/remover-tecnico`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ email, id_usuario })
        });
        
        const data = await res.json();
        
        if (!res.ok) {
            throw new Error(data.message || 'Erro ao remover técnico');
        }
        
        return data;
    } catch (error) {
        console.error('❌ Erro ao remover técnico:', error);
        throw error;
    }
};

// =====================================================
// VERIFICAR SE USUÁRIO É ADMINISTRADOR
// =====================================================
export const verificarAdmin = () => {
    try {
        const usuario = getUsuario();
        if (!usuario) return false;
        return usuario.tipo_usuario === 'Administrador';
    } catch (error) {
        console.error('❌ Erro ao verificar permissão de admin:', error);
        return false;
    }
};

// =====================================================
// REDIRECIONAR SE NÃO FOR ADMIN
// =====================================================
export const redirecionarSeNaoAdmin = (urlRedirect = '/frontend/pages/home/home.html') => {
    if (!verificarAdmin()) {
        alert('Você não tem permissão para acessar esta página.');
        window.location.href = urlRedirect;
        return false;
    }
    return true;
};