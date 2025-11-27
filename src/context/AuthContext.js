import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../api/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            if (token) {
                try {
                    const user = await authService.getCurrentUser();
                    if (user) {
                        setUser(user);
                    } else {
                        // Token invalid or expired
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                        setToken(null);
                        setUser(null);
                    }
                } catch (error) {
                    console.error('Auth initialization error:', error);
                    localStorage.removeItem('token');
                    setToken(null);
                }
            }
            setIsLoading(false);
        };

        initAuth();
    }, [token]);

    const login = async (email, password) => {
        const data = await authService.login(email, password);
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('token', data.token);
    };

    const register = async (fullName, email, password) => {
        const data = await authService.register(fullName, email, password);
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('token', data.token);
    };

    const logout = async () => {
        await authService.logout();
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
    };

    return (
        <AuthContext.Provider value={{ user, token, login, register, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
