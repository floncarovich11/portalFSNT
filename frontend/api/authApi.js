export const login = async (credentials) => {
    try {
        const res = await fetch('http://localhost:3000/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials)
        });
        if (!res.ok) throw new Error('Erro no login');
        return await res.json();
    } catch (error) {
        console.error('Erro ao fazer login:', error);
        throw error;
    }
};

export const register = async (userData) => {
    try {
        const res = await fetch('http://localhost:3000/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        if (!res.ok) throw new Error('Erro ao registrar usuário');
        return await res.json();
    } catch (error) {
        console.error('Erro ao registrar usuário:', error);
        throw error;
    }
};