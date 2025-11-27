import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, ArrowUp, X } from 'lucide-react';
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
                const formattedMessages = history.map(msg => ({
                    id: msg.ID,
                    author: msg.author, // 'user' or 'ai'
                    text: msg.text
                }));
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
                // Add AI response to messages
                setMessages(prev => [...prev, {
                    id: Date.now(),
                    author: 'ai',
                    text: message.payload.text
                }]);
                setIsThinking(false);
                break;
            case 'questionnaire':
                // Handle questionnaire
                setMessages(prev => [...prev, {
                    id: Date.now(),
                    author: 'ai',
                    type: 'questionnaire',
                    questions: message.payload.questions,
                    text: 'Please answer the following questions:'
                }]);
                setIsThinking(false);
                break;
            case 'error':
                console.error('AI Chat Error:', message.payload.msg);
                setIsThinking(false);
                // Optionally show error in UI
                break;
            case 'document_created':
                setMessages(prev => [...prev, {
                    id: Date.now(),
                    author: 'ai',
                    text: `📄 Document Created: "${message.payload.title}"`
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

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
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
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`${styles.message} ${msg.author === 'user' ? styles.userMessage : styles.aiMessage}`}
                    >
                        <div className={styles.messageContent}>
                            {msg.type === 'questionnaire' ? (
                                <QuestionnaireForm questions={msg.questions} onSubmit={submitQuestionnaire} />
                            ) : (
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {msg.text.replace(/\[SYSTEM CONTEXT:[\s\S]*?\]\s*/, '')}
                                </ReactMarkdown>
                            )}
                        </div>
                    </div>
                ))}
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
                    <input
                        type="text"
                        placeholder={isConnected ? "Ask anything..." : "Connecting..."}
                        className={styles.aiInput}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={!isConnected}
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

const QuestionnaireForm = ({ questions, onSubmit }) => {
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
