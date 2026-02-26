// src/components/ChatBot.jsx
import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User, Minimize2, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchChatResponse } from '../utils/aiService';

const ChatBot = ({ apiKey }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([
        { role: 'assistant', content: 'Hello! I am your SkillMatrix AI assistant. How can I help you with your coding journey today?' }
    ]);
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    const handleSend = async () => {
        if (!input.trim() || isTyping) return;

        const userMessage = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsTyping(true);

        try {
            if (!apiKey) {
                setMessages(prev => [...prev, { role: 'assistant', content: "API Key is missing. Ensure VITE_OPENROUTER_KEY is set in your .env file and you have restarted the server." }]);
                return;
            }
            const assistantMessage = await fetchChatResponse([...messages, userMessage], apiKey);
            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${error.message}. Please check your API key and network connection.` }]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="fixed bottom-8 right-8 z-[1000]">
            <AnimatePresence>
                {!isOpen && (
                    <motion.button
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        onClick={() => setIsOpen(true)}
                        className="w-16 h-16 bg-[#00a3ff] rounded-full shadow-[0_0_20px_rgba(0,163,255,0.4)] flex items-center justify-center text-white hover:scale-110 transition-transform group relative"
                    >
                        <MessageSquare size={28} />
                        <span className="absolute -top-12 right-0 bg-white text-[#0d1117] px-3 py-1 rounded-lg text-xs font-bold shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            Ask AI Assistant
                        </span>
                    </motion.button>
                )}

                {isOpen && (
                    <motion.div
                        initial={{ y: 100, opacity: 0, scale: 0.9 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: 100, opacity: 0, scale: 0.9 }}
                        className={`bg-[#0d1117]/95 backdrop-blur-xl border border-gray-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden ${isMinimized ? 'h-16 w-64' : 'h-[500px] w-96'
                            } transition-all duration-300`}
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-gradient-to-r from-[#0d1117] to-[#161b22]">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-[#00a3ff]/20 rounded-lg flex items-center justify-center text-[#00a3ff]">
                                    <Bot size={18} />
                                </div>
                                <span className="font-bold text-sm tracking-wide">SkillMatrix AI</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => setIsMinimized(!isMinimized)} className="text-gray-500 hover:text-white p-1">
                                    {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
                                </button>
                                <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-white p-1">
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        {!isMinimized && (
                            <>
                                {/* Messages Area */}
                                <div
                                    ref={scrollRef}
                                    className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar"
                                >
                                    {messages.map((msg, i) => (
                                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${msg.role === 'user'
                                                ? 'bg-[#00a3ff] text-white rounded-tr-none shadow-[0_4px_12px_rgba(0,163,255,0.2)]'
                                                : 'bg-[#161b22] text-gray-200 border border-gray-800 rounded-tl-none shadow-lg'
                                                }`}>
                                                {msg.content}
                                            </div>
                                        </div>
                                    ))}
                                    {isTyping && (
                                        <div className="flex justify-start">
                                            <div className="bg-[#161b22] text-gray-400 p-3 rounded-2xl rounded-tl-none border border-gray-800 flex gap-1 items-center">
                                                <span className="w-1.5 h-1.5 bg-gray-600 rounded-full animate-bounce" />
                                                <span className="w-1.5 h-1.5 bg-gray-600 rounded-full animate-bounce [animation-delay:0.2s]" />
                                                <span className="w-1.5 h-1.5 bg-gray-600 rounded-full animate-bounce [animation-delay:0.4s]" />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Input Area */}
                                <div className="p-4 border-t border-gray-800 bg-[#0d1117]">
                                    <div className="flex items-center gap-2 bg-[#161b22] border border-gray-800 rounded-xl px-3 py-2 focus-within:border-[#00a3ff] transition-colors">
                                        <input
                                            type="text"
                                            value={input}
                                            onChange={(e) => setInput(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                            placeholder="Ask a coding question..."
                                            className="bg-transparent border-none focus:outline-none flex-1 text-sm text-white"
                                        />
                                        <button
                                            onClick={handleSend}
                                            disabled={!input.trim() || isTyping}
                                            className="text-[#00a3ff] hover:scale-110 disabled:opacity-50 disabled:hover:scale-100 transition-all"
                                        >
                                            <Send size={18} />
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-gray-600 mt-2 text-center">Powered by AI assistant for Hackathon support</p>
                                </div>
                            </>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ChatBot;
