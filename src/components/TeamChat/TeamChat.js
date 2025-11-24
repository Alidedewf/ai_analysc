import React from 'react';
import { MessageSquareText, Search, MoreHorizontal } from 'lucide-react';
import styles from './TeamChat.module.css';

const MOCK_CHATS = [
    { id: 1, name: 'Анна Иванова', lastMessage: 'Привет, как дела с отчетом?', time: '10:30', avatar: 'A' },
    { id: 2, name: 'Сергей Петров', lastMessage: 'Нужно обсудить задачу', time: 'Вчера', avatar: 'S' },
    { id: 3, name: 'Мария Сидорова', lastMessage: 'Файл отправлен', time: 'Вчера', avatar: 'M' },
];

export const TeamChat = ({ isOpen, toggleChat }) => {
    if (!isOpen) return null;

    return (
        <div className={styles.panel}>
            <div className={styles.header}>
                <span className={styles.title}>ЧАТЫ</span>
                <div className={styles.actions}>
                    <button
                        className={`${styles.actionBtn} ${isOpen ? styles.activeAction : ''}`}
                        onClick={toggleChat}
                    >
                        <MessageSquareText size={18} />
                    </button>
                    <button className={styles.actionBtn}>
                        <MoreHorizontal size={18} />
                    </button>
                </div>
            </div>

            <div className={styles.searchContainer}>
                <div className={styles.searchWrapper}>
                    <Search size={16} className={styles.searchIcon} />
                    <input type="text" placeholder="Поиск..." className={styles.searchInput} />
                </div>
            </div>

            <div className={styles.content}>
                {MOCK_CHATS.map(chat => (
                    <div key={chat.id} className={styles.chatItem}>
                        <div className={styles.avatar}>{chat.avatar}</div>
                        <div className={styles.chatInfo}>
                            <div className={styles.chatHeader}>
                                <span className={styles.chatName}>{chat.name}</span>
                                <span className={styles.chatTime}>{chat.time}</span>
                            </div>
                            <span className={styles.lastMessage}>{chat.lastMessage}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
