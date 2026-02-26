import React from 'react';
import { useAuth } from '../utils/AuthContext';
import { useAnalytics } from '../analytics/useAnalytics';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
    const { user } = useAuth();
    const { getAnalyticsSummary } = useAnalytics();
    const navigate = useNavigate();

    if (!user) {
        navigate('/');
        return null;
    }

    const analytics = getAnalyticsSummary();

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
                    const stats = analytics.difficultyStats[diff];
                    const width = `${(stats.attempted / max) * 100}%`;
                    const acc = stats.attempted > 0 ? Math.round((stats.correct / stats.attempted) * 100) : 0;
                    return (
                        <div key={diff} className="flex items-center">
                            <span className="w-20 text-sm capitalize text-secondary">{diff}</span>
                            <div className="flex-1 h-6 bg-[rgba(255,255,255,0.05)] rounded overflow-hidden">
                                <div
                                    className={`h-full flex items-center px-2 text-xs font-bold text-white transition-all duration-1000 ${diff === 'easy' ? 'bg-[#238636]' :
                                            diff === 'medium' ? 'bg-[#e3b341]' :
                                                'bg-[#da3633]'
                                        }`}
                                    style={{ width: stats.attempted > 0 ? width : '0%' }}
                                >
                                    {stats.attempted > 0 && `${acc}% Acc`}
                                </div>
                            </div>
                            <span className="w-12 text-right text-sm">{stats.attempted} Qs</span>
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

    return (
        <div className="dashboard-container animate-fade-in p-6 max-w-7xl mx-auto">
            <div className="dashboard-header mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl text-gradient">Welcome back, {user.name}</h1>
                    <p className="text-secondary mt-2">Ready for your next skill assessment?</p>
                </div>
                <button
                    className="btn-primary"
                    onClick={() => navigate('/exam')}
                >
                    Start New Assessment
                </button>
            </div>

            <div className="dashboard-metrics grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="metric-card glass-panel p-6 text-center shadow-lg relative overflow-hidden">
                    <div className="text-secondary text-sm mb-2">Overall Accuracy</div>
                    <div className="text-4xl font-bold font-mono text-accent-primary">{analytics.accuracy}%</div>
                    <div className="absolute top-0 right-0 w-16 h-16 bg-accent-primary opacity-10 rounded-bl-full"></div>
                </div>
                <div className="metric-card glass-panel p-6 text-center shadow-lg">
                    <div className="text-secondary text-sm mb-2">Avg. Time / Q</div>
                    <div className="text-4xl font-bold font-mono text-accent-primary">{analytics.avgTimePerQuestion}s</div>
                </div>
                <div className="metric-card glass-panel p-6 text-center shadow-lg">
                    <div className="text-secondary text-sm mb-2">Total Attempted</div>
                    <div className="text-4xl font-bold font-mono text-accent-primary">{analytics.totalQuestionsAttempted}</div>
                </div>
                <div className="metric-card glass-panel p-6 text-center shadow-lg">
                    <div className="text-secondary text-sm mb-2">Daily Streak</div>
                    <div className="text-4xl font-bold font-mono text-warning">{analytics.dailyStreak} <span className="text-2xl">🔥</span></div>
                </div>
            </div>

            <div className="dashboard-charts grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
                <div className="chart-card glass-panel p-8">
                    <h3 className="text-xl mb-2 font-semibold border-b border-glass-border pb-4">Difficulty Distribution</h3>
                    <p className="text-secondary text-sm mb-6">Questions attempted per difficulty level and accuracy.</p>
                    {analytics.totalQuestionsAttempted > 0 ? renderDifficultyGraph() : (
                        <div className="flex h-40 items-center justify-center text-secondary border border-dashed border-glass-border rounded mt-4">
                            Take an assessment to generate this graph
                        </div>
                    )}
                </div>

                <div className="chart-card glass-panel p-8">
                    <h3 className="text-xl mb-2 font-semibold border-b border-glass-border pb-4">Skill Insights</h3>
                    <p className="text-secondary text-sm mb-6">Topic-based performance analysis.</p>
                    {analytics.totalQuestionsAttempted > 0 ? renderTopicBadges() : (
                        <div className="flex h-40 items-center justify-center text-secondary border border-dashed border-glass-border rounded mt-4">
                            Take an assessment to generate insights
                        </div>
                    )}
                </div>
            </div>

            {analytics.focusLossCount > 0 && (
                <div className="mt-8 p-4 border border-[rgba(218,54,51,0.5)] bg-[rgba(218,54,51,0.1)] rounded text-danger text-center animate-fade-in">
                    ⚠️ Attention: Your account has flagged {analytics.focusLossCount} attention warnings (tab switching/focus loss). Maintaining focus improves your analytics accuracy.
                </div>
            )}
        </div>
    );
};

export default Dashboard;
