import { useState, useEffect, useContext, useRef, useCallback } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import {
    Users, CheckCircle2, Clock, AlertTriangle, Play, FastForward,
    Stethoscope, FileText, Mic, MicOff, IndianRupee, Timer,
    History, Activity, MoreVertical, Plus, Check, Eye, Calendar, Trash2
} from 'lucide-react';
import './DoctorDashboard.css';

const DoctorDashboard = () => {
    const { user } = useContext(AuthContext);
    const [appointments, setAppointments] = useState([]);
    const [stats, setStats] = useState({ totalToday: 0, completed: 0, pending: 0, emergency: 0, totalEarnings: 0, totalUpcoming: 0 });
    const [availability, setAvailability] = useState('Offline');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeAppointment, setActiveAppointment] = useState(null);
    
    // Slot Management State
    const [showSlotManager, setShowSlotManager] = useState(false);
    const [mySlots, setMySlots] = useState([]);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [bulkSlot, setBulkSlot] = useState({ start: '09:00', end: '17:00', interval: 30 });
    const [slotLoading, setSlotLoading] = useState(false);

    // Consultation Tools State
    const [timer, setTimer] = useState(0);
    const [isConsulting, setIsConsulting] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const recognitionRef = useRef(null);

    useEffect(() => {
        fetchDashboardData();
        if (showSlotManager) fetchMySlots();
        const interval = setInterval(fetchDashboardData, 30000); // Auto refresh every 30s
        return () => clearInterval(interval);
    }, [user, showSlotManager, selectedDate]);

    // Timer Logic
    useEffect(() => {
        let interval;
        if (isConsulting) {
            interval = setInterval(() => setTimer(prev => prev + 1), 1000);
        } else {
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [isConsulting]);

    const fetchDashboardData = async () => {
        try {
            const config = { withCredentials: true };
            const aptsRes = await axios.get('/api/appointments/doctor', config);
            const statsRes = await axios.get('/api/doctors/stats/today', config);
            const doctorRes = await axios.get('/api/doctors/profile/me', config);

            setAppointments(aptsRes.data);
            setStats(statsRes.data);
            if (doctorRes.data?.availabilityStatus) setAvailability(doctorRes.data.availabilityStatus);
            setError(null);
        } catch (error) {
            console.error("Dashboard fetch error:", error);
            setError("Failed to sync data. Please check your connection.");
        } finally {
            setLoading(false);
        }
    };

    const fetchMySlots = async () => {
        try {
            setSlotLoading(true);
            const config = { withCredentials: true };
            const res = await axios.get(`/api/doctors/my/timeslots?date=${selectedDate}`, config);
            setMySlots(res.data);
        } catch (error) {
            console.error("Error fetching slots:", error);
        } finally {
            setSlotLoading(false);
        }
    };

    const handleBulkGenerate = async () => {
        try {
            setSlotLoading(true);
            const slots = [];
            let current = new Date(`2000-01-01T${bulkSlot.start}:00`);
            const end = new Date(`2000-01-01T${bulkSlot.end}:00`);

            while (current < end) {
                const startStr = current.toTimeString().slice(0, 5);
                current.setMinutes(current.getMinutes() + parseInt(bulkSlot.interval));
                const endStr = current.toTimeString().slice(0, 5);
                slots.push({ startTime: startStr, endTime: endStr });
            }

            await axios.post('/api/doctors/timeslots', {
                date: selectedDate,
                slots
            }, { withCredentials: true });

            fetchMySlots();
            alert("Slots generated successfully!");
        } catch (error) {
            console.error("Error generating slots:", error.data?.message || error.message);
            alert(error.response?.data?.message || "Failed to generate slots");
        } finally {
            setSlotLoading(false);
        }
    };

    const handleDeleteSlot = async (id) => {
        if (!window.confirm("Are you sure you want to delete this slot?")) return;
        try {
            await axios.delete(`/api/doctors/timeslots/${id}`, { withCredentials: true });
            setMySlots(prev => prev.filter(s => s._id !== id));
        } catch (error) {
            alert(error.response?.data?.message || "Failed to delete slot");
        }
    };

    const handleClearAllSlots = async () => {
        if (!window.confirm(`Are you sure you want to clear ALL unbooked slots for ${selectedDate}?`)) return;
        try {
            setSlotLoading(true);
            await axios.delete(`/api/doctors/timeslots?date=${selectedDate}`, { withCredentials: true });
            setMySlots(prev => prev.filter(s => s.isBooked));
            alert("All unbooked slots cleared!");
        } catch (error) {
            alert(error.response?.data?.message || "Failed to clear slots");
        } finally {
            setSlotLoading(false);
        }
    };

    const handleStatusChange = async (newStatus) => {
        try {
            const config = { withCredentials: true };
            await axios.put('/api/doctors/status', { status: newStatus }, config);
            setAvailability(newStatus);
        } catch (error) {
            console.error("Error updating status:", error);
        }
    };


    // Voice-to-Text Logic
    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
        } else {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SpeechRecognition) {
                alert("Voice-to-text is not supported in this browser.");
                return;
            }
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = 'en-IN';

            recognitionRef.current.onresult = (event) => {
                let currentTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    currentTranscript += event.results[i][0].transcript;
                }
                setTranscript(currentTranscript);
            };

            recognitionRef.current.start();
            setIsListening(true);
        }
    };

    const startConsultation = async (apt) => {
        try {
            await axios.put(`/api/appointments/${apt._id}/start`, {}, { withCredentials: true });
            setActiveAppointment(apt);
            setIsConsulting(true);
            setTimer(0);
            setTranscript('');
        } catch (error) {
            console.error("Failed to start consultation:", error);
        }
    };

    const completeConsultation = async () => {
        try {
            await axios.put(`/api/appointments/${activeAppointment._id}/complete`, {
                notes: transcript,
                consultationTime: timer
            }, { withCredentials: true });

            setIsConsulting(false);
            setActiveAppointment(null);
            setTimer(0);
            setTranscript('');
            fetchDashboardData();
        } catch (error) {
            console.error("Failed to complete:", error);
        }
    };

    const applyTemplate = (template) => {
        const medString = template.medicines.map(m => `${m.name} - ${m.dosage} - ${m.frequency} - ${m.duration}`).join('\n');
        setTranscript(prev => prev + (prev ? '\n\n' : '') + `Prescription (${template.title}):\n` + medString);
    };

    const viewFile = (file) => {
        window.open(file.url, '_blank');
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    if (loading) return <div className="loading-spinner">Loading Doctor Dashboard...</div>;

    const todayApts = (appointments || []).filter(a => {
        if (!a.date) return false;
        const apptDate = new Date(a.date).toDateString();
        const today = new Date().toDateString();
        return apptDate === today;
    });

    const upcomingApts = (appointments || []).filter(a => {
        if (!a.date) return false;
        const apptDate = new Date(a.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return apptDate > today && (a.status === 'Confirmed' || a.status === 'Pending');
    });

    const pendingQueue = todayApts.filter(a => a.status === 'Confirmed' || a.status === 'Pending').sort((a, b) => (a.queueNumber || 99) - (b.queueNumber || 99));

    return (
        <div className="doctor-dashboard">
            {error && <div className="error-banner animate-slide-down">
                <AlertTriangle size={18} /> {error}
            </div>}
            <header className="dashboard-top">
                <div className="doctor-profile">
                    <h1 className="text-2xl font-bold">Good Morning, Dr. {user.name}</h1>
                    <p className="text-muted text-sm">You have {pendingQueue.length} patients in queue for today.</p>
                </div>

                <div className="status-toggle-group">
                    <button 
                        className={`status-btn ${showSlotManager ? 'active' : ''}`}
                        onClick={() => setShowSlotManager(!showSlotManager)}
                        style={{ marginRight: '1rem', background: showSlotManager ? 'var(--primary)' : 'rgba(255,255,255,0.05)' }}
                    >
                        <Calendar size={18} /> Manage Slots
                    </button>
                    {['Available', 'Busy', 'Break', 'Offline'].map(status => (
                        <button
                            key={status}
                            className={`status-btn ${availability === status ? `active ${status.toLowerCase()}` : ''}`}
                            onClick={() => handleStatusChange(status)}
                        >
                            <span className={`status-dot ${status.toLowerCase()}`}></span>
                            {status}
                        </button>
                    ))}
                </div>
            </header>

            {showSlotManager && (
                <div className="slot-manager-overlay glass animate-fade-in">
                    <div className="slot-manager-card">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold flex items-center gap-2"><Calendar /> Availability Manager</h2>
                            <button className="btn btn-sm btn-outline" onClick={() => setShowSlotManager(false)}>Close</button>
                        </div>

                        <div className="slot-manager-grid">
                            <div className="date-selector-panel">
                                <label className="block text-sm font-medium mb-2">Select Date</label>
                                <input 
                                    type="date" 
                                    className="glass-input w-full p-2 rounded-xl"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    min={new Date().toISOString().split('T')[0]}
                                />

                                <div className="bulk-generator mt-6 p-4 glass rounded-2xl">
                                    <h4 className="font-bold mb-3 text-sm">Bulk Generate Slots</h4>
                                    <div className="grid grid-cols-2 gap-3 mb-3">
                                        <div>
                                            <label className="text-xs text-muted">Start</label>
                                            <input type="time" className="glass-input w-full text-xs" value={bulkSlot.start} onChange={e => setBulkSlot({...bulkSlot, start: e.target.value})} />
                                        </div>
                                        <div>
                                            <label className="text-xs text-muted">End</label>
                                            <input type="time" className="glass-input w-full text-xs" value={bulkSlot.end} onChange={e => setBulkSlot({...bulkSlot, end: e.target.value})} />
                                        </div>
                                    </div>
                                    <label className="text-xs text-muted">Interval (mins)</label>
                                    <select className="glass-input w-full text-xs mb-4" value={bulkSlot.interval} onChange={e => setBulkSlot({...bulkSlot, interval: e.target.value})}>
                                        <option value="15">15 mins</option>
                                        <option value="30">30 mins</option>
                                        <option value="45">45 mins</option>
                                        <option value="60">60 mins</option>
                                    </select>
                                    <button 
                                        className="btn btn-primary w-full btn-sm" 
                                        onClick={handleBulkGenerate}
                                        disabled={slotLoading}
                                    >
                                        {slotLoading ? "Generating..." : "Generate Slots"}
                                    </button>
                                </div>
                            </div>

                            <div className="slots-list-panel">
                                <div className="flex justify-between items-center mb-3">
                                    <h4 className="font-bold text-sm">Existing Slots for {new Date(selectedDate).toLocaleDateString()}</h4>
                                    {mySlots.some(s => !s.isBooked) && (
                                        <button className="text-error text-xs font-bold hover:underline" onClick={handleClearAllSlots}>Clear All</button>
                                    )}
                                </div>
                                {slotLoading ? (
                                    <p className="text-sm text-muted">Loading slots...</p>
                                ) : mySlots.length === 0 ? (
                                    <div className="empty-slots glass p-8 text-center rounded-2xl">
                                        <p className="text-sm text-muted">No slots available for this date.</p>
                                    </div>
                                ) : (
                                    <div className="slots-scroller">
                                        {mySlots.map(slot => (
                                            <div key={slot._id} className={`slot-item glass ${slot.isBooked ? 'booked' : ''}`}>
                                                <div className="slot-time">{slot.startTime} - {slot.endTime}</div>
                                                <div className="flex items-center gap-3">
                                                    {slot.isBooked && <span className="text-xs text-warning font-bold">Booked</span>}
                                                    {!slot.isBooked && (
                                                        <button className="text-error hover:scale-110 transition-transform" onClick={() => handleDeleteSlot(slot._id)}>
                                                            <Trash2 size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="overview-grid">
                <div className="overview-card">
                    <div className="overview-icon" style={{ background: 'rgba(37, 99, 235, 0.1)', color: 'var(--primary)' }}><Users /></div>
                    <div className="overview-details">
                        <h3>{stats.totalToday}</h3>
                        <p>Total Patients Today</p>
                    </div>
                </div>
                <div className="overview-card">
                    <div className="overview-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}><CheckCircle2 /></div>
                    <div className="overview-details">
                        <h3>{stats.completed}</h3>
                        <p>Completed Visits</p>
                    </div>
                </div>
                <div className="overview-card">
                    <div className="overview-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)' }}><Clock /></div>
                    <div className="overview-details">
                        <h3>{stats.pending}</h3>
                        <p>Waiting Patients</p>
                    </div>
                </div>
                <div className="overview-card">
                    <div className="overview-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)' }}><AlertTriangle /></div>
                    <div className="overview-details">
                        <h3>{stats.emergency}</h3>
                        <p>Emergency Alerts</p>
                    </div>
                </div>
                <div className="overview-card">
                    <div className="overview-icon" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}><FastForward /></div>
                    <div className="overview-details">
                        <h3>{upcomingApts.length}</h3>
                        <p>Total Upcoming</p>
                    </div>
                </div>
            </div>

            <main className="dashboard-main-content">
                <section className="queue-section">
                    <h2><Stethoscope /> Smart Patient Queue</h2>
                    <div className="patient-queue-list">
                        {pendingQueue.length === 0 ? (
                            <div className="empty-queue glass">No patients in queue. Enjoy your break!</div>
                        ) : (
                            pendingQueue.map((apt, index) => (
                                <div key={apt._id} className={`patient-card ${index === 0 ? 'next' : ''} ${apt.isEmergency ? 'emergency' : ''}`}>
                                    <div className="patient-info">
                                        <div className="patient-avatar">{apt.patientId?.name?.charAt(0)}</div>
                                        <div className="patient-meta">
                                            <h4>{index + 1}. {apt.patientId?.name}</h4>
                                            <p>{apt.reason || 'General Checkup'} • {apt.timeSlotId?.startTime}</p>
                                            <span className={`priority-tag priority-${apt.isEmergency ? 'emergency' : 'regular'}`}>
                                                {apt.isEmergency ? 'Emergency' : 'Regular'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="card-actions">
                                        {index === 0 && !isConsulting && (
                                            <button className="action-icon-btn active-start" onClick={() => startConsultation(apt)} title="Start Consultation">
                                                <Play size={18} fill="currentColor" />
                                            </button>
                                        )}
                                        <button className="action-icon-btn" title="Skip Patient"><FastForward size={18} /></button>
                                        <button className="action-icon-btn" title="View History"><History size={18} /></button>
                                        <button className="action-icon-btn" style={{ color: 'var(--error)' }} title="Emergency Priority"><AlertTriangle size={18} /></button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>

                <aside className="tools-sidebar">
                    {isConsulting && (
                        <div className="tool-card consultation-active-panel">
                            <h3><Timer /> Active Consultation</h3>
                            <div className="flex justify-between items-center">
                                <span>{activeAppointment?.patientId?.name}</span>
                                <div className="timer-display">{formatTime(timer)}</div>
                            </div>

                            <div className="transcription-area" id="consultation-notes">
                                {transcript || "Recording consultation notes automatically..."}
                            </div>

                            <div className="flex gap-2 mt-4">
                                <button className={`status-btn ${isListening ? 'active busy' : 'available'}`} onClick={toggleListening} style={{ flex: 1 }}>
                                    {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                                    {isListening ? 'Stop Mic' : 'Start Recording'}
                                </button>
                                <button className="btn btn-primary" onClick={completeConsultation} style={{ flex: 1, borderRadius: '50px' }}>
                                    <Check size={16} /> Complete
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="tool-card">
                        <h3><IndianRupee size={18} /> Daily Earnings</h3>
                        <div className="earnings-stat">
                            <p className="text-xs text-muted">Estimated earnings for today</p>
                            <h2>₹{stats.totalEarnings}</h2>
                        </div>
                    </div >

                    <div className="tool-card">
                        <h3><Activity size={18} /> AI Symptom Insight</h3>
                        <div className="glass p-3 rounded-xl text-sm italic">
                            {pendingQueue[0]?.reason ? (
                                `Patient reports ${pendingQueue[0].reason}. Suggested focus: Vital checks and routine assessment.`
                            ) : "Select a patient to see AI insights."}
                        </div>
                    </div>

                    <div className="tool-card">
                        <h3><FileText size={18} /> Quick Templates</h3>
                        <div className="flex flex-col gap-2">
                            {user.prescriptionTemplates?.length > 0 ? (
                                user.prescriptionTemplates.map((t, idx) => (
                                    <button
                                        key={idx}
                                        className="btn btn-outline btn-sm text-left truncate"
                                        onClick={() => applyTemplate(t)}
                                    >
                                        <Plus size={14} /> {t.title}
                                    </button>
                                ))
                            ) : (
                                <>
                                    <button className="btn btn-outline btn-sm text-left"><Plus size={14} /> Viral Fever Protocol</button>
                                    <button className="btn btn-outline btn-sm text-left"><Plus size={14} /> Hypertension Mgmt</button>
                                </>
                            )}
                        </div>
                    </div>
                </aside>
            </main>

            {/* Medical File Viewer (Inline List) */}
            {activeAppointment?.medicalFiles?.length > 0 && (
                <section className="mt-8 glass p-6 rounded-3xl border-2 border-primary">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><FileText /> Patient Medical Files</h2>
                    <div className="flex gap-4 overflow-x-auto pb-2">
                        {activeAppointment.medicalFiles.map((file, idx) => (
                            <div key={idx} className="glass p-4 rounded-2xl min-w-[200px] flex justify-between items-center">
                                <div>
                                    <p className="text-sm font-bold truncate w-32">{file.name}</p>
                                    <p className="text-xs text-muted">{file.fileType}</p>
                                </div>
                                <button className="action-icon-btn" onClick={() => viewFile(file)}>
                                    <Eye size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            <section className="mt-8 glass p-6 rounded-3xl">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><History /> Patient Health Timeline (Recent)</h2>
                <div className="timeline">
                    <div className="timeline-item">
                        <div className="timeline-content">
                            <h5>Blood Pressure Treatment Started</h5>
                            <p>Oct 2025 • Dr. {user.name}</p>
                        </div>
                    </div>
                    <div className="timeline-item">
                        <div className="timeline-content">
                            <h5>Diabetes Routine Checkup</h5>
                            <p>Aug 2025 • CareSync AI Summary</p>
                        </div>
                    </div>
                    <div className="timeline-item">
                        <div className="timeline-content">
                            <h5>Initial Diagnosis & Lab Reports</h5>
                            <p>Jan 2025 • General Hospital</p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default DoctorDashboard;

