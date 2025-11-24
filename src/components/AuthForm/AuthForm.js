import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import styles from './AuthForm.module.css';

export const AuthForm = () => {
    const { login, register } = useAuth();
    const navigate = useNavigate();
    const [mode, setMode] = useState('login');
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        fullName: '',
    });

    const validate = () => {
        const newErrors = {};

        if (!formData.email) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Invalid email address';
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        if (mode === 'register' && !formData.fullName) {
            newErrors.fullName = 'Full name is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        setIsLoading(true);
        try {
            if (mode === 'login') {
                await login(formData.email, formData.password);
            } else {
                await register(formData.fullName, formData.email, formData.password);
            }

            // alert(`Successfully ${mode === 'login' ? 'logged in' : 'registered'}!`);
            navigate('/app');
        } catch (error) {
            console.error(error);
            alert('Authentication failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.tabs}>
                <button
                    className={`${styles.tab} ${mode === 'login' ? styles.active : ''}`}
                    onClick={() => setMode('login')}
                >
                    Login
                </button>
                <button
                    className={`${styles.tab} ${mode === 'register' ? styles.active : ''}`}
                    onClick={() => setMode('register')}
                >
                    Register
                </button>
            </div>

            <form className={styles.form} onSubmit={handleSubmit}>
                {mode === 'register' && (
                    <div className={styles.inputGroup}>
                        <label className={styles.label}>Full Name</label>
                        <input
                            type="text"
                            className={styles.input}
                            value={formData.fullName}
                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                            placeholder="John Doe"
                        />
                        {errors.fullName && <span className={styles.error}>{errors.fullName}</span>}
                    </div>
                )}

                <div className={styles.inputGroup}>
                    <label className={styles.label}>Email</label>
                    <input
                        type="email"
                        className={styles.input}
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="john@example.com"
                    />
                    {errors.email && <span className={styles.error}>{errors.email}</span>}
                </div>

                <div className={styles.inputGroup}>
                    <label className={styles.label}>Password</label>
                    <input
                        type="password"
                        className={styles.input}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="••••••••"
                    />
                    {errors.password && <span className={styles.error}>{errors.password}</span>}
                </div>

                <button type="submit" className={styles.submitButton} disabled={isLoading}>
                    {isLoading ? <div className={styles.spinner} /> : (mode === 'login' ? 'Sign In' : 'Create Account')}
                </button>
            </form>
        </div>
    );
};
