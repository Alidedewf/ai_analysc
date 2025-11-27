import React, { useState } from 'react';
import {
    Search,
    Plus,
    History,
    FileText,
    CheckCircle,
    XCircle,
    LogOut,
    Bell,
    Trash2,
    Users,
    UserPlus
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useDashboard } from '../../context/DashboardContext';
import { dashboardService } from '../../api/dashboardService';
import styles from './Sidebar.module.css';
import { UserManagement } from '../UserManagement/UserManagement';

const SECTIONS = [
    { id: 'reviewing', label: 'Рассматривается', icon: History },
    { id: 'accepted', label: 'Приняты', icon: CheckCircle },
    { id: 'rejected', label: 'Отклоненные', icon: XCircle },
    { id: 'documents', label: 'Ваши проекты', icon: FileText },
];

export const Sidebar = () => {
    const { user, logout } = useAuth();
    const { selectedTask, setSelectedTask, tasks, clearAll, moveTask, createNewProject, deleteItem } = useDashboard();
    const [expandedSections, setExpandedSections] = useState({});
    const [searchQuery, setSearchQuery] = useState('');
    const [showUserManagement, setShowUserManagement] = useState(false);
    const [isSystemHealthy, setIsSystemHealthy] = useState(true);

    React.useEffect(() => {
        const checkHealth = async () => {
            const healthy = await dashboardService.checkHealth();
            setIsSystemHealthy(healthy);
        };
        checkHealth();
        // Check every minute
        const interval = setInterval(checkHealth, 60000);
        return () => clearInterval(interval);
    }, []);

    const toggleSection = (sectionId) => {
        setExpandedSections(prev => ({
            ...prev,
            [sectionId]: !prev[sectionId]
        }));
    };

    const handleTaskClick = (task) => {
        setSelectedTask({ ...task, date: 'Сегодня' });
    };

    const handleDelete = (e, id, type) => {
        e.stopPropagation();
        deleteItem(id, type);
    };

    const filterTasks = (taskList) => {
        if (!searchQuery) return taskList;
        return taskList.filter(task =>
            task.title.toLowerCase().includes(searchQuery.toLowerCase())
        );
    };

    const handleDragStart = (e, task, sourceCategory) => {
        e.dataTransfer.setData('taskId', task.id);
        e.dataTransfer.setData('sourceCategory', sourceCategory);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDrop = (e, targetCategory) => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData('taskId');
        const sourceCategory = e.dataTransfer.getData('sourceCategory');

        // Convert string ID to number if needed (for mock data)
        const numericId = Number(taskId);
        const finalId = isNaN(numericId) ? taskId : numericId;

        moveTask(finalId, sourceCategory, targetCategory);

        // Expand target section if collapsed
        if (!expandedSections[targetCategory]) {
            toggleSection(targetCategory);
        }
    };

    return (
        <aside className={styles.sidebar}>
            {/* ... (header and content) ... */}

            {/* Render UserManagement modal */}
            {showUserManagement && (
                <UserManagement onClose={() => setShowUserManagement(false)} />
            )}

            <div className={styles.header}>
                {/* <div className={styles.branding}>
                    <div className={styles.logo}>
                        <div className={styles.logoIcon}>F</div>
                    </div>
                    <button className={styles.notificationBtn} title="Нет новых уведомлений">
                        <Bell size={20} />
                    </button>
                </div> */}

                <div className={styles.userContainer}>
                    <div className={styles.userProfile}>
                        <div className={styles.avatar}>
                            {user?.name?.[0] || 'U'}
                        </div>
                        <div className={styles.userInfo}>
                            <span className={styles.userName}>{user?.name}</span>
                            <span className={styles.userRole}>{user?.role || 'Пользователь'}</span>
                        </div>
                    </div>

                    <div className={styles.footerActions}>
                        {/* Allow 'Business Analyst', 'admin' roles OR specific email */}
                        {(user?.role === 'Business Analyst' || user?.role === 'admin' || user?.email === 'admin@example.com') && (
                            <>
                                <button className={styles.actionBtn} title="Добавить пользователя" onClick={() => setShowUserManagement(true)}>
                                    <UserPlus size={16} />
                                </button>
                                <button className={styles.actionBtn} title="Управление командой" onClick={() => setShowUserManagement(true)}>
                                    <Users size={16} />
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div className={styles.scrollableContent}>
                {/* ... (search and new chat btn) ... */}
                <div className={styles.searchContainer}>
                    <Search className={styles.searchIcon} size={18} />
                    <input
                        type="text"
                        placeholder="Поиск"
                        className={styles.searchInput}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <button
                    className={styles.newChatBtn}
                    onClick={(e) => {
                        e.preventDefault();
                        createNewProject();
                    }}
                >
                    <Plus size={20} />
                    <span>Новый проект</span>
                </button>

                {/* BUSINESS REQUESTS SECTION */}
                <div className={styles.section}>
                    <h3 className={styles.sectionTitle}>БИЗНЕС ЗАПРОСЫ</h3>
                    {SECTIONS.filter(s => s.id !== 'documents').map(section => {
                        const sectionTasks = tasks[section.id] || [];
                        const filteredTasks = filterTasks(sectionTasks);

                        if (searchQuery && filteredTasks.length === 0) return null;

                        return (
                            <div
                                key={section.id}
                                className={`${styles.menuItem} ${expandedSections[section.id] ? styles.active : ''}`}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, section.id)}
                            >
                                <div
                                    className={styles.menuHeader}
                                    onClick={() => toggleSection(section.id)}
                                >
                                    <section.icon size={18} />
                                    <span>{section.label}</span>
                                    <span style={{ marginLeft: 'auto', fontSize: '12px', opacity: 0.5 }}>{filteredTasks.length}</span>
                                </div>
                                {expandedSections[section.id] && (
                                    <div className={styles.subMenu}>
                                        {filteredTasks.map(task => (
                                            <div
                                                key={task.id}
                                                className={`${styles.subMenuItem} ${selectedTask?.id === task.id ? styles.activeItem : ''}`}
                                                onClick={() => handleTaskClick(task)}
                                                draggable
                                                onDragStart={(e) => handleDragStart(e, task, section.id)}
                                            >
                                                <FileText size={16} />
                                                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</span>
                                                <button
                                                    className={styles.deleteItemBtn}
                                                    onClick={(e) => handleDelete(e, task.id, 'document')}
                                                    title="Удалить"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        ))}
                                        {filteredTasks.length === 0 && (
                                            <div className={styles.subMenuItem} style={{ fontStyle: 'italic', color: '#999' }}>
                                                Нет задач
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>

                {/* YOUR PROJECTS SECTION */}
                <div className={styles.section}>
                    <h3 className={styles.sectionTitle}>ВАШИ ПРОЕКТЫ</h3>
                    {(() => {
                        const section = { id: 'documents', label: 'Ваши проекты', icon: FileText };
                        const sectionTasks = tasks[section.id] || [];
                        const filteredTasks = filterTasks(sectionTasks);

                        if (searchQuery && filteredTasks.length === 0) return null;

                        return (
                            <div className={styles.projectList}>
                                {filteredTasks.map(task => (
                                    <div
                                        key={task.id}
                                        className={`${styles.subMenuItem} ${selectedTask?.id === task.id ? styles.activeItem : ''}`}
                                        onClick={() => handleTaskClick(task)}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, task, section.id)}
                                    >
                                        <FileText size={16} />
                                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</span>
                                        <span style={{ fontSize: '12px', opacity: 0.5, marginLeft: '8px' }}>{task.date}</span>
                                        <button
                                            className={styles.deleteItemBtn}
                                            onClick={(e) => handleDelete(e, task.id, 'session')}
                                            title="Удалить"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                                {filteredTasks.length === 0 && (
                                    <div className={styles.subMenuItem} style={{ fontStyle: 'italic', color: '#999' }}>
                                        Нет проектов
                                    </div>
                                )}
                            </div>
                        );
                    })()}
                </div>



                <div className={styles.clearContainer}>
                    <button onClick={clearAll} className={styles.clearBtn}>
                        <Trash2 size={16} />
                        <span>Очистить все</span>
                    </button>
                </div>
            </div>

            <div className={styles.footer}>
                <button onClick={logout} className={styles.logoutBtn} title="Выйти">
                    <LogOut size={18} />
                    <span>Выйти из системы</span>
                </button>

                <div className={styles.systemStatus}>
                    <div className={styles.statusDot} style={{ backgroundColor: isSystemHealthy ? '#4caf50' : '#f44336' }}></div>
                    System Status: {isSystemHealthy ? 'Operational' : 'Issues Detected'}
                </div>
            </div>
        </aside>
    );
};
