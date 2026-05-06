import { useState, useContext } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { GoogleLogin } from '@react-oauth/google';
import { AuthContext } from '../context/AuthContext';
import './Auth.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login, logout, setUser } = useContext(AuthContext);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // Detect which portal the user came from
    const role = searchParams.get('role'); // 'admin', 'doctor', or null
    const isAdminLogin = role === 'admin';
    const isDoctorLogin = role === 'doctor';

    const portalTitle = isAdminLogin ? 'Admin Portal Login'
        : isDoctorLogin ? 'Doctor Portal Login'
            : 'Welcome Back';

    const portalSubtitle = isAdminLogin ? 'Sign in as a CareSync Administrator'
        : isDoctorLogin ? 'Sign in to your Doctor Dashboard'
            : 'Log in to your CareSync account';

    const submitHandler = async (e) => {
        e.preventDefault();
        setError('');
        try {
            // 1. Perform Login
            const loggedInUser = await login(email, password);

            // 2. Portal-specific Access Control
            if (isAdminLogin && !loggedInUser.isAdmin) {
                setError('Access denied. This account is not an Administrator.');
                await logout();
                return;
            }
            if (isDoctorLogin && !loggedInUser.isDoctor) {
                setError('Access denied. This account is not a registered Doctor.');
                await logout();
                return;
            }

            // 3. Role-based Navigation
            if (loggedInUser.isAdmin) {
                navigate('/admin');
            } else if (loggedInUser.isDoctor) {
                navigate('/doctor-dashboard');
            } else {
                // If they logged in via main login but are doctors/admins, redirect anyway
                if (loggedInUser.isDoctor) navigate('/doctor-dashboard');
                else if (loggedInUser.isAdmin) navigate('/admin');
                else navigate('/patient-dashboard');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid email or password. Please try again.');
        }
    };

    const googleSuccessHandler = async (credentialResponse) => {
        setError('');
        try {
            const { data } = await axios.post('/api/auth/google', { 
                idToken: credentialResponse.credential 
            }, { withCredentials: true });

            console.log("Frontend: Response from Google Auth API:", data);

            // 1. Sync user state
            setUser(data);
            localStorage.setItem('userInfo', JSON.stringify(data));

            // 2. Portal-specific Access Control
            if (isAdminLogin && !data.isAdmin) {
                setError('Access denied. This account is not an Administrator.');
                await logout(); // Clear state if we just logged them in but they aren't authorized
                return;
            }
            if (isDoctorLogin && !data.isDoctor) {
                setError('Access denied. This account is not a registered Doctor.');
                await logout();
                return;
            }

            // 3. Role-based Navigation
            if (data.isAdmin) {
                navigate('/admin');
            } else if (data.isDoctor) {
                navigate('/doctor-dashboard');
            } else {
                navigate('/patient-dashboard');
            }
        } catch (err) {
            console.error("Google Auth failed", err);
            setError(err.response?.data?.message || "Google Login failed. Please try again.");
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card glass">
                <h2 className="auth-title text-center">{portalTitle}</h2>
                <p className="auth-subtitle text-center">{portalSubtitle}</p>

                {error && <div className="auth-error">{error}</div>}

                {!isAdminLogin ? (
                    <form onSubmit={submitHandler} className="auth-form">
                        <div className="form-group">
                            <label className="form-label">Email Address</label>
                            <input
                                type="email"
                                className="form-input"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="you@example.com"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <input
                                type="password"
                                className="form-input"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="••••••••"
                            />
                        </div>

                        <div className="text-right mb-4">
                            <Link to="/forgot-password" style={{fontSize: '14px', color: 'var(--primary)'}}>Forgot Password?</Link>
                        </div>

                        <button type="submit" className="btn btn-primary auth-submit">
                            {isDoctorLogin ? 'Login as Doctor' : 'Log In'}
                        </button>

                        <div className="auth-footer text-center mt-4">
                            {isDoctorLogin
                                ? <>New doctor? <Link to="/register?role=doctor" className="auth-link">Register here</Link></>
                                : <>Don't have an account? <Link to="/register?role=patient" className="auth-link">Register</Link></>
                            }
                        </div>
                    </form>
                ) : (
                    <div className="admin-notice text-center mb-6">
                        <p className="text-sm opacity-80 mb-4">
                            For security purposes, Admin access is restricted to authorized Google accounts only.
                        </p>
                    </div>
                )}

                {!isDoctorLogin && (
                    <div className="google-auth-separator mt-6">
                        <div className="separator-line"></div>
                        <span>OR</span>
                        <div className="separator-line"></div>
                    </div>
                )}

                {!isDoctorLogin && (
                    <div className="google-login-wrapper flex justify-center mt-4">
                         <GoogleLogin
                            onSuccess={googleSuccessHandler}
                            onError={() => setError("Google Sign-In failed")}
                            useOneTap
                            theme="filled_blue"
                            shape="pill"
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default Login;
