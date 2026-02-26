import React from 'react';
import { useAuth } from '../utils/AuthContext';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <nav className="navbar glass-panel">
            <div className="navbar-container">
                <div className="navbar-logo" onClick={() => navigate(user ? '/dashboard' : '/')}>
                    <span className="text-gradient">SkillMatrix</span>
                </div>

                <div className="navbar-links">
                    {user ? (
                        <>
                            <span className="user-greeting">Hello, {user.name}</span>
                            <button className="btn-secondary" onClick={() => navigate('/dashboard')}>
                                Dashboard
                            </button>
                            <button className="btn-primary" onClick={handleLogout}>
                                Logout
                            </button>
                        </>
                    ) : (
                        <button className="btn-primary" onClick={() => navigate('/login')}>
                            Login / Signup
                        </button>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
