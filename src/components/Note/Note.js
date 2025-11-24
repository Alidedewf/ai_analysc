import React, { useState } from 'react';
import { Share, Sparkles, MessageSquareText, MoreHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './Note.module.css';
import { AiChat } from '../AiChat/AiChat';
import { useDashboard } from '../../context/DashboardContext';

export const Note = () => {
    const { selectedTask } = useDashboard();
    const [isAiChatOpen, setIsAiChatOpen] = useState(false);

    const toggleAiChat = () => {
        setIsAiChatOpen(prev => !prev);
    };

    return (
        <div className={styles.noteArea}>
            <div className={styles.mainContainer}>
                <header className={styles.header}>
                    <div className={styles.navigation}>
                        <button className={styles.navBtn}><ChevronLeft size={20} /></button>
                        <button className={styles.navBtn}><ChevronRight size={20} /></button>
                    </div>

                    <div className={styles.actions}>
                        <button className={styles.actionBtn}><Share size={20} /></button>
                        <button
                            className={`${styles.actionBtn} ${isAiChatOpen ? styles.activeAction : ''}`}
                            onClick={toggleAiChat}
                        >
                            <Sparkles size={20} />
                        </button>
                        <button className={styles.actionBtn}><MessageSquareText size={20} /></button>
                        <button className={styles.actionBtn}><MoreHorizontal size={20} /></button>
                    </div>
                </header>

                <div className={styles.content}>
                    <div className={styles.placeholder}>
                        <span className={styles.metaInfo}>Тимур Губайдуллин отредактировал {selectedTask?.date || 'недавно'}</span>
                        <h1 className={styles.title}>{selectedTask?.title || 'Выберите задачу'}</h1>
                    </div>
                </div>
            </div>

            <AiChat isOpen={isAiChatOpen} toggleChat={toggleAiChat} />
        </div>
    );
};
