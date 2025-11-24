const API_URL = 'http://localhost:8080';

export const authService = {
    async login(email, password) {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
            throw new Error('Login failed');
        }

        return response.json();
    },

    async register(fullName, email, password) {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ full_name: fullName, email, password }),
        });

        if (!response.ok) {
            throw new Error('Registration failed');
        }

        return response.json();
    },
};
