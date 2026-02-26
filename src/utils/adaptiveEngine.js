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

    // STRICTOR Topic-first fallback
    const topicMatches = allQuestions.filter(q =>
        q.language === language && q.topic === topic
    );
    if (topicMatches.length > 0) return topicMatches[Math.floor(Math.random() * topicMatches.length)];

    // Language match only as a last resort
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
    targetType,
    targetTopic
) => {
    let nextLevel = DIFFICULTY_LEVELS[currentDifficulty] || 2;

    // 1. Logic: Adjust Difficulty based on correctness
    if (lastIsCorrect) {
        if (nextLevel < 3) {
            // Correct and fast? Go up 1 level
            if (lastTimeTaken < (lastTimeLimit / 2)) nextLevel = Math.min(3, nextLevel + 1);
            // Default: stay or go up slow
        }
    } else {
        if (nextLevel > 1) {
            nextLevel = Math.max(1, nextLevel - 1);
        }
    }

    const nextDifficultyStr = LEVEL_TO_STRING[nextLevel];

    // 2. Filter Pool: RESILIENCE FALLBACK
    // a. STRICTLY filter by Language, Type, AND Topic
    let availableQuestions = allQuestions.filter(q =>
        !attemptedIds.includes(q.id) &&
        q.language === targetLanguage &&
        q.type === targetType &&
        q.topic === targetTopic
    );

    // 2. RESILIENCE FALLBACK: If specific Topic is exhausted, relax Topic filter BUT keep Type strict
    if (availableQuestions.length === 0) {
        availableQuestions = allQuestions.filter(q =>
            !attemptedIds.includes(q.id) &&
            q.language === targetLanguage &&
            q.type === targetType
        );
    }

    if (availableQuestions.length === 0) {
        // Fallback: If absolutely nothing left in this language of the specific TYPE, just stop
        return null;
    }
    // 3. Selection Strategy
    // Find weakest topic in current pool based on history
    let weakestTopic = null;
    if (topicStats && Object.keys(topicStats).length > 0) {
        weakestTopic = Object.keys(topicStats).reduce((a, b) => {
            const accA = (topicStats[a]?.attempted > 0) ? (topicStats[a].correct / topicStats[a].attempted) : 1;
            const accB = (topicStats[b]?.attempted > 0) ? (topicStats[b].correct / topicStats[b].attempted) : 1;
            return accA < accB ? a : b;
        }, Object.keys(topicStats)[0]);
    }

    // Priority 1: Weak topic + Target Difficulty
    if (weakestTopic) {
        const weakTopicQuestions = availableQuestions.filter(
            q => q.topic === weakestTopic && q.difficulty === nextDifficultyStr
        );
        if (weakTopicQuestions.length > 0) {
            return weakTopicQuestions[Math.floor(Math.random() * weakTopicQuestions.length)];
        }
    }

    // Priority 2: Target Difficulty (any topic in pool)
    const exactDifficultyQuestions = availableQuestions.filter(
        q => q.difficulty === nextDifficultyStr
    );
    if (exactDifficultyQuestions.length > 0) {
        return exactDifficultyQuestions[Math.floor(Math.random() * exactDifficultyQuestions.length)];
    }

    // Priority 3: Closest Difficulty
    const sortedDifficulties = ['hard', 'medium', 'easy'];
    for (const diff of sortedDifficulties) {
        const fallbackQuestions = availableQuestions.filter(q => q.difficulty === diff);
        if (fallbackQuestions.length > 0) {
            return fallbackQuestions[Math.floor(Math.random() * fallbackQuestions.length)];
        }
    }

    // Ultimate safeguard
    return availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
};
