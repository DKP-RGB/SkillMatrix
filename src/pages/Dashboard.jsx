import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../utils/AuthContext';
import { useAnalytics } from '../analytics/useAnalytics';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import ChatBot from '../components/ChatBot';
import RadarChart from '../components/RadarChart';
import { motion } from 'framer-motion';
import {
    Trophy,
    Target,
    Zap,
    Clock,
    ChevronRight,
    LayoutDashboard,
    Search,
    BrainCircuit,
    BarChart3
} from 'lucide-react';

const Dashboard = () => {
    const { user } = useAuth();
    const { fetchAllTimeStats } = useAnalytics();
    const navigate = useNavigate();

    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const location = useLocation();
    const [lastAssessment, setLastAssessment] = useState(null);
    const [recentAssessments, setRecentAssessments] = useState([]);

    useEffect(() => {
        const loadStats = async () => {
            if (user) {
                const data = await fetchAllTimeStats();
                setStats(data);

                const { data: latest } = await supabase
                    .from('assessments')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(1);

                if (latest && latest.length > 0) {
                    setLastAssessment(latest[0]);
                }

                const { data: recent } = await supabase
                    .from('assessments')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(5);

                if (recent) setRecentAssessments(recent);
                setLoading(false);
            }
        };
        loadStats();

        const channel = supabase
            .channel('realtime_attempts')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'question_attempts',
                filter: `user_id=eq.${user?.id}`
            }, () => {
                loadStats();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, fetchAllTimeStats]);

    const handleReattempt = (topic) => {
        const topicData = analytics.topicStats[topic];
        const config = {
            topic,
            language: topicData?.lastLanguage || 'JavaScript',
            type: topicData?.lastType || 'mcq',
            difficulty: 'medium'
        };
        navigate('/exam', { state: { reattemptConfig: config } });
    };

    const analytics = useMemo(() => {
        if (!stats) return {
            accuracy: 0,
            avgTimePerQuestion: 0,
            totalQuestionsAttempted: 0,
            dailyStreak: 1,
            difficultyStats: { easy: { attempted: 0, correct: 0 }, medium: { attempted: 0, correct: 0 }, hard: { attempted: 0, correct: 0 } },
            topicStats: {}
        };

        const accuracy = stats.totalQuestionsAttempted > 0
            ? Math.round((stats.correctAnswers / stats.totalQuestionsAttempted) * 100)
            : 0;

        const avgTimePerQuestion = stats.totalQuestionsAttempted > 0
            ? Math.round(stats.totalTimeSpent / stats.totalQuestionsAttempted)
            : 0;

        let bestTopic = null;
        let weakTopic = null;
        let highestTopicAcc = -1;
        let lowestTopicAcc = 101;

        Object.entries(stats.topicStats || {}).forEach(([topic, s]) => {
            if (s.attempted > 0) {
                const acc = s.correct / s.attempted;
                if (acc > highestTopicAcc) { highestTopicAcc = acc; bestTopic = topic; }
                if (acc < lowestTopicAcc) { lowestTopicAcc = acc; weakTopic = topic; }
            }
        });

        return {
            ...stats,
            accuracy,
            avgTimePerQuestion,
            bestTopic,
            weakTopic,
            dailyStreak: 1
        };
    }, [stats]);

    if (!user) {
        navigate('/');
        return null;
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#0d1117]">
                <div className="relative flex flex-col items-center gap-6">
                    <div className="w-16 h-16 border-4 border-[#58a6ff]/20 border-t-[#58a6ff] rounded-full animate-spin"></div>
                    <div className="text-center">
                        <p className="text-white font-black tracking-tighter text-xl uppercase">Calibrating Console</p>
                        <p className="text-gray-500 font-mono text-xs mt-1 animate-pulse">SYNCHRONIZING_METRICS...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen w-full bg-[#0d1117] overflow-hidden selection:bg-[#58a6ff]/30">
            {/* Background Systems */}
            <div className="absolute inset-0 bg-dot-grid opacity-20 pointer-events-none" />
            <div className="glow-blob top-[-20%] right-[-10%] bg-[#58a6ff]/10" />
            <div className="glow-blob bottom-[-10%] left-[-10%] bg-[#238636]/5" />

            <div className="relative z-10 p-6 lg:p-10 max-w-7xl mx-auto flex flex-col gap-10">

                {/* Cheating Alert */}
                {location.state?.cheated && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        className="p-1 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-between shadow-2xl shadow-red-500/5"
                    >
                        <div className="flex items-center gap-4 p-3 px-5">
                            <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center text-red-500">
                                <Zap size={24} />
                            </div>
                            <div>
                                <h4 className="text-red-500 font-black uppercase text-sm tracking-tighter">Integrity Violation Detected</h4>
                                <p className="text-gray-400 text-xs font-medium">{location.state.reason || 'Assessment auto-terminated by system.'}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => navigate('/exam')}
                            className="mr-3 px-6 py-3 bg-red-500 text-white font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-black transition-all hover:scale-105 active:scale-95 shadow-lg shadow-red-500/20"
                        >
                            Appeal & Reattempt
                        </button>
                    </motion.div>
                )}

                {/* Header Section */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pt-6">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#161b22] border border-gray-800 mb-4">
                            <LayoutDashboard size={12} className="text-[#58a6ff]" />
                            <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">Command Center V2</span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-[0.9]">
                            GREETINGS, <span className="text-gradient uppercase">{user.user_metadata?.full_name || user.email?.split('@')[0]}</span>
                        </h1>
                        <p className="text-gray-500 mt-4 text-lg font-medium max-w-lg">
                            Your skill matrix is ready for synchronization. What shall we baseline today?
                        </p>
                    </div>
                    <button
                        onClick={() => navigate('/exam')}
                        className="group relative px-8 py-4 bg-white text-black font-black uppercase text-xs tracking-widest rounded-xl overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-[#58a6ff] to-[#3fb950] opacity-0 group-hover:opacity-10 transition-opacity" />
                        <span className="relative flex items-center gap-2">
                            New Evaluation <ChevronRight size={14} />
                        </span>
                    </button>
                </header>

                {/* Main Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                    <StatCard icon={<Target className="text-[#58a6ff]" />} label="Total Accuracy" value={`${analytics.accuracy}%`} color="blue" />
                    <StatCard icon={<Clock className="text-[#e3b341]" />} label="Avg Speed" value={`${analytics.avgTimePerQuestion}s`} color="yellow" />
                    <StatCard icon={<BrainCircuit className="text-[#238636]" />} label="Detections" value={analytics.totalQuestionsAttempted} color="green" />
                    <StatCard icon={<Zap className="text-[#da3633]" />} label="Streak" value={analytics.dailyStreak} color="red" isPulse />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Left Column: Analysis & History */}
                    <div className="lg:col-span-12 xl:col-span-8 flex flex-col gap-6">

                        {/* Radar Chart Container */}
                        <section className="bg-[#161b22]/50 backdrop-blur-md border border-gray-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                                <Search size={200} />
                            </div>

                            <div className="flex flex-col md:flex-row justify-between mb-8 gap-4">
                                <div>
                                    <h3 className="text-2xl font-black text-white tracking-tighter uppercase italic">Proficiency Radar</h3>
                                    <p className="text-gray-500 text-sm font-medium">Multi-dimensional mapping of your technical DNA.</p>
                                </div>
                                <div className="text-[10px] font-mono text-[#58a6ff] bg-[#58a6ff]/5 px-3 py-1 rounded-full border border-[#58a6ff]/20 self-start">
                                    [ ANALYSIS_MODE_ACTIVE ]
                                </div>
                            </div>

                            <div className="flex flex-col md:flex-row items-center gap-10">
                                <div className="flex-1 w-full flex justify-center">
                                    {analytics.totalQuestionsAttempted > 0 ? (
                                        <RadarChart data={analytics.topicStats} size={340} />
                                    ) : (
                                        <EmptyState message="Baseline required for radar generation" />
                                    )}
                                </div>

                                <div className="w-full md:w-64 space-y-4">
                                    <MiniStat label="Pillar Strength" value={analytics.bestTopic || 'UNDEFINED'} color="green" />
                                    <MiniStat label="Growth Vector" value={analytics.weakTopic || 'UNDEFINED'} color="red" />
                                    <div className="pt-4 border-t border-gray-800">
                                        <div className="text-[10px] text-gray-500 uppercase mb-2 font-bold">Maturity Score</div>
                                        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${analytics.accuracy}%` }}
                                                className="h-full bg-gradient-to-r from-[#58a6ff] to-[#3fb950]"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="bg-[#161b22]/50 backdrop-blur-md border border-gray-800 rounded-3xl p-8 shadow-2xl">
                            <div className="flex justify-between items-center mb-10">
                                <h3 className="text-xl font-black text-white tracking-tighter uppercase italic text-gradient">Session Ledger</h3>
                                <button className="text-[10px] text-gray-500 font-bold hover:text-white transition-colors uppercase tracking-widest px-3 py-1 bg-white/5 rounded-lg border border-white/5">Export Index</button>
                            </div>
                            <div className="space-y-4">
                                {recentAssessments.length > 0 ? recentAssessments.map((asmt) => (
                                    <motion.div
                                        key={asmt.id}
                                        whileHover={{ x: 5 }}
                                        className="flex items-center justify-between p-4 bg-[#0d1117]/50 rounded-2xl border border-gray-800/50 hover:border-[#58a6ff]/30 transition-all cursor-pointer group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black ${asmt.status === 'terminated' ? 'bg-red-500/10 text-red-500' : 'bg-[#58a6ff]/10 text-[#58a6ff]'}`}>
                                                {asmt.score}
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-black text-white uppercase group-hover:text-[#58a6ff] transition-colors">{asmt.topic}</h4>
                                                <p className="text-[10px] text-gray-500 font-mono uppercase">{asmt.language} • {new Date(asmt.created_at).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <div className="text-right flex flex-col items-end gap-1">
                                            <div className="text-xs font-mono font-black text-gray-400">{(asmt.score / asmt.total_questions * 100).toFixed(0)}%</div>
                                            <div className={`text-[8px] px-2 py-0.5 rounded font-black uppercase ${asmt.status === 'terminated' ? 'bg-red-500 text-white' : 'bg-[#238636] text-white'}`}>
                                                {asmt.status}
                                            </div>
                                        </div>
                                    </motion.div>
                                )) : (
                                    <p className="text-center py-10 text-gray-600 font-mono text-sm uppercase tracking-tighter">No session logs found</p>
                                )}
                            </div>
                        </section>
                    </div>

                    {/* Right Column: Recommendations & AI */}
                    <div className="lg:col-span-12 xl:col-span-4 flex flex-col gap-6">
                        <section className="bg-gradient-to-br from-[#161b22] to-black border border-gray-800 rounded-3xl p-8 shadow-2xl flex flex-col gap-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                                <BrainCircuit size={40} className="text-[#e3b341]" />
                            </div>
                            <h3 className="text-xl font-black text-white tracking-tighter uppercase italic flex items-center gap-2">
                                <BarChart3 className="text-[#e3b341]" size={20} /> AI Recommendations
                            </h3>
                            <div className="space-y-4">
                                {Object.entries(analytics.topicStats)
                                    .filter(([_, s]) => (s.correct / s.attempted) < 0.75)
                                    .sort((a, b) => (a[1].correct / a[1].attempted) - (b[1].correct / b[1].attempted))
                                    .slice(0, 3)
                                    .map(([topic, s]) => {
                                        const topicAcc = (s.correct / s.attempted) * 100;
                                        let aiInsight = "";

                                        if (topicAcc < 30) aiInsight = "Critical gap in foundational logic identified.";
                                        else if (topicAcc < 50) aiInsight = "Execution consistency below optimal threshold.";
                                        else if (topicAcc < 70) aiInsight = "Recent evaluation shows declining precision.";
                                        else aiInsight = "Needs reinforcement to reach mastery level.";

                                        return (
                                            <div key={topic} className="p-5 bg-white/[0.03] border border-white/5 rounded-2xl hover:bg-white/[0.05] transition-all group/rec">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <span className="text-sm font-black text-white uppercase tracking-tight">{topic}</span>
                                                        <p className="text-[9px] text-[#e3b341] font-mono mt-1 flex items-center gap-1">
                                                            <Zap size={8} /> {aiInsight}
                                                        </p>
                                                    </div>
                                                    <span className={`text-[10px] font-mono font-bold ${topicAcc < 50 ? 'text-red-500' : 'text-yellow-500'}`}>
                                                        {topicAcc.toFixed(0)}%
                                                    </span>
                                                </div>
                                                <div className="h-1.5 bg-white/5 rounded-full mb-4 overflow-hidden">
                                                    <div className="h-full bg-gradient-to-r from-red-500 to-[#e3b341]" style={{ width: `${topicAcc}%` }} />
                                                </div>
                                                <button
                                                    onClick={() => handleReattempt(topic)}
                                                    className="w-full py-2.5 bg-white text-black font-black uppercase text-[10px] tracking-[0.2em] rounded-xl hover:bg-[#58a6ff] hover:text-white transition-all transform active:scale-95 shadow-lg shadow-white/5"
                                                >
                                                    Reattempt Evaluation
                                                </button>
                                            </div>
                                        );
                                    })}
                                {analytics.totalQuestionsAttempted === 0 && (
                                    <div className="py-8 text-center bg-white/5 rounded-2xl border border-dashed border-white/10">
                                        <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Search size={16} className="text-gray-600" />
                                        </div>
                                        <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest italic">Baseline Required <br />[ Neural Link Inactive ]</p>
                                    </div>
                                )}
                            </div>
                        </section>

                        <div className="flex-1">
                            <div className="h-full flex flex-col items-center justify-center p-10 bg-[#58a6ff]/5 border border-[#58a6ff]/10 rounded-3xl border-dashed opacity-50 select-none">
                                <Trophy size={48} className="text-[#58a6ff] mb-4 opacity-20" />
                                <p className="text-center font-black text-white uppercase text-[10px] tracking-widest leading-loose">
                                    Global Leaderboards <br /> Coming Soon
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <footer className="pt-10 mb-6 border-t border-gray-800 text-center">
                    <p className="text-[#ffffff10] text-3xl md:text-6xl font-black tracking-tighter uppercase select-none">
                        Mapping Professional DNA
                    </p>
                </footer>
            </div>

            <ChatBot apiKey={import.meta.env.VITE_OPENROUTER_KEY} />
        </div>
    );
};

