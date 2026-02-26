import React from 'react';
import { useAuth } from '../utils/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Do not render Navbar during active assessment for focus
    if (location.pathname.startsWith('/exam')) {
        return null;
    }

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <nav className="sticky top-0 z-50 w-full backdrop-blur-xl bg-[#0d1117]/80 border-b border-gray-800">
            <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                <div className="cursor-pointer flex items-center gap-2" onClick={() => navigate(user ? '/dashboard' : '/')}>
                    <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#58a6ff] to-indigo-400">SkillMatrix</span>
                </div>

                <div className="flex items-center gap-6">
                    {user ? (
                        <>
                            <span className="text-gray-300 font-medium hidden sm:block text-sm">Hello, {user.user_metadata?.full_name || user.email?.split('@')[0]}</span>
                            <button className="text-gray-300 hover:text-white transition-colors text-sm font-medium" onClick={() => navigate('/dashboard')}>
                                Dashboard
                            </button>
                            <button className="bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 px-4 py-2 rounded-lg transition-all text-sm font-medium" onClick={handleLogout}>
                                Logout
                            </button>
                        </>
                    ) : (
                        <button className="bg-[#1f6feb] hover:bg-[#3182ce] text-white px-5 py-2 rounded-lg font-medium transition-all text-sm shadow-[0_0_15px_rgba(49,130,206,0.3)]" onClick={() => navigate('/login')}>
                            Login / Signup
                        </button>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
