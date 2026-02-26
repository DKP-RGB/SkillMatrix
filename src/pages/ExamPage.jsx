import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAnalytics } from '../analytics/useAnalytics';
import { useAuth } from '../utils/AuthContext';
import { initAntiCheat } from '../utils/antiCheat';
import { useProctor } from '../utils/useProctor';
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

    // AI Proctoring State
    const [isTerminated, setIsTerminated] = useState(false);
    const [proctorReason, setProctorReason] = useState('');
    const [isAILoading, setIsAILoading] = useState(true);

    const canvasRef = useRef(null);

    const handleViolation = (violation) => {
        if (violation.type === 'HARD_VIOLATION') {
            setProctorReason(violation.reason);
            setIsTerminated(true);
            setExamFinished(true);
            // Hard violations (Mobile Phone) trigger immediate logout after short delay
            setTimeout(() => {
                logout();
                navigate('/');
            }, 5000);
        } else {
            setCheatWarnings(prev => prev + 1);
            setLostFocusThisQuestion(true);
        }
    };

    const { videoRef, isModelLoading, predictions, startRecording, startDetection, stopDetection } = useProctor(handleViolation);

    // Draw Tracking Boxes
    useEffect(() => {
        if (!canvasRef.current || !videoRef.current) return;
        const ctx = canvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

        predictions.forEach(prediction => {
            const [x, y, width, height] = prediction.bbox;
            const isForbidden = prediction.class === 'cell phone' || prediction.class === 'mobile phone';

            // Draw Box
            ctx.strokeStyle = isForbidden ? '#ff4d4d' : '#00a3ff';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, width, height);

            // Draw Label
            ctx.fillStyle = isForbidden ? '#ff4d4d' : '#00a3ff';
            ctx.font = '10px Arial';
            ctx.fillText(
                `${prediction.class.toUpperCase()} (${Math.round(prediction.score * 100)}%)`,
                x,
                y > 10 ? y - 5 : y + 10
            );
        });
    }, [predictions]);

    useEffect(() => {
        setIsAILoading(isModelLoading);
    }, [isModelLoading]);

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
        setExamConfig(config);
        setSetupComplete(true);

        // Get first question based on config
        const firstQ = getInitialQuestion(questionsData, config);
        startNextQuestion(firstQ);
    };

    // Initialize Anti-Cheat & Proctoring after setup with a small delay to avoid false positives
    useEffect(() => {
        if (!setupComplete || examFinished) return;

        // Trigger Fullscreen
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen().catch(err => {
                console.log("Error attempting to enable fullscreen:", err);
            });
        }

        let proctorStarted = false;
        let antiCheatCleanup = null;

        const startSecurity = async () => {
            // Delay to allow focus to settle
            await new Promise(resolve => setTimeout(resolve, 2000));

            await startRecording();
            startDetection();
            proctorStarted = true;

            antiCheatCleanup = initAntiCheat((type) => {
                setCheatWarnings(prev => prev + 1);
                setLostFocusThisQuestion(true);
            });
        };

        startSecurity();

        return () => {
            if (proctorStarted) stopDetection();
            if (antiCheatCleanup) antiCheatCleanup();
        };
    }, [setupComplete, examFinished]);

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
            // Navigate to dashboard automatically for immediate analytics view
            setTimeout(() => navigate('/dashboard'), 1500);
        } else {
            startNextQuestion(nextQ);
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

    // Render Loading State
    if (!currentQuestion) {
        return (
            <div className="flex flex-col items-center justify-center h-[80vh] animate-fade-in">
                <div className="w-12 h-12 border-4 border-[#58a6ff] border-t-transparent rounded-full animate-spin mb-4"></div>
                <div className="text-center">
                    <h3 className="text-xl font-bold text-white mb-2">Initializing Assessment Engine</h3>
                    <p className="text-gray-400 text-sm">
                        {isAILoading ? "Warming up AI Proctoring models..." : "Preparing questions..."}
                    </p>
                </div>
            </div>
        );
    }

    // Render the Professional Split Interface (Attempting Phase)
    return (
        <div className="w-full relative">
            {/* AI Proctoring Camera Preview */}
            <div className="fixed top-24 right-8 z-[100] w-48 h-36 bg-black rounded-2xl border-2 border-[#00a3ff] shadow-[0_0_20px_rgba(0,163,255,0.3)] overflow-hidden group">
                <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover scale-x-[-1]"
                />
                <canvas
                    ref={canvasRef}
                    width={320}
                    height={240}
                    className="absolute inset-0 w-full h-full pointer-events-none scale-x-[-1]"
                />
                <div className="absolute top-2 left-2 bg-[rgba(0,0,0,0.6)] px-2 py-0.5 rounded text-[10px] text-white flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                    AI PROCTORING LIVE
                </div>
            </div>

            {/* Termination Overlay */}
            {isTerminated && (
                <div className="fixed inset-0 z-[1000] bg-[#0d1117] flex flex-col items-center justify-center p-10 text-center animate-fade-in">
                    <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center text-red-500 mb-8 animate-bounce">
                        <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.876c1.27 0 2.066-1.333 1.47-2.4l-6.938-12a2 2 0 00-3.412 0l-6.938 12c-.597 1.067.199 2.4 1.47 2.4z" />
                        </svg>
                    </div>
                    <h2 className="text-5xl font-bold text-white mb-4">Assessment Terminated</h2>
                    <p className="text-xl text-red-400 font-medium mb-2 uppercase tracking-widest">{proctorReason}</p>
                    <p className="text-gray-400 max-w-lg mb-10">
                        Our AI Proctoring system has detected a high-level integrity violation (Mobile Device / Forbidden Object).
                        As per strict anti-cheating policy, this session is invalid and you are being logged out.
                    </p>
                    <div className="text-secondary animate-pulse">
                        Logging out in 5 seconds...
                    </div>
                </div>
            )}

            {(cheatWarnings > 0 && !isTerminated) && (
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
