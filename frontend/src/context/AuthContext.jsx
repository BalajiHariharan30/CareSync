import { createContext, useState, useEffect } from 'react';
import axios from 'axios';

// Create a context
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Initial load: check if we have a user in localStorage (or via check-auth API)
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const { data } = await axios.get('/api/auth/profile', { withCredentials: true });
                setUser(data);
                localStorage.setItem('userInfo', JSON.stringify(data));
            } catch (error) {
                // If profile check fails, clear potential stale userInfo
                localStorage.removeItem('userInfo');
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        const userInfo = localStorage.getItem('userInfo');
        if (userInfo) {
            setUser(JSON.parse(userInfo));
            // Still check background to verify token is valid
            checkAuth();
        } else {
            setLoading(false);
        }
    }, []);

    const login = async (email, password) => {
        const config = { headers: { 'Content-Type': 'application/json' }, withCredentials: true };
        const { data } = await axios.post('/api/auth/login', { email, password }, config);
        // data contains _id, name, email, isAdmin, isDoctor
        setUser(data);
        localStorage.setItem('userInfo', JSON.stringify(data));
        return data;
    };

    const register = async (userData) => {
        const config = { headers: { 'Content-Type': 'application/json' }, withCredentials: true };
        const { data } = await axios.post('/api/auth/register', userData, config);
        // We don't call setUser(data) here because email verification is now required
        return data;
    };

    const logout = async () => {
        try {
            await axios.post('/api/auth/logout', {}, { withCredentials: true });
        } catch (error) {
            console.error("Logout API failed:", error);
        } finally {
            setUser(null);
            localStorage.removeItem('userInfo');
        }
    };

    return (
        <AuthContext.Provider value={{ user, setUser, loading, login, register, logout }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
