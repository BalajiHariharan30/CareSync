import { useState, useContext } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './Auth.css';

const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const { register } = useContext(AuthContext);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [isSuccess, setIsSuccess] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');

    // Detect which portal the user came from
    const role = searchParams.get('role'); // 'patient' or 'doctor'
    const isDoctor = role === 'doctor';

    const portalTitle = isDoctor ? 'Register as Doctor' : 'Create Patient Account';
    const portalSubtitle = isDoctor
        ? 'Join CareSync as a healthcare provider'
        : 'Join CareSync to manage your health';

    const submitHandler = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(password)) {
            setError('Password must be at least 8 characters long and include letters, numbers, and a special character.');
            return;
        }

        try {
            const data = await register({ name, email, password, isDoctor });
            setSuccessMsg(data.message);
            setIsSuccess(true);
            window.scrollTo(0, 0);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to register');
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card glass">
                <h2 className="auth-title text-center">{portalTitle}</h2>
                <p className="auth-subtitle text-center">{portalSubtitle}</p>

                {isSuccess && (
                    <div className="auth-success" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#059669', padding: '15px', borderRadius: '10px', marginBottom: '20px', border: '1px solid #10b981' }}>
                        ✅ {successMsg}
                        <div className="mt-4 text-center">
                            <Link to="/login" className="btn btn-primary btn-sm">Go to Login</Link>
                        </div>
                    </div>
                )}

                {error && <div className="auth-error">{error}</div>}

                {isDoctor && (
                    <div className="auth-error" style={{ background: 'rgba(56, 189, 248, 0.15)', color: 'var(--primary)', borderColor: 'var(--primary)' }}>
                        ℹ️ Doctor accounts require Admin approval before you can access all features.
                    </div>
                )}

                <form onSubmit={submitHandler} className="auth-form">
                    <div className="form-group">
                        <label className="form-label">{isDoctor ? 'Full Name (as on certificate)' : 'Full Name'}</label>
                        <input
                            type="text"
                            className="form-input"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            placeholder={isDoctor ? 'Dr. John Doe' : 'John Doe'}
                        />
                    </div>

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

                    <div className="form-group">
                        <label className="form-label">Confirm Password</label>
                        <input
                            type="password"
                            className="form-input"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            placeholder="••••••••"
                        />
                    </div>

                    <button type="submit" className="btn btn-primary auth-submit" disabled={isSuccess}>
                        {isDoctor ? 'Register as Doctor' : 'Sign Up'}
                    </button>

                    <div className="auth-footer text-center mt-4">
                        Already have an account?{' '}
                        <Link to={isDoctor ? '/login?role=doctor' : '/login'} className="auth-link">
                            Log In
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Register;
