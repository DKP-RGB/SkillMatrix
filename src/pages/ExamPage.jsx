import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAnalytics } from '../analytics/useAnalytics';
import { useAuth } from '../utils/AuthContext';
import { initAntiCheat } from '../utils/antiCheat';
import { getNextQuestion, getInitialQuestion } from '../utils/adaptiveEngine';
import questionsData from '../data/questions.json';

// Components
import { StartAssessmentStepper } from '../components/StartAssessmentStepper';
import { AttemptingLayout } from '../components/AttemptingLayout';

const ExamPage = () => {
    const navigate = useNavigate();
    const { recordQuestionResult, topicStats } = useAnalytics();
    const { logout } = useAuth();

    // Setup Flow State
    const [setupComplete, setSetupComplete] = useState(false);
    const [examConfig, setExamConfig] = useState(null);

    // Core Exam State
    const [currentQuestion, setCurrentQuestion] = useState(null);
    const [attemptedIds, setAttemptedIds] = useState([]);
    const [examFinished, setExamFinished] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState(0);

    // Anti-Cheat State
    const [cheatWarnings, setCheatWarnings] = useState(0);
    const [lostFocusThisQuestion, setLostFocusThisQuestion] = useState(false);

    // Auto-Logout on 3 Cheat Warnings
    useEffect(() => {
        if (cheatWarnings >= 3 && !examFinished) {
            alert('Assessment stopped: Maximum tab-switching limits exceeded. You are being logged out for violating anti-cheat rules.');
            setExamFinished(true);
            logout();
            navigate('/');
        }
    }, [cheatWarnings, examFinished, logout, navigate]);

    // User Input State
    const [mcqAnswer, setMcqAnswer] = useState('');
    const [codeAnswer, setCodeAnswer] = useState('');
    const [consoleOutput, setConsoleOutput] = useState('');
    const [debugError, setDebugError] = useState('');

    // Handle CSS body class for full width layout
    useEffect(() => {
        if (setupComplete && !examFinished) {
            document.body.classList.add('exam-layout-active');
        } else {
            document.body.classList.remove('exam-layout-active');
        }
        return () => document.body.classList.remove('exam-layout-active');
    }, [setupComplete, examFinished]);

    // Handle Fullscreen Exit on Finish/Unmount
    useEffect(() => {
        if (examFinished && document.fullscreenElement) {
            document.exitFullscreen().catch(err => console.log(err));
        }
    }, [examFinished]);

    useEffect(() => {
        return () => {
            if (document.fullscreenElement) {
                document.exitFullscreen().catch(err => console.log(err));
            }
        };
    }, []);

    // Handle Setup Completion
    const handleSetupComplete = (config) => {
        // Trigger Fullscreen
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen().catch(err => {
                console.log("Error attempting to enable fullscreen:", err);
            });
        }

        setExamConfig(config);
        setSetupComplete(true);

        // Get first question based on config
        const firstQ = getInitialQuestion(questionsData, config);
        startNextQuestion(firstQ);

        const cleanupCheat = initAntiCheat((type) => {
            setCheatWarnings(prev => prev + 1);
            setLostFocusThisQuestion(true);
            alert('WARNING: Cheating activity detected (' + type + '). This incident has been logged.');
        });

        return cleanupCheat;
    };

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
        setConsoleOutput('Executing code...');
        setTimeout(() => {
            if (codeAnswer.includes(currentQuestion.expectedOutput)) {
                setConsoleOutput(currentQuestion.expectedOutput + '\n\n[Process completed]');
            } else {
                setConsoleOutput('Output mismatch. Compilation/Logic error.\nExpected: ' + currentQuestion.expectedOutput);
            }
        }, 1000);
    };

    const submitAnswer = (userForcedSubmit = true, timedOut = false) => {
        try {
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

            // Get next adaptive question based on config Language
            const nextQ = getNextQuestion(
                questionsData,
                attemptedIds,
                isCorrect,
                timeTaken,
                currentQuestion.timeLimit,
                currentQuestion.difficulty,
                topicStats,
                examConfig.language
            );

            // End exam after 5 questions
            if (attemptedIds.length >= 5 || !nextQ) {
                setExamFinished(true);
            } else {
                startNextQuestion(nextQ);
            }
        } catch (error) {
            setDebugError(error.toString() + " \n " + error.stack);
            console.error("submitAnswer ERROR:", error);
        }
    };

    // Render Setup Flow
    if (!setupComplete) {
        return (
            <div className="pt-10">
                <div className="text-center mb-10">
                    <h2 className="text-4xl font-heading font-bold mb-4">Start New Assessment</h2>
                    <p className="text-secondary">Configure your exam parameters before beginning.</p>
                </div>
                <StartAssessmentStepper onComplete={handleSetupComplete} />
            </div>
        );
    }

    // Render Finished State
    if (examFinished) {
        return (
            <div className="w-full max-w-2xl mx-auto mt-20 p-10 bg-[#161b22] border border-gray-800 rounded-3xl shadow-2xl text-center animate-fade-in">
                <h2 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#58a6ff] to-[#3fb950] mb-6">Assessment Complete!</h2>
                <div className="bg-[#0d1117] p-6 rounded-xl border border-gray-800 mb-8 inline-block">
                    <p className="text-gray-300 text-lg">Your analytics have been recorded.</p>
                    {cheatWarnings > 0 && (
                        <p className="text-red-400 mt-2 font-medium">Attention Warning Deductions: {cheatWarnings}</p>
                    )}
                </div>
                <div className="flex justify-center">
                    <button
                        className="bg-[#1f6feb] hover:bg-[#3182ce] text-white font-semibold py-4 px-10 rounded-xl transition-all shadow-[0_4px_14px_rgba(49,130,206,0.4)] hover:-translate-y-1"
                        onClick={() => navigate('/dashboard')}
                    >
                        Return to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    // Render Loading State (Should be instant)
    if (!currentQuestion) return <div className="text-center mt-12 animate-pulse">Initializing Engine...</div>;

    // Render the Professional Split Interface (Attempting Phase)
    return (
        <div className="w-full relative">
            {debugError && (
                <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[100] p-6 bg-red-950 border border-red-500 rounded text-red-200 text-sm shadow-2xl font-mono whitespace-pre-wrap w-3/4 max-w-2xl max-h-[80vh] overflow-auto">
                    CRITICAL BUG CAPTURED:<br /><br />
                    {debugError}
                    <button className="mt-4 px-4 py-2 bg-red-500 text-white rounded" onClick={() => setDebugError('')}>Dismiss</button>
                </div>
            )}
            {cheatWarnings > 0 && (
                <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 p-3 bg-[rgba(218,54,51,0.95)] border border-red-500 rounded text-white text-sm shadow-xl font-medium animate-pulse">
                    ⚠️ Trust Factor Warning: You have switched tabs or lost focus {cheatWarnings} time(s).
                </div>
            )}
            <AttemptingLayout
                question={currentQuestion}
                number={attemptedIds.length}
                timeRemaining={timeRemaining}
                codeAnswer={codeAnswer}
                setCodeAnswer={setCodeAnswer}
                mcqAnswer={mcqAnswer}
                setMcqAnswer={setMcqAnswer}
                consoleOutput={consoleOutput}
                runCode={runCode}
                submitAnswer={() => submitAnswer()}
            />
        </div>
    );
};

export default ExamPage;
