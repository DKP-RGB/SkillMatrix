import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAnalytics } from '../analytics/useAnalytics';
import { initAntiCheat } from '../utils/antiCheat';
import { getNextQuestion } from '../utils/adaptiveEngine';
import questionsData from '../data/questions.json';

const ExamPage = () => {
    const navigate = useNavigate();
    const { recordQuestionResult, topicStats } = useAnalytics();

    // Core Exam State
    const [currentQuestion, setCurrentQuestion] = useState(null);
    const [attemptedIds, setAttemptedIds] = useState([]);
    const [examFinished, setExamFinished] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState(0); // per question

    // Anti-Cheat State
    const [cheatWarnings, setCheatWarnings] = useState(0);
    const [lostFocusThisQuestion, setLostFocusThisQuestion] = useState(false);

    // User Input State
    const [mcqAnswer, setMcqAnswer] = useState('');
    const [codeAnswer, setCodeAnswer] = useState('');
    const [consoleOutput, setConsoleOutput] = useState('');

    // Initialization: Pick first medium question
    useEffect(() => {
        const mediumQs = questionsData.filter(q => q.difficulty === 'medium');
        const firstQ = mediumQs[Math.floor(Math.random() * mediumQs.length)];
        startNextQuestion(firstQ);

        const cleanupCheat = initAntiCheat((type) => {
            setCheatWarnings(prev => prev + 1);
            setLostFocusThisQuestion(true);
            alert('WARNING: Cheating activity detected (' + type + '). This incident has been logged.');
        });

        return cleanupCheat;
    }, []);

    // Timer logic
    useEffect(() => {
        if (timeRemaining > 0 && currentQuestion && !examFinished) {
            const timer = setTimeout(() => setTimeRemaining(prev => prev - 1), 1000);
            return () => clearTimeout(timer);
        } else if (timeRemaining === 0 && currentQuestion && !examFinished) {
            handleTimeUp();
        }
    }, [timeRemaining, currentQuestion, examFinished]);

    const startNextQuestion = (q) => {
        if (!q) {
            setExamFinished(true);
            return;
        }
        setCurrentQuestion(q);
        setAttemptedIds(prev => [...prev, q.id]);
        setTimeRemaining(q.timeLimit);
        setLostFocusThisQuestion(false);
        setMcqAnswer('');
        setCodeAnswer('');
        setConsoleOutput('');
    };

    const handleTimeUp = () => {
        submitAnswer(false, true); // Failed due to timeout
    };

    // Simulated Code Execution
    const runCode = () => {
        // Check if what they typed CONTAINS the expected output in some way exactly as meant
        // Real implementation will call backend/code_execution.js
        setConsoleOutput('Executing code...');
        setTimeout(() => {
            // Mock validation
            if (codeAnswer.includes(currentQuestion.expectedOutput)) {
                setConsoleOutput(currentQuestion.expectedOutput + '\n\n[Process completed]');
            } else {
                setConsoleOutput('Output mismatch. Compilation/Logic error.\nExpected: ' + currentQuestion.expectedOutput);
            }
        }, 1000);
    };

    const submitAnswer = (userForcedSubmit = true, timedOut = false) => {
        let isCorrect = false;

        if (currentQuestion.type === 'mcq') {
            isCorrect = mcqAnswer === currentQuestion.correctAnswer;
        } else {
            isCorrect = codeAnswer.includes(currentQuestion.expectedOutput);
        }

        if (timedOut) {
            isCorrect = false;
        }

        const timeTaken = currentQuestion.timeLimit - timeRemaining;

        // Record to analytics
        recordQuestionResult(
            currentQuestion.topic,
            currentQuestion.difficulty,
            isCorrect,
            timeTaken,
            lostFocusThisQuestion
        );

        // Get next adaptive question
        const nextQ = getNextQuestion(
            questionsData,
            attemptedIds,
            isCorrect,
            timeTaken,
            currentQuestion.timeLimit,
            currentQuestion.difficulty,
            topicStats
        );

        // Assuming exam is 5 questions long for demo purposes
        if (attemptedIds.length >= 5 || !nextQ) {
            setExamFinished(true);
        } else {
            startNextQuestion(nextQ);
        }
    };

    if (examFinished) {
        return (
            <div className="exam-container mt-12 text-center animate-slide-up">
                <h2 className="text-3xl text-gradient mb-4">Assessment Complete!</h2>
                <p className="text-secondary mb-8">Your analytics have been recorded.</p>
                <button className="btn-primary" onClick={() => navigate('/dashboard')}>
                    Return to Dashboard
                </button>
            </div>
        );
    }

    if (!currentQuestion) return <div className="text-center mt-12">Loading Engine...</div>;

    return (
        <div className="exam-container max-w-5xl mx-auto animate-fade-in relative mt-8">

            {/* Top Bar Navigation */}
            <div className="flex justify-between items-center mb-6 glass-panel p-4">
                <div className="flex items-center gap-4">
                    <span className="bg-[rgba(255,255,255,0.1)] px-3 py-1 rounded text-sm">
                        Question {attemptedIds.length} / 5
                    </span>
                    <span className={`px-3 py-1 rounded text-sm ${currentQuestion.difficulty === 'easy' ? 'text-accent-success border border-[#238636]' :
                            currentQuestion.difficulty === 'medium' ? 'text-accent-warning border border-[#e3b341]' :
                                'text-accent-danger border border-[#da3633]'
                        }`}>
                        {currentQuestion.difficulty.toUpperCase()}
                    </span>
                    <span className="text-secondary text-sm">Topic: {currentQuestion.topic}</span>
                </div>
                <div className="text-warning font-mono text-xl">
                    ⏳ {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
                </div>
            </div>

            {cheatWarnings > 0 && (
                <div className="mb-6 p-3 bg-[rgba(218,54,51,0.2)] border border-[rgba(218,54,51,0.5)] rounded text-danger text-sm">
                    ⚠️ Trust Factor Warning: You have switched tabs or lost focus {cheatWarnings} time(s). Further infractions will terminate the exam.
                </div>
            )}

            {/* Main Question Area */}
            <div className="question-card glass-panel p-8 mb-6">
                <h3 className="text-2xl mb-6 font-main font-semibold">
                    {currentQuestion.question}
                </h3>

                {currentQuestion.type === 'mcq' ? (
                    <div className="options-grid grid grid-cols-1 md:grid-cols-2 gap-4">
                        {currentQuestion.options.map((opt, idx) => (
                            <label
                                key={idx}
                                className={`flex items-center p-4 border rounded cursor-pointer transition-all ${mcqAnswer === opt
                                        ? 'border-accent-primary bg-[rgba(88,166,255,0.1)]'
                                        : 'border-glass-border hover:bg-[rgba(255,255,255,0.05)]'
                                    }`}
                            >
                                <input
                                    type="radio"
                                    name="mcq"
                                    value={opt}
                                    checked={mcqAnswer === opt}
                                    onChange={(e) => setMcqAnswer(e.target.value)}
                                    className="mr-3"
                                />
                                <span className="font-mono text-sm">{opt}</span>
                            </label>
                        ))}
                    </div>
                ) : (
                    <div className="code-env-mock">
                        <div className="flex justify-between items-center mb-2 bg-[#161b22] p-2 rounded-t border border-glass-border">
                            <span className="text-secondary text-sm px-2">main.{currentQuestion.language === 'C' ? 'c' : 'cpp'}</span>
                            <button className="btn-secondary text-sm px-3 py-1" onClick={runCode}>
                                ▶ Run Code
                            </button>
                        </div>
                        <textarea
                            className="w-full bg-[#0d1117] text-[#c9d1d9] font-mono p-4 min-h-[200px] border border-glass-border focus:border-accent-primary outline-none resize-y"
                            value={codeAnswer}
                            onChange={(e) => setCodeAnswer(e.target.value)}
                            placeholder={`// Write your ${currentQuestion.language} code here...`}
                            spellCheck="false"
                        />

                        <div className="console-output mt-4 bg-[#0d1117] border border-[rgba(88,166,255,0.3)] rounded p-4 font-mono text-sm min-h-[100px]">
                            <div className="text-[rgba(88,166,255,0.8)] mb-2">$ ./program</div>
                            <div className="whitespace-pre-wrap">{consoleOutput || 'Output will appear here...'}</div>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex justify-end">
                <button
                    className="btn-primary"
                    onClick={() => submitAnswer()}
                    disabled={currentQuestion.type === 'mcq' && !mcqAnswer}
                >
                    Submit Answer
                </button>
            </div>

        </div>
    );
};

export default ExamPage;
