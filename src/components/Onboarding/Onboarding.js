import React, { useState, useEffect } from 'react';
import { Sparkles, Plus, PlayCircle, Zap, FileText, MessageSquare } from 'lucide-react';
import styles from './Onboarding.module.css';
import { useDashboard } from '../../context/DashboardContext';

export const Onboarding = () => {
    const { createNewProject } = useDashboard();
    const [text, setText] = useState('');
    const fullText = "Привет! Я твой AI бизнес-аналитик.";

    useEffect(() => {
        let index = 0;
        const timer = setInterval(() => {
            setText(fullText.slice(0, index + 1));
            index++;
            if (index >= fullText.length) {
                clearInterval(timer);
            }
        }, 50); // Typing speed

        return () => clearInterval(timer);
    }, []);

    return (
        <div className={styles.container}>
            <div className={styles.content}>
                <div className={styles.iconWrapper}>
                    <Sparkles size={32} />
                </div>

                <h1 className={styles.title}>
                    {text}
                    <span className={styles.cursor}></span>
                </h1>

                <p className={styles.description}>
                    Я помогу структурировать идеи, создать документацию и проанализировать требования.
                    Начни с создания нового проекта или выбери существующий.
                </p>

                <div className={styles.actions}>
                    <button className={styles.primaryBtn} onClick={createNewProject}>
                        <Plus size={20} />
                        Создать проект
                    </button>
                    <button className={styles.secondaryBtn}>
                        <PlayCircle size={20} />
                        Как это работает?
                    </button>
                </div>

                <div className={styles.features}>
                    <div className={styles.featureCard}>
                        <div className={styles.featureIcon}><MessageSquare size={24} /></div>
                        <h3 className={styles.featureTitle}>Умный чат</h3>
                        <p className={styles.featureText}>Обсуждай идеи и получай мгновенную обратную связь от AI.</p>
                    </div>
                    <div className={styles.featureCard}>
                        <div className={styles.featureIcon}><FileText size={24} /></div>
                        <h3 className={styles.featureTitle}>Документация</h3>
                        <p className={styles.featureText}>Автоматическая генерация ТЗ и требований в формате Markdown.</p>
                    </div>
                    <div className={styles.featureCard}>
                        <div className={styles.featureIcon}><Zap size={24} /></div>
                        <h3 className={styles.featureTitle}>Анализ</h3>
                        <p className={styles.featureText}>Глубокий анализ бизнес-процессов и выявление рисков.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
