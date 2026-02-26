import React from 'react';
import { ContainerScroll } from '../components/ui/container-scroll-animation';
import { useNavigate } from 'react-router-dom';
import { Code2, BrainCircuit, ShieldAlert, BarChart3, CheckCircle2 } from 'lucide-react';

const HomePage = () => {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col overflow-hidden w-full items-center justify-center">

            {/* Scroll Animation Hero Section */}
            <ContainerScroll
                titleComponent={
                    <>
                        <h1 className="text-4xl font-semibold text-white mb-4 animate-fade-in">
                            Master Your Skills With <br />
                            <span className="text-4xl md:text-[6rem] font-bold mt-2 leading-none text-gradient block drop-shadow-lg">
                                Adaptive Assessments
                            </span>
                        </h1>
                        <p className="text-xl text-secondary mt-6 max-w-2xl mx-auto mb-10">
                            An intelligent examination platform that adapts in real-time to your skill level,
                            evaluating development capabilities with pinpoint accuracy.
                        </p>
                        <button
                            onClick={() => navigate('/login')}
                            className="bg-[#1f6feb] hover:bg-[#3182ce] text-white font-semibold py-4 px-12 rounded-xl transition-all shadow-[0_4px_14px_rgba(49,130,206,0.5)] hover:shadow-[0_6px_25px_rgba(49,130,206,0.7)] transform hover:-translate-y-1 text-xl animate-pulse"
                        >
                            Get Started Now
                        </button>
                    </>
                }
            >
                <img
                    src="https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=2070&auto=format&fit=crop"
                    alt="Dashboard Preview"
                    className="mx-auto rounded-2xl object-cover h-full w-full object-left-top opacity-80"
                    draggable={false}
                />
            </ContainerScroll>

            {/* Features Outline */}
            <div className="max-w-7xl mx-auto py-20 px-6 w-full">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold font-heading mb-4">Powerful Features</h2>
                    <p className="text-secondary">Everything you need to conduct and take professional technical assessments.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    <div className="bg-[#161b22] border border-gray-800 rounded-2xl p-8 hover:-translate-y-2 transition-transform duration-300 shadow-lg hover:border-gray-600">
                        <div className="w-12 h-12 bg-[#58a6ff]/10 rounded-xl flex items-center justify-center mb-6 text-[#58a6ff]">
                            <Code2 size={24} />
                        </div>
                        <h3 className="text-xl font-bold mb-3 text-white">Live Code Editor</h3>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            Integrated compiler simulation. Write, run, and test code directly in the browser.
                        </p>
                    </div>

                    <div className="bg-[#161b22] border border-gray-800 rounded-2xl p-8 hover:-translate-y-2 transition-transform duration-300 shadow-lg hover:border-[#238636]">
                        <div className="w-12 h-12 bg-[#238636]/10 rounded-xl flex items-center justify-center mb-6 text-[#238636]">
                            <BrainCircuit size={24} />
                        </div>
                        <h3 className="text-xl font-bold mb-3 text-white">Adaptive Engine</h3>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            Questions adjust dynamically based on user speed, accuracy, and topic weaknesses.
                        </p>
                    </div>

                    <div className="bg-[#161b22] border border-gray-800 rounded-2xl p-8 hover:-translate-y-2 transition-transform duration-300 shadow-lg hover:border-[#da3633]">
                        <div className="w-12 h-12 bg-[#da3633]/10 rounded-xl flex items-center justify-center mb-6 text-[#da3633]">
                            <ShieldAlert size={24} />
                        </div>
                        <h3 className="text-xl font-bold mb-3 text-white">Anti-Cheating</h3>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            Trust factors track tab focuses, disables copying, pasting, and contextual actions.
                        </p>
                    </div>

                    <div className="bg-[#161b22] border border-gray-800 rounded-2xl p-8 hover:-translate-y-2 transition-transform duration-300 shadow-lg hover:border-[#e3b341]">
                        <div className="w-12 h-12 bg-[#e3b341]/10 rounded-xl flex items-center justify-center mb-6 text-[#e3b341]">
                            <BarChart3 size={24} />
                        </div>
                        <h3 className="text-xl font-bold mb-3 text-white">Rich Analytics</h3>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            Real-time graphs projecting topic understanding, time metrics, and accuracy benchmarks.
                        </p>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default HomePage;
