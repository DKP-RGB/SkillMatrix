import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAnalytics } from '../analytics/useAnalytics';
import { useAuth } from '../utils/AuthContext';
import { initAntiCheat } from '../utils/antiCheat';
import { useProctor } from '../utils/useProctor';
import { getNextQuestion, getInitialQuestion } from '../utils/adaptiveEngine';
import { motion, AnimatePresence } from 'framer-motion';
import questionsData from '../data/questions.json';
import { executeCode, getBoilerplate } from '../utils/codeExecution';

// Components
import { StartAssessmentStepper } from '../components/StartAssessmentStepper';
import { AttemptingLayout } from '../components/AttemptingLayout';

const ExamPage = () => {
    const navigate = useNavigate();
    const {
        recordQuestionResult,
        topicStats,
        startAssessment,
        finishAssessment,
        isSaving,
        getHistoricalQuestionIds
    } = useAnalytics();
    const { logout } = useAuth();

    const location = useLocation();

    // Setup Flow State
    const [setupComplete, setSetupComplete] = useState(false);
    const [examConfig, setExamConfig] = useState(null);
    const [fullResults, setFullResults] = useState([]);
    const [isLoadingTransition, setIsLoadingTransition] = useState(
        !!location.state?.reattemptConfig
    );
    const [loadingProgress, setLoadingProgress] = useState(0);

    // Core Exam State
    const [currentQuestion, setCurrentQuestion] = useState(null);
    const [attemptedIds, setAttemptedIds] = useState([]);
    const [examFinished, setExamFinished] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState(0);

    // Anti-Cheat State
    const [cheatWarnings, setCheatWarnings] = useState(0);
    const [lostFocusThisQuestion, setLostFocusThisQuestion] = useState(false);
    const [lastViolationSource, setLastViolationSource] = useState('');

    // AI Proctoring State
    const [isTerminated, setIsTerminated] = useState(false);
    const [proctorReason, setProctorReason] = useState('');
    const [isAILoading, setIsAILoading] = useState(true);
    const [violationType, setViolationType] = useState(null); // 'MOBILE' or 'PERSON'
    const [detectionProgress, setDetectionProgress] = useState(0); // 0 to 3000ms
    const [isViolating, setIsViolating] = useState(false);

    const canvasRef = useRef(null);

    const handleViolation = (msg) => {
        if (msg.type === 'STATUS') {
            if (msg.status === 'MOBILE_DETECTED' || msg.status === 'MULTIPLE_PEOPLE') {
                if (!isTerminated) {
                    setIsViolating(true);
                    setViolationType(msg.status === 'MOBILE_DETECTED' ? 'MOBILE' : 'PERSON');
                }
            } else if (msg.status === 'CLEAR') {
                setIsViolating(false);
                setDetectionProgress(0);
            }

            if (msg.status === 'NO_FACE') {
                const now = Date.now();
                if (!window.lastSoftWarning || now - window.lastSoftWarning > 3000) {
                    setCheatWarnings(prev => prev + 1);
                    setLastViolationSource('AI Camera (No Face Detected)');
                    setLostFocusThisQuestion(true);
                    window.lastSoftWarning = now;
                }
            }
        }
    };

    // 3-Second Detection Logic
    useEffect(() => {
        let interval;
        if (isViolating && !isTerminated) {
            interval = setInterval(() => {
                setDetectionProgress(prev => {
                    const next = prev + 100; // Increment by 100ms
                    if (next >= 3000) {
                        clearInterval(interval);
                        // Trigger Termination
                        setIsTerminated(true);
                        setExamFinished(true);
                        setProctorReason(violationType === 'MOBILE' ? 'Mobile Phone Detected' : 'Unauthorized Person(s) Detected');
                        finishAssessment('terminated');

                        setTimeout(() => {
                            navigate('/dashboard', {
                                state: {
                                    cheated: true,
                                    reason: violationType === 'MOBILE' ? 'Mobile Phone Detected' : 'Unauthorized Person(s) Detected',
                                    config: examConfig
                                }
                            });
                        }, 3000);
                        return 3000;
                    }
                    return next;
                });
            }, 100);
        } else {
            setDetectionProgress(0);
        }
        return () => clearInterval(interval);
    }, [isViolating, isTerminated, violationType, navigate, examConfig, finishAssessment]);

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

    // Terminate on 3 Cheat Warnings
    useEffect(() => {
        if (cheatWarnings >= 3 && !examFinished) {
            setExamFinished(true);
            setIsTerminated(true);
            setProctorReason('Multiple focus/integrity violations');
            finishAssessment('terminated');
            setTimeout(() => {
                navigate('/dashboard', {
                    state: {
                        cheated: true,
                        reason: 'Maximum integrity violations exceeded',
                        config: examConfig
                    }
                });
            }, 3000);
        }
    }, [cheatWarnings, examFinished, finishAssessment, navigate, examConfig]);

    useEffect(() => {
        const runTransition = async () => {
            if (isLoadingTransition) {
                // Smooth progress bar simulation
                const progressInterval = setInterval(() => {
                    setLoadingProgress(prev => {
                        if (prev >= 100) {
                            clearInterval(progressInterval);
                            return 100;
                        }
                        return prev + 5;
                    });
                }, 100);

                // Artificial delay for feel (1.5s - 2s)
                await new Promise(resolve => setTimeout(resolve, 2000));

                const config = location.state?.reattemptConfig;
                if (!config) {
                    setIsLoadingTransition(false);
                    return;
                }

                const historicalIds = await getHistoricalQuestionIds();
                const availableQuestions = questionsData.filter(q => !historicalIds.includes(q.id));
                const pool = availableQuestions.length > 0 ? availableQuestions : questionsData;
                const firstQ = getInitialQuestion(pool, config);

                startAssessment(config.language, config.type);
                setExamConfig(config);
                setAttemptedIds([...historicalIds, firstQ.id]);
                setCurrentQuestion(firstQ);
                setTimeRemaining(firstQ.timeLimit);
                setSetupComplete(true);
                setIsLoadingTransition(false);
                clearInterval(progressInterval);
            }
        };
        runTransition();
    }, [isLoadingTransition, location.state, startAssessment, getHistoricalQuestionIds]);

    // Handle initial state if reattemptConfig is present
    useEffect(() => {
        if (location.state?.reattemptConfig && !setupComplete && !isLoadingTransition && !examFinished && !isTerminated) {
            setIsLoadingTransition(true);
        }
    }, [location.state, setupComplete, isLoadingTransition, examFinished, isTerminated]);

    // User Input State
    const [mcqAnswer, setMcqAnswer] = useState('');
    const [codeAnswer, setCodeAnswer] = useState('');
    const [consoleOutput, setConsoleOutput] = useState('');
    const [isRunning, setIsRunning] = useState(false);

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
    const handleSetupComplete = async (config) => {
        setExamConfig(config);
        setSetupComplete(true);
        startAssessment(config.language, config.type);

        // Fetch historical IDs to avoid global repetition
        const historicalIds = await getHistoricalQuestionIds();

        // Filter out historical IDs for initial question if possible
        const availableQuestions = questionsData.filter(q => !historicalIds.includes(q.id));
        const pool = availableQuestions.length > 0 ? availableQuestions : questionsData;

        const firstQ = getInitialQuestion(pool, config);

        // Auto-fill boilerplate if it's a code question
        if (config.type === 'code') {
            setCodeAnswer(getBoilerplate(config.language));
        }

        setAttemptedIds([...historicalIds, firstQ.id]);
        setCurrentQuestion(firstQ);
        setTimeRemaining(firstQ.timeLimit);
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
                setLastViolationSource('Tab Switching / Focus Loss');
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
        setCodeAnswer(q.type === 'code' ? getBoilerplate(q.language) : '');
        setConsoleOutput('');
    };

    const handleTimeUp = () => {
        submitAnswer(false, true); // Failed due to timeout
    };

    // Real Code Execution via Piston API
    const runCode = async () => {
        if (!codeAnswer.trim()) {
            setConsoleOutput('// No code to execute.');
            return;
        }

        setIsRunning(true);
        setConsoleOutput('>> Initializing runtime...\n');

        try {
            const result = await executeCode(currentQuestion.language, codeAnswer);

            let finalOutput = "";
            if (result.stdout) finalOutput += result.stdout;
            if (result.stderr) finalOutput += `\n[ERROR]\n${result.stderr}`;

            if (result.cpuTime || result.memory) {
                finalOutput += `\n\n------------------------\n`;
                if (result.cpuTime) finalOutput += `CPU Time: ${result.cpuTime}s  `;
                if (result.memory) finalOutput += `Memory: ${result.memory}kb`;
            }

            if (!result.stdout && !result.stderr) {
                finalOutput = "[Process completed with no output]";
            }

            setConsoleOutput(finalOutput);
        } catch (error) {
            setConsoleOutput(`[FATAL ERROR] Failed to connect to execution engine.\n${error.message}`);
        } finally {
            setIsRunning(false);
        }
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
        const userAnswer = currentQuestion.type === 'mcq' ? mcqAnswer : codeAnswer;

        // Capture for Review
        const resultItem = {
            ...currentQuestion,
            userAnswer,
            isCorrect,
            timeTaken
        };
        const updatedFullResults = [...fullResults, resultItem];
        setFullResults(updatedFullResults);

        // Record to analytics (Supabase)
        recordQuestionResult(
            currentQuestion.topic,
            currentQuestion.difficulty,
            isCorrect,
            timeTaken,
            lostFocusThisQuestion,
            currentQuestion.id
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
            examConfig.language,
            examConfig.type,
            examConfig.topic
        );

        // End exam after 10 questions in this session
        if (updatedFullResults.length >= 10 || !nextQ) {
            setExamFinished(true);
            finishAssessment();

            // Navigate to Review Page with data
            setTimeout(() => {
                navigate('/review', {
                    state: {
                        results: updatedFullResults,
                        sessionMeta: examConfig
                    }
                });
            }, 3000);
        } else {
            startNextQuestion(nextQ);
        }
    };

    // Render Setup Flow (Only if no loading transition is active)
    if (!setupComplete && !isLoadingTransition) {
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

    // Render Finished State (Success)
    if (examFinished && !isTerminated) {
        return (
            <div className="w-full max-w-2xl mx-auto mt-20 p-10 bg-[#161b22] border border-gray-800 rounded-3xl shadow-2xl text-center animate-fade-in">
                <h2 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#58a6ff] to-[#3fb950] mb-6">Assessment Complete!</h2>
                <div className="bg-[#0d1117] p-6 rounded-xl border border-gray-800 mb-8 inline-block">
                    <p className="text-gray-300 text-lg">
                        {isSaving ? "Finalizing results & securing data..." : "Your analytics have been recorded."}
                    </p>
                    {isSaving && <div className="mt-2 w-full h-1 bg-gray-800 rounded overflow-hidden"><div className="h-full bg-[#58a6ff] animate-progress-indefinite"></div></div>}
                    {(cheatWarnings > 0 && !isSaving) && (
                        <p className="text-red-400 mt-2 font-medium">Attention Warning Deductions: {cheatWarnings}</p>
                    )}
                </div>
                <div className="flex justify-center flex-col items-center gap-4">
                    <p className="text-gray-400 animate-pulse text-sm">Preparing your personalized review page...</p>
                    <div className="flex gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-.3s]"></div>
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-.5s]"></div>
                    </div>
                </div>
            </div>
        );
    }

    // Render Terminated State (High Priority Disqualification)
    if (isTerminated) {
        return (
            <div className="fixed inset-0 z-[1100] bg-[#0d1117]/95 backdrop-blur-xl flex flex-col items-center justify-center p-10 text-center animate-fade-in">
                <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center text-red-500 mb-8 border-2 border-red-500/50 animate-pulse">
                    <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </div>
                <h2 className="text-6xl font-black text-white mb-4 tracking-tighter uppercase">Disqualified</h2>
                <p className="text-2xl text-red-500 font-bold mb-4 uppercase tracking-widest">{proctorReason}</p>
                <p className="text-gray-400 max-w-lg mb-10 text-lg leading-relaxed">
                    The AI Proctoring system has identified a severe integrity violation.
                    This session has been invalidated and terminated immediately.
                </p>
                <div className="flex flex-col items-center gap-2">
                    <div className="w-48 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full bg-red-600 animate-progress-indefinite"></div>
                    </div>
                    <span className="text-red-400/60 text-xs font-mono uppercase mt-2">Redirecting to Dashboard...</span>
                </div>
            </div>
        );
    }

    // Render Loading State (But not if transition is active)
    if (!currentQuestion && !isLoadingTransition) {
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
            {/* AI Proctoring Camera Preview - Moved to Bottom Left */}
            <div className="fixed bottom-8 left-8 z-[100] w-48 h-36 bg-black rounded-2xl border-2 border-[#00a3ff] shadow-[0_0_20px_rgba(0,163,255,0.3)] overflow-hidden group">
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
                <div className="absolute top-2 left-2 bg-[rgba(0,0,0,0.6)] px-2 py-0.5 rounded text-[10px] text-white flex items-center gap-1 z-10">
                    <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isViolating ? 'bg-red-500' : 'bg-green-500'}`} />
                    {isViolating ? 'RISK DETECTED' : 'AI PROCTORING LIVE'}
                </div>

                {/* Violation Progress Bar Overlay */}
                {isViolating && (
                    <div className="absolute inset-0 bg-red-500/20 flex flex-col justify-end">
                        <div
                            className="bg-red-600 h-1.5 transition-all duration-100"
                            style={{ width: `${(detectionProgress / 3000) * 100}%` }}
                        />
                    </div>
                )}
            </div>

            {/* Warning Popup Overlay */}
            <AnimatePresence>
                {(isViolating && !isTerminated) && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.9 }}
                        className="fixed bottom-48 left-8 z-[200] max-w-xs bg-[#da3633] text-white p-4 rounded-xl shadow-2xl border-2 border-white/20"
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center animate-bounce">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.876c1.27 0 2.066-1.333 1.47-2.4l-6.938-12a2 2 0 00-3.412 0l-6.938 12c-.597 1.067.199 2.4 1.47 2.4z" />
                                </svg>
                            </div>
                            <h4 className="font-black uppercase tracking-tight text-sm">Cheating Warning!</h4>
                        </div>
                        <p className="text-white/90 text-[11px] leading-relaxed mb-3 font-medium">
                            {violationType === 'MOBILE' ? 'Mobile phone detected in frame.' : 'Additional person detected in frame.'}
                            Session will terminate in **{Math.max(0, Math.ceil((3000 - detectionProgress) / 1000))}** seconds.
                        </p>
                        <div className="w-full h-1 bg-black/20 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-white"
                                animate={{ width: `${(detectionProgress / 3000) * 100}%` }}
                                transition={{ ease: "linear" }}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>


            {/* Final Termination Overlay - Red Themed */}
            {isTerminated && (
                <div className="fixed inset-0 z-[1100] bg-[#0d1117]/95 backdrop-blur-xl flex flex-col items-center justify-center p-10 text-center animate-fade-in">
                    <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center text-red-500 mb-8 border-2 border-red-500/50 animate-pulse">
                        <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                    <h2 className="text-6xl font-black text-white mb-4 tracking-tighter">DISQUALIFIED</h2>
                    <p className="text-2xl text-red-500 font-bold mb-4 uppercase tracking-widest">{proctorReason}</p>
                    <p className="text-gray-400 max-w-lg mb-10 text-lg">
                        The AI Proctoring system has identified a severe integrity violation.
                        This session has been invalidated and terminated immediately.
                    </p>
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-48 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                            <div className="h-full bg-red-600 animate-progress-indefinite"></div>
                        </div>
                        <span className="text-red-400/60 text-xs font-mono uppercase mt-2">Redirecting to Dashboard...</span>
                    </div>
                </div>
            )}

            {/* Reattempt Loading Overlay */}
            <AnimatePresence>
                {isLoadingTransition && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[2000] bg-[#0d1117] flex flex-col items-center justify-center backdrop-blur-3xl overflow-hidden"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="flex flex-col items-center max-w-md w-full px-8"
                        >
                            <div className="w-20 h-20 bg-[#58a6ff]/10 rounded-3xl flex items-center justify-center mb-8 border border-[#58a6ff]/20">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                    className="w-10 h-10 border-4 border-[#58a6ff] border-t-transparent rounded-full"
                                />
                            </div>

                            <h2 className="text-2xl font-bold text-white mb-2 uppercase tracking-widest text-center">
                                Initializing Reattempt
                            </h2>
                            <p className="text-gray-400 text-sm mb-12 text-center">
                                {loadingProgress < 40 ? "Synchronizing topic data..." :
                                    loadingProgress < 80 ? "Calibrating adaptive engine..." : "Securing environment..."}
                            </p>

                            <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden mb-4 relative">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-[#58a6ff] to-[#3fb950]"
                                    style={{ width: `${loadingProgress}%` }}
                                    transition={{ duration: 0.1 }}
                                />
                            </div>
                            <div className="flex justify-between w-full text-[10px] font-mono text-gray-500 uppercase">
                                <span>Engine State: Ready</span>
                                <span>{loadingProgress}%</span>
                            </div>
                        </motion.div>

                        <div className="absolute inset-0 bg-gradient-to-t from-[#0d1117] via-transparent to-transparent pointer-events-none opacity-50" />
                        <div className="w-96 h-96 bg-[#58a6ff] rounded-full blur-[150px] opacity-[0.05] absolute -bottom-48 -right-48 animate-pulse" />
                    </motion.div>
                )}
            </AnimatePresence>

            {(cheatWarnings > 0 && !isTerminated) && (
                <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 p-3 bg-[rgba(218,54,51,0.95)] border border-red-500 rounded text-white text-sm shadow-xl font-medium animate-pulse">
                    ⚠️ Trust Factor Warning: You have switched tabs or lost focus {cheatWarnings} time(s).
                </div>
            )}
            {currentQuestion && (
                <AttemptingLayout
                    question={currentQuestion}
                    number={fullResults.length + 1}
                    questionTotal={10}
                    timeRemaining={timeRemaining}
                    codeAnswer={codeAnswer}
                    setCodeAnswer={setCodeAnswer}
                    mcqAnswer={mcqAnswer}
                    setMcqAnswer={setMcqAnswer}
                    consoleOutput={consoleOutput}
                    runCode={runCode}
                    submitAnswer={submitAnswer}
                    isRunning={isRunning}
                />
            )}
        </div>
    );
};

export default ExamPage;
