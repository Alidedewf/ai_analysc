import React, { createContext, useState, useContext, useEffect } from 'react';
import { dashboardService } from '../api/dashboardService';

const DashboardContext = createContext(null);



export const DashboardProvider = ({ children }) => {
    const [selectedTask, setSelectedTask] = useState({
        id: 'default',
        title: 'Select a task',
        date: ''
    });
    const [tasks, setTasks] = useState({ reviewing: [], accepted: [], rejected: [], documents: [] });
    const [allContent, setAllContent] = useState({});

    useEffect(() => {
        refreshData();
    }, []);

    const refreshData = async () => {
        const [sessions, requests] = await Promise.all([
            dashboardService.fetchSessions(),
            dashboardService.fetchBusinessRequests()
        ]);

        const newTasks = { reviewing: [], accepted: [], rejected: [], documents: [] };
        const newContent = {};

        // 1. Process Business Requests (Drafts) -> reviewing, accepted, rejected
        const processRequest = (draft, status) => {
            const task = {
                id: `draft-${draft.id}`,
                title: draft.title,
                date: new Date(draft.created_at).toLocaleDateString(),
                isDraft: true,
                originalId: draft.id,
                sessionId: draft.session_id || null,
                status: status
            };
            newTasks[status].push(task);

            newContent[`draft-${draft.id}`] = {
                type: 'document',
                title: draft.title,
                content: draft.content,
                structuredContent: draft.structured_content
            };
        };

        (requests.reviewing || []).forEach(d => processRequest(d, 'reviewing'));
        (requests.accepted || []).forEach(d => processRequest(d, 'accepted'));
        (requests.rejected || []).forEach(d => processRequest(d, 'rejected'));

        // 2. Process Sessions -> documents (Your Projects)
        sessions.forEach(session => {
            const task = {
                id: session.id,
                title: session.title || `Session #${session.id}`,
                date: new Date(session.created_at * 1000).toLocaleDateString()
            };
            newTasks.documents.push(task);

            newContent[session.id] = {
                type: 'chat',
                title: task.title,
                content: 'Chat session content...'
            };
        });

        setTasks(newTasks);
        setAllContent(newContent);
    };

    const addTask = (title, htmlContent) => {
        // This is for manual upload, kept for compatibility
        const newId = Date.now();
        const newTask = { id: newId, title, date: 'Today' };

        setTasks(prev => ({
            ...prev,
            documents: [newTask, ...prev.documents]
        }));

        setAllContent(prev => ({
            ...prev,
            [newId]: {
                type: 'uploaded',
                title: title,
                content: htmlContent
            }
        }));

        setSelectedTask(newTask);
    };

    const moveTask = (taskId, sourceCategory, targetCategory) => {
        if (sourceCategory === targetCategory) return;

        setTasks(prev => {
            const sourceList = prev[sourceCategory];
            const targetList = prev[targetCategory];
            const taskIndex = sourceList.findIndex(t => t.id === taskId);

            if (taskIndex === -1) return prev;

            const task = sourceList[taskIndex];
            const newSourceList = [...sourceList];
            newSourceList.splice(taskIndex, 1);

            const newTargetList = [task, ...targetList];

            return {
                ...prev,
                [sourceCategory]: newSourceList,
                [targetCategory]: newTargetList
            };
        });
    };

    const clearAll = async () => {
        try {
            await dashboardService.clearAllData();
            setTasks({ reviewing: [], accepted: [], rejected: [], documents: [] });
            setAllContent({});
            setSelectedTask({
                id: 'default',
                title: 'Select a task',
                date: ''
            });
        } catch (error) {
            console.error('Failed to clear data:', error);
        }
    };

    const deleteItem = async (id, type) => {
        try {
            if (type === 'document') {
                // Extract numeric ID from "draft-123"
                const draftId = id.replace('draft-', '');
                await dashboardService.deleteDraft(draftId);
            } else {
                // Session
                await dashboardService.deleteSession(id);
            }
            await refreshData(); // Refresh list to sync with backend

            // If deleted item was selected, deselect it
            if (selectedTask?.id === id) {
                setSelectedTask({
                    id: 'default',
                    title: 'Select a task',
                    date: ''
                });
            }
        } catch (error) {
            console.error('Failed to delete item:', error);
        }
    };

    const [isCreating, setIsCreating] = useState(false);

    const createNewProject = async () => {
        if (isCreating) return;
        setIsCreating(true);
        try {
            const session = await dashboardService.createSession('New Project');
            await refreshData(); // Refresh list

            // Select the new session immediately
            setSelectedTask({
                id: session.session_id,
                title: session.title || 'New Project',
                date: 'Сегодня'
            });
        } catch (error) {
            console.error('Failed to create project:', error);
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <DashboardContext.Provider value={{ selectedTask, setSelectedTask, tasks, allContent, addTask, clearAll, moveTask, refreshData, createNewProject, deleteItem }}>
            {children}
        </DashboardContext.Provider>
    );
};

export const useDashboard = () => useContext(DashboardContext);
