import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, ArrowUp, X } from 'lucide-react';
import styles from './AiChat.module.css';
import { authService } from '../../api/authService';

export const AiChat = ({ isOpen, toggleChat }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const [sessionId, setSessionId] = useState(null);
    const wsRef = useRef(null);
    const messagesEndRef = useRef(null);

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
    }, [messages]);

    const connectWebSocket = () => {
        const token = authService.getToken();
        if (!token) {
            console.error('No token found, cannot connect to chat');
            return;
        }

        // Connect to WebSocket with token in query param or header (browser WS API only supports query for initial handshake usually)
        const wsUrl = `ws://localhost:9000/ws/agent?token=${token}`;
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            console.log('Connected to AI Chat');
            setIsConnected(true);
            // Start a session immediately upon connection
            ws.send(JSON.stringify({
                type: 'start_session',
                payload: { title: 'New Chat' }
            }));
        };

        ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                handleWebSocketMessage(message);
            } catch (error) {
                console.error('Error parsing WebSocket message:', error);
            }
        };

        ws.onclose = () => {
            console.log('Disconnected from AI Chat');
            setIsConnected(false);
            wsRef.current = null;
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        wsRef.current = ws;
    };

    const handleWebSocketMessage = (message) => {
        switch (message.type) {
            case 'session_started':
                setSessionId(message.payload.session_id);
                break;
            case 'ai_done':
                // Add AI response to messages
                setMessages(prev => [...prev, {
                    id: Date.now(),
                    author: 'ai',
                    text: message.payload.text
                }]);
                break;
            case 'error':
                console.error('AI Chat Error:', message.payload.msg);
                // Optionally show error in UI
                break;
            case 'document_created':
                setMessages(prev => [...prev, {
                    id: Date.now(),
                    author: 'ai',
                    text: `📄 Document Created: "${message.payload.title}"`
                }]);
                break;
            default:
                console.log('Unknown message type:', message.type);
        }
    };

    const sendMessage = () => {
        if (!input.trim() || !wsRef.current || !isConnected || !sessionId) return;

        const userMsg = {
            id: Date.now(),
            author: 'user',
            text: input
        };

        // Optimistically add user message
        setMessages(prev => [...prev, userMsg]);

        // Send to backend
        wsRef.current.send(JSON.stringify({
            type: 'user_message',
            payload: {
                session_id: sessionId,
                text: input
            }
        }));

        setInput('');
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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

            <div className={styles.aiPanelContent}>
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
                            {msg.text}
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            <div className={styles.aiInputContainer}>
                <div className={styles.aiInputWrapper}>
                    <input
                        type="text"
                        placeholder={isConnected ? "Ask anything..." : "Connecting..."}
                        className={styles.aiInput}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
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
