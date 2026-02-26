import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import { fetchChatResponse } from '../utils/aiService';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronDown,
    ChevronUp,
    MessageCircle,
    CheckCircle,
    XCircle,
    ArrowLeft,
    Loader2
} from 'lucide-react';

const ReviewPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { results, sessionMeta } = location.state || { results: [], sessionMeta: {} };

    const [explanations, setExplanations] = useState({});
    const [loadingExpl, setLoadingExpl] = useState({});
    const [activeChat, setActiveChat] = useState(null); // ID of question being chatted with
    const [chatMessages, setChatMessages] = useState({});
    const [userMessage, setUserMessage] = useState("");
    const [isThinking, setIsThinking] = useState(false);

    useEffect(() => {
        if (!location.state) {
            navigate('/dashboard');
        }
    }, [location.state, navigate]);

    const getAIExplanation = async (question, index) => {
        if (explanations[index]) return; // Already fetched

        setLoadingExpl(prev => ({ ...prev, [index]: true }));
        try {
            const prompt = `
                I am a student using SkillMatrix. I got this question wrong. 
                Question: ${question.question}
                My Code/Answer: ${question.userAnswer}
                Expected Output/Correct Answer: ${question.correctAnswer || question.expectedOutput}
                Topic: ${question.topic}
                
                Explain exactly why my approach was incorrect and provide the correct logical path. Be concise but deep.
            `;
            const response = await fetchChatResponse([{ role: "user", content: prompt }], import.meta.env.VITE_OPENROUTER_KEY);
            setExplanations(prev => ({ ...prev, [index]: response.content }));
        } catch (err) {
            console.error("AI Explanation Error:", err);
            setExplanations(prev => ({ ...prev, [index]: "Failed to load explanation. Please try again." }));
        } finally {
            setLoadingExpl(prev => ({ ...prev, [index]: false }));
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!userMessage.trim() || isThinking) return;

        const qId = activeChat.index;
        const currentChat = chatMessages[qId] || [];
        const newMessages = [...currentChat, { role: "user", content: userMessage }];

        setChatMessages(prev => ({ ...prev, [qId]: newMessages }));
        setUserMessage("");
        setIsThinking(true);

        try {
            const contextPrompt = `
                CONTEXT: Discussing question "${activeChat.question.question}" from a ${activeChat.question.language} test on ${activeChat.question.topic}.
                User Answered: ${activeChat.question.userAnswer}
                Correct result should be: ${activeChat.question.correctAnswer || activeChat.question.expectedOutput}
            `;

            const fullHistory = [
                { role: "system", content: contextPrompt },
                ...newMessages
            ];

            const aiResp = await fetchChatResponse(fullHistory, import.meta.env.VITE_OPENROUTER_KEY);
            setChatMessages(prev => ({
                ...prev,
                [qId]: [...newMessages, { role: "assistant", content: aiResp.content }]
            }));
        } catch (err) {
            console.error("Chat Error:", err);
        } finally {
            setIsThinking(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0d1117] text-gray-100 p-6 md:p-10 pb-32">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-10">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft /> Back to Dashboard
                    </button>
                    <div className="text-right">
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#58a6ff] to-indigo-400">
                            Assessment Review
                        </h1>
                        <p className="text-gray-400 mt-1">{sessionMeta.language} • {sessionMeta.type}</p>
                    </div>
                </div>

                {/* Score Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <div className="bg-[#161b22] border border-gray-800 p-6 rounded-2xl text-center">
                        <div className="text-gray-400 text-sm mb-1">FINAL SCORE</div>
                        <div className="text-4xl font-bold text-[#58a6ff]">{results.filter(r => r.isCorrect).length} / {results.length}</div>
                    </div>
                    <div className="bg-[#161b22] border border-gray-800 p-6 rounded-2xl text-center">
                        <div className="text-gray-400 text-sm mb-1">ACCURACY</div>
                        <div className="text-4xl font-bold text-[#3fb950]">
                            {Math.round((results.filter(r => r.isCorrect).length / results.length) * 100)}%
                        </div>
                    </div>
                    <div className="bg-[#161b22] border border-gray-800 p-6 rounded-2xl text-center">
                        <div className="text-gray-400 text-sm mb-1">AVG. TIME / Q</div>
                        <div className="text-4xl font-bold text-[#f2cc60]">
                            {Math.round(results.reduce((acc, r) => acc + r.timeTaken, 0) / results.length)}s
                        </div>
                    </div>
                </div>

                {/* Question List */}
                <div className="space-y-6">
                    <h2 className="text-xl font-bold border-b border-gray-800 pb-4">Detailed Question Analysis</h2>
                    {results.map((res, idx) => (
                        <div
                            key={idx}
                            className={`bg-[#161b22] border rounded-2xl overflow-hidden transition-all duration-300 ${res.isCorrect ? 'border-gray-800' : 'border-red-900/40'}`}
                        >
                            <div className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <span className="text-gray-500 font-mono text-sm">#{idx + 1}</span>
                                        {res.isCorrect ? (
                                            <CheckCircle className="text-[#3fb950] text-xl" />
                                        ) : (
                                            <XCircle className="text-[#f85149] text-xl" />
                                        )}
                                        <span className="px-2 py-0.5 bg-gray-800 rounded text-xs text-gray-400 uppercase tracking-wider">{res.topic}</span>
                                        <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${res.difficulty === 'easy' ? 'bg-green-900/30 text-green-400' :
                                            res.difficulty === 'medium' ? 'bg-yellow-900/30 text-yellow-400' :
                                                'bg-red-900/30 text-red-400'
                                            }`}>{res.difficulty}</span>
                                    </div>
                                    <div className="text-gray-400 text-sm font-mono">{res.timeTaken}s</div>
                                </div>

                                <h3 className="text-lg font-medium mb-4">{res.question}</h3>

                                {/* Answer Comparison */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                    <div className="p-4 bg-[#0d1117] rounded-xl border border-gray-800">
                                        <div className="text-xs text-gray-500 mb-2 uppercase font-bold tracking-tighter">Your Answer</div>
                                        <div className={`font-mono text-sm ${res.isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                                            {res.userAnswer || "[No Answer]"}
                                        </div>
                                    </div>
                                    {!res.isCorrect && (
                                        <div className="p-4 bg-[#0d1117] rounded-xl border border-gray-800">
                                            <div className="text-xs text-gray-500 mb-2 uppercase font-bold tracking-tighter">Correct Answer</div>
                                            <div className="font-mono text-sm text-[#3fb950]">
                                                {res.correctAnswer || res.expectedOutput}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* AI Actions */}
                                <div className="flex flex-wrap gap-4 pt-4 border-t border-gray-800">
                                    {!res.isCorrect && (
                                        <button
                                            onClick={() => getAIExplanation(res, idx)}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${explanations[idx]
                                                ? 'bg-[#1f6feb] text-white cursor-default'
                                                : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                                                }`}
                                        >
                                            {loadingExpl[idx] ? <Loader2 className="animate-spin" /> : <MessageCircle size={18} />}
                                            {explanations[idx] ? 'Explanation Loaded' : 'Ask AI why I failed'}
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setActiveChat({ index: idx, question: res })}
                                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600/20 text-indigo-400 border border-indigo-900/50 hover:bg-indigo-600/30 transition-all"
                                    >
                                        <MessageCircle size={18} /> Chat for Doubts
                                    </button>
                                </div>

                                {/* AI Explanation Text */}
                                {explanations[idx] && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="mt-6 p-5 bg-blue-900/10 border border-blue-900/30 rounded-xl"
                                    >
                                        <div className="flex items-center gap-2 text-[#58a6ff] mb-3 font-bold text-sm uppercase">
                                            AI Analysis:
                                        </div>
                                        <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                                            {explanations[idx]}
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* AI Review Chat Sidebar */}
            <AnimatePresence>
                {activeChat && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setActiveChat(null)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            className="fixed right-0 top-0 h-full w-full max-w-lg bg-[#161b22] border-l border-gray-800 z-50 flex flex-col shadow-2xl"
                        >
                            <div className="p-6 border-b border-gray-800 bg-[#0d1117] flex items-center justify-between">
                                <div>
                                    <h3 className="font-bold text-[#58a6ff]">Discuss Question #{activeChat.index + 1}</h3>
                                    <p className="text-xs text-gray-500 truncate max-w-[300px]">{activeChat.question.question}</p>
                                </div>
                                <button
                                    onClick={() => setActiveChat(null)}
                                    className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                                >
                                    <ChevronUp className="w-6 h-6 transform rotate-90" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                                {(!chatMessages[activeChat.index] || chatMessages[activeChat.index].length === 0) && (
                                    <div className="text-center py-10">
                                        <div className="w-16 h-16 bg-indigo-900/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-indigo-900/50">
                                            <MessageCircle className="text-indigo-400 text-2xl" />
                                        </div>
                                        <p className="text-gray-400 text-sm">Ask anything about this question.<br />Explain your logic, ask for examples, etc.</p>
                                    </div>
                                )}
                                {chatMessages[activeChat.index]?.map((msg, midx) => (
                                    <div
                                        key={midx}
                                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div className={`max-w-[85%] p-4 rounded-2xl ${msg.role === 'user'
                                            ? 'bg-[#1f6feb] text-white rounded-tr-none shadow-lg'
                                            : 'bg-[#0d1117] border border-gray-800 rounded-tl-none'
                                            }`}>
                                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                        </div>
                                    </div>
                                ))}
                                {isThinking && (
                                    <div className="flex justify-start">
                                        <div className="bg-[#0d1117] border border-gray-800 p-4 rounded-2xl rounded-tl-none">
                                            <div className="flex gap-2">
                                                <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce"></div>
                                                <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                                                <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <form onSubmit={handleSendMessage} className="p-6 border-t border-gray-800 bg-[#0d1117]">
                                <div className="flex gap-3">
                                    <input
                                        type="text"
                                        value={userMessage}
                                        onChange={(e) => setUserMessage(e.target.value)}
                                        placeholder="Ask a doubt..."
                                        className="flex-1 bg-[#161b22] border border-gray-800 rounded-xl px-4 py-3 focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff] outline-none text-sm transition-all"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!userMessage.trim() || isThinking}
                                        className="bg-[#1f6feb] hover:bg-[#3182ce] disabled:bg-gray-800 disabled:text-gray-500 text-white p-3 rounded-xl transition-all shadow-lg"
                                    >
                                        <MessageCircle />
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ReviewPage;
