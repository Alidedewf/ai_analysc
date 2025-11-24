import React, { useState } from 'react';
import {
    Search,
    Plus,
    History,
    FileText,
    CheckCircle,
    XCircle,
    LogOut,
    Bell
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useDashboard } from '../../context/DashboardContext';
import styles from './Sidebar.module.css';

const MOCK_TASKS = {
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

const SECTIONS = [
    { id: 'reviewing', label: 'Рассматривается', icon: History },
    { id: 'accepted', label: 'Приняты', icon: CheckCircle },
    { id: 'rejected', label: 'Отклоненные', icon: XCircle },
];

const MOCK_HISTORY = [
    { id: 1, title: 'общий (Пример каналы)', date: 'Вчера' },
    { id: 2, title: 'Анализ конкурентов', date: '2 дня назад' },
];

export const Sidebar = () => {
    const { user, logout } = useAuth();
    const { setSelectedTask } = useDashboard();
    const [expandedSections, setExpandedSections] = useState({ reviewing: true });

    const toggleSection = (sectionId) => {
        setExpandedSections(prev => ({
            ...prev,
            [sectionId]: !prev[sectionId]
        }));
    };

    const handleTaskClick = (task) => {
        setSelectedTask({ ...task, date: 'Сегодня' }); 
    };

    return (
        <aside className={styles.sidebar}>
            <div className={styles.header}>
                <div className={styles.logo}>
                    <div className={styles.logoIcon}>F</div>
                    <span className={styles.logoText}>AI business analyst</span>
                </div>
                <button className={styles.notificationBtn}>
                    <Bell size={20} />
                </button>
            </div>

            <div className={styles.searchContainer}>
                <Search className={styles.searchIcon} size={18} />
                <input
                    type="text"
                    placeholder="Поиск"
                    className={styles.searchInput}
                />
            </div>

            <button className={styles.newChatBtn}>
                <Plus size={20} />
                <span>Новый проект</span>
            </button>

            <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Запросы</h3>

                {SECTIONS.map(section => (
                    <div key={section.id} className={`${styles.menuItem} ${expandedSections[section.id] ? styles.active : ''}`}>
                        <div
                            className={styles.menuHeader}
                            onClick={() => toggleSection(section.id)}
                        >
                            <section.icon size={18} />
                            <span>{section.label}</span>
                        </div>
                        {expandedSections[section.id] && (
                            <div className={styles.subMenu}>
                                {MOCK_TASKS[section.id].map(task => (
                                    <div
                                        key={task.id}
                                        className={styles.subMenuItem}
                                        onClick={() => handleTaskClick(task)}
                                    >
                                        <FileText size={16} />
                                        <span>{task.title}</span>
                                    </div>
                                ))}
                                {MOCK_TASKS[section.id].length === 0 && (
                                    <div className={styles.subMenuItem} style={{ fontStyle: 'italic', color: '#999' }}>
                                        Нет задач
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className={styles.section}>
                <h3 className={styles.sectionTitle}>История чатов</h3>
                <div className={styles.historyList}>
                    {MOCK_HISTORY.map(chat => (
                        <div key={chat.id} className={styles.historyItem}>
                            <span className={styles.historyTitle}>{chat.title}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className={styles.footer}>
                <div className={styles.userProfile}>
                    <div className={styles.avatar}>
                        {user?.name?.[0] || 'U'}
                    </div>
                    <div className={styles.userInfo}>
                        <span className={styles.userName}>{user?.name}</span>
                        <span className={styles.userRole}>бизнес аналитик</span>
                    </div>
                </div>
                <button onClick={logout} className={styles.logoutBtn}>
                    <LogOut size={18} />
                </button>
            </div>
        </aside>
    );
};
