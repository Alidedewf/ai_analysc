import React from 'react';
import { AuthForm } from '../../components/AuthForm/AuthForm';
import styles from './AuthPage.module.css';

export const AuthPage = () => {
    return (
        <div className={styles.container}>
            <div className={styles.brandPanel}>
                <h1 className={styles.slogan}>
                    Forte AI Analyst
                </h1>
            </div>
            <div className={styles.formPanel}>
                <AuthForm />
            </div>
        </div>
    );
};
