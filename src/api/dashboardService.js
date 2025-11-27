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

            const data = await response.json();
            return data.drafts || [];
        } catch (error) {
            console.error('Error fetching drafts:', error);
            return [];
        }
    },
    async fetchSessionMessages(sessionId) {
        const token = authService.getToken();
        if (!token) return [];

        try {
            const response = await fetch(`${API_URL}/sessions/${sessionId}/messages`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch messages');
            }

            const data = await response.json();
            return data.messages || [];
        } catch (error) {
            console.error('Error fetching messages:', error);
            return [];
        }
    },
    async clearAllData() {
        const token = authService.getToken();
        if (!token) return;

        try {
            const responses = await Promise.all([
                fetch(`${API_URL}/sessions`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`${API_URL}/drafts`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);

            responses.forEach(response => {
                if (!response.ok) {
                    throw new Error(`Failed to clear data: ${response.status} ${response.statusText}`);
                }
            });
        } catch (error) {
            console.error('Error clearing data:', error);
            throw error;
        }
    },

    async deleteSession(id) {
        const token = authService.getToken();
        if (!token) throw new Error('No token');

        try {
            const response = await fetch(`${API_URL}/sessions/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                throw new Error('Failed to delete session');
            }
        } catch (error) {
            console.error('Error deleting session:', error);
            throw error;
        }
    },

    async deleteDraft(id) {
        const token = authService.getToken();
        if (!token) throw new Error('No token');

        try {
            const response = await fetch(`${API_URL}/drafts/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                throw new Error('Failed to delete draft');
            }
        } catch (error) {
            console.error('Error deleting draft:', error);
            throw error;
        }
    },

    async createSession(title) {
        const token = authService.getToken();
        if (!token) throw new Error('No token');

        try {
            const response = await fetch(`${API_URL}/sessions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ title })
            });

            if (!response.ok) {
                throw new Error('Failed to create session');
            }

            return await response.json();
        } catch (error) {
            console.error('Error creating session:', error);
            throw error;
        }
    }
};
