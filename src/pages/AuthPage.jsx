import React, { useState } from 'react';
import { useAuth } from '../utils/AuthContext';
import { useNavigate } from 'react-router-dom';

const AuthPage = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const { login, signup } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            if (isLogin) {
                const success = await login(email, password);
                if (success) navigate('/dashboard');
                else setError('Invalid credentials');
            } else {
                const success = await signup(email, password, name);
                if (success) navigate('/dashboard');
                else setError('Signup failed');
            }
        } catch (err) {
            setError('An error occurred');
        }
    };

    return (
        <div className="min-h-[calc(100vh-64px)] w-full flex items-center justify-center p-6 animate-fade-in relative z-10">
            <div className="w-full max-w-md bg-[#161b22] border border-gray-800 rounded-2xl shadow-2xl p-8 backdrop-blur-sm">
                <h2 className="text-3xl font-bold text-center mb-8 bg-clip-text text-transparent bg-gradient-to-r from-[#58a6ff] to-indigo-400">
                    {isLogin ? 'Welcome Back' : 'Create Account'}
                </h2>

                {error && <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg mb-6 text-sm text-center">{error}</div>}

                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                    {!isLogin && (
                        <div className="flex flex-col gap-2">
                            <label className="text-sm text-gray-400 font-medium">Full Name</label>
                            <input type="text" className="w-full bg-[#0d1117] border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff] transition-all placeholder-gray-600 autocomplete-none" value={name} onChange={(e) => setName(e.target.value)} required />
                        </div>
                    )}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm text-gray-400 font-medium">Email Address</label>
                        <input type="email" className="w-full bg-[#0d1117] border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff] transition-all placeholder-gray-600" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                    <div className="flex flex-col gap-2 mb-2">
                        <label className="text-sm text-gray-400 font-medium">Password</label>
                        <input type="password" className="w-full bg-[#0d1117] border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff] transition-all placeholder-gray-600" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    </div>

                    <button type="submit" className="w-full bg-[#1f6feb] hover:bg-[#3182ce] text-white font-semibold tracking-wide py-3 rounded-lg transition-all shadow-[0_4px_14px_rgba(49,130,206,0.3)] hover:shadow-[0_6px_20px_rgba(49,130,206,0.5)] hover:-translate-y-0.5 transform">
                        {isLogin ? 'Login to Dashboard' : 'Sign Up Now'}
                    </button>
                </form>

                <div className="text-center mt-6">
                    <p className="text-gray-400 text-sm">
                        {isLogin ? "Don't have an account? " : "Already have an account? "}
                        <button type="button" className="text-[#58a6ff] hover:text-blue-300 font-medium transition-colors ml-1" onClick={() => setIsLogin(!isLogin)}>
                            {isLogin ? 'Sign up' : 'Login'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AuthPage;
