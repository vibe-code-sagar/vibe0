import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [token, setToken] = useState(() => localStorage.getItem('token'));
    const [user, setUser] = useState(() => {
        const email = localStorage.getItem('userEmail');
        return email ? { email } : null;
    });

    function login(accessToken, email) {
        localStorage.setItem('token', accessToken);
        localStorage.setItem('userEmail', email);
        setToken(accessToken);
        setUser({ email });
    }

    function logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('userEmail');
        setToken(null);
        setUser(null);
    }

    const isAuthenticated = Boolean(token);

    return (
        <AuthContext.Provider value={{ token, user, isAuthenticated, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
    return ctx;
}
