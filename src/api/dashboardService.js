import { authService } from './authService';

const API_URL = 'http://localhost:9000';

export const dashboardService = {
    async fetchSessions() {
        const token = authService.getToken();
        if (!token) return [];

        try {
            const response = await fetch(`${API_URL}/sessions`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch sessions');
            }

            const data = await response.json();
            return data.sessions || [];
        } catch (error) {
            console.error('Fetch sessions error:', error);
            return [];
        }
    },
    async fetchDrafts() {
        const token = authService.getToken();
        if (!token) return [];

        try {
            const response = await fetch(`${API_URL}/drafts`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch drafts');
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching drafts:', error);
            return [];
        }
    }
};
