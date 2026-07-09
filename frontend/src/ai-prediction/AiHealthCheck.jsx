import { useState, useEffect } from 'react';
import axios from 'axios';
import './AiPrediction.css';

const AiHealthCheck = () => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [dragActive, setDragActive] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState(null);
    const [history, setHistory] = useState([]);
    const [viewImage, setViewImage] = useState(null);

    // Fetch history on load
    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const { data } = await axios.get('/api/ai-prediction/my-predictions', { withCredentials: true });
            setHistory(data);
        } catch (err) {
            console.error('Failed to load prediction history', err);
        }
    };

    // Drag events
    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const handleFile = (file) => {
        setError('');
        setResult(null);

        // Validation
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        if (!allowedTypes.includes(file.type)) {
            setError('Only JPEG, JPG, and PNG images are supported.');
            return;
        }

        // Limit size: 5MB
        if (file.size > 5 * 1024 * 1024) {
            setError('File size must be under 5MB.');
            return;
        }

        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
    };

    const handleReset = () => {
        setSelectedFile(null);
        setPreviewUrl(null);
        setResult(null);
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedFile) return;

        setLoading(true);
        setError('');
        setResult(null);

        const formData = new FormData();
        formData.append('image', selectedFile);

        try {
            const { data } = await axios.post('/api/ai-prediction/pneumonia', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
                withCredentials: true
            });
            setResult(data);
            fetchHistory(); // Refresh history
        } catch (err) {
            setError(err.response?.data?.message || err.response?.data?.error || 'AI prediction request failed. Please make sure the Python server backend is configured properly.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="ai-prediction-container">
            <div className="ai-header">
                <h1 className="ai-title">AI Disease Prediction</h1>
                <p className="ai-subtitle">Upload a chest X-ray image to perform an instant automated screening for Pneumonia.</p>
            </div>

            <div className="ai-card glass">
                {!previewUrl ? (
                    <div 
                        className={`upload-zone ${dragActive ? 'drag-active' : ''}`}
                        onDragEnter={handleDrag}
                        onDragOver={handleDrag}
                        onDragLeave={handleDrag}
                        onDrop={handleDrop}
                        onClick={() => document.getElementById('xray-file').click()}
                    >
                        <div className="upload-icon">📁</div>
                        <p>Drag and drop your chest X-ray image here, or <strong>browse files</strong></p>
                        <p className="upload-hint">Supports JPEG, JPG, PNG (Max 5MB)</p>
                        <input 
                            type="file" 
                            id="xray-file" 
                            className="file-input" 
                            onChange={handleChange}
                            accept="image/jpeg, image/jpg, image/png"
                        />
                    </div>
                ) : (
                    <div className="preview-container">
                        <img src={previewUrl} alt="X-Ray Preview" className="preview-image" />
                        
                        {error && <div className="auth-error mb-4" style={{ width: '100%' }}>{error}</div>}
                        
                        <div className="action-buttons">
                            <button 
                                className="btn btn-outline" 
                                onClick={handleReset} 
                                disabled={loading}
                            >
                                Clear Image
                            </button>
                            <button 
                                className="btn btn-primary" 
                                onClick={handleSubmit} 
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <div className="spinner"></div>
                                        Analyzing X-Ray...
                                    </>
                                ) : 'Run Diagnosis'}
                            </button>
                        </div>
                    </div>
                )}

                {result && (
                    <div className={`result-box ${result.prediction.toLowerCase()}`}>
                        <div className="result-header">
                            <h3 className="result-title">Screening Completed</h3>
                            <span className={`result-status ${result.prediction.toLowerCase()}`}>
                                {result.prediction}
                            </span>
                        </div>
                        <div className="result-confidence">
                            <strong>Confidence level:</strong> {(result.confidence * 100).toFixed(2)}%
                            <div className="confidence-bar-bg">
                                <div className="confidence-bar" style={{ width: `${result.confidence * 100}%` }}></div>
                            </div>
                        </div>
                        <div className="result-disclaimer">
                            ⚠️ <strong>Disclaimer:</strong> {result.disclaimer}
                        </div>
                    </div>
                )}
            </div>

            {/* History List */}
            <div className="history-section">
                <h2 className="section-title">📊 Your Screening History</h2>
                {history.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)' }}>No previous screening records found.</p>
                ) : (
                    <div className="history-grid">
                        {history.map((record) => (
                            <div key={record._id} className={`history-card glass ${record.prediction.toLowerCase()}`}>
                                <img 
                                    src={record.imageUrl} 
                                    alt="X-ray Thumb" 
                                    className="history-thumbnail"
                                    onClick={() => setViewImage(record.imageUrl)}
                                />
                                <div className="history-details">
                                    <div className="flex items-center justify-between">
                                        <span className={`result-status ${record.prediction.toLowerCase()}`}>
                                            {record.prediction}
                                        </span>
                                        <span className="history-date">
                                            {new Date(record.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p style={{ marginTop: '0.5rem' }}>
                                        <strong>Confidence:</strong> {(record.confidence * 100).toFixed(1)}%
                                    </p>
                                    
                                    {record.doctorRemarks ? (
                                        <div className="doctor-remark-badge">
                                            <div className="remark-title">👨‍⚕️ Doctor's Remarks</div>
                                            <p>{record.doctorRemarks}</p>
                                        </div>
                                    ) : (
                                        <p style={{ fontStyle: 'italic', fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                                            No doctor remarks yet.
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Fullscreen Image Modal */}
            {viewImage && (
                <div className="image-modal-overlay" onClick={() => setViewImage(null)}>
                    <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => setViewImage(null)}>&times;</button>
                        <img src={viewImage} alt="Full size X-Ray" className="modal-image" />
                    </div>
                </div>
            )}
        </div>
    );
};

export default AiHealthCheck;
