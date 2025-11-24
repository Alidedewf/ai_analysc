const API_URL = 'http://localhost:8080';

export const authService = {
    async login(email, password) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (email && password) {
                    resolve({
                        token: 'mock-jwt-token-12345',
                        user: {
                            id: 1,
                            email: email,
                            name: 'Test User'
                        }
                    });
                } else {
                    reject(new Error('Invalid credentials'));
                }
            }, 500);
        });
    },

    async register(fullName, email, password) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (email && password && fullName) {
                    resolve({
                        token: 'mock-jwt-token-67890',
                        user: {
                            id: 2,
                            email: email,
                            name: fullName
                        }
                    });
                } else {
                    reject(new Error('Registration failed'));
                }
            }, 500);
        });
    },

    async logout() {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve();
            }, 500);
        });
    }
};
