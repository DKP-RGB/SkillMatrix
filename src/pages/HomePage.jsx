import React from 'react';
import { ContainerScroll } from '../components/ui/container-scroll-animation';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../utils/AuthContext';
import {
    Code2,
    BrainCircuit,
    ShieldAlert,
    BarChart3,
    Cpu,
    Globe,
    Lock,
    Zap,
    ChevronRight
} from 'lucide-react';

const HomePage = () => {
    const navigate = useNavigate();
    const { user, loading } = useAuth();

    // Redirect authenticated users to the dashboard
    React.useEffect(() => {
        if (!loading && user) {
            navigate('/dashboard', { replace: true });
        }
    }, [user, loading, navigate]);

    return (
        <div className="relative min-h-screen w-full bg-[#0d1117] overflow-hidden">
            {/* Ambient Background Effects */}
            <div className="absolute inset-0 bg-dot-grid opacity-30 pointer-events-none" />
            <div className="glow-blob top-[-10%] left-[-10%] bg-[#58a6ff]" />
            <div className="glow-blob bottom-[-10%] right-[-10%] bg-[#238636]" />

            <div className="relative z-10 flex flex-col items-center">
                {/* Hero Section with Scroll Animation */}
                <ContainerScroll
                    titleComponent={
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                            className="flex flex-col items-center"
                        >
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#58a6ff]/10 border border-[#58a6ff]/20 mb-8">
                                <span className="w-2 h-2 bg-[#58a6ff] rounded-full animate-pulse" />
                                <span className="text-[10px] font-mono text-[#58a6ff] uppercase tracking-widest">v2.0 Adaptive Engine Live</span>
                            </div>

                            <h1 className="text-5xl md:text-8xl font-black text-white tracking-tighter mb-6 leading-[0.9]">
                                EVALUATE WITH <br />
                                <span className="text-gradient">ADAPTIVE INTELLIGENCE</span>
                            </h1>

                            <p className="text-lg md:text-xl text-secondary max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
                                The next generation of technical assessments. SkillMatrix uses real-time
                                adaptive algorithms to map developer DNA with surgical precision.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 mb-20 shadow-2xl">
                                <button
                                    onClick={() => navigate('/login', { state: { mode: 'signup' } })}
                                    className="group relative px-8 py-4 bg-white text-black font-bold rounded-xl overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-[#58a6ff] to-[#3fb950] opacity-0 group-hover:opacity-10 transition-opacity" />
                                    <span className="relative flex items-center gap-2">
                                        Get Started Free <ChevronRight size={18} />
                                    </span>
                                </button>
                                <button
                                    onClick={() => navigate('/login', { state: { mode: 'login' } })}
                                    className="px-8 py-4 bg-[#161b22]/80 backdrop-blur-md text-white font-bold rounded-xl border border-gray-800 hover:border-[#58a6ff]/50 transition-all active:scale-95 hover:shadow-[0_0_15px_rgba(88,166,255,0.1)]"
                                >
                                    Sign In
                                </button>
                            </div>
                        </motion.div>
                    }
                >
                    <img
                        src="https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=2070&auto=format&fit=crop"
                        alt="Dashboard Preview"
                        className="mx-auto rounded-2xl object-cover h-full w-full object-left-top opacity-90 shadow-2xl"
                        draggable={false}
                    />
                </ContainerScroll>

                {/* Tech Trust Bar */}
                <div className="w-full border-y border-white/5 bg-white/[0.02] backdrop-blur-sm py-10 overflow-hidden">
                    <div className="max-w-7xl mx-auto px-6 flex flex-wrap justify-center md:justify-between items-center gap-8 opacity-40 grayscale group hover:grayscale-0 transition-all duration-500">
                        <TechBadge icon={<Cpu size={24} />} text="TensorFlow.js" />
                        <TechBadge icon={<BrainCircuit size={24} />} text="Adaptive Engine" />
                        <TechBadge icon={<Zap size={24} />} text="Vite Speed" />
                        <TechBadge icon={<Globe size={24} />} text="Supabase Edge" />
                        <TechBadge icon={<Lock size={24} />} text="AI Proctoring" />
                    </div>
                </div>

                {/* Features Bento Grid */}
                <section className="max-w-7xl mx-auto py-32 px-6 w-full">
                    <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-4">
                        <div className="max-w-xl">
                            <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-4 uppercase">
                                Built for the <span className="text-gradient">Elite</span>
                            </h2>
                            <p className="text-secondary text-lg font-medium">
                                We've engineered every component to ensure maximum integrity and deep skill discovery.
                            </p>
                        </div>
                        <div className="text-secondary font-mono text-sm tracking-widest hidden md:block">
                            [ SYSTEM_ARCHITECTURE_V2 ]
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                        {/* Feature 1: Big Bento */}
                        <BentoCard
                            className="md:col-span-4 h-[400px]"
                            icon={<Code2 className="text-[#58a6ff]" />}
                            title="Live Adaptive Compilation"
                            description="Write and execute code in a high-performance sandbox. The engine analyzes your logic, complexity, and speed in real-time."
                            visual={<CodeVisual />}
                        />

                        {/* Feature 2: Small Bento */}
                        <BentoCard
                            className="md:col-span-2 h-[400px]"
                            icon={<ShieldAlert className="text-[#da3633]" />}
                            title="Zero-Tolerance Proctoring"
                            description="AI-powered eye tracking and object detection with immediate 3-second enforcement."
                            visual={<ShieldVisual />}
                        />

                        {/* Feature 3: Medium Bento */}
                        <BentoCard
                            className="md:col-span-3 h-[300px]"
                            icon={<BarChart3 className="text-[#e3b341]" />}
                            title="Deep Analytics"
                            description="Interactive skill matrices that projected growth and weakness clusters."
                        />

                        {/* Feature 4: Medium Bento */}
                        <BentoCard
                            className="md:col-span-3 h-[300px]"
                            icon={<Zap className="text-[#238636]" />}
                            title="Hyper-Fast Recovery"
                            description="Intelligent reattempts that restore your adaptive state instantly."
                        />
                    </div>
                </section>

                {/* Footer Quote */}
                <div className="py-20 text-center border-t border-white/5 w-full bg-gradient-to-b from-transparent to-black/50">
                    <p className="text-secondary font-mono text-xs tracking-[0.5em] uppercase mb-4">SkillMatrix © 2026</p>
                    <h3 className="text-white/20 text-4xl md:text-7xl font-black tracking-tighter select-none">
                        EVOLVE BEYOND THE MATRIX
                    </h3>
                </div>
            </div>
        </div>
    );
};

