import React from 'react';
import { Sparkles, MessageSquareText, MoreHorizontal, ArrowUp } from 'lucide-react';
import styles from './AiChat.module.css';

export const AiChat = ({ isOpen, toggleChat }) => {
    if (!isOpen) return null;

    return (
        <div className={styles.aiPanel}>
            <div className={styles.aiPanelHeader}>
                <span className={styles.aiPanelTitle}>О ДОКУМЕНТЕ</span>
                <div className={styles.aiPanelActions}>
                    <button
                        className={`${styles.aiPanelBtn} ${isOpen ? styles.activeAction : ''}`}
                        onClick={toggleChat}
                    >
                        <Sparkles size={18} />
                    </button>
                </div>
            </div>

            <div className={styles.aiPanelContent}>
                {/* Chat history would go here */}
            </div>

            <div className={styles.aiInputContainer}>
                <div className={styles.aiInputWrapper}>
                    <input
                        type="text"
                        placeholder="Опишите вашу задачу..."
                        className={styles.aiInput}
                    />
                    <button className={styles.aiSendBtn}>
                        <ArrowUp size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};
