import fs from 'fs';
import { getInitialQuestion, getNextQuestion } from './src/utils/adaptiveEngine.js';

const allQuestions = JSON.parse(fs.readFileSync('d:/DKP-RGB-SkillMatrix/src/data/questions.json', 'utf8'));

try {
    const setupSelection = {
        language: 'C++',
        topic: 'Arrays',
        difficulty: 'medium',
        type: 'mcq'
    };

    let currentQuestion = getInitialQuestion(allQuestions, setupSelection);
    console.log('Initial:', currentQuestion.id, '| Topic:', currentQuestion.topic, '| Language:', currentQuestion.language);

    let attemptedIds = [currentQuestion.id];
    let topicStats = {};

    for (let i = 0; i < 5; i++) {
        const isCorrect = true;
        const timeTaken = 10;

        const nextQ = getNextQuestion(
            allQuestions,
            attemptedIds,
            isCorrect,
            timeTaken,
            currentQuestion.timeLimit,
            currentQuestion.difficulty,
            topicStats,
            setupSelection.language
        );

        if (!nextQ) {
            console.log('No next question found at iteration', i + 1);
            break;
        }

        currentQuestion = nextQ;
        attemptedIds.push(nextQ.id);
        console.log('Next:', currentQuestion.id, '| Topic:', currentQuestion.topic, '| Language:', currentQuestion.language);
    }
} catch (error) {
    console.error('ERROR ENCOUNTERED:', error);
}
