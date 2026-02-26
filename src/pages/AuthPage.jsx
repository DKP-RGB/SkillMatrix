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
        <div className="auth-container animate-fade-in">
            <div className="auth-card glass-panel">
                <h2 className="text-gradient text-center mb-6">
                    {isLogin ? 'Welcome Back' : 'Create Account'}
                </h2>

                {error && <div className="auth-error text-danger mb-4">{error}</div>}

                <form onSubmit={handleSubmit} className="auth-form">
                    {!isLogin && (
                        <div className="form-group mb-4">
                            <label>Full Name</label>
                            <input
                                type="text"
                                className="input-field"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>
                    )}
                    <div className="form-group mb-4">
                        <label>Email Address</label>
                        <input
                            type="email"
                            className="input-field"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group mb-6">
                        <label>Password</label>
                        <input
                            type="password"
                            className="input-field"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className="btn-primary w-100 mb-4">
                        {isLogin ? 'Login' : 'Sign Up'}
                    </button>
                </form>

                <div className="auth-switch text-center mt-4">
                    <p className="text-secondary text-sm">
                        {isLogin ? "Don't have an account? " : "Already have an account? "}
                        <span
                            className="text-primary cursor-pointer switch-link"
                            onClick={() => setIsLogin(!isLogin)}
                        >
                            {isLogin ? 'Sign up' : 'Login'}
                        </span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AuthPage;
