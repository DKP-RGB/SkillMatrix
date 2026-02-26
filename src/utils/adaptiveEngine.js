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
 * Gets the very first question based on the user's explicit selection in the Setup Stepper.
 */
export const getInitialQuestion = (allQuestions, setupSelection) => {
    const { language, topic, difficulty, type } = setupSelection;

    // Exact match
    const exactMatches = allQuestions.filter(q =>
        q.language === language &&
        q.topic === topic &&
        q.difficulty === difficulty &&
        q.type === type
    );
    if (exactMatches.length > 0) return exactMatches[Math.floor(Math.random() * exactMatches.length)];

    // Fallback: Just match language and topic
    const looseMatches = allQuestions.filter(q =>
        q.language === language && q.topic === topic
    );
    if (looseMatches.length > 0) return looseMatches[Math.floor(Math.random() * looseMatches.length)];

    // Ultimate fallback: Just match language
    const langMatches = allQuestions.filter(q => q.language === language);
    return langMatches.length > 0 ? langMatches[Math.floor(Math.random() * langMatches.length)] : allQuestions[0];
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
    topicStats,
    targetLanguage,
    targetType
) => {
    let nextDifficultyLevel = DIFFICULTY_LEVELS[currentDifficulty];

    // Logic: Adjust Difficulty based on correctness
    if (lastIsCorrect) {
        if (nextDifficultyLevel < 3) {
            nextDifficultyLevel += 1;
        }
    } else {
        if (nextDifficultyLevel > 1) {
            nextDifficultyLevel -= 1;
        }
    }

    const nextDifficultyStr = LEVEL_TO_STRING[nextDifficultyLevel];

    // STRICTLY filter by Language AND Type
    const availableQuestions = allQuestions.filter(q =>
        !attemptedIds.includes(q.id) &&
        q.language === targetLanguage &&
        q.type === targetType
    );

    if (availableQuestions.length === 0) {
        return null;
    }

    // Find the weakest topic
    let weakestTopic = null;
    let lowestAcc = 101;
    Object.entries(topicStats || {}).forEach(([topic, stats]) => {
        if (stats.attempted > 0) {
            const acc = stats.correct / stats.attempted;
            if (acc < lowestAcc) {
                lowestAcc = acc;
                weakestTopic = topic;
            }
        }
    });

    // 1. Weak topic + Exact difficulty
    if (weakestTopic) {
        const weakTopicQuestions = availableQuestions.filter(
            q => q.topic === weakestTopic && q.difficulty === nextDifficultyStr
        );
        if (weakTopicQuestions.length > 0) {
            return weakTopicQuestions[Math.floor(Math.random() * weakTopicQuestions.length)];
        }
    }

    // 2. Exact difficulty
    const exactDifficultyQuestions = availableQuestions.filter(
        q => q.difficulty === nextDifficultyStr
    );
    if (exactDifficultyQuestions.length > 0) {
        return exactDifficultyQuestions[Math.floor(Math.random() * exactDifficultyQuestions.length)];
    }

    // 3. Fallback: Search for any question with the closest available difficulty
    const sortedDifficulties = ['hard', 'medium', 'easy'];
    for (const diff of sortedDifficulties) {
        const fallbackQuestions = availableQuestions.filter(q => q.difficulty === diff);
        if (fallbackQuestions.length > 0) {
            return fallbackQuestions[Math.floor(Math.random() * fallbackQuestions.length)];
        }
    }

    // Ultimate safeguard (should not be logicially reached if availableQuestions.length > 0)
    return availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
};
