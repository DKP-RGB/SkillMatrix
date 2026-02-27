import React from 'react';
import { Play, Send } from 'lucide-react';

export const AttemptingLayout = ({
    question,
    number,
    questionTotal,
    timeRemaining,
    codeAnswer,
    setCodeAnswer,
    mcqAnswer,
    setMcqAnswer,
    consoleOutput,
    runCode,
    submitAnswer
}) => {

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const getDifficultyColor = (diff) => {
        switch (diff) {
            case 'easy': return 'bg-[#2ea043] text-white';
            case 'medium': return 'bg-[#f5b041] text-white';
            case 'hard': return 'bg-[#da3633] text-white';
            default: return 'bg-gray-500 text-white';
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-100px)] animate-fade-in bg-white text-[#0d1117]">

            {/* Header Bar */}
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
                <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                        <span className="font-bold text-xl ml-2 tracking-wide font-heading">
                            Q{number} <span className="text-gray-400 text-sm font-normal">/ {questionTotal}</span>
                        </span>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getDifficultyColor(question?.difficulty)}`}>
                        {question?.difficulty}
                    </span>
                    <span className="text-sm text-gray-500">
                        {question?.topic} • {question?.language}
                    </span>
                </div>

                {/* Timer Progress */}
                <div className="flex items-center gap-3 w-1/3 max-w-[300px]">
                    <span className="text-gray-400 text-sm">⏱</span>
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all duration-1000 ${timeRemaining < 30 ? 'bg-[#da3633]' : 'bg-[#2ea043]'
                                }`}
                            style={{ width: `${Math.max(0, (timeRemaining / question?.timeLimit) * 100)}%` }}
                        ></div>
                    </div>
                    <span className="font-mono text-sm font-semibold">{timeRemaining}s</span>
                </div>

                <button
                    onClick={() => { if (window.confirm('Are you sure you want to end and submit the assessment now?')) submitAnswer(true); }}
                    className="bg-red-50 text-red-600 hover:bg-red-100 px-4 py-1.5 rounded-lg transition-colors text-sm font-bold border border-red-200 shadow-sm flex items-center gap-2"
                >
                    End & Submit
                </button>
            </div>

            {/* Split Screen Container */}
            <div className="flex flex-1 overflow-hidden">

                {/* LEFT PANEL: Question Details */}
                <div className="w-1/2 p-8 overflow-y-auto bg-[#fafafa]">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">
                        {question?.type === 'mcq' ? 'MULTIPLE CHOICE' : 'CODE WRITING'}
                    </h4>

                    <h2 className="text-xl md:text-2xl font-main font-semibold leading-relaxed mb-8 drop-shadow-sm" style={{ color: '#000000' }}>
                        {question?.question}
                    </h2>

                    {question?.type === 'code' && (
                        <div className="bg-[#1e1e1e] border border-gray-800 rounded-xl p-6 mt-8 shadow-inner">
                            <span className="text-xs text-gray-500 uppercase tracking-widest block mb-2">Expected Output:</span>
                            <pre className="font-mono text-[#4af626] whitespace-pre-wrap">{question?.expectedOutput}</pre>
                        </div>
                    )}
                </div>

                {/* RIGHT PANEL: Editor or MCQ Options */}
                <div className="w-1/2 flex flex-col border-l border-gray-200 bg-[#161b22]">

                    {/* Top Actions & Tabs */}
                    <div className="flex justify-between items-center p-3 border-b border-gray-800 bg-[#0d1117]">
                        <span className="text-gray-400 text-xs font-mono ml-4">
                            {question?.type === 'code' ? `main.${question?.language === 'C' ? 'c' : 'cpp'}` : 'Select an option'}
                        </span>
                        <div className="flex gap-3">
                            {question?.type === 'code' && (
                                <button
                                    onClick={runCode}
                                    className="flex items-center gap-2 text-sm px-4 py-1.5 rounded bg-transparent border border-gray-700 text-gray-300 hover:bg-gray-800 transition-colors"
                                >
                                    <Play size={14} /> Run
                                </button>
                            )}
                            <button
                                onClick={submitAnswer}
                                disabled={question?.type === 'mcq' && !mcqAnswer}
                                className={`flex items-center gap-2 text-sm px-5 py-2 rounded transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-bold tracking-wide shadow-lg ${number === questionTotal
                                    ? 'bg-[#d29922] text-white hover:bg-[#b8861b] ring-2 ring-yellow-400 ring-offset-2 ring-offset-[#0d1117] animate-pulse'
                                    : 'bg-[#238636] text-white hover:bg-[#2ea043]'
                                    }`}
                            >
                                <Send size={16} /> {number === questionTotal ? 'Submit Assessment' : 'Next Question'}
                            </button>
                        </div>
                    </div>

                    {/* Interactive Area */}
                    <div className="flex-1 overflow-y-auto w-full relative">
                        {question?.type === 'mcq' ? (
                            <div className="p-8 flex flex-col gap-4">
                                {question?.options.map((opt, idx) => (
                                    <label
                                        key={idx}
                                        onClick={() => setMcqAnswer(opt)}
                                        className={`flex items-center p-5 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:scale-[1.02] ${mcqAnswer === opt
                                            ? 'border-[#58a6ff] bg-[rgba(88,166,255,0.1)]'
                                            : 'border-gray-700 hover:border-gray-500 bg-[#1e1e1e]'
                                            }`}
                                    >
                                        <div className={`w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center ${mcqAnswer === opt ? 'border-[#58a6ff]' : 'border-gray-500'
                                            }`}>
                                            {mcqAnswer === opt && <div className="w-2.5 h-2.5 bg-[#58a6ff] rounded-full" />}
                                        </div>
                                        <span className="font-mono text-gray-200 text-sm">{opt}</span>
                                    </label>
                                ))}
                            </div>
                        ) : (
                            <textarea
                                className="w-full h-full bg-[#1e1e1e] text-[#c9d1d9] font-mono p-6 resize-none focus:outline-none focus:ring-1 focus:ring-[#58a6ff] border-none"
                                value={codeAnswer}
                                onChange={(e) => setCodeAnswer(e.target.value)}
                                placeholder={`// Write your ${question?.language} code here...\n\n#include <stdio.h>\n\nint main() {\n    // Type here\n    return 0;\n}`}
                                spellCheck="false"
                            />
                        )}
                    </div>

                    {/* Bottom Console Panel (Code Only) */}
                    {question?.type === 'code' && (
                        <div className="h-48 border-t border-gray-800 bg-[#0d1117] flex flex-col">
                            <div className="px-4 py-2 border-b border-gray-800 text-xs text-gray-500 uppercase tracking-widest font-semibold">
                                Output
                            </div>
                            <div className="p-4 font-mono text-sm overflow-y-auto flex-1 text-gray-400 whitespace-pre-wrap">
                                {consoleOutput || '// Run your code to see output here'}
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};
