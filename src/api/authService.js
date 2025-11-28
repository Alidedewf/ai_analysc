const API_URL = 'https://ai-ba-backend.onrender.com';

export const authService = {
    async login(email, password) {
        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Login failed');
            }

            const data = await response.json();

            if (data.token) {
                localStorage.setItem('token', data.token);

                // Parse JWT to get user details (name, email)
                try {
                    const base64Url = data.token.split('.')[1];
                    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                    const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
                        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                    }).join(''));

                    const payload = JSON.parse(jsonPayload);
                    const user = {
                        id: payload.sub,
                        name: payload.name,
                        email: payload.email,
                        role: payload.role || (payload.email === 'admin@example.com' ? 'Business Analyst' : 'user')
                    };
                    localStorage.setItem('user', JSON.stringify(user));
                    return { ...data, user };
                } catch (e) {
                    console.error('Failed to parse JWT:', e);
                }
            }

            return data;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    },

    async register(name, email, password) {
        try {
            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, email, password }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Registration failed');
            }

            const data = await response.json();
            if (data.token) {
                localStorage.setItem('token', data.token);

                // Parse JWT to get user details (same as login)
                try {
                    const base64Url = data.token.split('.')[1];
                    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                    const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
                        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                    }).join(''));

                    const payload = JSON.parse(jsonPayload);
                    const user = {
                        id: payload.sub,
                        name: payload.name,
                        email: payload.email,
                        role: payload.role || (payload.email === 'admin@example.com' ? 'Business Analyst' : 'user')
                    };
                    localStorage.setItem('user', JSON.stringify(user));
                    return { ...data, user };
                } catch (e) {
                    console.error('Failed to parse JWT in register:', e);
                }
            }
            return data;
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    },

    async googleLogin(idToken) {
        try {
            const response = await fetch(`${API_URL}/auth/google`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ idToken }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Google login failed');
            }

            const data = await response.json();
            if (data.token) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
            }
            return data;
        } catch (error) {
            console.error('Google login error:', error);
            throw error;
        }
    },

    async createUser(name, email, password, role, position) {
        const token = this.getToken();
        try {
            const response = await fetch(`${API_URL}/api/admin/users`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name, email, password, role, position }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to create user');
            }

            return await response.json();
        } catch (error) {
            console.error('Create user error:', error);
            throw error;
        }
    },

    async logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        return Promise.resolve();
    },

    getToken() {
        return localStorage.getItem('token');
    },

    getUser() {
        try {
            const userStr = localStorage.getItem('user');
            if (!userStr || userStr === 'undefined' || userStr === 'null') {
                return null;
            }
            return JSON.parse(userStr);
        } catch (e) {
            console.error('Error parsing user data:', e);
            try {
                localStorage.removeItem('user');
            } catch (err) {
                console.error('Failed to clear invalid user data:', err);
            }
            return null;
        }
    },

    async getCurrentUser() {
        const token = this.getToken();
        if (!token) return null;

        try {
            // Parse JWT to get user details (name, email)
            // We do this instead of calling /me because /me returns a string on the backend
            // and we are not allowed to change the backend.
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));

            const payload = JSON.parse(jsonPayload);
            const user = {
                id: payload.sub,
                name: payload.name,
                email: payload.email,
                role: payload.role || (payload.email === 'admin@example.com' ? 'Business Analyst' : 'user')
            };
            return user;
        } catch (error) {
            console.error('Get current user error:', error);
            return null;
        }
    }
};
