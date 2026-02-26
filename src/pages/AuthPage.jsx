import React, { useState } from 'react';
import { useAuth } from '../utils/AuthContext';
import { useNavigate } from 'react-router-dom';

const AuthPage = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const { login, signup, loginWithGoogle } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            if (isLogin) {
                await login(email, password);
                navigate('/dashboard');
            } else {
                await signup(email, password, name);
                setError('Please check your email for the confirmation link!');
            }
        } catch (err) {
            setError(err.message || 'An error occurred');
        }
    };

    const handleGoogleLogin = async () => {
        try {
            await loginWithGoogle();
        } catch (err) {
            setError(err.message || 'Google login failed');
        }
    };

    return (
        <div className="min-h-[calc(100vh-64px)] w-full flex items-center justify-center p-6 animate-fade-in relative z-10">
            <div className="w-full max-w-md bg-[#161b22] border border-gray-800 rounded-2xl shadow-2xl p-8 backdrop-blur-sm">
                <h2 className="text-3xl font-bold text-center mb-8 bg-clip-text text-transparent bg-gradient-to-r from-[#58a6ff] to-indigo-400">
                    {isLogin ? 'Welcome Back' : 'Create Account'}
                </h2>

                {error && <div className={`p-3 rounded-lg mb-6 text-sm text-center ${error.includes('check your email') ? 'bg-green-500/10 border border-green-500/50 text-green-400' : 'bg-red-500/10 border border-red-500/50 text-red-400'}`}>{error}</div>}

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

                <div className="relative my-8">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-800"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-[#161b22] text-gray-500 uppercase">Or continue with</span>
                    </div>
                </div>

                <button
                    onClick={handleGoogleLogin}
                    className="w-full bg-[#24292f] hover:bg-[#2c3137] text-white font-medium py-3 rounded-lg border border-gray-700 flex items-center justify-center gap-3 transition-all hover:border-gray-500 mb-4"
                >
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                    Login with Google
                </button>

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
