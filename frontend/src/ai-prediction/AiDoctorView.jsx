import { useState, useEffect } from 'react';
import axios from 'axios';
import './AiPrediction.css';

const AiDoctorView = () => {
    const [predictions, setPredictions] = useState([]);
    const [remarks, setRemarks] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState({});
    const [error, setError] = useState('');
    const [viewImage, setViewImage] = useState(null);

    useEffect(() => {
        fetchPredictions();
    }, []);

    const fetchPredictions = async () => {
        try {
            setLoading(true);
            const { data } = await axios.get('/api/ai-prediction/all-predictions', { withCredentials: true });
            setPredictions(data);
            
            // Pre-populate remarks state
            const initialRemarks = {};
            data.forEach(item => {
                initialRemarks[item._id] = item.doctorRemarks || '';
            });
            setRemarks(initialRemarks);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load patient predictions.');
        } finally {
            setLoading(false);
        }
    };

    const handleRemarkChange = (id, val) => {
        setRemarks(prev => ({
            ...prev,
            [id]: val
        }));
    };

    const saveRemark = async (id) => {
        setSaving(prev => ({ ...prev, [id]: true }));
        try {
            await axios.put(`/api/ai-prediction/${id}/remark`, {
                remark: remarks[id]
            }, { withCredentials: true });
            
            // Update prediction array locally
            setPredictions(prev => prev.map(p => 
                p._id === id ? { ...p, doctorRemarks: remarks[id] } : p
            ));
            
            // Show brief success alert/state if needed
        } catch (err) {
            alert('Failed to save doctor remark. Please try again.');
        } finally {
            setSaving(prev => ({ ...prev, [id]: false }));
        }
    };

    return (
        <div className="ai-prediction-container">
            <div className="ai-header">
                <h1 className="ai-title">Patient AI Predictions</h1>
                <p className="ai-subtitle">Review AI Pneumonia screening results submitted by patients and add medical remarks.</p>
            </div>

            {error && <div className="auth-error mb-4">{error}</div>}

            {loading ? (
                <div className="flex justify-center items-center mt-6" style={{ minHeight: '200px' }}>
                    <div className="spinner" style={{ borderColor: 'var(--primary) rgba(255,255,255,0.2) rgba(255,255,255,0.2)' }}></div>
                    <span style={{ marginLeft: '10px' }}>Loading patient screenings...</span>
                </div>
            ) : predictions.length === 0 ? (
                <div className="ai-card glass text-center">
                    <p style={{ color: 'var(--text-muted)' }}>No patient AI screenings found.</p>
                </div>
            ) : (
                <div className="doctor-table-container glass">
                    <table className="doctor-table">
                        <thead>
                            <tr>
                                <th>Patient Details</th>
                                <th>Scan Image</th>
                                <th>Scan Date</th>
                                <th>AI Diagnosis</th>
                                <th>Confidence</th>
                                <th>Doctor Remarks</th>
                            </tr>
                        </thead>
                        <tbody>
                            {predictions.map((item) => (
                                <tr key={item._id}>
                                    <td>
                                        <div className="patient-info">
                                            <span className="patient-name">{item.patient?.name || 'Unknown Patient'}</span>
                                            <span className="patient-email">{item.patient?.email || 'N/A'}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <img 
                                            src={item.imageUrl} 
                                            alt="Patient Chest X-Ray" 
                                            className="table-image"
                                            onClick={() => setViewImage(item.imageUrl)}
                                        />
                                    </td>
                                    <td>
                                        {new Date(item.createdAt).toLocaleDateString()}
                                    </td>
                                    <td>
                                        <span className={`result-status ${item.prediction.toLowerCase()}`}>
                                            {item.prediction}
                                        </span>
                                    </td>
                                    <td>
                                        {(item.confidence * 100).toFixed(1)}%
                                    </td>
                                    <td>
                                        <div className="remark-input-container">
                                            <input 
                                                type="text" 
                                                className="remark-input"
                                                placeholder="Add diagnostic comments..."
                                                value={remarks[item._id] || ''}
                                                onChange={(e) => handleRemarkChange(item._id, e.target.value)}
                                            />
                                            <button 
                                                className="btn btn-primary btn-sm"
                                                onClick={() => saveRemark(item._id)}
                                                disabled={saving[item._id] || remarks[item._id] === item.doctorRemarks}
                                            >
                                                {saving[item._id] ? 'Saving...' : 'Save'}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Fullscreen Image Modal */}
            {viewImage && (
                <div className="image-modal-overlay" onClick={() => setViewImage(null)}>
                    <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => setViewImage(null)}>&times;</button>
                        <img src={viewImage} alt="Full size Patient X-Ray" className="modal-image" />
                    </div>
                </div>
            )}
        </div>
    );
};

export default AiDoctorView;
