import React, { useState, useEffect, useRef } from 'react';
import { MessageSquareText, Search, MoreHorizontal, Send, UserPlus, X } from 'lucide-react';
import styles from './TeamChat.module.css';
import { authService } from '../../api/authService';

export const TeamChat = ({ isOpen, toggleChat }) => {
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [messages, setMessages] = useState({}); // { userId: [msgs] }
    const [input, setInput] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const wsRef = useRef(null);
    const messagesEndRef = useRef(null);

    const currentUser = authService.getUser();
    console.log('TeamChat currentUser:', currentUser); // Debug log
    const isAdmin = currentUser?.role === 'Business Analyst' || currentUser?.role === 'admin';

    useEffect(() => {
        if (isOpen) {
            fetchUsers();
            connectWebSocket();
        } else {
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
                setIsConnected(false);
            }
        }
    }, [isOpen]);

    useEffect(() => {
        scrollToBottom();
    }, [messages, selectedUser, isOpen]);

    const fetchUsers = async () => {
        try {
            const token = authService.getToken();
            const response = await fetch('https://ai-ba-backend.onrender.com/api/users', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setUsers(data || []);
            }
        } catch (error) {
            console.error('Failed to fetch users:', error);
        }
    };

    const connectWebSocket = () => {
        const token = authService.getToken();
        if (!token) return;

        const ws = new WebSocket(`wss://ai-ba-backend.onrender.com/ws/team?token=${token}`);

        ws.onopen = () => {
            console.log('Connected to Team Chat');
            setIsConnected(true);
        };

        ws.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data);
                handleWebSocketMessage(msg);
            } catch (error) {
                console.error('WS error:', error);
            }
        };

        ws.onclose = () => {
            setIsConnected(false);
            wsRef.current = null;
        };

        wsRef.current = ws;
    };

    const handleWebSocketMessage = (msg) => {
        if (msg.type === 'new_message' || msg.type === 'message_sent') {
            const payload = msg.payload;
            const otherId = payload.sender_id === authService.getUser()?.id ? payload.receiver_id : payload.sender_id;

            // For message_sent (echo), sender is me, receiver is other.
            // For new_message, sender is other, receiver is me.
            // Wait, authService.getUser() might not have ID easily available if it's just name/email in local storage.
            // Let's rely on the payload structure.

            // If I sent it (message_sent):
            if (msg.type === 'message_sent') {
                addMessage(payload.receiver_id, payload);
            } else {
                // If I received it (new_message):
                addMessage(payload.sender_id, payload);
            }
        } else if (msg.type === 'history') {
            const { other_user_id, messages } = msg.payload;
            setMessages(prev => ({
                ...prev,
                [other_user_id]: messages
            }));
        }
    };

    const addMessage = (userId, msg) => {
        setMessages(prev => ({
            ...prev,
            [userId]: [...(prev[userId] || []), msg]
        }));
    };

    const selectUser = (user) => {
        setSelectedUser(user);
        // Request history
        if (wsRef.current && isConnected) {
            wsRef.current.send(JSON.stringify({
                type: 'get_history',
                payload: { other_user_id: user.id }
            }));
        }
    };



    // Fix for the double send above and clarification:
    // Backend: `var msg wsMsg` -> `json.Unmarshal(data, &msg)`
    // `msg.Payload` is `json.RawMessage`.
    // Then `json.Unmarshal(msg.Payload, &p)`.
    // So if I send `{ "type": "...", "payload": { "receiver_id": 1, ... } }`, 
    // `msg.Payload` will be `{"receiver_id": 1, ...}` (bytes).
    // Unmarshaling that into `p` works.

    const handleSend = () => {
        if (!input.trim() || !selectedUser || !wsRef.current) return;

        const payload = {
            receiver_id: selectedUser.id,
            content: input
        };

        wsRef.current.send(JSON.stringify({
            type: 'private_message',
            payload: payload
        }));

        setInput('');
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    if (!isOpen) return null;

    return (
        <div className={styles.panel}>
            <div className={styles.header}>
                {selectedUser ? (
                    <div className={styles.chatHeaderUser}>
                        <button onClick={() => setSelectedUser(null)} className={styles.backBtn}>←</button>
                        <span className={styles.title}>{selectedUser.name}</span>
                    </div>
                ) : (
                    <>
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
                    </>
                )}
            </div>

            {!selectedUser ? (
                <>
                    <div className={styles.searchContainer}>
                        <div className={styles.searchWrapper}>
                            <Search size={16} className={styles.searchIcon} />
                            <input type="text" placeholder="Поиск..." className={styles.searchInput} />
                        </div>
                    </div>

                    <div className={styles.content}>
                        {users.length === 0 && <div className={styles.emptyState}>Нет пользователей</div>}
                        {users.map(user => (
                            <div key={user.id} className={styles.chatItem} onClick={() => selectUser(user)}>
                                <div className={styles.avatar}>{user.name[0]}</div>
                                <div className={styles.chatInfo}>
                                    <div className={styles.chatHeader}>
                                        <span className={styles.chatName}>{user.name}</span>
                                    </div>
                                    <span className={styles.lastMessage}>{user.position || user.email}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                <>
                    <div className={styles.messagesList}>
                        {(messages[selectedUser.id] || []).map((msg, idx) => {
                            // Determine if message is from me or them
                            // We need to know my ID. 
                            // Since we don't have it easily, we can check sender_id.
                            // If sender_id === selectedUser.id, it's from them.
                            // Else it's from me.
                            const isMe = msg.sender_id !== selectedUser.id;
                            return (
                                <div key={idx} className={`${styles.messageBubble} ${isMe ? styles.myMessage : styles.theirMessage}`}>
                                    {msg.content}
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>
                    <div className={styles.inputArea}>
                        <input
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSend()}
                            placeholder="Написать сообщение..."
                            className={styles.messageInput}
                        />
                        <button onClick={handleSend} className={styles.sendBtn}>
                            <Send size={18} />
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};
