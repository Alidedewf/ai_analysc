import React from 'react';
import { DashboardLayout } from '../../layouts/DashboardLayout/DashboardLayout';
import { Note } from '../../components/Note/Note';

export const DashboardPage = () => {
    return (
        <DashboardLayout>
            <Note />
        </DashboardLayout>
    );
};
