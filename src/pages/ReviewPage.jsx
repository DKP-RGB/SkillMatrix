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
    Loader2,
    ShieldCheck,
    BarChart,
    Timer,
    BrainCircuit
} from 'lucide-react';

const ReviewPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { results, sessionMeta } = location.state || { results: [], sessionMeta: {} };

    const [explanations, setExplanations] = useState({});
    const [loadingExpl, setLoadingExpl] = useState({});
    const [activeChat, setActiveChat] = useState(null);
    const [chatMessages, setChatMessages] = useState({});
    const [userMessage, setUserMessage] = useState("");
    const [isThinking, setIsThinking] = useState(false);

    useEffect(() => {
        if (!location.state) {
            navigate('/dashboard');
        }
    }, [location.state, navigate]);

    const getAIExplanation = async (question, index) => {
        if (explanations[index]) return;

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

    const correctCount = results.filter(r => r.isCorrect).length;
    const accuracy = Math.round((correctCount / results.length) * 100);
    const avgTime = Math.round(results.reduce((acc, r) => acc + r.timeTaken, 0) / results.length);

    return (
        <div className="relative min-h-screen w-full bg-[#0d1117] overflow-hidden selection:bg-[#58a6ff]/30">
            {/* Background Systems */}
            <div className="absolute inset-0 bg-dot-grid opacity-20 pointer-events-none" />
            <div className="glow-blob top-[-20%] left-[-10%] bg-[#58a6ff]/10" />

            <div className="relative z-10 p-6 lg:p-10 max-w-5xl mx-auto pb-32">
                {/* Header */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12 pt-6">
                    <div>
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="flex items-center gap-2 text-gray-500 hover:text-white transition-all text-xs font-black uppercase tracking-widest mb-4 group"
                        >
                            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Return to Command Center
                        </button>
                        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase italic leading-none">
                            Deep <span className="text-gradient">Analysis</span> Log
                        </h1>
                        <p className="text-gray-500 mt-2 font-mono text-xs uppercase tracking-tighter">
                            Session: {sessionMeta.language} • {sessionMeta.type} • {new Date().toLocaleDateString()}
                        </p>
                    </div>
                </header>

                {/* Score Summary Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
                    <MetricCard icon={<ShieldCheck className="text-[#58a6ff]" />} label="Final Score" value={`${correctCount} / ${results.length}`} color="blue" />
                    <MetricCard icon={<BarChart className="text-[#238636]" />} label="Precision" value={`${accuracy}%`} color="green" />
                    <MetricCard icon={<Timer className="text-[#e3b341]" />} label="Avg Tempo" value={`${avgTime}s`} color="yellow" />
                </div>

                {/* Question Breakdown */}
                <div className="space-y-6">
                    <h2 className="text-sm font-black text-gray-400 uppercase tracking-[0.3em] mb-8 border-b border-gray-800 pb-4 flex items-center gap-4">
                        <span className="w-2 h-2 bg-[#58a6ff] rounded-full animate-pulse shadow-[0_0_8px_#58a6ff]"></span>
                        Neural Breakdown
                    </h2>

                    {results.map((res, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className={`relative bg-[#161b22]/50 backdrop-blur-md border rounded-3xl overflow-hidden group transition-all duration-300 ${res.isCorrect ? 'border-gray-800 hover:border-gray-700' : 'border-red-900/30 hover:border-red-900/50 shadow-2xl shadow-red-500/5'}`}
                        >
                            <div className="p-8">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-4">
                                        <span className="font-mono text-xs text-gray-500 font-bold">#{idx + 1}</span>
                                        <div className={`p-2 rounded-lg ${res.isCorrect ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                            {res.isCorrect ? <CheckCircle size={18} /> : <XCircle size={18} />}
                                        </div>
                                        <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded font-mono text-[9px] text-gray-400 uppercase tracking-widest">{res.topic}</span>
                                        <span className={`px-2 py-0.5 rounded font-black text-[9px] uppercase tracking-widest ${res.difficulty === 'easy' ? 'text-green-500' :
                                                res.difficulty === 'medium' ? 'text-yellow-500' :
                                                    'text-red-500'
                                            }`}>{res.difficulty}</span>
                                    </div>
                                    <span className="text-[10px] font-mono text-gray-500 font-bold">{res.timeTaken}s</span>
                                </div>

                                <h3 className="text-xl font-bold text-white mb-8 tracking-tight leading-snug">{res.question}</h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                                    <div className="p-5 bg-black/40 rounded-2xl border border-gray-800/50">
                                        <div className="text-[10px] text-gray-500 mb-3 uppercase font-black tracking-widest">Input Pattern</div>
                                        <div className={`font-mono text-sm ${res.isCorrect ? 'text-green-400' : 'text-red-400'} break-all`}>
                                            {res.userAnswer || "// NO_INPUT_RECORDED"}
                                        </div>
                                    </div>
                                    {!res.isCorrect && (
                                        <div className="p-5 bg-black/40 rounded-2xl border border-gray-800/50">
                                            <div className="text-[10px] text-gray-500 mb-3 uppercase font-black tracking-widest">Valid Solution</div>
                                            <div className="font-mono text-sm text-[#58a6ff] break-all">
                                                {res.correctAnswer || res.expectedOutput}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-wrap gap-3 pt-6 border-t border-gray-800/50">
                                    {!res.isCorrect && (
                                        <button
                                            onClick={() => getAIExplanation(res, idx)}
                                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${explanations[idx]
                                                ? 'bg-[#58a6ff] text-white'
                                                : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/5'
                                                }`}
                                        >
                                            {loadingExpl[idx] ? <Loader2 className="animate-spin" size={14} /> : <BrainCircuit size={14} />}
                                            {explanations[idx] ? 'Core logic identified' : 'Diagnose Failure'}
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setActiveChat({ index: idx, question: res })}
                                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 transition-all"
                                    >
                                        <MessageCircle size={14} /> Refine Understanding
                                    </button>
                                </div>

                                <AnimatePresence>
                                    {explanations[idx] && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            className="mt-6 p-6 bg-[#58a6ff]/5 border border-[#58a6ff]/20 rounded-2xl"
                                        >
                                            <div className="text-gray-300 text-sm leading-relaxed font-medium">
                                                {explanations[idx]}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* AI Review Chat Modal */}
            <AnimatePresence>
                {activeChat && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setActiveChat(null)}
                            className="fixed inset-0 bg-black/80 backdrop-blur-md z-40"
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed right-0 top-0 h-full w-full max-w-lg bg-[#0d1117] border-l border-gray-800 z-50 flex flex-col shadow-3xl"
                        >
                            <div className="p-8 border-b border-gray-800 bg-[#161b22] flex items-center justify-between">
                                <div>
                                    <h3 className="font-black text-white uppercase tracking-tighter text-xl italic">Neural Dialogue</h3>
                                    <p className="text-[10px] text-gray-500 font-mono mt-1 uppercase truncate max-w-[250px]">Topic: {activeChat.question.topic}</p>
                                </div>
                                <button
                                    onClick={() => setActiveChat(null)}
                                    className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-gray-400 hover:text-white transition-all"
                                >
                                    <XCircle />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-dot-grid bg-[length:20px_20px]">
                                {(!chatMessages[activeChat.index] || chatMessages[activeChat.index].length === 0) && (
                                    <div className="text-center py-20 opacity-30">
                                        <BrainCircuit size={64} className="mx-auto mb-6 text-[#58a6ff]" />
                                        <p className="text-white font-black uppercase text-[10px] tracking-widest leading-loose">
                                            Awaiting logical <br /> inquiries...
                                        </p>
                                    </div>
                                )}
                                {chatMessages[activeChat.index]?.map((msg, midx) => (
                                    <div
                                        key={midx}
                                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div className={`max-w-[90%] p-5 rounded-3xl ${msg.role === 'user'
                                            ? 'bg-white text-black font-bold text-sm rounded-tr-none shadow-xl'
                                            : 'bg-[#161b22] border border-gray-800 text-gray-300 text-sm leading-relaxed rounded-tl-none font-medium'
                                            }`}>
                                            {msg.content}
                                        </div>
                                    </div>
                                ))}
                                {isThinking && (
                                    <div className="flex justify-start">
                                        <div className="bg-[#161b22] border border-gray-800 p-5 rounded-3xl rounded-tl-none">
                                            <div className="flex gap-2">
                                                <div className="w-1.5 h-1.5 bg-[#58a6ff] rounded-full animate-pulse"></div>
                                                <div className="w-1.5 h-1.5 bg-[#58a6ff] rounded-full animate-pulse [animation-delay:0.2s]"></div>
                                                <div className="w-1.5 h-1.5 bg-[#58a6ff] rounded-full animate-pulse [animation-delay:0.4s]"></div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <form onSubmit={handleSendMessage} className="p-8 border-t border-gray-800 bg-[#161b22]">
                                <div className="flex gap-4">
                                    <input
                                        type="text"
                                        value={userMessage}
                                        onChange={(e) => setUserMessage(e.target.value)}
                                        placeholder="Discuss logic failure..."
                                        className="flex-1 bg-black border border-gray-800 rounded-2xl px-5 py-4 focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff] outline-none text-sm transition-all text-white font-medium"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!userMessage.trim() || isThinking}
                                        className="bg-[#58a6ff] hover:bg-[#3182ce] disabled:bg-gray-800 disabled:text-gray-500 text-white w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-xl shadow-[#58a6ff]/20 active:scale-95"
                                    >
                                        <MessageCircle />
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Matrix Decoration Footer */}
            <div className="py-20 text-center border-t border-white/5 w-full bg-gradient-to-b from-transparent to-black/50 pointer-events-none">
                <p className="text-[#ffffff05] text-5xl md:text-9xl font-black tracking-tighter uppercase select-none leading-none">
                    Session_Immutable
                </p>
            </div>
        </div>
    );
};

const MetricCard = ({ icon, label, value, color }) => (
    <div className="bg-[#161b22]/80 backdrop-blur-md border border-gray-800 p-8 rounded-3xl group hover:border-gray-600 transition-all">
        <div className="flex items-center gap-4 mb-4">
            <div className={`p-3 rounded-xl bg-white/5`}>
                {icon}
            </div>
            <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest font-bold">{label}</span>
        </div>
        <div className="text-4xl font-black text-white tracking-tighter uppercase">{value}</div>
    </div>
);

export default ReviewPage;
