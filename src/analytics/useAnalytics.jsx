import React, { createContext, useContext, useState } from 'react';

const AnalyticsContext = createContext(null);

export const AnalyticsProvider = ({ children }) => {
    // State for tracking the overall exam performance
    const [examData, setExamData] = useState({
        totalQuestionsAttempted: 0,
        correctAnswers: 0,
        totalTimeSpent: 0, // In seconds
        focusLossCount: 0, // Cheating signal
        dailyStreak: 1, // Mocked static stat
    });

    // State for tracking performance per topic and difficulty
    const [topicStats, setTopicStats] = useState({});
    const [difficultyStats, setDifficultyStats] = useState({
        easy: { attempted: 0, correct: 0 },
        medium: { attempted: 0, correct: 0 },
        hard: { attempted: 0, correct: 0 },
    });

    // Method to update states after every question
    const recordQuestionResult = (topic, difficulty, isCorrect, timeTaken, lostFocus) => {
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
            resetAnalytics
        }}>
            {children}
        </AnalyticsContext.Provider>
    );
};

export const useAnalytics = () => useContext(AnalyticsContext);
