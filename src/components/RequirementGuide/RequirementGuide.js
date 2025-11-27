import React from 'react';
import { Lightbulb, MessageSquare, FileText, ArrowRight } from 'lucide-react';
import styles from './RequirementGuide.module.css';

export const RequirementGuide = ({ onOpenChat }) => {
    return (
        <div className={styles.container}>
            <div className={styles.iconWrapper}>
                <Lightbulb size={32} />
            </div>

            <h2 className={styles.title}>С чего начнем?</h2>

            <p className={styles.description}>
                Этот проект пока пуст. Давайте заполним его смыслом!
                Я помогу превратить ваши идеи в четкие бизнес-требования.
            </p>

            <div className={styles.steps}>
                <div className={styles.step}>
                    <div className={styles.stepNumber}>1</div>
                    <span className={styles.stepText}>Откройте чат с AI агентом</span>
                </div>
                <div className={styles.step}>
                    <div className={styles.stepNumber}>2</div>
                    <span className={styles.stepText}>Опишите свою идею своими словами</span>
                </div>
                <div className={styles.step}>
                    <div className={styles.stepNumber}>3</div>
                    <span className={styles.stepText}>Получите готовую структуру требований</span>
                </div>
            </div>

            <button className={styles.actionBtn} onClick={onOpenChat}>
                <MessageSquare size={20} />
                Открыть чат с AI
                <ArrowRight size={18} style={{ marginLeft: '4px' }} />
            </button>
        </div>
    );
};