const TechBadge = ({ icon, text }) => (
    <div className="flex items-center gap-3 text-white font-bold tracking-tighter uppercase text-sm">
        {icon}
        <span>{text}</span>
    </div>
);

const BentoCard = ({ icon, title, description, className, visual }) => (
    <motion.div
        whileHover={{ y: -5 }}
        className={`relative group overflow-hidden bg-[#161b22] border border-gray-800 rounded-3xl p-8 flex flex-col justify-between hover:border-gray-600 transition-all duration-300 ${className}`}
    >
        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
            {icon}
        </div>

        <div className="relative z-10 h-full flex flex-col">
            <div className="mb-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mb-6">
                    {icon}
                </div>
                <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">{title}</h3>
                <p className="text-secondary text-sm leading-relaxed max-w-xs">{description}</p>
            </div>

            {visual && (
                <div className="mt-auto pt-6 flex justify-center items-center h-full max-h-[150px] overflow-hidden">
                    {visual}
                </div>
            )}
        </div>
    </motion.div>
);

const CodeVisual = () => (
    <div className="w-full h-full bg-[#0d1117] rounded-xl border border-white/5 p-4 font-mono text-[10px] space-y-2 opacity-50 group-hover:opacity-100 transition-opacity translate-y-4 group-hover:translate-y-0 duration-500">
        <div className="flex gap-2"><div className="w-2 h-2 rounded-full bg-red-500/50" /><div className="w-2 h-2 rounded-full bg-yellow-500/50" /><div className="w-2 h-2 rounded-full bg-green-500/50" /></div>
        <div className="text-blue-400">async function <span className="text-yellow-400">evaluateDNA</span>() &#123;</div>
        <div className="pl-4 text-gray-500">const metrics = await engine.calibrate();</div>
        <div className="pl-4 text-green-400">return metrics.score &gt; 90;</div>
        <div className="text-blue-400">&#125;</div>
    </div>
);

const ShieldVisual = () => (
    <div className="relative w-24 h-24 flex items-center justify-center translate-y-4 group-hover:translate-y-0 duration-500 delay-75">
        <div className="absolute inset-0 border-2 border-red-500/20 rounded-full animate-ping" />
        <div className="absolute inset-2 border-2 border-red-500/40 rounded-full animate-ping [animation-delay:-.5s]" />
        <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center border border-red-500/50">
            <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse" />
        </div>
    </div>
);

export default HomePage;
