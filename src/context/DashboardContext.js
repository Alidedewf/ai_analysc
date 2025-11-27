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
        loadSessions();
    }, []);

    const loadSessions = async () => {
        const [sessions, drafts] = await Promise.all([
            dashboardService.fetchSessions(),
            dashboardService.fetchDrafts()
        ]);

        const newTasks = { reviewing: [], accepted: [], rejected: [] };
        const newContent = {};

        // Process sessions
        sessions.forEach(session => {
            const task = {
                id: session.id,
                title: session.title || `Session #${session.id}`,
                date: new Date(session.created_at * 1000).toLocaleDateString()
            };

            const status = session.status || 'reviewing';
            if (newTasks[status]) {
                newTasks[status].push(task);
            } else {
                newTasks.reviewing.push(task);
            }

            newContent[session.id] = {
                type: 'chat',
                title: task.title,
                content: 'Chat session content...'
            };
        });

        // Process drafts (add to 'reviewing' or a new section if UI supported it, for now adding to reviewing as 'Draft: ...')
        // Or better, let's keep them separate in state if we want a separate section in Sidebar.
        // But Sidebar uses `tasks` object. Let's add a 'documents' key to tasks.
        newTasks.documents = [];

        drafts.forEach(draft => {
            const docTask = {
                id: `draft-${draft.ID}`,
                title: draft.title,
                date: new Date(draft.created_at * 1000).toLocaleDateString(),
                isDraft: true,
                originalId: draft.ID,
                sessionId: draft.session_id || null
            };
            newTasks.documents.push(docTask);

            const contentData = {
                type: 'document',
                title: draft.title,
                content: draft.content
            };

            newContent[`draft-${draft.ID}`] = contentData;

            // If this draft belongs to a session, also update the session's content
            if (draft.session_id && newContent[draft.session_id]) {
                newContent[draft.session_id] = {
                    ...newContent[draft.session_id],
                    ...contentData,
                    type: 'document' // Override type to document so Note renders it
                };
            }
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
            await loadSessions(); // Refresh list to sync with backend

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
            await loadSessions(); // Refresh list

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

    const refreshDrafts = async () => {
        const drafts = await dashboardService.fetchDrafts();
        const newDocuments = [];
        const newContentUpdates = {};

        drafts.forEach(draft => {
            const docTask = {
                id: `draft-${draft.ID}`,
                title: draft.title,
                date: new Date(draft.created_at * 1000).toLocaleDateString(),
                isDraft: true,
                originalId: draft.ID,
                sessionId: draft.session_id || null
            };
            newDocuments.push(docTask);

            newContentUpdates[`draft-${draft.ID}`] = {
                type: 'document',
                title: draft.title,
                content: draft.content
            };

            // If this draft belongs to a session, also update the session's content in the update map
            if (draft.session_id) {
                // We need to know if the session exists in allContent to update it safely,
                // but here we are just preparing updates.
                // We can assume if we have a session_id, we want to update that key too.
                newContentUpdates[draft.session_id] = {
                    type: 'document',
                    title: draft.title,
                    content: draft.content
                };
            }
        });

        setTasks(prev => ({
            ...prev,
            documents: newDocuments
        }));

        setAllContent(prev => ({
            ...prev,
            ...newContentUpdates
        }));

        // Also reload sessions to update titles in the sidebar if they changed
        const sessions = await dashboardService.fetchSessions();
        setTasks(prev => {
            const updatedReviewing = prev.reviewing.map(task => {
                const session = sessions.find(s => s.id === task.id);
                if (session) {
                    return { ...task, title: session.title };
                }
                return task;
            });
            return { ...prev, reviewing: updatedReviewing };
        });
    };



    return (
        <DashboardContext.Provider value={{ selectedTask, setSelectedTask, tasks, allContent, addTask, clearAll, moveTask, refreshDrafts, createNewProject, deleteItem }}>
            {children}
        </DashboardContext.Provider>
    );
};

export const useDashboard = () => useContext(DashboardContext);
