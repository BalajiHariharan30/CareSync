import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { Calendar, Clock, User, Activity, Video, FileText, Pill, Users, ChevronRight, MapPin, Star, Trash2, Printer, Languages } from 'lucide-react';
import Telemedicine from '../components/Telemedicine';
import './Dashboard.css';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';

const QueueTracker = ({ appointmentId }) => {
    const [queueData, setQueueData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchQueueInfo = async () => {
            try {
                const { data } = await axios.get(`/api/appointments/${appointmentId}/queue-info`);
                setQueueData(data);
            } catch (err) {
                console.error("Error fetching queue info", err);
            } finally {
                setLoading(false);
            }
        };

        fetchQueueInfo();
        const interval = setInterval(fetchQueueInfo, 30000); // Poll every 30 seconds
        return () => clearInterval(interval);
    }, [appointmentId]);

    if (loading || !queueData || !['Pending', 'Confirmed', 'Delayed'].includes(queueData.status)) return null;

    const patientsBefore = queueData.patientsAhead;
    const isNext = patientsBefore === 0;
    const isMyTurn = queueData.currentPatientNumber === queueData.queueNumber;

    return (
        <div className="queue-tracker-card animate-slide-up mt-4">
            <div className="queue-tracker-header">
                <div className="flex items-center gap-2">
                    <div className="pulse-dot"></div>
                    <span className="text-sm font-bold text-blue-600 uppercase tracking-wider">Live Queue Tracker</span>
                </div>
                {queueData.isEmergency && <span className="emergency-pill">EMERGENCY</span>}
            </div>

            <div className="queue-stats-grid mt-4">
                <div className="queue-stat-item">
                    <span className="label">Current Patient</span>
                    <span className="value">#{queueData.currentPatientNumber}</span>
                </div>
                <div className="queue-stat-item highlight">
                    <span className="label">Your Position</span>
                    <span className="value">#{queueData.queueNumber}</span>
                </div>
                <div className="queue-stat-item">
                    <span className="label">Wait Time</span>
                    <span className="value">{queueData.estimatedWaitTime} min</span>
                </div>
            </div>

            <div className="queue-progress-bar-wrapper mt-6">
                <div className="queue-nodes">
                    <div className={`queue-node ${isMyTurn ? '' : 'active'}`}>
                        <div className="node-circle current"></div>
                        <span className="node-label">Current</span>
                    </div>
                    <div className="queue-connector"></div>
                    <div className="queue-node">
                        <div className="node-circle next"></div>
                        <span className="node-label">Next</span>
                    </div>
                    <div className="queue-connector"></div>
                    <div className={`queue-node ${isMyTurn ? 'active' : ''}`}>
                        <div className="node-circle you"></div>
                        <span className="node-label">You</span>
                    </div>
                </div>
            </div>

            <div className="queue-footer mt-4">
                <p className="text-xs text-muted">
                    {isMyTurn ? "It's your turn! Please be ready." :
                        isNext ? "You are next! Please stay close." :
                            `${patientsBefore} patients ahead of you.`}
                </p>
            </div>
        </div>
    );
};



