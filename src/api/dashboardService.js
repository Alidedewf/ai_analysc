import { authService } from './authService';

const API_URL = 'https://ai-ba-backend.onrender.com';

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
    async fetchBusinessRequests() {
        const token = authService.getToken();
        if (!token) return { reviewing: [], accepted: [], rejected: [] };

        try {
            const response = await fetch(`${API_URL}/api/requests`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch business requests');
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching business requests:', error);
            return { reviewing: [], accepted: [], rejected: [] };
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
    },

    async createDraft(title, content) {
        const token = authService.getToken();
        if (!token) throw new Error('No token');

        try {
            const response = await fetch(`${API_URL}/drafts`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title: title,
                    request: content // Backend expects 'request' field
                })
            });

            if (!response.ok) {
                throw new Error('Failed to create draft');
            }

            return await response.json();
        } catch (error) {
            console.error('Error creating draft:', error);
            throw error;
        }
    },

    async downloadDraft(id) {
        const token = authService.getToken();
        if (!token) throw new Error('No token');

        try {
            const response = await fetch(`${API_URL}/drafts/${id}/download`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to download draft');
            }

            // Return blob for download
            return await response.blob();
        } catch (error) {
            console.error('Error downloading draft:', error);
            throw error;
        }
    },

    async approveDraft(id) {
        const token = authService.getToken();
        if (!token) throw new Error('No token');

        try {
            const response = await fetch(`${API_URL}/drafts/${id}/approve`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to approve draft');
            }
        } catch (error) {
            console.error('Error approving draft:', error);
            throw error;
        }
    },

    async checkHealth() {
        try {
            const response = await fetch(`${API_URL}/health`);
            return response.ok;
        } catch (error) {
            console.error('Health check failed:', error);
            return false;
        }
    }
};
