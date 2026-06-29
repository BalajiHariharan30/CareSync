import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './SymptomChecker.css';

const SymptomChecker = () => {
    const [symptoms, setSymptoms] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const checkSymptoms = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setResult(null);

        try {
            const { data } = await axios.post('/api/ai/symptoms', { symptoms });
            setResult(data);
        } catch (err) {
            setError(err.response?.data?.message || 'Error checking symptoms. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const handleFindDoctor = () => {
        if (result && result.recommendedSpecialist) {
            navigate(`/doctors?specialization=${encodeURIComponent(result.recommendedSpecialist)}`);
        } else {
            navigate('/doctors');
        }
    };

    return (
        <div className="symptom-checker-container">
            <h2>AI Symptom Checker & Doctor Recommendation</h2>
            <p>Describe your symptoms and our AI will suggest possible conditions and the right specialist.</p>

            <form onSubmit={checkSymptoms} className="symptom-form">
                <textarea
                    placeholder="E.g., Severe headache, mild fever, and nausea since yesterday..."
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    required
                    rows="4"
                />
                <button type="submit" disabled={loading || !symptoms.trim()} className="btn btn-primary">
                    {loading ? 'Analyzing...' : 'Check Symptoms'}
                </button>
            </form>

            {error && <div className="error-message">{error}</div>}

            {result && (
                <div className="result-container animate-fade-in">
                    <div className="result-section">
                        <h3>Recommended Specialist</h3>
                        <p className="highlight-text">{result.recommendedSpecialist || 'General Physician'}</p>
                        <button onClick={handleFindDoctor} className="btn btn-secondary mt-2">
                            Find a {result.recommendedSpecialist || 'Doctor'}
                        </button>
                    </div>

                    <div className="result-section">
                        <h3>Possible Conditions</h3>
                        <ul>
                            {result.possibleConditions && result.possibleConditions.map((condition, idx) => (
                                <li key={idx}>{condition}</li>
                            ))}
                        </ul>
                    </div>

                    <div className="result-section">
                        <h3>Health Tips</h3>
                        <ul>
                            {result.healthTips && result.healthTips.map((tip, idx) => (
                                <li key={idx}>{tip}</li>
                            ))}
                        </ul>
                    </div>
                    <small className="disclaimer">* This is an AI prediction and not a substitute for professional medical advice.</small>
                </div>
            )}
        </div>
    );
};

export default SymptomChecker;
