// Implementação do sistema de autenticação
class Auth {
    constructor() {
        this.isLoggedIn = false;
        this.currentUser = null;
        this.sessionKey = 'guia_encaminhamento_session';
        this.sessionTimeout = 24 * 60 * 60 * 1000; // 24 horas em milissegundos
        
        // Verificar sessão ao inicializar
        this.checkSession();
    }
    
    // Verificar se existe uma sessão válida
    checkSession() {
        const sessionData = localStorage.getItem(this.sessionKey);
        
        if (sessionData) {
            try {
                const session = JSON.parse(sessionData);
                
                // Verificar se a sessão não expirou
                if (session.expiry > Date.now()) {
                    this.isLoggedIn = true;
                    this.currentUser = session.user;
                    return true;
                } else {
                    // Sessão expirada, remover
                    this.logout();
                }
            } catch (error) {
                console.error('Erro ao verificar sessão:', error);
                this.logout();
            }
        }
        
        return false;
    }
    
    // Realizar login
    async login(username, password) {
        try {
            // Buscar usuário no banco de dados
            const user = await db.usuarios
                .where('username')
                .equals(username)
                .first();
            
            if (user && user.password === password) { // Em produção, usar comparação de hash
                // Criar sessão
                this.isLoggedIn = true;
                this.currentUser = user;
                
                // Salvar sessão no localStorage
                const session = {
                    user: user,
                    expiry: Date.now() + this.sessionTimeout
                };
                
                localStorage.setItem(this.sessionKey, JSON.stringify(session));
                
                // Atualizar último acesso
                await db.usuarios.update(user.id, {
                    ultimoAcesso: new Date()
                });
                
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('Erro ao realizar login:', error);
            return false;
        }
    }
    
    // Realizar logout
    logout() {
        this.isLoggedIn = false;
        this.currentUser = null;
        localStorage.removeItem(this.sessionKey);
    }
    
    // Verificar se o usuário está logado
    isAuthenticated() {
        return this.isLoggedIn && this.currentUser !== null;
    }
    
    // Verificar se o usuário é administrador
    isAdmin() {
        return this.isAuthenticated() && this.currentUser.tipo === 'admin';
    }
    
    // Obter usuário atual
    getCurrentUser() {
        return this.currentUser;
    }
    
    // Alterar senha do usuário atual
    async changePassword(currentPassword, newPassword) {
        if (!this.isAuthenticated()) {
            return false;
        }
        
        try {
            // Verificar senha atual
            if (this.currentUser.password !== currentPassword) { // Em produção, usar comparação de hash
                return false;
            }
            
            // Atualizar senha
            await db.usuarios.update(this.currentUser.id, {
                password: newPassword // Em produção, usar hash
            });
            
            // Atualizar usuário atual
            this.currentUser.password = newPassword;
            
            // Atualizar sessão
            const session = {
                user: this.currentUser,
                expiry: Date.now() + this.sessionTimeout
            };
            
            localStorage.setItem(this.sessionKey, JSON.stringify(session));
            
            return true;
        } catch (error) {
            console.error('Erro ao alterar senha:', error);
            return false;
        }
    }
}

// Criar instância global do sistema de autenticação
const auth = new Auth();

// Exportar a instância
window.auth = auth;
