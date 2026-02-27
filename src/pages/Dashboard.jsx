import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../utils/AuthContext';
import { useAnalytics } from '../analytics/useAnalytics';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import ChatBot from '../components/ChatBot';
import RadarChart from '../components/RadarChart';

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

                // Fetch most recent assessment status
                const { data: latest } = await supabase
                    .from('assessments')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(1);

                if (latest && latest.length > 0) {
                    setLastAssessment(latest[0]);
                }

                // Fetch last 5 assessments for the "Recent Activity" table
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

        // Real-time listener for question attempts to update chart in "real-time"
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
        // Find the specific stats for this topic
        const topicData = analytics.topicStats[topic];

        const config = {
            topic,
            language: topicData?.lastLanguage || 'JavaScript',
            type: topicData?.lastType || 'mcq',
            difficulty: 'medium' // Always reset to medium for a fresh adaptive start
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
            dailyStreak: 1 // still mock
        };
    }, [stats]);

    if (!user) {
        navigate('/');
        return null;
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#0d1117]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-[#1f6feb] border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-400 font-medium">Crunching your skill metrics...</p>
                </div>
            </div>
        );
    }

    // Helper for generating simple CSS bar charts
    const renderDifficultyGraph = () => {
        const max = Math.max(
            analytics.difficultyStats.easy.attempted,
            analytics.difficultyStats.medium.attempted,
            analytics.difficultyStats.hard.attempted,
            1
        );

        return (
            <div className="flex flex-col gap-4 mt-4 w-full">
                {['easy', 'medium', 'hard'].map(diff => {
                    const diffData = analytics.difficultyStats[diff];
                    const width = `${(diffData.attempted / max) * 100}%`;
                    const acc = diffData.attempted > 0 ? Math.round((diffData.correct / diffData.attempted) * 100) : 0;
                    return (
                        <div key={diff} className="flex items-center">
                            <span className="w-20 text-sm capitalize text-secondary">{diff}</span>
                            <div className="flex-1 h-6 bg-[rgba(255,255,255,0.05)] rounded overflow-hidden">
                                <div
                                    className={`h-full flex items-center px-2 text-xs font-bold text-white transition-all duration-1000 ${diff === 'easy' ? 'bg-[#238636]' :
                                        diff === 'medium' ? 'bg-[#e3b341]' :
                                            'bg-[#da3633]'
                                        }`}
                                    style={{ width: diffData.attempted > 0 ? width : '0%' }}
                                >
                                    {diffData.attempted > 0 && `${acc}% Acc`}
                                </div>
                            </div>
                            <span className="w-12 text-right text-sm">{diffData.attempted} Qs</span>
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderRecentActivity = () => {
        if (recentAssessments.length === 0) return null;

        return (
            <div className="mt-10 pt-8 border-t border-gray-800">
                <div className="flex justify-between items-center mb-6">
                    <h4 className="text-sm font-bold text-[#58a6ff] uppercase tracking-widest">Recent Performance History</h4>
                    <span className="text-[10px] text-gray-500 bg-gray-800/50 px-2 py-0.5 rounded-full uppercase tracking-tighter">Auto-Refreshing</span>
                </div>
                <div className="grid grid-cols-1 gap-4">
                    {recentAssessments.map((asmt, idx) => (
                        <div key={asmt.id} className="group relative flex items-center justify-between p-5 bg-[#0d1117] rounded-2xl border border-gray-800 hover:border-[#58a6ff]/50 transition-all duration-300 hover:shadow-[0_0_15px_rgba(88,166,255,0.1)]">
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg ${asmt.status === 'terminated' ? 'bg-red-900/20 text-red-500' : 'bg-blue-900/20 text-[#58a6ff]'}`}>
                                    {asmt.score}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-white group-hover:text-[#58a6ff] transition-colors">{asmt.topic}</span>
                                    <span className="text-xs text-gray-500">{asmt.language} • {new Date(asmt.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="text-right flex flex-col items-end">
                                    <div className="text-xs font-mono font-bold text-gray-400">
                                        {Math.round((asmt.score / asmt.total_questions) * 100)}% <span className="text-[10px] font-normal text-gray-600">ACC</span>
                                    </div>
                                    <div className={`text-[9px] uppercase font-black tracking-tighter px-2 py-0.5 rounded mt-1 ${asmt.status === 'terminated' ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
                                        {asmt.status}
                                    </div>
                                </div>
                                <button className="opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-gray-800 rounded-lg hover:bg-gray-700 text-gray-400" title="Review Analysis">
                                    🔍
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderExpertAnalysis = () => {
        const stats = analytics.topicStats;
        if (Object.keys(stats).length === 0) return null;

        // Calculate specific stats for the narrative
        const bestStats = stats[analytics.bestTopic] || { attempted: 0, correct: 0 };
        const bestAcc = bestStats.attempted > 0 ? Math.round((bestStats.correct / bestStats.attempted) * 100) : 0;

        const weakStats = stats[analytics.weakTopic] || { attempted: 0, correct: 0 };
        const weakAcc = weakStats.attempted > 0 ? Math.round((weakStats.correct / weakStats.attempted) * 100) : 0;

        return (
            <div className="mt-12 p-8 bg-[#0d1117] rounded-3xl border border-gray-800 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[60px] rounded-full group-hover:bg-blue-500/10 transition-all duration-500"></div>

                <h4 className="text-xs font-bold text-[#58a6ff] uppercase tracking-widest mb-6 flex items-center gap-3">
                    <span className="w-2 h-2 bg-[#58a6ff] rounded-full animate-pulse shadow-[0_0_8px_#58a6ff]"></span>
                    Deep Analysis Output
                </h4>

                <div className="space-y-6 relative z-10">
                    <div className="flex flex-col gap-2">
                        <span className="text-[10px] text-gray-500 font-mono uppercase">Primary Specialization</span>
                        <p className="text-gray-300 text-base leading-relaxed">
                            Your performance data identifies <span className="text-white font-bold">{analytics.bestTopic || 'Core Systems'}</span> as your <span className="text-[#238636] font-bold">domain of excellence</span>. With a current accuracy of <span className="text-white font-mono">{bestAcc}%</span> over <span className="text-white font-mono">{bestStats.attempted}</span> rigorous evaluations, this pillar anchors your analytical profile.
                        </p>
                    </div>

                    <div className="border-l-4 border-[#da3633] bg-red-500/5 p-5 rounded-r-xl">
                        <span className="text-[10px] text-red-400 font-mono uppercase block mb-1">Growth Constraint Detected</span>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            The Skill Matrix illustrates a significant contraction in <span className="text-white font-bold">{analytics.weakTopic || 'untested areas'}</span>. Your <span className="text-white font-mono">{weakAcc}%</span> hit-rate in this topic suggests a conceptual bottleneck. Prioritizing reattempts in this area will stabilize your matrix shape and prevent performance decay in complex scenarios.
                        </p>
                    </div>

                    <div className="pt-4 border-t border-gray-800/50">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="flex flex-col gap-2">
                                <div className="text-[10px] text-gray-500 uppercase tracking-tighter">Matrix Stability</div>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-[#238636] w-[85%] rounded-full shadow-[0_0_10px_rgba(35,134,54,0.4)]"></div>
                                    </div>
                                    <span className="text-xs font-mono text-[#238636] font-bold">85%</span>
                                </div>
                            </div>
                            <div className="flex flex-col gap-2 text-right">
                                <div className="text-[10px] text-gray-500 uppercase tracking-tighter">Skill Maturity</div>
                                <div className="text-sm font-bold text-white uppercase tracking-widest">{analytics.accuracy > 70 ? 'Advanced' : 'Intermediate'} Profile</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderTopicBadges = () => {
        return (
            <div className="flex flex-col gap-6 mt-4">
                <div className="p-4 rounded border border-glass-border bg-[rgba(35,134,54,0.1)]">
                    <div className="text-secondary text-sm mb-1">Strongest Pillar</div>
                    <div className="text-xl text-[#238636] font-bold">
                        {analytics.bestTopic || 'Not enough data'}
                    </div>
                </div>

                <div className="p-4 rounded border border-glass-border bg-[rgba(218,54,51,0.1)]">
                    <div className="text-secondary text-sm mb-1">Primary Growth Opportunity</div>
                    <div className="text-xl text-[#da3633] font-bold">
                        {analytics.weakTopic || 'Not enough data'}
                    </div>
                </div>
            </div>
        );
    };

    const renderRecommendations = () => {
        const recommendations = [];

        Object.entries(analytics.topicStats || {}).forEach(([topic, stats]) => {
            if (stats.attempted > 0) {
                const acc = stats.correct / stats.attempted;
                if (acc < 0.6) {
                    recommendations.push(
                        <div key={topic} className="flex p-4 bg-[#161b22] border border-glass-border rounded-lg items-center justify-between hover:border-[#58a6ff] transition-colors cursor-pointer">
                            <div>
                                <h4 className="font-bold text-white mb-1">{topic}</h4>
                                <p className="text-secondary text-xs">Practice Recommended • {Math.round(acc * 100)}% Accuracy</p>
                            </div>
                            <button
                                onClick={() => handleReattempt(topic)}
                                className="text-[#58a6ff] bg-[rgba(88,166,255,0.1)] px-3 py-1 text-sm rounded hover:bg-[rgba(88,166,255,0.2)] transition-colors font-bold"
                            >
                                Reattempt Topic
                            </button>
                        </div>
                    );
                }
            }
        });

        if (recommendations.length === 0 && analytics.totalQuestionsAttempted > 0) {
            return (
                <div className="flex h-32 items-center justify-center text-secondary border border-dashed border-[#238636] bg-[rgba(35,134,54,0.05)] rounded mt-4">
                    Excellent work! No immediate practice recommended.
                </div>
            );
        }

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {recommendations}
            </div>
        );
    };

    return (
        <div className="animate-fade-in p-6 max-w-7xl mx-auto min-h-screen">
            {location.state?.cheated && (
                <div className="mb-6 p-4 bg-[rgba(218,54,51,0.1)] border border-[#da3633] rounded-xl flex items-center justify-between animate-shake">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">⚠️</span>
                        <div>
                            <h4 className="text-[#da3633] font-bold">Assessment Terminated</h4>
                            <p className="text-gray-400 text-sm">{location.state.reason || 'Integrity violation detected.'}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            const config = location.state?.config || lastAssessment;
                            if (config) {
                                navigate('/exam', {
                                    state: {
                                        reattemptConfig: {
                                            language: config.language,
                                            topic: config.topic,
                                            type: config.type,
                                            difficulty: 'medium'
                                        }
                                    }
                                });
                            } else {
                                navigate('/exam');
                            }
                        }}
                        className="bg-[#da3633] text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#b02a27] transition-colors"
                    >
                        Appeal & Reattempt
                    </button>
                </div>
            )}

            <div className="mb-10 flex flex-col md:flex-row justify-between md:items-end gap-6 border-b border-gray-800 pb-6">
                <div>
                    <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#58a6ff] to-indigo-400">Welcome back, {user.user_metadata?.full_name || user.email?.split('@')[0]}</h1>
                    <p className="text-gray-400 mt-2 text-lg">Ready for your next skill assessment?</p>
                </div>
                <button
                    className="bg-[#1f6feb] hover:bg-[#3182ce] text-white font-semibold py-3 px-8 rounded-xl transition-all shadow-[0_4px_14px_rgba(49,130,206,0.3)] hover:shadow-[0_6px_20px_rgba(49,130,206,0.5)] transform hover:-translate-y-1"
                    onClick={() => navigate('/exam')}
                >
                    Start New Assessment
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                <div className="bg-[#161b22] border border-gray-800 rounded-2xl p-6 text-center shadow-lg relative overflow-hidden flex flex-col items-center justify-center min-h-[140px] hover:border-gray-600 transition-colors">
                    <div className="text-gray-400 text-sm font-medium mb-2 uppercase tracking-wide">Overall Accuracy</div>
                    <div className="text-5xl font-bold font-mono text-[#58a6ff] drop-shadow-md">{analytics.accuracy}%</div>
                    <div className="absolute top-0 right-0 w-24 h-24 bg-[#58a6ff] opacity-[0.03] rounded-bl-full"></div>
                </div>
                <div className="bg-[#161b22] border border-gray-800 rounded-2xl p-6 text-center shadow-lg flex flex-col items-center justify-center min-h-[140px] hover:border-gray-600 transition-colors">
                    <div className="text-gray-400 text-sm font-medium mb-2 uppercase tracking-wide">Avg. Time / Q</div>
                    <div className="text-5xl font-bold font-mono text-[#58a6ff] drop-shadow-md">{analytics.avgTimePerQuestion}s</div>
                </div>
                <div className="bg-[#161b22] border border-gray-800 rounded-2xl p-6 text-center shadow-lg flex flex-col items-center justify-center min-h-[140px] hover:border-gray-600 transition-colors">
                    <div className="text-gray-400 text-sm font-medium mb-2 uppercase tracking-wide">Total Attempted</div>
                    <div className="text-5xl font-bold font-mono text-[#58a6ff] drop-shadow-md">{analytics.totalQuestionsAttempted}</div>
                </div>
                <div className="bg-[#161b22] border border-gray-800 rounded-2xl p-6 text-center shadow-lg flex flex-col items-center justify-center min-h-[140px] hover:border-gray-600 transition-colors relative overflow-hidden">
                    <div className="text-gray-400 text-sm font-medium mb-2 uppercase tracking-wide">Daily Streak</div>
                    <div className="text-5xl font-bold font-mono text-[#e3b341] drop-shadow-md flex items-center justify-center gap-2">
                        {analytics.dailyStreak} <span className="text-3xl animate-pulse">🔥</span>
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-10 mt-12 mb-10 max-w-4xl mx-auto">
                {/* 1. Difficulty Distribution & Recent Activity */}
                <div className="bg-[#161b22] border border-gray-800 rounded-3xl p-10 shadow-xl">
                    <h3 className="text-3xl mb-2 font-bold border-b border-gray-800 pb-6 text-white flex items-center gap-3">
                        <span className="text-[#58a6ff]">📊</span> Performance Distribution
                    </h3>
                    <p className="text-gray-400 text-sm mb-8">Detailed breakdown of question attempts and precision levels.</p>
                    {analytics.totalQuestionsAttempted > 0 ? (
                        <>
                            {renderDifficultyGraph()}
                            {renderRecentActivity()}
                        </>
                    ) : (
                        <div className="flex flex-col h-40 items-center justify-center text-gray-500 border-2 border-dashed border-gray-800 rounded-xl mt-4 bg-[#0d1117] font-medium">
                            Take an assessment to generate this graph
                        </div>
                    )}
                </div>

                {/* 2. Skill Matrix & Expert Analysis */}
                <div className="bg-[#161b22] border border-gray-800 rounded-3xl p-10 shadow-xl flex flex-col">
                    <h3 className="text-3xl mb-2 font-bold border-b border-gray-800 pb-6 text-white flex items-center gap-3">
                        <span className="text-[#58a6ff]">🕸️</span> Skill Matrix
                    </h3>
                    <p className="text-gray-400 text-sm mb-8">Multi-dimensional proficiency radar and deep-dive analytics.</p>
                    <div className="flex-1 flex flex-col items-center gap-10">
                        {analytics.totalQuestionsAttempted > 0 ? (
                            <>
                                <div className="w-full flex justify-center py-4">
                                    <RadarChart data={analytics.topicStats} size={380} />
                                </div>
                                <div className="w-full">
                                    {renderTopicBadges()}
                                </div>
                                <div className="w-full">
                                    {renderExpertAnalysis()}
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col h-64 items-center justify-center text-gray-500 border-2 border-dashed border-gray-800 rounded-xl mt-4 bg-[#0d1117] font-medium w-full">
                                Take an assessment to generate insights
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-[#161b22] border border-gray-800 rounded-2xl p-8 shadow-md mb-8">
                <h3 className="text-2xl mb-2 font-bold border-b border-gray-800 pb-4 text-[#58a6ff]">Recommended For You</h3>
                <p className="text-gray-400 text-sm mb-6">Personalized study plan based on your adaptive performance.</p>
                {analytics.totalQuestionsAttempted > 0 ? renderRecommendations() : (
                    <div className="flex flex-col h-32 items-center justify-center text-gray-500 border-2 border-dashed border-gray-800 rounded-xl mt-4 bg-[#0d1117] font-medium">
                        Take an assessment to get personalized recommendations
                    </div>
                )}
            </div>

            {/* AI ChatBot Assistant */}
            <ChatBot apiKey={import.meta.env.VITE_OPENROUTER_KEY} />
        </div>
    );
};

export default Dashboard;
