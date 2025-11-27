import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, ArrowUp, X, AlertCircle } from 'lucide-react';
import styles from './AiChat.module.css';
import { authService } from '../../api/authService';

import { useDashboard } from '../../context/DashboardContext';

import { dashboardService } from '../../api/dashboardService';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export const AiChat = ({ isOpen, toggleChat }) => {
    const { refreshDrafts, selectedTask, allContent } = useDashboard();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const [sessionId, setSessionId] = useState(null);
    const wsRef = useRef(null);
    const contentRef = useRef(null);

    const [isThinking, setIsThinking] = useState(false);

    // Load history when selectedTask changes
    useEffect(() => {
        const loadHistory = async () => {
            // Check if it's a session OR a draft with a linked session
            const targetSessionId = selectedTask?.sessionId || (selectedTask?.id !== 'default' && !selectedTask?.isDraft ? selectedTask?.id : null);

            if (targetSessionId) {
                // It's an existing session or linked draft
                setSessionId(targetSessionId);
                const history = await dashboardService.fetchSessionMessages(targetSessionId);

                // Map backend messages to frontend format
                const formattedMessages = history.map(msg => {
                    // Check if it's a stored questionnaire
                    if (msg.text && msg.text.startsWith('[QUESTIONNAIRE_JSON]')) {
                        try {
                            const jsonStr = msg.text.replace('[QUESTIONNAIRE_JSON]', '');
                            const questions = JSON.parse(jsonStr);
                            return {
                                id: msg.ID,
                                author: msg.author,
                                type: 'questionnaire',
                                questions: questions,
                                text: 'Please answer the following questions:'
                            };
                        } catch (e) {
                            console.error('Failed to parse stored questionnaire', e);
                            return {
                                id: msg.ID,
                                author: msg.author,
                                text: 'Interactive Questionnaire (Error loading)'
                            };
                        }
                    } else if (msg.text) {
                        // Try to parse any JSON message (questionnaire, clarification, requirements, error)
                        // First clean potential markdown
                        let textToParse = msg.text.trim();
                        textToParse = textToParse.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '');

                        if (textToParse.startsWith('{')) {
                            try {
                                const data = JSON.parse(textToParse);
                                if (data.type === 'questionnaire' || data.type === 'clarification') {
                                    return {
                                        id: msg.ID,
                                        author: msg.author,
                                        type: data.type,
                                        title: data.title,
                                        questions: data.questions,
                                        text: data.title || 'Please answer the following questions:'
                                    };
                                } else if (data.type === 'error') {
                                    return {
                                        id: msg.ID,
                                        author: msg.author,
                                        type: 'error',
                                        text: data.message || 'An error occurred'
                                    };
                                }
                            } catch (e) {
                                // Not JSON or not the structure we want, ignore
                            }
                        }
                    }

                    return {
                        id: msg.ID,
                        author: msg.author, // 'user' or 'ai'
                        text: msg.text
                    };
                });
                setMessages(formattedMessages);
            } else {
                // New session or draft without history
                setMessages([]);
                setSessionId(null);
            }
        };

        if (isOpen) {
            loadHistory();
        }
    }, [selectedTask, isOpen]);

    useEffect(() => {
        if (isOpen && !wsRef.current) {
            connectWebSocket();
        }

        return () => {
            if (!isOpen && wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
                setIsConnected(false);
            }
        };
    }, [isOpen]);

    useEffect(() => {
        scrollToBottom();
    }, [messages, isThinking]);

    const connectWebSocket = () => {
        const token = authService.getToken();
        if (!token) return;

        const wsUrl = `ws://localhost:9000/ws/agent?token=${token}`;
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            console.log('Connected to AI Chat');
            setIsConnected(true);

            // Only start a NEW session if we don't have one selected
            if (!selectedTask || selectedTask.id === 'default' || selectedTask.isDraft) {
                ws.send(JSON.stringify({
                    type: 'start_session',
                    payload: { title: 'New Chat' }
                }));
            } else {
                // We are in an existing session context. 
                // The backend WS might need to know which session we are attaching to, 
                // OR we just use the session_id in the messages we send.
                // For simplicity, we just set the local sessionId state.
                // But wait, if we reload the page, we need to ensure the WS knows context if it relies on it.
                // In this simple implementation, the backend is stateless regarding "current session" 
                // until we send a message with session_id. 
                // So we just need to ensure `sessionId` state is set correctly (which we did in the useEffect above).
                setSessionId(selectedTask.id);
            }
        };

        ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                handleWebSocketMessage(message);
            } catch (error) {
                console.error('Error parsing WebSocket message:', error);
                setIsThinking(false);
            }
        };

        ws.onclose = () => {
            console.log('Disconnected from AI Chat');
            setIsConnected(false);
            wsRef.current = null;
            setIsThinking(false);
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            setIsThinking(false);
        };

        wsRef.current = ws;
    };

    const handleWebSocketMessage = (message) => {
        switch (message.type) {
            case 'session_started':
                setSessionId(message.payload.session_id);
                // If we are in a draft, the backend handles linking.
                // We might want to refresh drafts if a new session was created for a draft that didn't have one?
                // But generally, if we are in a draft, we already have a session ID or we just started one.
                // If we started a new one for an existing draft, we should probably refresh to get the updated draft with session_id?
                // But wait, start_session doesn't update the draft in DB unless we told it to.
                // Actually, if we are in a draft context, we should probably assume the backend knows?
                // But the current backend implementation of start_session is generic.
                // Ideally, if we are in a draft, we should have passed draft_id to start_session?
                // But let's stick to the current flow:
                // If we started a session, we just use it.
                // If we create a document, that's when the link is permanent.
                break;
            case 'ai_done':
                // Check if the text is actually a JSON object (e.g. clarification)
                let aiMsg = {
                    id: Date.now(),
                    author: 'ai',
                    text: message.payload.text
                };

                try {
                    let textToParse = message.payload.text.trim();
                    // Remove markdown code blocks if present
                    textToParse = textToParse.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '');

                    if (textToParse.startsWith('{')) {
                        const data = JSON.parse(textToParse);
                        if (data.type === 'questionnaire' || data.type === 'clarification') {
                            aiMsg.type = data.type;
                            aiMsg.questions = data.questions;
                            aiMsg.title = data.title;
                            aiMsg.text = data.title || 'Please answer the following questions:';
                        } else if (data.type === 'error') {
                            aiMsg.type = 'error';
                            aiMsg.text = data.message || 'An error occurred';
                        }
                    }
                } catch (e) {
                    // Not JSON, treat as text
                }

                setMessages(prev => [...prev, aiMsg]);
                setIsThinking(false);
                break;
            case 'questionnaire':
                // Handle questionnaire
                // Backend sends flat JSON for questionnaire, so we check root or payload
                const questions = message.questions || (message.payload && message.payload.questions);

                if (questions) {
                    setMessages(prev => [...prev, {
                        id: Date.now(),
                        author: 'ai',
                        type: 'questionnaire',
                        questions: questions,
                        text: 'Please answer the following questions:'
                    }]);
                } else {
                    console.error('Invalid questionnaire format:', message);
                }
                setIsThinking(false);
                break;
            case 'error':
                console.error('AI Chat Error:', message.payload.msg);
                setIsThinking(false);
                // Optionally show error in UI
                break;
            case 'doc_generated':
                setMessages(prev => [...prev, {
                    id: Date.now(),
                    author: 'ai',
                    text: `📄 Document Created: "${message.payload.title || 'Business Analysis Report'}"`
                }]);
                refreshDrafts();
                setIsThinking(false);
                break;
            default:
                console.log('Unknown message type:', message.type);
        }
    };

    const sendMessage = () => {
        if (!input.trim() || !wsRef.current || !isConnected) return;

        const userMsg = {
            id: Date.now(),
            author: 'user',
            text: input
        };

        // Optimistically add user message
        setMessages(prev => [...prev, userMsg]);
        setIsThinking(true);

        let payloadText = input;

        // Inject context if a document is open
        if (selectedTask && allContent[selectedTask.id]) {
            const content = allContent[selectedTask.id];
            if (content.type === 'document' || content.type === 'uploaded') {
                // Prepend context (hidden from user, visible to LLM)
                // We format it clearly for the LLM
                const contextHeader = `\n\n[SYSTEM CONTEXT: The user is currently viewing the document titled "${content.title}". \nCONTENT START:\n${content.content}\nCONTENT END\nIf the user asks to edit/update, use this content as the base.]\n\n`;
                payloadText = payloadText + contextHeader;
            }
        }

        // Send to backend
        wsRef.current.send(JSON.stringify({
            type: 'user_message',
            payload: {
                session_id: sessionId || 0,
                text: payloadText
            }
        }));

        setInput('');
    };

    const submitQuestionnaire = (questions, answers) => {
        if (!wsRef.current || !isConnected) {
            alert("Соединение потеряно. Пожалуйста, подождите или перезагрузите страницу.");
            return;
        }

        // Format answers as a text message
        let responseText = "Answers to questionnaire:\n";
        questions.forEach(q => {
            responseText += `Q: ${q.text}\nA: ${answers[q.id] || 'Skipped'}\n\n`;
        });

        const userMsg = {
            id: Date.now(),
            author: 'user',
            text: responseText
        };

        setMessages(prev => [...prev, userMsg]);
        setIsThinking(true);

        // Send to backend
        wsRef.current.send(JSON.stringify({
            type: 'user_message',
            payload: {
                session_id: sessionId || 0,
                text: responseText
            }
        }));
    };

    const textareaRef = useRef(null);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [input]);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const scrollToBottom = () => {
        if (contentRef.current) {
            contentRef.current.scrollTop = contentRef.current.scrollHeight;
        }
    };

    if (!isOpen) return null;

    return (
        <div className={styles.aiPanel}>
            <div className={styles.aiPanelHeader}>
                <span className={styles.aiPanelTitle}>AI ASSISTANT</span>
                <div className={styles.aiPanelActions}>
                    <button
                        className={`${styles.aiPanelBtn} ${isOpen ? styles.activeAction : ''}`}
                        onClick={toggleChat}
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>

            <div className={styles.aiPanelContent} ref={contentRef}>
                {messages.length === 0 && (
                    <div className={styles.emptyState}>
                        <Sparkles size={48} className={styles.emptyIcon} />
                        <p>Start a conversation with AI Assistant</p>
                    </div>
                )}
                {messages.map((msg) => {
                    const isQuestionnaireAnswer = msg.text && msg.text.startsWith('Answers to questionnaire:');
                    return (
                        <div
                            key={msg.id}
                            className={`${styles.message} ${msg.author === 'user' ? styles.userMessage : styles.aiMessage} ${isQuestionnaireAnswer ? styles.questionnaireAnswer : ''}`}
                        >
                            <div className={styles.messageContent}>
                                {(msg.type === 'questionnaire' || msg.type === 'clarification') ? (
                                    <QuestionnaireForm
                                        questions={msg.questions}
                                        title={msg.title}
                                        onSubmit={submitQuestionnaire}
                                    />
                                ) : msg.type === 'error' ? (
                                    <div className={styles.errorMessage}>
                                        <AlertCircle size={20} className={styles.errorIcon} />
                                        <span>{msg.text}</span>
                                    </div>
                                ) : msg.text.startsWith('Answers to questionnaire:') ? (
                                    <SubmittedAnswers text={msg.text} />
                                ) : (
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {msg.text.replace(/\[SYSTEM CONTEXT:[\s\S]*?\]\s*/, '')}
                                    </ReactMarkdown>
                                )}
                            </div>
                        </div>
                    );
                })}
                {isThinking && (
                    <div className={`${styles.message} ${styles.aiMessage}`}>
                        <div className={styles.messageContent}>
                            <div className={styles.typingIndicator}>
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className={styles.aiInputContainer}>
                <div className={styles.aiInputWrapper}>
                    <textarea
                        ref={textareaRef}
                        placeholder={isConnected ? "Ask anything..." : "Connecting..."}
                        className={styles.aiInput}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={!isConnected}
                        rows={1}
                    />
                    <button
                        className={styles.aiSendBtn}
                        onClick={sendMessage}
                        disabled={!isConnected || !input.trim()}
                    >
                        <ArrowUp size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};

const SubmittedAnswers = ({ text }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    // Parse the text back to Q&A
    // Format: "Answers to questionnaire:\nQ: ...\nA: ...\n\n"
    const pairs = text.replace('Answers to questionnaire:\n', '').split('\n\n').filter(p => p.trim());

    return (
        <div className={styles.submittedAnswers}>
            <div className={styles.submittedHeader} onClick={() => setIsExpanded(!isExpanded)}>
                <div className={styles.submittedTitle}>
                    <span className={styles.checkIcon}>✓</span>
                    Questionnaire Submitted
                </div>
                <span className={styles.expandIcon}>{isExpanded ? '−' : '+'}</span>
            </div>

            {isExpanded && (
                <div className={styles.submittedContent}>
                    {pairs.map((pair, idx) => {
                        const [q, a] = pair.split('\nA: ');
                        return (
                            <div key={idx} className={styles.qaPair}>
                                <div className={styles.qaQuestion}>{q.replace('Q: ', '')}</div>
                                <div className={styles.qaAnswer}>{a}</div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

const QuestionnaireForm = ({ questions, title, onSubmit }) => {
    const [answers, setAnswers] = useState({});
    const [submitted, setSubmitted] = useState(false);

    const handleChange = (id, value) => {
        setAnswers(prev => ({ ...prev, [id]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(questions, answers);
        setSubmitted(true);
    };

    if (submitted) {
        return <div className={styles.submittedMessage}>✓ Answers submitted</div>;
    }

    return (
        <form onSubmit={handleSubmit} className={styles.questionnaireForm}>
            {title && <h4 className={styles.formTitle}>{title}</h4>}
            {questions.map(q => (
                <div key={q.id} className={styles.questionGroup}>
                    <label className={styles.questionLabel}>{q.text}</label>
                    <textarea
                        className={styles.questionInput}
                        value={answers[q.id] || ''}
                        onChange={(e) => handleChange(q.id, e.target.value)}
                        placeholder="Type your answer..."
                        rows={2}
                    />
                </div>
            ))}
            <button type="submit" className={styles.submitBtn}>Submit Answers</button>
        </form>
    );
};