const PatientDashboard = () => {
    const { t } = useTranslation();
    const { user, setUser } = useContext(AuthContext);
    const [activeTab, setActiveTab] = useState('appointments'); // appointments, records, prescriptions, family, symptoms

    // Data states
    const [appointments, setAppointments] = useState([]);
    const [records, setRecords] = useState([]);
    const [prescriptions, setPrescriptions] = useState([]);
    const [family, setFamily] = useState(user?.familyMembers || []);
    const [healthVitals, setHealthVitals] = useState(user?.healthTracker || []);
    const [notifications, setNotifications] = useState([]); // Will store simulated broadcasts
    const [ehrSummary, setEhrSummary] = useState(null);

    // UI states
    const [loading, setLoading] = useState(true);
    const [activeCall, setActiveCall] = useState(null);
    const [uploading, setUploading] = useState(false);

    // Form states
    const [file, setFile] = useState(null);
    const [docType, setDocType] = useState('Lab Report');
    const [notes, setNotes] = useState('');
    const [famName, setFamName] = useState('');
    const [famRel, setFamRel] = useState('');
    const [vitalForms, setVitalForms] = useState({ bloodPressure: '', sugarLevel: '', weight: '', temperature: '' });

    // AI Symptom Finder states
    const [symptoms, setSymptoms] = useState('');
    const [aiLoading, setAiLoading] = useState(false);
    const [aiResult, setAiResult] = useState(null);
    const [aiError, setAiError] = useState('');

    // Review & Reschedule states
    const [showReviewModal, setShowReviewModal] = useState(null); // appointmentId
    const [rating, setRating] = useState(5);
    const [reviewComment, setReviewComment] = useState('');
    const [reschedulingApt, setReschedulingApt] = useState(null);
    const [newSlots, setNewSlots] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState('');
    const [rescheduleDate, setRescheduleDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const config = { withCredentials: true };

                // Fetch Appointments
                const aptRes = await axios.get('/api/appointments/myappointments', config);
                setAppointments(aptRes.data);

                // Fetch Records
                const recRes = await axios.get('/api/records', config);
                setRecords(recRes.data);

                // Fetch Prescriptions
                const presRes = await axios.get('/api/prescriptions/my', config);
                setPrescriptions(presRes.data);

                // Update family and vitals from user profile route
                const userRes = await axios.get('/api/auth/profile', config);
                setFamily(userRes.data.familyMembers || []);
                setHealthVitals(userRes.data.healthTracker || []);
                if (!user.familyMembers || !user.healthTracker) {
                    setUser(userRes.data); // sync context
                }

                // Simulate fetching broadcasts (since Admin can broadcast)
                // In a real app we'd fetch from a /api/broadcasts endpoint.
                const mockNotifications = [
                    { _id: '1', message: 'Welcome to CareSync Health Tracker! Log your vitals daily.', date: new Date().toISOString() }
                ];
                setNotifications(mockNotifications);

                // Fetch EHR Summary
                const ehrRes = await axios.get('/api/auth/ehr-summary', config);
                setEhrSummary(ehrRes.data);

            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };

        if (user) fetchDashboardData();
    }, [user, setUser]);

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) return;
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('documentType', docType);
            formData.append('notes', notes);

            const config = { withCredentials: true, headers: { 'Content-Type': 'multipart/form-data' } };
            const { data } = await axios.post('/api/records/upload', formData, config);
            setRecords([data, ...records]);
            setFile(null);
            setNotes('');
        } catch (error) {
            console.error("Error uploading file", error);
            alert("Upload failed.");
        } finally {
            setUploading(false);
        }
    };

    const handleAddFamily = async (e) => {
        e.preventDefault();
        try {
            const config = { withCredentials: true };
            const { data } = await axios.post('/api/auth/family', { name: famName, relation: famRel }, config);
            setFamily(data);
            setFamName('');
            setFamRel('');
        } catch (error) {
            console.error("Error adding family member", error);
        }
    };

    const handleLogVitals = async (e) => {
        e.preventDefault();
        try {
            const config = { withCredentials: true };
            const { data } = await axios.post('/api/auth/health-tracker', vitalForms, config);
            setHealthVitals(data);
            setVitalForms({ bloodPressure: '', sugarLevel: '', weight: '', temperature: '' });
            alert("Health Vitals Logged Successfully");
        } catch (error) {
            console.error("Error logging vitals:", error);
            alert("Failed to log vitals");
        }
    };

    const handleCancelAppointment = async (id) => {
        if (!window.confirm("Are you sure you want to cancel this appointment?")) return;
        try {
            await axios.delete(`/api/appointments/${id}/cancel`, { withCredentials: true });
            setAppointments(appointments.map(a => a._id === id ? { ...a, status: 'Cancelled' } : a));
            alert("Appointment cancelled.");
        } catch (error) {
            console.error("Error cancelling", error);
        }
    };

    const handleReschedule = async (apt) => {
        setReschedulingApt(apt);
        fetchSlots(rescheduleDate, apt.doctorId._id);
    };

    const fetchSlots = async (date, doctorId) => {
        try {
            const { data } = await axios.get(`/api/doctors/${doctorId}/timeslots?date=${date}`);
            setNewSlots(data);
        } catch (err) {
            console.error("Error fetching slots", err);
        }
    };

    const submitReschedule = async () => {
        if (!selectedSlot) return;
        try {
            await axios.put(`/api/appointments/${reschedulingApt._id}/reschedule`, {
                date: rescheduleDate,
                timeSlotId: selectedSlot
            }, { withCredentials: true });
            alert("Rescheduled successfully!");
            window.location.reload();
        } catch (error) {
            alert(error.response?.data?.message || "Reschedule failed");
        }
    };

    const submitReview = async () => {
        try {
            await axios.post(`/api/doctors/${showReviewModal.doctorId._id}/reviews`, {
                rating,
                comment: reviewComment,
                appointmentId: showReviewModal._id
            }, { withCredentials: true });
            alert("Review submitted! Thank you.");
            setShowReviewModal(null);
            setReviewComment('');
        } catch (error) {
            alert(error.response?.data?.message || "Review failed");
        }
    };

    const printOPDSlip = (apt) => {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head><title>OPD Token - CareSync</title></head>
                <body style="font-family: sans-serif; padding: 40px; border: 2px solid #000;">
                    <center><h1>CARESYNC DIGITAL OPD SLIP</h1></center>
                    <hr/>
                    <p><strong>Patient Name:</strong> ${user.name}</p>
                    <p><strong>Doctor:</strong> Dr. ${apt.doctorId?.userId?.name || apt.doctorId?.clinicName}</p>
                    <p><strong>Date:</strong> ${new Date(apt.date).toLocaleDateString()}</p>
                    <p><strong>Time Slot:</strong> ${apt.timeSlotId?.startTime} - ${apt.timeSlotId?.endTime}</p>
                    <p><strong>Queue Number:</strong> #${apt.queueNumber}</p>
                    <hr/>
                    <p><i>Please present this digital slip at the reception.</i></p>
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    };

    const handleRequestCallback = async (id) => {
        try {
            await axios.post(`/api/appointments/${id}/callback`, {}, { withCredentials: true });
            alert("Callback requested. Someone from the clinic will contact you soon.");
        } catch (error) {
            console.error("Error requesting callback", error);
            alert("Failed to request callback.");
        }
    };

    const handleCheckSymptoms = async (e) => {
        e.preventDefault();
        setAiLoading(true);
        setAiError('');
        setAiResult(null);

        try {
            const { data } = await axios.post('/api/ai/symptoms', { symptoms });
            setAiResult(data);
        } catch (err) {
            setAiError(err.response?.data?.message || 'Error checking symptoms. Please try again later.');
        } finally {
            setAiLoading(false);
        }
    };

    if (loading) return <div className="loading-state">Loading your dashboard...</div>;

    return (
        <div className="dashboard-container">
            <header className="dashboard-header glass">
                <div className="user-profile-info">
                    <div className="avatar-circle">
                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                        <h1 className="dashboard-title">Welcome, {user?.name || 'User'}</h1>
                        <p className="dashboard-subtitle">Manage your health appointments and records.</p>
                    </div>
                </div>
                <div className="header-actions flex gap-3">
                    <button onClick={() => i18n.changeLanguage(i18n.language === 'en' ? 'hi' : 'en')} className="btn btn-outline flex items-center gap-2">
                        <Languages size={18} /> {i18n.language === 'en' ? 'हिन्दी' : 'English'}
                    </button>
                    <Link to="/doctors" className="btn btn-primary">{t('book_new')}</Link>
                </div>
            </header>

            <div className="dashboard-tabs" style={{ flexWrap: 'wrap' }}>
                <button className={`tab-btn ${activeTab === 'appointments' ? 'active' : ''}`} onClick={() => setActiveTab('appointments')}><Calendar size={18} className="inline mr-2" /> {t('appointments')}</button>
                <button className={`tab-btn ${activeTab === 'records' ? 'active' : ''}`} onClick={() => setActiveTab('records')}><FileText size={18} className="inline mr-2" /> {t('records')}</button>
                <button className={`tab-btn ${activeTab === 'vitals' ? 'active' : ''}`} onClick={() => setActiveTab('vitals')}><Activity size={18} className="inline mr-2" /> {t('vitals')}</button>
                <button className={`tab-btn ${activeTab === 'prescriptions' ? 'active' : ''}`} onClick={() => setActiveTab('prescriptions')}><Pill size={18} className="inline mr-2" /> {t('prescriptions')}</button>
                <button className={`tab-btn ${activeTab === 'family' ? 'active' : ''}`} onClick={() => setActiveTab('family')}><Users size={18} className="inline mr-2" /> {t('family')}</button>
                <button className={`tab-btn ${activeTab === 'notifications' ? 'active' : ''}`} onClick={() => setActiveTab('notifications')}><Calendar size={18} className="inline mr-2" /> {t('notifications')}</button>
                <button className={`tab-btn ${activeTab === 'symptoms' ? 'active' : ''}`} onClick={() => setActiveTab('symptoms')}><Activity size={18} className="inline mr-2" /> {t('symptoms')}</button>
                <button className={`tab-btn ${activeTab === 'ehr' ? 'active' : ''}`} onClick={() => setActiveTab('ehr')}><FileText size={18} className="inline mr-2" /> {t('ehr')}</button>
            </div>

            <div className="dashboard-grid tab-panel">
                {activeTab === 'appointments' && (
                    <>
                        {/* Stats Section */}
                        <div className="stats-cards">
                            <div className="stat-card glass">
                                <Calendar size={28} className="stat-icon primary" />
                                <div className="stat-details">
                                    <h3>{appointments.length}</h3>
                                    <p>Total Appointments</p>
                                </div>
                            </div>
                            <div className="stat-card glass">
                                <Activity size={28} className="stat-icon success" />
                                <div className="stat-details">
                                    <h3>{appointments.filter(a => a.status === 'Completed').length}</h3>
                                    <p>Completed Visits</p>
                                </div>
                            </div>
                        </div>

                        {/* Appointments List */}
                        <section className="appointments-section glass">
                            <h2>Your Upcoming Appointments</h2>

                            {appointments.length === 0 ? (
                                <div className="empty-state">
                                    <Clock size={48} className="empty-icon" />
                                    <p>You have no upcoming appointments.</p>
                                    <Link to="/doctors" className="btn btn-outline mt-4">Find a Doctor</Link>
                                </div>
                            ) : (
                                <div className="appointment-list">
                                    {appointments.map(apt => (
                                        <div key={apt._id} className="appointment-card pb-4">
                                            <div className="apt-header">
                                                <div className="doctor-info flex-col items-start gap-1">
                                                    <div className="flex items-center gap-2">
                                                        <User size={20} className="text-muted" />
                                                        <strong>Dr. {apt.doctorId?.userId?.name || apt.doctorId?.clinicName || 'Doctor'}</strong>
                                                    </div>
                                                    {apt.isEmergency && <span className="text-xs text-red-500 font-bold tracking-wide">EMERGENCY PRIORITY</span>}
                                                </div>
                                                <span className={`status-badge status-${apt.status.toLowerCase()}`}>
                                                    {apt.status}
                                                </span>
                                            </div>
                                            <div className="apt-body flex flex-col gap-2">
                                                <div className="flex gap-4">
                                                    <div className="apt-detail">
                                                        <Calendar size={16} />
                                                        <span>{new Date(apt.date).toLocaleDateString()}</span>
                                                    </div>
                                                    <div className="apt-detail">
                                                        <Clock size={16} />
                                                        <span>{apt.timeSlotId?.startTime} - {apt.timeSlotId?.endTime}</span>
                                                    </div>
                                                </div>

                                                {/* Smart Queue Info */}
                                                {(apt.status === 'Pending' || apt.status === 'Confirmed') && apt.queueNumber > 0 && (
                                                    <div className="queue-info">
                                                        <span>Current Queue No: <strong>{apt.queueNumber}</strong></span>
                                                        <span>Est. Wait Time: <strong>{apt.expectedWaitTime} mins</strong></span>
                                                    </div>
                                                )}
                                            </div>

                                            {(apt.status === 'Pending' || apt.status === 'Confirmed' || apt.status === 'Delayed') && (
                                                <QueueTracker appointmentId={apt._id} />
                                            )}

                                            {apt.status === 'Confirmed' && (
                                                <div className="mt-4 border-t border-gray-100 pt-4 flex gap-4">
                                                    {apt.telemedicineLink ? (
                                                        <a href={apt.telemedicineLink} target="_blank" rel="noreferrer" className="btn btn-primary flex items-center justify-center gap-2" style={{ textDecoration: 'none', width: 'auto' }}>
                                                            <Video size={18} /> Join Jitsi Call
                                                        </a>
                                                    ) : (
                                                        <button
                                                            className="btn btn-primary flex items-center justify-center gap-2"
                                                            onClick={() => setActiveCall(apt.doctorId?.userId?.name || apt.doctorId?.clinicName)}
                                                        >
                                                            <Video size={18} /> Join Video Consultation
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                            {(apt.status === 'Pending' || apt.status === 'Confirmed' || apt.status === 'Delayed') && (
                                                <div className="mt-4 flex flex-wrap gap-2">
                                                    <button onClick={() => handleReschedule(apt)} className="btn btn-outline btn-sm flex items-center gap-1">
                                                        <Clock size={14} /> {t('reschedule')}
                                                    </button>
                                                    <button onClick={() => handleCancelAppointment(apt._id)} className="btn btn-outline btn-sm text-red-500 border-red-200 flex items-center gap-1">
                                                        <Trash2 size={14} /> {t('cancel')}
                                                    </button>
                                                    <button onClick={() => printOPDSlip(apt)} className="btn btn-outline btn-sm flex items-center gap-1">
                                                        <Printer size={14} /> {t('opd_slip')}
                                                    </button>
                                                    <button onClick={() => handleRequestCallback(apt._id)} className="btn btn-outline btn-sm flex items-center gap-1">
                                                        <Activity size={14} /> {t('callback')}
                                                    </button>
                                                </div>
                                            )}

                                            {apt.status === 'Completed' && (
                                                <div className="mt-4 border-t border-gray-100 pt-4 flex gap-2">
                                                    <button onClick={() => setShowReviewModal(apt)} className="btn btn-primary btn-sm flex items-center gap-1">
                                                        <Star size={14} /> {t('rate')}
                                                    </button>
                                                    <Link to={`/book/${apt.doctorId?._id}`} className="btn btn-outline btn-sm flex items-center gap-1">
                                                        <Calendar size={14} /> {t('rebook')}
                                                    </Link>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    </>
                )}

                {activeTab === 'records' && (
                    <section className="glass p-6 rounded-[20px]">
                        <h2 className="mb-4 text-xl">Upload Medical Record</h2>
                        <form onSubmit={handleUpload} className="inline-form">
                            <input type="file" onChange={(e) => setFile(e.target.files[0])} required className="form-input flex-1" />
                            <select value={docType} onChange={(e) => setDocType(e.target.value)} className="form-input w-48">
                                <option value="Lab Report">Lab Report</option>
                                <option value="Prescription">Prescription</option>
                                <option value="X-ray">X-ray</option>
                                <option value="Other">Other</option>
                            </select>
                            <input type="text" placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} className="form-input flex-1" />
                            <button type="submit" disabled={uploading || !file} className="btn btn-primary">{uploading ? 'Uploading...' : 'Upload'}</button>
                        </form>

                        <h2 className="mb-4 text-xl mt-8">Your Health Locker</h2>
                        {records.length === 0 ? <p className="text-gray-500">No records uploaded yet.</p> : (
                            <div>
                                {records.map(rec => (
                                    <div key={rec._id} className="record-card">
                                        <div>
                                            <h4 className="font-bold text-lg text-blue-600">{rec.documentType}</h4>
                                            <p className="text-sm text-gray-500">{new Date(rec.createdAt).toLocaleDateString()}</p>
                                            {rec.notes && <p className="text-sm mt-1">{rec.notes}</p>}
                                        </div>
                                        <a href={`http://localhost:5000${rec.documentUrl}`} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">View Document</a>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                )}

                {activeTab === 'prescriptions' && (
                    <section className="glass p-6 rounded-[20px]">
                        <h2 className="mb-4 text-xl">Medicine Reminders & Prescriptions</h2>
                        {prescriptions.length === 0 ? <p className="text-gray-500">No prescriptions found.</p> : (
                            <div className="grid gap-4">
                                {prescriptions.map(pres => (
                                    <div key={pres._id} className="record-card flex-col items-start gap-4">
                                        <div className="w-full flex justify-between border-b pb-2">
                                            <strong>Dr. {pres.doctorId?.userId?.name || 'Doctor'}</strong>
                                            <span className="text-sm text-gray-500">{new Date(pres.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <div className="w-full">
                                            <h4 className="font-bold mb-2">Medicines:</h4>
                                            <ul className="list-disc pl-5">
                                                {pres.medicines.map((med, i) => (
                                                    <li key={i} className="mb-1">
                                                        <strong>{med.name}</strong> - {med.dosage} ({med.frequency}) for {med.duration}
                                                    </li>
                                                ))}
                                            </ul>
                                            {pres.instructions && <p className="mt-3 text-sm italic">Note: {pres.instructions}</p>}
                                        </div>
                                        <div className="w-full pt-3 mt-2 border-t flex justify-end">
                                            <a href="https://www.google.com/maps/search/pharmacy+near+me" target="_blank" rel="noreferrer" className="btn btn-outline flex items-center gap-2" style={{ textDecoration: 'none' }}>
                                                Find Nearby Pharmacy
                                            </a>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                )}

                {activeTab === 'family' && (
                    <section className="glass p-6 rounded-[20px]">
                        <h2 className="mb-4 text-xl">Add Family Member</h2>
                        <form onSubmit={handleAddFamily} className="inline-form">
                            <input type="text" placeholder="Name" value={famName} onChange={(e) => setFamName(e.target.value)} required className="form-input flex-1" />
                            <input type="text" placeholder="Relation (e.g., Son, Wife)" value={famRel} onChange={(e) => setFamRel(e.target.value)} required className="form-input flex-1" />
                            <button type="submit" disabled={!famName || !famRel} className="btn btn-primary">Add Member</button>
                        </form>

                        <h2 className="mb-4 text-xl mt-8">Family Members</h2>
                        {family.length === 0 ? <p className="text-gray-500">No family members added.</p> : (
                            <div className="grid gap-2">
                                {family.map((member, i) => (
                                    <div key={i} className="record-card">
                                        <div>
                                            <h4 className="font-bold">{member.name}</h4>
                                            <p className="text-sm text-gray-500">Relation: {member.relation}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                )}

                {activeTab === 'vitals' && (
                    <section className="glass p-6 rounded-[20px]">
                        <h2 className="mb-4 text-xl">Log Daily Health Vitals</h2>
                        <form onSubmit={handleLogVitals} className="grid grid-cols-2 gap-4 mb-6">
                            <input type="text" placeholder="Blood Pressure (e.g. 120/80)" value={vitalForms.bloodPressure} onChange={(e) => setVitalForms({ ...vitalForms, bloodPressure: e.target.value })} className="form-input" />
                            <input type="number" placeholder="Sugar Level (mg/dL)" value={vitalForms.sugarLevel} onChange={(e) => setVitalForms({ ...vitalForms, sugarLevel: e.target.value })} className="form-input" />
                            <input type="number" step="0.1" placeholder="Weight (kg)" value={vitalForms.weight} onChange={(e) => setVitalForms({ ...vitalForms, weight: e.target.value })} className="form-input" />
                            <input type="number" step="0.1" placeholder="Temperature (°F)" value={vitalForms.temperature} onChange={(e) => setVitalForms({ ...vitalForms, temperature: e.target.value })} className="form-input" />
                            <button type="submit" className="btn btn-primary col-span-2">Save Vitals</button>
                        </form>

                        <h3 className="mb-3 text-lg font-bold">Vitals History</h3>
                        {healthVitals.length === 0 ? <p className="text-gray-500">No vitals logged yet.</p> : (
                            <div className="grid gap-2">
                                {healthVitals.slice().reverse().map((h, i) => (
                                    <div key={i} className="record-card grid grid-cols-5 gap-2 text-sm text-center">
                                        <div className="font-bold text-left">{new Date(h.date).toLocaleDateString()}</div>
                                        <div>BP: {h.bloodPressure || '-'}</div>
                                        <div>Sugar: {h.sugarLevel ? `${h.sugarLevel}mg/dL` : '-'}</div>
                                        <div>Weight: {h.weight ? `${h.weight}kg` : '-'}</div>
                                        <div>Temp: {h.temperature ? `${h.temperature}°F` : '-'}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                )}

                {activeTab === 'notifications' && (
                    <section className="glass p-6 rounded-[20px]">
                        <h2 className="mb-4 text-xl">System Notifications & Reminders</h2>
                        {notifications.length === 0 ? <p className="text-gray-500">You're all caught up!</p> : (
                            <div className="grid gap-3">
                                {notifications.map((n, i) => (
                                    <div key={i} className="record-card border-l-4 border-blue-500">
                                        <div>
                                            <p className="text-sm font-bold">{n.message}</p>
                                            <span className="text-xs text-gray-500">{new Date(n.date).toLocaleString()}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                )}

                {activeTab === 'symptoms' && (
                    <section className="glass p-8 rounded-[30px] symptom-finder-section">
                        <div className="section-header text-center mb-8">
                            <div className="ai-badge mb-4">AI POWERED</div>
                            <h2 className="text-3xl font-bold mb-2">Smart Symptom Finder</h2>
                            <p className="text-gray-500 max-w-lg mx-auto">Describe what you're feeling, and our medical AI will suggest the right specialist for you.</p>
                        </div>

                        <form onSubmit={handleCheckSymptoms} className="symptom-input-wrapper mb-10">
                            <textarea
                                placeholder="E.g., I've had a sharp tooth pain for 2 days and my gums are swollen..."
                                value={symptoms}
                                onChange={(e) => setSymptoms(e.target.value)}
                                required
                                className="premium-textarea"
                                rows="3"
                            />
                            <button
                                type="submit"
                                disabled={aiLoading || !symptoms.trim()}
                                className={`check-symptoms-btn ${aiLoading ? 'loading' : ''}`}
                            >
                                {aiLoading ? (
                                    <div className="flex items-center gap-2">
                                        <div className="spinner-small"></div>
                                        Analyzing Symptoms...
                                    </div>
                                ) : 'Find Right Specialist'}
                            </button>
                        </form>

                        {aiError && <div className="error-card mb-6 animate-shake">{aiError}</div>}

                        {aiResult && (
                            <div className="analysis-result-card animate-slide-up">
                                <div className="recommendation-header">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold uppercase tracking-widest text-blue-500 mb-1">Recommended Specialist</span>
                                        <h3 className="text-2xl font-black text-gray-800">{aiResult.recommendedSpecialist || 'General Physician'}</h3>
                                    </div>
                                    <Link
                                        to={`/doctors?specialization=${encodeURIComponent(aiResult.recommendedSpecialist || 'General Physician')}`}
                                        className="btn btn-primary premium-shadow"
                                    >
                                        Book with {aiResult.recommendedSpecialist || 'Doctor'}
                                    </Link>
                                </div>

                                <div className="analysis-grid gap-6 mt-8">
                                    <div className="analysis-item">
                                        <h4 className="flex items-center gap-2 font-bold mb-3 text-gray-700">
                                            <Activity size={18} className="text-blue-500" />
                                            Possible Conditions
                                        </h4>
                                        <ul className="condition-list">
                                            {aiResult.possibleConditions?.map((c, i) => (
                                                <li key={i}>{c}</li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="analysis-item">
                                        <h4 className="flex items-center gap-2 font-bold mb-3 text-gray-700">
                                            <Pill size={18} className="text-green-500" />
                                            Immediate Health Tips
                                        </h4>
                                        <ul className="tips-list">
                                            {aiResult.healthTips?.map((t, i) => (
                                                <li key={i}>{t}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>

                                <div className="ai-disclaimer mt-8 p-4 bg-red-50 rounded-xl flex gap-3 text-red-700 text-xs">
                                    <Activity size={16} className="shrink-0" />
                                    <p>Disclaimer: This AI recommendation is for informational purposes only. In case of serious emergencies (chest pain, breathing difficulty), please visit the ER immediately.</p>
                                </div>
                            </div>
                        )}
                    </section>
                )}

                {activeTab === 'ehr' && (
                    <section className="glass p-8 rounded-[30px] ehr-master-summary">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-3xl font-black">Electronic Health Record (EHR)</h2>
                            <button className="btn btn-outline btn-sm flex items-center gap-2" onClick={() => window.print()}>
                                <Printer size={16} /> Print Full Report
                            </button>
                        </div>

                        {!ehrSummary ? <div className="spinner"></div> : (
                            <div className="ehr-content-grid">
                                <div className="ehr-main">
                                    <div className="summary-section mb-10">
                                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Activity className="text-red-500" /> Recent Vitals Analysis</h3>
                                        <div className="vitals-dashboard grid grid-cols-4 gap-4">
                                            <div className="vital-mini-card">
                                                <span className="label">Blood Pressure</span>
                                                <span className="val">{ehrSummary.vitals[ehrSummary.vitals.length-1]?.bloodPressure || 'N/A'}</span>
                                            </div>
                                            <div className="vital-mini-card">
                                                <span className="label">Sugar (mg/dL)</span>
                                                <span className="val">{ehrSummary.vitals[ehrSummary.vitals.length-1]?.sugarLevel || 'N/A'}</span>
                                            </div>
                                            <div className="vital-mini-card">
                                                <span className="label">Weight (kg)</span>
                                                <span className="val">{ehrSummary.vitals[ehrSummary.vitals.length-1]?.weight || 'N/A'}</span>
                                            </div>
                                            <div className="vital-mini-card">
                                                <span className="label">Temp (°F)</span>
                                                <span className="val">{ehrSummary.vitals[ehrSummary.vitals.length-1]?.temperature || 'N/A'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="summary-section mb-10">
                                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><FileText className="text-blue-500" /> Medical History & Diagnoses</h3>
                                        {ehrSummary.appointments.length === 0 ? <p className="text-gray-500">No medical history found.</p> : (
                                            <div className="memo-list">
                                                {ehrSummary.appointments.map(apt => (
                                                    <div key={apt._id} className="memo-item glass mb-3 p-4">
                                                        <div className="flex justify-between mb-1">
                                                            <strong className="text-blue-700">Dr. {apt.doctorId?.userId?.name || apt.doctorId?.clinicName}</strong>
                                                            <span className="text-xs text-gray-500">{new Date(apt.date).toLocaleDateString()}</span>
                                                        </div>
                                                        <p className="text-sm">Consultation completed.</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="summary-section">
                                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Pill className="text-green-500" /> Active Prescriptions</h3>
                                        <div className="grid gap-3">
                                            {ehrSummary.prescriptions.slice(0, 3).map(p => (
                                                <div key={p._id} className="record-card compact">
                                                    <div className="flex-1">
                                                        <p className="font-bold text-sm">{p.medicines.map(m => m.name).join(', ')}</p>
                                                        <p className="text-xs text-gray-400">Prescribed on {new Date(p.createdAt).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </section>
                )}
            </div>

            {activeCall && (
                <Telemedicine
                    doctorName={activeCall}
                    onEndCall={() => setActiveCall(null)}
                />
            )}

            {/* Review Modal */}
            {showReviewModal && (
                <div className="modal-overlay">
                    <div className="modal-content glass p-8 text-center max-w-md">
                        <h2 className="text-2xl font-bold mb-4">Rate your visit</h2>
                        <p className="mb-6 text-gray-500">How was your session with Dr. {showReviewModal.doctorId?.userId?.name}?</p>
                        <div className="flex justify-center gap-2 mb-6">
                            {[1, 2, 3, 4, 5].map(num => (
                                <Star
                                    key={num}
                                    size={32}
                                    className={`cursor-pointer ${rating >= num ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                                    onClick={() => setRating(num)}
                                />
                            ))}
                        </div>
                        <textarea
                            placeholder="Share your experience..."
                            className="premium-textarea mb-4"
                            rows="4"
                            value={reviewComment}
                            onChange={(e) => setReviewComment(e.target.value)}
                        />
                        <div className="flex gap-4">
                            <button onClick={() => setShowReviewModal(null)} className="btn btn-outline flex-1">Better Later</button>
                            <button onClick={submitReview} className="btn btn-primary flex-1">Submit Review</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reschedule Modal */}
            {reschedulingApt && (
                <div className="modal-overlay">
                    <div className="modal-content glass p-8 max-w-lg">
                        <h2 className="text-2xl font-bold mb-4">Reschedule Appointment</h2>
                        <div className="mb-4">
                            <label className="block text-sm font-bold mb-2">Select New Date</label>
                            <input 
                                type="date" 
                                className="form-input" 
                                value={rescheduleDate} 
                                onChange={(e) => {
                                    setRescheduleDate(e.target.value);
                                    fetchSlots(e.target.value, reschedulingApt.doctorId._id);
                                }}
                            />
                        </div>
                        <div className="mb-6">
                            <label className="block text-sm font-bold mb-2">Available Slots</label>
                            <div className="grid grid-cols-2 gap-2">
                                {newSlots.length === 0 ? <p className="col-span-2 text-red-500 text-sm">No slots for this date.</p> :
                                    newSlots.map(slot => (
                                        <button 
                                            key={slot._id} 
                                            onClick={() => setSelectedSlot(slot._id)}
                                            className={`btn btn-sm ${selectedSlot === slot._id ? 'btn-primary' : 'btn-outline'}`}
                                        >
                                            {slot.startTime}
                                        </button>
                                    ))
                                }
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <button onClick={() => setReschedulingApt(null)} className="btn btn-outline flex-1">Dismiss</button>
                            <button onClick={submitReschedule} disabled={!selectedSlot} className="btn btn-primary flex-1">Confirm New Time</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PatientDashboard;
