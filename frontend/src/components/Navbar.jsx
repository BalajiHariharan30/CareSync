import { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { HeartPulse, UserCircle } from 'lucide-react';
import './Navbar.css';

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <nav className="navbar glass">
            <div className="container nav-content">
                <Link to="/" className="nav-brand">
                    <HeartPulse className="brand-icon" size={32} />
                    <span className="brand-text">CareSync</span>
                </Link>

                <div className="nav-actions">
                    <div className="nav-links">
                        <Link to="/doctors" className="nav-link">Find Doctors</Link>
                        <Link to="/symptom-checker" className="nav-link">Symptom Checker</Link>
                    </div>

                    <div className="auth-section">
                        {user ? (
                            <div className="user-menu">
                                <span className="user-greeting">Hi, {user.name}</span>
                                <Link
                                    to={user.isAdmin ? "/admin" : user.isDoctor ? "/doctor-dashboard" : "/patient-dashboard"}
                                    className="profile-link"
                                    title="Dashboard"
                                >
                                    <UserCircle size={22} className="profile-icon" />
                                </Link>
                                <button onClick={handleLogout} className="logout-btn">
                                    Logout
                                </button>
                            </div>
                        ) : (
                            <div className="auth-buttons">
                                <Link to="/login" className="nav-link">Log In</Link>
                                <Link to="/register" className="btn btn-primary btn-sm">Sign Up</Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
