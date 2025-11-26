import React, { createContext, useState, useContext, useEffect } from 'react';
import { dashboardService } from '../api/dashboardService';

const DashboardContext = createContext(null);

const INITIAL_TASKS = {
    reviewing: [
        { id: 1, title: 'бизнес задача' },
        { id: 2, title: 'бизнес задача' },
        { id: 3, title: 'бизнес задача' },
    ],
    accepted: [
        { id: 4, title: 'Принятая задача 1' },
        { id: 5, title: 'Принятая задача 2' },
    ],
    rejected: [
        { id: 6, title: 'Отклоненная задача 1' },
    ]
};

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
                originalId: draft.ID
            };
            newTasks.documents.push(docTask);

            newContent[`draft-${draft.ID}`] = {
                type: 'document',
                title: draft.title,
                content: draft.content
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
            reviewing: [newTask, ...prev.reviewing]
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

    return (
        <DashboardContext.Provider value={{ selectedTask, setSelectedTask, tasks, allContent, addTask }}>
            {children}
        </DashboardContext.Provider>
    );
};

export const useDashboard = () => useContext(DashboardContext);
