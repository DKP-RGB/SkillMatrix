import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../utils/AuthContext';
import { useAnalytics } from '../analytics/useAnalytics';
import { useNavigate } from 'react-router-dom';
import ChatBot from '../components/ChatBot';

const Dashboard = () => {
    const { user } = useAuth();
    const { fetchAllTimeStats } = useAnalytics();
    const navigate = useNavigate();

    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadStats = async () => {
            if (user) {
                const data = await fetchAllTimeStats();
                setStats(data);
                setLoading(false);
            }
        };
        loadStats();
    }, [user, fetchAllTimeStats]);

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

    const renderTopicBadges = () => {
        return (
            <div className="flex flex-col gap-6 mt-4">
                <div className="p-4 rounded border border-glass-border bg-[rgba(35,134,54,0.1)]">
                    <div className="text-secondary text-sm mb-1">Strongest Topic</div>
                    <div className="text-xl text-[#238636] font-bold">
                        {analytics.bestTopic || 'Not enough data'}
                    </div>
                </div>

                <div className="p-4 rounded border border-glass-border bg-[rgba(218,54,51,0.1)]">
                    <div className="text-secondary text-sm mb-1">Topic to Improve</div>
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
                            <button className="text-[#58a6ff] bg-[rgba(88,166,255,0.1)] px-3 py-1 text-sm rounded hover:bg-[rgba(88,166,255,0.2)] transition-colors">
                                Review
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12 mb-10">
                <div className="bg-[#161b22] border border-gray-800 rounded-2xl p-8 shadow-md">
                    <h3 className="text-2xl mb-2 font-bold border-b border-gray-800 pb-4 text-white">Difficulty Distribution</h3>
                    <p className="text-gray-400 text-sm mb-6">Questions attempted per difficulty level and accuracy.</p>
                    {analytics.totalQuestionsAttempted > 0 ? renderDifficultyGraph() : (
                        <div className="flex flex-col h-40 items-center justify-center text-gray-500 border-2 border-dashed border-gray-800 rounded-xl mt-4 bg-[#0d1117] font-medium">
                            Take an assessment to generate this graph
                        </div>
                    )}
                </div>

                <div className="bg-[#161b22] border border-gray-800 rounded-2xl p-8 shadow-md">
                    <h3 className="text-2xl mb-2 font-bold border-b border-gray-800 pb-4 text-white">Skill Insights</h3>
                    <p className="text-gray-400 text-sm mb-6">Topic-based performance analysis.</p>
                    {analytics.totalQuestionsAttempted > 0 ? renderTopicBadges() : (
                        <div className="flex flex-col h-40 items-center justify-center text-gray-500 border-2 border-dashed border-gray-800 rounded-xl mt-4 bg-[#0d1117] font-medium">
                            Take an assessment to generate insights
                        </div>
                    )}
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
