import React, { useState, useRef } from 'react';
import { Share, Sparkles, MessageSquareText, MoreHorizontal, ChevronLeft, ChevronRight, Upload, Download, Check } from 'lucide-react';
import styles from './Note.module.css';
import { AiChat } from '../AiChat/AiChat';
import { TeamChat } from '../TeamChat/TeamChat';
import { Onboarding } from '../Onboarding/Onboarding';
import { RequirementGuide } from '../RequirementGuide/RequirementGuide';
import { useDashboard } from '../../context/DashboardContext';
import { dashboardService } from '../../api/dashboardService';
import mammoth from 'mammoth';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export const Note = () => {
    const { selectedTask, allContent, addTask, refreshData } = useDashboard();
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
                const htmlContent = result.value;

                // 1. Show locally immediately
                addTask(file.name.replace('.docx', ''), htmlContent);

                // 2. Send to backend (as requested)
                try {
                    await dashboardService.createDraft(file.name, htmlContent);
                    console.log("Document uploaded to backend successfully");
                } catch (uploadError) {
                    console.error("Failed to upload to backend:", uploadError);
                    // We don't block the UI, just log error
                }
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

    const handleDownload = async () => {
        if (!selectedTask?.originalId) return;
        try {
            const blob = await dashboardService.downloadDraft(selectedTask.originalId);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${selectedTask.title || 'document'}.docx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error("Download failed:", error);
            alert("Failed to download document");
        }
    };

    const handleApprove = async () => {
        if (!selectedTask?.originalId) return;
        try {
            await dashboardService.approveDraft(selectedTask.originalId);
            alert("Document approved successfully!");
            await refreshData();
        } catch (error) {
            console.error("Approve failed:", error);
            alert("Failed to approve document");
        }
    };

    const taskContent = selectedTask ? allContent[selectedTask.id] : null;

    const renderBusinessRequirement = (data) => {
        if (!data) return null;
        let parsedData = data;
        if (typeof data === 'string') {
            try {
                // Check if it looks like base64 (starts with eyJ which is {" in base64)
                if (data.startsWith('eyJ')) {
                    try {
                        // Fix for UTF-8 characters: use TextDecoder
                        const binaryString = atob(data);
                        const bytes = new Uint8Array(binaryString.length);
                        for (let i = 0; i < binaryString.length; i++) {
                            bytes[i] = binaryString.charCodeAt(i);
                        }
                        const decoded = new TextDecoder('utf-8').decode(bytes);
                        parsedData = JSON.parse(decoded);
                    } catch (base64Error) {
                        console.error("Failed to decode base64", base64Error);
                        // Fallback to trying to parse original string
                        parsedData = JSON.parse(data);
                    }
                } else {
                    parsedData = JSON.parse(data);
                }
            } catch (e) {
                console.error("Failed to parse structured content", e);
                console.log("Raw data causing error:", data);
                return <div className={styles.error}>Error parsing structured content: {e.message}. Check console for details.</div>;
            }
        } else {
            console.log("Structured content is already an object:", data);
        }

        // Check for SmartAnalysisData structure (from Chat flow)
        if (parsedData.smart_requirements || parsedData.confluence) {
            return (
                <div className={styles.businessRequirement}>
                    {parsedData.confluence && (
                        <div className={styles.brSection}>
                            <h1 className={styles.brTitle}>{parsedData.confluence.title}</h1>
                            <div className={styles.markdownContent}>
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {parsedData.confluence.content}
                                </ReactMarkdown>
                            </div>
                        </div>
                    )}

                    {parsedData.smart_requirements && (
                        <div className={styles.brSection}>
                            <h2 className={styles.brTitle}>SMART Requirements</h2>
                            <div className={styles.brGrid}>
                                <div className={styles.brItem}><strong>Specific:</strong> {parsedData.smart_requirements.specific}</div>
                                <div className={styles.brItem}><strong>Measurable:</strong> {parsedData.smart_requirements.measurable}</div>
                                <div className={styles.brItem}><strong>Achievable:</strong> {parsedData.smart_requirements.achievable}</div>
                                <div className={styles.brItem}><strong>Relevant:</strong> {parsedData.smart_requirements.relevant}</div>
                                <div className={styles.brItem}><strong>Time-bound:</strong> {parsedData.smart_requirements.time_bound}</div>
                            </div>
                        </div>
                    )}

                    {parsedData.summary && !parsedData.confluence && (
                        <div className={styles.brSection}>
                            <h2 className={styles.brTitle}>Summary</h2>
                            <p>{parsedData.summary}</p>
                        </div>
                    )}
                </div>
            );
        }

        // Check for AnalysisData structure (from Request flow)
        const hasContent = parsedData.project || parsedData.executive_summary || parsedData.project_objectives || parsedData.project_scope || parsedData.business_requirements || parsedData.functional_requirements;

        if (!hasContent) {
            console.warn("Parsed data does not match expected structure:", parsedData);
            return (
                <div className={styles.businessRequirement}>
                    <div className={styles.error}>
                        <h3>Structure Mismatch</h3>
                        <p>The document data was parsed but doesn't match the expected format.</p>
                        <details>
                            <summary>View Raw Data</summary>
                            <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12px' }}>{JSON.stringify(parsedData, null, 2)}</pre>
                        </details>
                    </div>
                </div>
            );
        }

        return (
            <div className={styles.businessRequirement}>
                {parsedData.project && (
                    <div className={styles.brSection}>
                        <h2 className={styles.brTitle}>Project Details</h2>
                        <div className={styles.brGrid}>
                            <div className={styles.brItem}><strong>Name:</strong> {parsedData.project.name}</div>
                            <div className={styles.brItem}><strong>Manager:</strong> {parsedData.project.manager}</div>
                            <div className={styles.brItem}><strong>Date:</strong> {parsedData.project.date_submitted}</div>
                            <div className={styles.brItem}><strong>Status:</strong> {parsedData.project.document_status}</div>
                        </div>
                    </div>
                )}

                {parsedData.executive_summary && (
                    <div className={styles.brSection}>
                        <h2 className={styles.brTitle}>Executive Summary</h2>
                        <p><strong>Problem:</strong> {parsedData.executive_summary.problem_statement}</p>
                        <p><strong>Goal:</strong> {parsedData.executive_summary.goal}</p>
                        <p><strong>Outcome:</strong> {parsedData.executive_summary.expected_outcomes}</p>
                    </div>
                )}

                {parsedData.project_objectives && (
                    <div className={styles.brSection}>
                        <h2 className={styles.brTitle}>Objectives</h2>
                        <ul className={styles.brList}>
                            {parsedData.project_objectives.map((obj, i) => <li key={i}>{obj}</li>)}
                        </ul>
                    </div>
                )}

                {parsedData.project_scope && (
                    <div className={`${styles.brSection} ${styles.sectionScope}`}>
                        <h2 className={styles.brTitle}>Scope</h2>
                        <div className={styles.scopeContainer}>
                            <div className={styles.scopeCol}>
                                <h3>In Scope</h3>
                                <ul>{parsedData.project_scope.in_scope?.map((s, i) => <li key={i}>{s}</li>)}</ul>
                            </div>
                            <div className={styles.scopeCol}>
                                <h3>Out of Scope</h3>
                                <ul>{parsedData.project_scope.out_of_scope?.map((s, i) => <li key={i}>{s}</li>)}</ul>
                            </div>
                        </div>
                    </div>
                )}

                {parsedData.business_requirements && (
                    <div className={`${styles.brSection} ${styles.sectionBusinessReq}`}>
                        <h2 className={styles.brTitle}>Business Requirements</h2>
                        <table className={styles.brTable}>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Description</th>
                                    <th>Priority</th>
                                    <th>Criticality</th>
                                </tr>
                            </thead>
                            <tbody>
                                {parsedData.business_requirements.map((req, i) => (
                                    <tr key={i}>
                                        <td>{req.id}</td>
                                        <td>{req.description}</td>
                                        <td>{req.priority_level}</td>
                                        <td>{req.critical_level}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {parsedData.key_stakeholders && (
                    <div className={`${styles.brSection} ${styles.sectionStakeholders}`}>
                        <h2 className={styles.brTitle}>Key Stakeholders</h2>
                        <table className={styles.brTable}>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Role</th>
                                    <th>Duties</th>
                                </tr>
                            </thead>
                            <tbody>
                                {parsedData.key_stakeholders.map((st, i) => (
                                    <tr key={i}>
                                        <td>{st.name}</td>
                                        <td>{st.job_role}</td>
                                        <td>{st.duties}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {parsedData.project_constraints && (
                    <div className={`${styles.brSection} ${styles.sectionConstraints}`}>
                        <h2 className={styles.brTitle}>Project Constraints</h2>
                        <table className={styles.brTable}>
                            <thead>
                                <tr>
                                    <th>Constraint</th>
                                    <th>Description</th>
                                </tr>
                            </thead>
                            <tbody>
                                {parsedData.project_constraints.map((c, i) => (
                                    <tr key={i}>
                                        <td>{c.constraint}</td>
                                        <td>{c.description}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {parsedData.functional_requirements && (
                    <div className={`${styles.brSection} ${styles.sectionFunctionalReq}`}>
                        <h2 className={styles.brTitle}>Functional Requirements</h2>
                        {parsedData.functional_requirements.map((mod, i) => (
                            <div key={i} className={styles.moduleBlock}>
                                <h3>{mod.module}</h3>
                                <ul>{mod.features?.map((f, j) => <li key={j}>{f}</li>)}</ul>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

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

                        {selectedTask?.isDraft && (
                            <>
                                <button className={styles.actionBtn} onClick={handleDownload} title="Скачать DOCX">
                                    <Download size={20} />
                                </button>
                                <button className={styles.actionBtn} onClick={handleApprove} title="Утвердить">
                                    <Check size={20} />
                                </button>
                            </>
                        )}

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
                    {selectedTask?.id === 'default' ? (
                        <Onboarding />
                    ) : (
                        <div className={styles.placeholder}>
                            {/* <span className={styles.metaInfo}>
                                {taskContent?.type === 'uploaded' ? 'Загруженный документ' : `Тимур Губайдуллин отредактировал ${selectedTask?.date || 'недавно'}`}
                            </span> */}
                            <h1 className={styles.title}>
                                {taskContent?.title || selectedTask?.title || 'Выберите задачу'}
                            </h1>

                            {taskContent && (
                                <div className={styles.documentBody}>
                                    {/* Show RequirementGuide if content is the default placeholder */}
                                    {taskContent.content === 'Chat session content...' ? (
                                        <RequirementGuide onOpenChat={() => togglePanel('ai')} />
                                    ) : taskContent.structuredContent ? (
                                        renderBusinessRequirement(taskContent.structuredContent)
                                    ) : taskContent.type === 'uploaded' ? (
                                        <div dangerouslySetInnerHTML={{ __html: taskContent.content }} />
                                    ) : taskContent.type === 'document' ? (
                                        <div className={styles.markdownContent}>
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                {taskContent.content}
                                            </ReactMarkdown>
                                        </div>
                                    ) : (
                                        taskContent.sections?.map(renderSection)
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <AiChat isOpen={activePanel === 'ai'} toggleChat={() => togglePanel('ai')} />
            <TeamChat isOpen={activePanel === 'team'} toggleChat={() => togglePanel('team')} />
        </div>
    );
};