const StatCard = ({ icon, label, value, color, isPulse }) => (
    <motion.div
        whileHover={{ y: -5 }}
        className="bg-[#161b22] border border-gray-800 rounded-2xl p-6 flex flex-col items-start gap-4 hover:border-gray-600 transition-all"
    >
        <div className={`p-3 rounded-xl bg-white/5 ${isPulse ? 'animate-pulse' : ''}`}>
            {icon}
        </div>
        <div>
            <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">{label}</div>
            <div className={`text-3xl font-black tracking-tighter ${color === 'red' ? 'text-red-500' : 'text-white'}`}>{value}</div>
        </div>
    </motion.div>
);

const MiniStat = ({ label, value, color }) => (
    <div className="flex flex-col gap-1">
        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">{label}</span>
        <span className={`text-lg font-black uppercase tracking-tighter truncate ${color === 'green' ? 'text-[#238636]' :
            color === 'red' ? 'text-red-500' :
                'text-white'
            }`}>{value}</span>
    </div>
);

const EmptyState = ({ message }) => (
    <div className="flex flex-col items-center justify-center min-h-[300px] text-gray-600 opacity-50">
        <BarChart3 size={48} className="mb-4" />
        <p className="font-mono text-xs uppercase tracking-widest">{message}</p>
    </div>
);

export default Dashboard;
