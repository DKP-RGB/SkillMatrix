// utils/adaptiveEngine.js

const DIFFICULTY_LEVELS = {
    easy: 1,
    medium: 2,
    hard: 3
};

const LEVEL_TO_STRING = {
    1: 'easy',
    2: 'medium',
    3: 'hard'
};

/**
 * Determines the next question based on user performance.
 * 
 * Rules:
 * - Start with medium difficulty (handled in ExamPage state).
 * - If user answers correctly & quickly -> increase difficulty.
 * - If user answers incorrectly or slowly -> decrease difficulty.
 * - Select next question dynamically based on current skill level and topic weakness.
 */
export const getNextQuestion = (
    allQuestions,
    attemptedIds,
    lastIsCorrect,
    lastTimeTaken,
    lastTimeLimit,
    currentDifficulty,
    topicStats
) => {
    let nextDifficultyLevel = DIFFICULTY_LEVELS[currentDifficulty];

    // Logic: Adjust Difficulty based on correctness and speed
    if (lastIsCorrect) {
        // If answered correctly and within 50% of time limit, it's considered quick
        const isQuick = lastTimeTaken <= (lastTimeLimit * 0.5);
        if (isQuick && nextDifficultyLevel < 3) {
            nextDifficultyLevel += 1; // Increase difficulty
        }
    } else {
        // If incorrect, decrease difficulty to help them learn
        // OR if they took too long (slow), also decrease
        if (nextDifficultyLevel > 1) {
            nextDifficultyLevel -= 1;
        }
    }

    const nextDifficultyStr = LEVEL_TO_STRING[nextDifficultyLevel];

    // Filter out already attempted questions
    const availableQuestions = allQuestions.filter(q => !attemptedIds.includes(q.id));

    if (availableQuestions.length === 0) {
        return null; // Exam finished (no more questions)
    }

    // Find the weakest topic to challenge them constructively, or just pick available
    let weakestTopic = null;
    let lowestAcc = 101;
    Object.entries(topicStats).forEach(([topic, stats]) => {
        if (stats.attempted > 0) {
            const acc = stats.correct / stats.attempted;
            if (acc < lowestAcc) {
                lowestAcc = acc;
                weakestTopic = topic;
            }
        }
    });

    // 1. Try to find a question in the weak topic at the target difficulty
    if (weakestTopic) {
        const weakTopicQuestions = availableQuestions.filter(
            q => q.topic === weakestTopic && q.difficulty === nextDifficultyStr
        );
        if (weakTopicQuestions.length > 0) {
            return weakTopicQuestions[Math.floor(Math.random() * weakTopicQuestions.length)];
        }
    }

    // 2. Try to find ANY question at the target difficulty
    const exactDifficultyQuestions = availableQuestions.filter(
        q => q.difficulty === nextDifficultyStr
    );
    if (exactDifficultyQuestions.length > 0) {
        return exactDifficultyQuestions[Math.floor(Math.random() * exactDifficultyQuestions.length)];
    }

    // 3. Fallback: Just return any available question
    return availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
};
