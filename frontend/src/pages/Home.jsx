import { Link } from 'react-router-dom';
import { CalendarCheck, ShieldCheck, UserCheck } from 'lucide-react';
import './Home.css';

const Home = () => {
    return (
        <div className="home-container">
            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-content">
                    <h1 className="hero-title">
                        Your Health, <span className="text-gradient">Our Priority.</span>
                    </h1>
                    <p className="hero-subtitle">
                        Experience seamless healthcare with AI-powered doctor recommendations, instant booking, and secure telemedicine.
                    </p>
                    <div className="hero-cta" style={{ flexWrap: 'wrap' }}>
                        <Link to="/register?role=patient" className="btn btn-primary btn-lg">
                            Patient Portal
                        </Link>
                        <Link to="/register?role=doctor" className="btn btn-lg" style={{ backgroundColor: 'var(--secondary)', color: 'white' }}>
                            Doctor Portal
                        </Link>
                        <Link to="/login?role=admin" className="btn btn-outline btn-lg">
                            Admin Portal
                        </Link>
                    </div>
                </div>

                <div className="hero-image-wrapper glass">
                    <img
                        src="https://images.unsplash.com/photo-1576091160550-2173ff9e5eb8?q=80&w=2069&auto=format&fit=crop"
                        alt="Medical Professionals"
                        className="hero-image"
                    />
                    {/* Floating Badge */}
                    <div className="floating-badge glass">
                        <div className="badge-icon success">
                            <UserCheck size={24} />
                        </div>
                        <div className="badge-text">
                            <strong>10K+</strong>
                            <span>Happy Patients</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="features-section">
                <h2 className="section-title text-center">Why Choose CareSync?</h2>
                <div className="features-grid">
                    <div className="feature-card glass">
                        <div className="feature-icon primary">
                            <CalendarCheck size={32} />
                        </div>
                        <h3>Instant Booking</h3>
                        <p>Real-time slot availability. No more waiting in long queues or calling the clinic multiple times.</p>
                    </div>

                    <div className="feature-card glass">
                        <div className="feature-icon secondary">
                            <ShieldCheck size={32} />
                        </div>
                        <h3>Verified Doctors</h3>
                        <p>All our medical professionals are thoroughly vetted and verified for your safety and peace of mind.</p>
                    </div>

                    <div className="feature-card glass">
                        <div className="feature-icon accent">
                            <UserCheck size={32} />
                        </div>
                        <h3>AI Recommendations</h3>
                        <p>Not sure who to see? Our advanced AI will recommend the right specialist based on your symptoms.</p>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;
