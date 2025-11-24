import React, { createContext, useState, useContext } from 'react';

const DashboardContext = createContext(null);

export const DashboardProvider = ({ children }) => {
    const [selectedTask, setSelectedTask] = useState({
        id: 'default',
        title: 'общий (Пример каналы)',
        date: 'Вчера'
    });

    return (
        <DashboardContext.Provider value={{ selectedTask, setSelectedTask }}>
            {children}
        </DashboardContext.Provider>
    );
};

export const useDashboard = () => useContext(DashboardContext);
