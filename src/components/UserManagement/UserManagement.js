import React, { useState } from 'react';
import { X, UserPlus, Check } from 'lucide-react';
import { authService } from '../../api/authService';
import styles from './UserManagement.module.css';

export const UserManagement = ({ onClose }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'User'
    });
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccess(false);

        try {
            await authService.createUser(
                formData.name,
                formData.email,
                formData.password,
                formData.role
            );
            setSuccess(true);
            setFormData({ name: '', email: '', password: '', role: 'User' });
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h2>Управление командой</h2>
                    <button onClick={onClose} className={styles.closeBtn}>
                        <X size={20} />
                    </button>
                </div>

                <div className={styles.content}>
                    <h3>Добавить нового сотрудника</h3>

                    {success && (
                        <div className={styles.successMessage}>
                            <Check size={16} /> Пользователь успешно создан
                        </div>
                    )}

                    {error && (
                        <div className={styles.errorMessage}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className={styles.form}>
                        <div className={styles.inputGroup}>
                            <label>Имя</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                required
                                placeholder="Иван Иванов"
                            />
                        </div>

                        <div className={styles.inputGroup}>
                            <label>Email</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                required
                                placeholder="ivan@company.com"
                            />
                        </div>

                        <div className={styles.inputGroup}>
                            <label>Пароль</label>
                            <input
                                type="text"
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                required
                                placeholder="Пароль"
                            />
                        </div>

                        <div className={styles.inputGroup}>
                            <label>Роль / Профессия</label>
                            <select
                                value={formData.role}
                                onChange={e => setFormData({ ...formData, role: e.target.value })}
                                className={styles.select}
                            >
                                <option value="User">Пользователь</option>
                                <option value="Business Analyst">Бизнес Аналитик</option>
                                <option value="Developer">Разработчик</option>
                                <option value="Manager">Менеджер</option>
                                <option value="Designer">Дизайнер</option>
                            </select>
                        </div>

                        <button type="submit" className={styles.submitBtn} disabled={isLoading}>
                            {isLoading ? 'Создание...' : (
                                <>
                                    <UserPlus size={18} />
                                    Создать пользователя
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};
