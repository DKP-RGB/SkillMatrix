import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);

    // TODO: Secure authentication & compliance layer (Supabase) integration

    const login = async (email, password) => {
        // Mock login logic
        if (email && password) {
            setUser({ id: 'user_1', email, name: email.split('@')[0] });
            return true;
        }
        return false;
    };

    const signup = async (email, password, name) => {
        // Mock signup logic
        if (email && password && name) {
            setUser({ id: 'user_new', email, name });
            return true;
        }
        return false;
    };

    const logout = async () => {
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, signup, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
