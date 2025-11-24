import React from 'react';
import { Sidebar } from '../../components/Sidebar/Sidebar';
import { DashboardProvider } from '../../context/DashboardContext';
import styles from './DashboardLayout.module.css';

export const DashboardLayout = ({ children }) => {
    return (
        <DashboardProvider>
            <div className={styles.container}>
                <Sidebar />
                <main className={styles.mainContent}>
                    {children}
                </main>
            </div>
        </DashboardProvider>
    );
};
