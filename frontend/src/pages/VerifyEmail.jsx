import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle, XCircle } from 'lucide-react';
import './Auth.css';

const VerifyEmail = () => {
    const { token } = useParams();
    const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error'
    const [message, setMessage] = useState('');

    useEffect(() => {
        const verify = async () => {
            try {
                const { data } = await axios.get(`/api/auth/verify/${token}`);
                setStatus('success');
                setMessage(data.message);
            } catch (err) {
                setStatus('error');
                setMessage(err.response?.data?.message || 'Verification failed. The link may be invalid or expired.');
            }
        };
        verify();
    }, [token]);

    return (
        <div className="auth-container">
            <div className="auth-card glass text-center">
                {status === 'verifying' && (
                    <>
                        <div className="loading-spinner mb-4" style={{border: '4px solid #f3f3f3', borderTop: '4px solid #3b82f6', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite', margin: '0 auto'}}></div>
                        <h2 className="auth-title">Verifying your email...</h2>
                        <p className="auth-subtitle">Please wait while we activate your account.</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <CheckCircle size={60} color="#10b981" className="mx-auto mb-4" />
                        <h2 className="auth-title">Email Verified!</h2>
                        <p className="auth-subtitle">{message}</p>
                        <Link to="/login" className="btn btn-primary mt-6 inline-block no-underline">Go to Login</Link>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <XCircle size={60} color="#ef4444" className="mx-auto mb-4" />
                        <h2 className="auth-title">Verification Failed</h2>
                        <p className="auth-subtitle">{message}</p>
                        <Link to="/register" className="btn btn-outline mt-6 inline-block no-underline">Back to Register</Link>
                    </>
                )}
            </div>
            <style>{`
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

export default VerifyEmail;
