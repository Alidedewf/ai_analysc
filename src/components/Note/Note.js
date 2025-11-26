import React, { useState, useRef } from 'react';
import { Share, Sparkles, MessageSquareText, MoreHorizontal, ChevronLeft, ChevronRight, Upload } from 'lucide-react';
import styles from './Note.module.css';
import { AiChat } from '../AiChat/AiChat';
import { TeamChat } from '../TeamChat/TeamChat';
import { useDashboard } from '../../context/DashboardContext';
import mammoth from 'mammoth';

export const Note = () => {
    const { selectedTask, allContent, addTask } = useDashboard();
    const [activePanel, setActivePanel] = useState(null);
    const fileInputRef = useRef(null);

    const togglePanel = (panel) => {
        setActivePanel(prev => prev === panel ? null : panel);
    };

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            const arrayBuffer = e.target.result;
            try {
                const result = await mammoth.convertToHtml({ arrayBuffer });
                addTask(file.name.replace('.docx', ''), result.value);
            } catch (error) {
                console.error("Error converting file:", error);
                alert("Ошибка при чтении файла");
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const triggerFileUpload = () => {
        fileInputRef.current.click();
    };

    const taskContent = selectedTask ? allContent[selectedTask.id] : null;

    const renderSection = (section) => {
        switch (section.type) {
            case 'chart':
                if (section.chartType === 'bar') {
                    return (
                        <div key={section.id} className={styles.documentSection}>
                            <h3 className={styles.sectionTitle}>{section.title}</h3>
                            <div className={styles.chartContainer}>
                                <div className={styles.barChart}>
                                    {section.data.map((item, index) => (
                                        <div key={index} className={styles.barWrapper}>
                                            <div
                                                className={styles.bar}
                                                style={{ height: `${item.value}%`, backgroundColor: item.color }}
                                            >
                                                <span className={styles.barValue}>{item.value}%</span>
                                            </div>
                                            <span className={styles.barLabel}>{item.label}</span>
                                        </div>
                                    ))}
                                </div>
                                <p className={styles.chartDescription}>{section.description}</p>
                            </div>
                        </div>
                    );
                } else if (section.chartType === 'timeline') {
                    return (
                        <div key={section.id} className={styles.documentSection}>
                            <h3 className={styles.sectionTitle}>{section.title}</h3>
                            <div className={styles.chartContainer}>
                                <div className={styles.timelineChart}>
                                    {section.data.map((item, index) => (
                                        <div key={index} className={styles.timelineItem}>
                                            <span className={styles.timelineLabel}>{item.label}</span>
                                            <span className={styles.timelineText}>{item.text}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    );
                }
                return null;
            default:
                return (
                    <div key={section.id} className={styles.documentSection}>
                        <h3 className={styles.sectionTitle}>{section.title}</h3>
                        <div
                            className={styles.textBlock}
                            dangerouslySetInnerHTML={{ __html: section.content }}
                        />
                    </div>
                );
        }
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
                        <input
                            type="file"
                            accept=".docx"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            onChange={handleFileUpload}
                        />
                        <button className={styles.actionBtn} onClick={triggerFileUpload} title="Загрузить DOCX">
                            <Upload size={20} />
                        </button>
                        <button className={styles.actionBtn}><Share size={20} /></button>
                        <button
                            className={`${styles.actionBtn} ${activePanel === 'ai' ? styles.activeAction : ''}`}
                            onClick={() => togglePanel('ai')}
                        >
                            <Sparkles size={20} />
                        </button>
                        <button
                            className={`${styles.actionBtn} ${activePanel === 'team' ? styles.activeAction : ''}`}
                            onClick={() => togglePanel('team')}
                        >
                            <MessageSquareText size={20} />
                        </button>
                        <button className={styles.actionBtn}><MoreHorizontal size={20} /></button>
                    </div>
                </header>

                <div className={styles.content}>
                    <div className={styles.placeholder}>
                        <span className={styles.metaInfo}>
                            {taskContent?.type === 'uploaded' ? 'Загруженный документ' : `Тимур Губайдуллин отредактировал ${selectedTask?.date || 'недавно'}`}
                        </span>
                        <h1 className={styles.title}>
                            {taskContent?.title || selectedTask?.title || 'Выберите задачу'}
                        </h1>

                        {taskContent && (
                            <div className={styles.documentBody}>
                                {taskContent.type === 'uploaded' ? (
                                    <div dangerouslySetInnerHTML={{ __html: taskContent.content }} />
                                ) : (
                                    taskContent.sections?.map(renderSection)
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <AiChat isOpen={activePanel === 'ai'} toggleChat={() => togglePanel('ai')} />
            <TeamChat isOpen={activePanel === 'team'} toggleChat={() => togglePanel('team')} />
        </div>
    );
};
