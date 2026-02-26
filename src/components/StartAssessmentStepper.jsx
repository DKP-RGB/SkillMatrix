import React, { useState } from 'react';
import { ChevronRight, Code2, Layers, Target, TerminalSquare } from 'lucide-react';

const TOPICS = [
    'Arrays', 'Data Structures', 'Functions', 'Pointers',
    'Loops', 'Conditionals', 'Time Complexity', 'Basic Algorithms'
];

const LANG_ICONS = {
    'C': 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/c/c-original.svg',
    'C++': 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/cplusplus/cplusplus-original.svg',
    'Python': 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/python/python-original.svg',
    'Java': 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/java/java-original.svg',
    'JavaScript': 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/javascript/javascript-original.svg',
    'Go': 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/go/go-original-wordmark.svg'
};

export const StartAssessmentStepper = ({ onComplete }) => {
    const [step, setStep] = useState(1);
    const [selection, setSelection] = useState({
        language: null,
        topic: null,
        difficulty: 'medium', // Default per requirements
        type: null
    });

    const handleNext = () => setStep(s => Math.min(s + 1, 4));
    const handleBack = () => setStep(s => Math.max(s - 1, 1));

    const updateSelection = (key, value) => {
        setSelection(prev => ({ ...prev, [key]: value }));
    };

    const submitSetup = () => {
        onComplete(selection);
    };

    return (
        <div className="w-full max-w-5xl mx-auto bg-[#0d1117] text-[#c9d1d9] p-8 md:p-12 rounded-2xl shadow-2xl animate-fade-in border border-gray-800 mt-4">

            {/* Stepper Header */}
            <div className="flex items-center justify-between mb-16 relative px-4 mx-8">
                <div className="absolute left-6 right-6 top-6 h-[1px] bg-gray-800 -z-10"></div>
                {[
                    { num: 1, label: 'Language', icon: Code2 },
                    { num: 2, label: 'Topic', icon: Layers },
                    { num: 3, label: 'Difficulty', icon: Target },
                    { num: 4, label: 'Type', icon: TerminalSquare }
                ].map((s) => (
                    <div key={s.num} className="flex flex-col items-center bg-[#0d1117] px-4">
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center border-2 transition-all duration-700 ${step >= s.num
                            ? 'border-[#00a3ff] text-white shadow-[0_0_25px_rgba(0,163,255,0.6)] bg-[rgba(0,163,255,0.15)] scale-110'
                            : 'border-gray-800 text-gray-700'
                            }`}>
                            <s.icon size={20} />
                        </div>
                        <span className={`text-sm mt-3 font-bold tracking-widest uppercase ${step >= s.num ? 'text-white' : 'text-gray-600'}`}>
                            {s.label}
                        </span>
                    </div>
                ))}
            </div>

            {/* Step Content */}
            <div className="min-h-[350px] flex flex-col justify-center items-center w-full">
                {step === 1 && (
                    <div className="animate-slide-up w-full text-center">
                        <h3 className="text-2xl mb-12 font-bold text-white tracking-wide">Select Programming Language</h3>
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-8">
                            {['C', 'C++', 'Python', 'Java', 'JavaScript', 'Go'].map(lang => (
                                <button
                                    key={lang}
                                    onClick={() => updateSelection('language', lang)}
                                    className={`py-8 rounded-2xl transition-all duration-500 flex flex-col items-center justify-center gap-4 group relative overflow-hidden transform hover:-translate-y-2 hover:shadow-[0_20px_60px_rgba(0,163,255,0.2)] ${selection.language === lang
                                        ? 'bg-[rgba(22,27,34,0.9)] backdrop-blur-xl shadow-[0_0_40px_rgba(0,163,255,0.3)] ring-[3px] ring-[#00a3ff] text-white scale-[1.02]'
                                        : 'bg-[#161b22] hover:bg-[#1c2128] ring-1 ring-gray-800 hover:ring-gray-600 text-gray-500 hover:text-white'
                                        }`}
                                    style={{ color: selection.language === lang ? '#ffffff' : undefined }}
                                >
                                    <img
                                        src={LANG_ICONS[lang]}
                                        alt={`${lang} logo`}
                                        className={`w-16 h-16 object-contain transition-transform duration-300 ${selection.language === lang ? 'scale-110' : 'group-hover:scale-110 grayscale-[0.2]'}`}
                                    />
                                    <span className="text-2xl font-black font-heading tracking-wider transition-all duration-300 transform group-hover:scale-105">{lang}</span>
                                    {selection.language === lang && (
                                        <div className="absolute bottom-0 left-0 w-full h-[3px] bg-gradient-to-r from-transparent via-[#00a3ff] to-transparent animate-pulse" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="animate-slide-up w-full text-center">
                        <h3 className="text-2xl mb-12 font-bold text-white tracking-wide">Select Topic Area</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            {TOPICS.map(topic => (
                                <button
                                    key={topic}
                                    onClick={() => updateSelection('topic', topic)}
                                    className={`p-6 rounded-xl border-[3px] transition-all duration-500 transform hover:-translate-y-1 hover:shadow-[0_15px_35px_rgba(0,163,255,0.2)] text-base font-black tracking-widest uppercase ${selection.topic === topic
                                        ? 'border-[#00a3ff] bg-[rgba(0,163,255,0.1)] text-white shadow-[0_0_25px_rgba(0,163,255,0.25)] scale-105'
                                        : 'border-gray-800 bg-[#161b22] text-gray-600 hover:border-gray-500 hover:text-gray-200'
                                        }`}
                                    style={{ color: selection.topic === topic ? '#ffffff' : undefined }}
                                >
                                    {topic}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="animate-slide-up w-full text-center max-w-2xl mx-auto">
                        <h3 className="text-2xl mb-4 font-bold text-white tracking-wide">Select Initial Difficulty</h3>
                        <p className="text-gray-500 mb-12 text-sm">
                            The engine will intelligently adapt higher or lower based on your performance.
                        </p>

                        <div className="flex justify-between items-center mb-6 px-1">
                            <span className={`font-bold tracking-wider uppercase text-sm ${selection.difficulty === 'easy' ? 'text-[#3fb950]' : 'text-gray-600'}`}>Easy</span>
                            <span className={`font-bold tracking-wider uppercase text-sm ${selection.difficulty === 'medium' ? 'text-[#d29922]' : 'text-gray-600'}`}>Medium</span>
                            <span className={`font-bold tracking-wider uppercase text-sm ${selection.difficulty === 'hard' ? 'text-[#f85149]' : 'text-gray-600'}`}>Hard</span>
                        </div>

                        <div className="relative h-[6px] bg-gray-800 rounded-full mb-12 mx-4 flex items-center justify-between px-0">
                            <div
                                className="absolute left-0 top-0 h-full rounded-full transition-all duration-500 pointer-events-none"
                                style={{
                                    width: selection.difficulty === 'easy' ? '0%' : selection.difficulty === 'medium' ? '50%' : '100%',
                                    background: selection.difficulty === 'easy' ? '#3fb950' : selection.difficulty === 'medium' ? '#d29922' : '#f85149'
                                }}
                            ></div>
                            {['easy', 'medium', 'hard'].map((diff) => (
                                <button
                                    key={diff}
                                    onClick={() => updateSelection('difficulty', diff)}
                                    className={`w-6 h-6 rounded-full shadow-lg z-10 cursor-pointer transition-transform duration-300 border-[3px] bg-[#0d1117] ${selection.difficulty === diff ? 'scale-125 border-white' : 'border-gray-600 hover:border-gray-400'
                                        }`}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {step === 4 && (
                    <div className="animate-slide-up w-full text-center max-w-2xl mx-auto">
                        <h3 className="text-2xl mb-12 font-bold text-white tracking-wide">Select Question Type</h3>
                        <div className="grid grid-cols-2 gap-8">
                            {['mcq', 'code'].map(type => (
                                <button
                                    key={type}
                                    onClick={() => updateSelection('type', type)}
                                    className={`p-10 rounded-2xl border-[3px] transition-all duration-500 transform hover:-translate-y-2 hover:shadow-[0_30px_60px_rgba(0,0,0,0.6)] flex flex-col items-center justify-center gap-6 ${selection.type === type
                                        ? 'border-[#00a3ff] bg-[rgba(0,163,255,0.1)] shadow-[0_0_35px_rgba(0,163,255,0.2)] text-white scale-[1.03]'
                                        : 'border-gray-800 bg-[#161b22] hover:border-gray-600 hover:bg-[#1c2128] text-gray-600 hover:text-white'
                                        }`}
                                    style={{ color: selection.type === type ? '#ffffff' : undefined }}
                                >
                                    <span className="text-2xl font-bold tracking-wide">
                                        {type === 'mcq' ? 'Multiple Choice' : 'Code Writing'}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Navigation Footer */}
            <div className="flex justify-between w-full mt-10 pt-6 border-t border-gray-800">
                <button
                    onClick={handleBack}
                    disabled={step === 1}
                    className={`px-6 py-2 rounded-lg border border-gray-700 text-gray-300 font-medium transition-colors ${step === 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-gray-800 hover:text-white'}`}
                >
                    Back
                </button>

                {step < 4 ? (
                    <button
                        onClick={handleNext}
                        disabled={
                            (step === 1 && !selection.language) ||
                            (step === 2 && !selection.topic)
                        }
                        className="bg-[#1f6feb] hover:bg-[#388bfd] text-white px-8 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Next Step <ChevronRight size={18} />
                    </button>
                ) : (
                    <button
                        onClick={submitSetup}
                        disabled={!selection.type}
                        className="bg-[#238636] hover:bg-[#2ea043] text-white px-8 py-2 rounded-lg font-bold uppercase tracking-wide transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Start Assessment
                    </button>
                )}
            </div>
        </div>
    );
};
