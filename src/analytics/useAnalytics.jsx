import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../utils/AuthContext';

const AnalyticsContext = createContext(null);

export const AnalyticsProvider = ({ children }) => {
    const { user } = useAuth();

    // local session state
    const [examData, setExamData] = useState({
        totalQuestionsAttempted: 0,
        correctAnswers: 0,
        totalTimeSpent: 0,
        focusLossCount: 0,
        dailyStreak: 1,
    });

    const [topicStats, setTopicStats] = useState({});
    const [difficultyStats, setDifficultyStats] = useState({
        easy: { attempted: 0, correct: 0 },
        medium: { attempted: 0, correct: 0 },
        hard: { attempted: 0, correct: 0 },
    });

    const [currentAssessmentId, setCurrentAssessmentId] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    // Initialize/Create Assessment in Supabase
    const startAssessment = async (language, type) => {
        if (!user) return null;

        try {
            const { data, error } = await supabase
                .from('assessments')
                .insert([{
                    user_id: user.id,
                    language,
                    type,
                    status: 'in_progress'
                }])
                .select()
                .single();

            if (error) throw error;
            setCurrentAssessmentId(data.id);
            resetAnalytics();
            return data.id;
        } catch (err) {
            console.error("Error starting assessment:", err);
            return null;
        }
    };

    // Record question result to both local state and Supabase
    const recordQuestionResult = async (topic, difficulty, isCorrect, timeTaken, lostFocus, questionId) => {
        // Update Local State for immediate adaptive engine use
        setExamData(prev => ({
            ...prev,
            totalQuestionsAttempted: prev.totalQuestionsAttempted + 1,
            correctAnswers: prev.correctAnswers + (isCorrect ? 1 : 0),
            totalTimeSpent: prev.totalTimeSpent + timeTaken,
            focusLossCount: prev.focusLossCount + (lostFocus ? 1 : 0),
        }));

        setTopicStats(prev => {
            const topicData = prev[topic] || { attempted: 0, correct: 0 };
            return {
                ...prev,
                [topic]: {
                    attempted: topicData.attempted + 1,
                    correct: topicData.correct + (isCorrect ? 1 : 0),
                }
            };
        });

        setDifficultyStats(prev => {
            const diffData = prev[difficulty] || { attempted: 0, correct: 0 };
            return {
                ...prev,
                [difficulty]: {
                    attempted: diffData.attempted + 1,
                    correct: diffData.correct + (isCorrect ? 1 : 0),
                }
            };
        });

        // Persist to Supabase if session active
        if (currentAssessmentId && user) {
            try {
                await supabase.from('question_attempts').insert([{
                    assessment_id: currentAssessmentId,
                    user_id: user.id,
                    question_id: questionId || 'unknown',
                    topic,
                    difficulty,
                    is_correct: isCorrect,
                    time_taken: timeTaken
                }]);
            } catch (err) {
                console.error("Error saving question attempt:", err);
            }
        }
    };

    const finishAssessment = async (status = 'completed') => {
        if (!currentAssessmentId || !user) return;

        try {
            setIsSaving(true);
            const { error } = await supabase
                .from('assessments')
                .update({
                    score: examData.correctAnswers,
                    total_questions: examData.totalQuestionsAttempted,
                    status: status,
                    completed_at: new Date().toISOString()
                })
                .eq('id', currentAssessmentId);

            if (error) throw error;
            setCurrentAssessmentId(null);
        } catch (err) {
            console.error("Error finishing assessment:", err);
        } finally {
            setIsSaving(false);
        }
    };

    const getAnalyticsSummary = () => {
        const accuracy = examData.totalQuestionsAttempted > 0
            ? Math.round((examData.correctAnswers / examData.totalQuestionsAttempted) * 100)
            : 0;

        const avgTimePerQuestion = examData.totalQuestionsAttempted > 0
            ? Math.round(examData.totalTimeSpent / examData.totalQuestionsAttempted)
            : 0;

        let bestTopic = null;
        let weakTopic = null;
        let highestAcc = -1;
        let lowestAcc = 101;

        Object.entries(topicStats).forEach(([topic, stats]) => {
            if (stats.attempted > 0) {
                const acc = stats.correct / stats.attempted;
                if (acc > highestAcc) { highestAcc = acc; bestTopic = topic; }
                if (acc < lowestAcc) { lowestAcc = acc; weakTopic = topic; }
            }
        });

        return {
            ...examData,
            accuracy,
            avgTimePerQuestion,
            bestTopic,
            weakTopic,
            topicStats,
            difficultyStats
        };
    };

    // Fetch All-Time History for Dashboard
    const fetchAllTimeStats = async () => {
        if (!user) return null;

        try {
            const { data: attempts, error } = await supabase
                .from('question_attempts')
                .select('*')
                .eq('user_id', user.id);

            if (error) throw error;

            // Aggregate data
            const summary = {
                totalQuestionsAttempted: attempts.length,
                correctAnswers: attempts.filter(a => a.is_correct).length,
                totalTimeSpent: attempts.reduce((acc, a) => acc + a.time_taken, 0),
                topicStats: {},
                difficultyStats: {
                    easy: { attempted: 0, correct: 0 },
                    medium: { attempted: 0, correct: 0 },
                    hard: { attempted: 0, correct: 0 }
                }
            };

            attempts.forEach(a => {
                // Topic aggregation
                if (!summary.topicStats[a.topic]) {
                    summary.topicStats[a.topic] = { attempted: 0, correct: 0 };
                }
                summary.topicStats[a.topic].attempted++;
                if (a.is_correct) summary.topicStats[a.topic].correct++;

                // Difficulty aggregation
                if (summary.difficultyStats[a.difficulty]) {
                    summary.difficultyStats[a.difficulty].attempted++;
                    if (a.is_correct) summary.difficultyStats[a.difficulty].correct++;
                }
            });

            return summary;
        } catch (err) {
            console.error("Error fetching all-time stats:", err);
            return null;
        }
    };

    const resetAnalytics = () => {
        setExamData({
            totalQuestionsAttempted: 0,
            correctAnswers: 0,
            totalTimeSpent: 0,
            focusLossCount: 0,
            dailyStreak: 1,
        });
        setTopicStats({});
        setDifficultyStats({
            easy: { attempted: 0, correct: 0 },
            medium: { attempted: 0, correct: 0 },
            hard: { attempted: 0, correct: 0 },
        });
    };

    return (
        <AnalyticsContext.Provider value={{
            recordQuestionResult,
            getAnalyticsSummary,
            resetAnalytics,
            startAssessment,
            finishAssessment,
            fetchAllTimeStats,
            getHistoricalQuestionIds: async () => {
                if (!user) return [];
                try {
                    const { data, error } = await supabase
                        .from('question_attempts')
                        .select('question_id')
                        .eq('user_id', user.id);
                    if (error) throw error;
                    return data.map(d => d.question_id);
                } catch (err) {
                    console.error("Error fetching historical IDs:", err);
                    return [];
                }
            },
            topicStats,
            isSaving
        }}>
            {children}
        </AnalyticsContext.Provider>
    );
};

export const useAnalytics = () => useContext(AnalyticsContext);
