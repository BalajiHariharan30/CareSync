import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Users, UserPlus, Activity, CheckCircle, AlertTriangle, MessageSquare, Send, Stethoscope, Trash2, Edit3, ToggleLeft, ToggleRight, Eye, X, Plus } from 'lucide-react';
import './Dashboard.css';

const EMPTY_DOC_FORM = {
    name: '', email: '', phone: '', password: 'doctor123',
    specialization: '', qualification: '', experience: '',
    consultationFee: '', clinicName: '', clinicAddress: '',
    workingHoursStart: '09:00', workingHoursEnd: '17:00',
};

const AdminDashboard = () => {
    const { user } = useContext(AuthContext);
    const [activeTab, setActiveTab] = useState('overview');
    const [analytics, setAnalytics] = useState(null);
    const [unapprovedDoctors, setUnapprovedDoctors] = useState([]);
    const [fraudUsers, setFraudUsers] = useState([]);
    const [complaints, setComplaints] = useState([]);
    const [loadMonitor, setLoadMonitor] = useState([]);
    const [broadcastMsg, setBroadcastMsg] = useState('');
    const [broadcastAudience, setBroadcastAudience] = useState('All');
    const [loading, setLoading] = useState(true);
    const [allPatients, setAllPatients] = useState([]);
    const [allAppointments, setAllAppointments] = useState([]);
    const [paymentStats, setPaymentStats] = useState(null);
    const [allReviews, setAllReviews] = useState([]);

    // Doctor Management State
    const [allDoctors, setAllDoctors] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null); // holds doctor id
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [docForm, setDocForm] = useState(EMPTY_DOC_FORM);
    const [docAppointments, setDocAppointments] = useState([]);
    const [showDoctorApts, setShowDoctorApts] = useState(null); // holds doctor object
    const [formError, setFormError] = useState('');

    // Patient Edit state
    const [showEditPatientModal, setShowEditPatientModal] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [patientForm, setPatientForm] = useState({ name: '', email: '', phone: '', status: 'Active' });

    const config = { withCredentials: true };

    useEffect(() => { fetchAdminData(); }, [user]);

    const fetchAdminData = async () => {
        setLoading(true);
        try {
            const [analyticsRes, unapprovedRes, fraudRes, loadRes, complaintsRes, doctorsRes, patientsRes, aptsRes, paymentsRes, reviewsRes] = await Promise.all([
                axios.get('/api/admin/analytics', config),
                axios.get('/api/admin/doctors/unapproved', config),
                axios.get('/api/admin/fraud-detection', config),
                axios.get('/api/admin/ai-load-monitor', config),
                axios.get('/api/admin/complaints', config),
                axios.get('/api/admin/doctors', config),
                axios.get('/api/admin/users', config), // patients
                axios.get('/api/admin/appointments', config),
                axios.get('/api/admin/payments', config),
                axios.get('/api/admin/reviews', config),
            ]);
            setAnalytics(analyticsRes.data);
            setUnapprovedDoctors(unapprovedRes.data);
            setFraudUsers(fraudRes.data);
            setLoadMonitor(loadRes.data.peakHours);
            setComplaints(complaintsRes.data);
            setAllDoctors(doctorsRes.data);
            setAllPatients(patientsRes.data.filter(u => !u.isDoctor && !u.isAdmin));
            setAllAppointments(aptsRes.data);
            setPaymentStats(paymentsRes.data);
            setAllReviews(reviewsRes.data);
        } catch (error) {
            console.error('Error fetching admin data:', error);
        } finally {
            setLoading(false);
        }
    };

    const approveDoctor = async (id) => {
        try {
            await axios.put(`/api/admin/doctors/${id}/approve`, {}, config);
            fetchAdminData();
        } catch (error) { console.error(error); }
    };

    const sendBroadcast = async () => {
        if (!broadcastMsg.trim()) return;
        try {
            await axios.post('/api/admin/broadcast', { message: broadcastMsg, targetAudience: broadcastAudience }, config);
            alert(`Broadcast sent to ${broadcastAudience}!`);
            setBroadcastMsg('');
        } catch (error) { console.error(error); }
    };

    const resolveComplaint = async (id) => {
        try {
            await axios.put(`/api/admin/complaints/${id}/resolve`, { adminResponse: 'Resolved by Admin' }, config);
            fetchAdminData();
        } catch (error) { console.error(error); }
    };

    // Doctor Management handlers
    const handleAddDoctor = async (e) => {
        e.preventDefault();
        setFormError('');
        try {
            await axios.post('/api/admin/doctors', docForm, config);
            setShowAddModal(false);
            setDocForm(EMPTY_DOC_FORM);
            fetchAdminData();
            alert('Doctor added successfully!');
        } catch (err) {
            setFormError(err.response?.data?.message || 'Failed to add doctor');
        }
    };

    const handleEditDoctor = async (e) => {
        e.preventDefault();
        setFormError('');
        try {
            await axios.put(`/api/admin/doctors/${selectedDoctor._id}`, docForm, config);
            setShowEditModal(false);
            setSelectedDoctor(null);
            setDocForm(EMPTY_DOC_FORM);
            fetchAdminData();
            alert('Doctor updated successfully!');
        } catch (err) {
            setFormError(err.response?.data?.message || 'Failed to update doctor');
        }
    };

    const handleToggleStatus = async (id) => {
        try {
            await axios.put(`/api/admin/doctors/${id}/toggle-status`, {}, config);
            fetchAdminData();
        } catch (err) { console.error(err); }
    };

    const handleDeleteDoctor = async (id) => {
        try {
            await axios.delete(`/api/admin/doctors/${id}`, config);
            setShowDeleteConfirm(null);
            fetchAdminData();
            alert('Doctor deleted successfully!');
        } catch (err) { console.error(err); }
    };

    const openEditModal = (doc) => {
        setSelectedDoctor(doc);
        setDocForm({
            name: doc.userId?.name || '',
            email: doc.userId?.email || '',
            phone: doc.userId?.phone || '',
            password: '',
            specialization: doc.specialization || '',
            qualification: doc.qualification || '',
            experience: doc.experience || '',
            consultationFee: doc.consultationFee || '',
            clinicName: doc.clinicName || '',
            clinicAddress: doc.clinicAddress || '',
            workingHoursStart: doc.workingHours?.start || '09:00',
            workingHoursEnd: doc.workingHours?.end || '17:00',
        });
        setShowEditModal(true);
    };

    const openDoctorApts = async (doc) => {
        setShowDoctorApts(doc);
        try {
            const res = await axios.get(`/api/admin/doctors/${doc._id}/appointments`, config);
            setDocAppointments(res.data);
        } catch (err) { console.error(err); }
    };

    // Patient Management handlers
    const openEditPatient = (patient) => {
        setSelectedPatient(patient);
        setPatientForm({ name: patient.name, email: patient.email, phone: patient.phone || '', status: patient.status || 'Active' });
        setShowEditPatientModal(true);
    };

    const handleEditPatient = async (e) => {
        e.preventDefault();
        try {
            await axios.put(`/api/admin/patients/${selectedPatient._id}`, patientForm, config);
            setShowEditPatientModal(false);
            fetchAdminData();
            alert('Patient updated successfully!');
        } catch (err) { alert(err.response?.data?.message || 'Update failed'); }
    };

    const handleDeletePatient = async (id) => {
        if (!window.confirm('Are you sure? This will delete all their appointments too.')) return;
        try {
            await axios.delete(`/api/admin/patients/${id}`, config);
            fetchAdminData();
            alert('Patient deleted');
        } catch (err) { console.error(err); }
    };

    // Appointment handlers
    const handleUpdateAptStatus = async (id, status) => {
        try {
            await axios.patch(`/api/admin/appointments/${id}/status`, { status }, config);
            fetchAdminData();
        } catch (err) { console.error(err); }
    };

    // Review handlers
    const handleDeleteReview = async (id) => {
        if (!window.confirm('Delete this review?')) return;
        try {
            await axios.delete(`/api/admin/reviews/${id}`, config);
            fetchAdminData();
            alert('Review removed');
        } catch (err) { console.error(err); }
    };

    // Report Generation (CSV Export)
    const exportToCSV = (data, filename) => {
        if (!data || data.length === 0) return alert('No data to export');
        const headers = Object.keys(data[0]);
        const csvRows = [
            headers.join(','),
            ...data.map(row => headers.map(header => {
                const val = row[header];
                return `"${typeof val === 'object' ? JSON.stringify(val).replace(/"/g, '""') : val}"`;
            }).join(','))
        ];
        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    if (loading) return <div className="loading-state">Loading Admin Panel...</div>;

    return (
        <div className="dashboard-container">
            <header className="dashboard-header glass">
                <div className="user-profile-info">
                    <div className="avatar-circle" style={{ background: 'var(--danger)' }}>A</div>
                    <div>
                        <h1 className="dashboard-title">Admin Control Panel</h1>
                        <p className="dashboard-subtitle">Manage the entire CareSync platform</p>
                    </div>
                </div>
            </header>

            <div className="dashboard-tabs" style={{ flexWrap: 'wrap' }}>
                {[
                    { key: 'overview', label: 'Overview' },
                    { key: 'doctors', label: 'Doctors' },
                    { key: 'patients', label: 'Patients' },
                    { key: 'appointments', label: 'Appointments' },
                    { key: 'payments', label: 'Payments & Revenue' },
                    { key: 'complaints', label: 'Complaints' },
                    { key: 'reviews', label: 'Feedback' },
                    { key: 'broadcast', label: 'Broadcasts' },
                ].map(tab => (
                    <button key={tab.key} className={`tab-btn ${activeTab === tab.key ? 'active' : ''}`} onClick={() => setActiveTab(tab.key)}>
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="dashboard-grid tab-panel">

                {/* ── OVERVIEW TAB ── */}
                {activeTab === 'overview' && analytics && (
                    <>
                        <div className="stats-cards">
                            {[
                                { icon: <Users size={28} />, label: 'Total Patients', val: analytics.totalUsers, color: 'primary' },
                                { icon: <Stethoscope size={28} />, label: 'Active Doctors', val: analytics.totalDoctors, color: 'success' },
                                { icon: <Activity size={28} />, label: 'Total Appointments', val: analytics.totalAppointments, color: 'secondary' },
                                { icon: <CheckCircle size={28} />, label: 'Completed', val: analytics.completedAppointments, color: 'success' },
                                { icon: <AlertTriangle size={28} />, label: 'Pending Approvals', val: analytics.unapprovedDoctorsCount, color: 'warning' },
                            ].map((s, i) => (
                                <div key={i} className="stat-card glass">
                                    <span className={`stat-icon ${s.color}`}>{s.icon}</span>
                                    <div className="stat-details"><h3>{s.val}</h3><p>{s.label}</p></div>
                                </div>
                            ))}
                        </div>

                        {unapprovedDoctors.length > 0 && (
                            <section className="glass p-6 rounded-[20px]">
                                <h2 className="mb-4 text-xl">⏳ Pending Doctor Approvals</h2>
                                <div className="grid gap-3">
                                    {unapprovedDoctors.map(doc => (
                                        <div key={doc._id} className="record-card">
                                            <div>
                                                <h4 className="font-bold">{doc.userId?.name}</h4>
                                                <p className="text-sm text-gray-500">{doc.specialization} · {doc.userId?.email}</p>
                                            </div>
                                            <button onClick={() => approveDoctor(doc._id)} className="btn btn-primary btn-sm">Approve</button>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        <section className="glass p-6 rounded-[20px]">
                            <h2 className="mb-4 text-xl">📊 AI Appointment Load Monitor</h2>
                            {loadMonitor.length === 0 ? (<p className="text-gray-500">No appointments scheduled today.</p>) : (
                                <div className="grid gap-2">
                                    {loadMonitor.map(h => (
                                        <div key={h._id} className="flex items-center gap-4">
                                            <span className="text-sm text-gray-500 w-20">{h._id}:00 hrs</span>
                                            <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                                                <div className="bg-blue-500 h-3 rounded-full" style={{ width: `${Math.min(h.count * 10, 100)}%` }} />
                                            </div>
                                            <span className="text-sm font-bold">{h.count} apts</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    </>
                )}

                {/* ── DOCTOR MANAGEMENT TAB ── */}
                {activeTab === 'doctors' && (
                    <section className="glass p-6 rounded-[20px]">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold">🩺 Doctor Management</h2>
                            <button className="btn btn-primary flex items-center gap-2" onClick={() => { setDocForm(EMPTY_DOC_FORM); setFormError(''); setShowAddModal(true); }}>
                                <Plus size={18} /> Add New Doctor
                            </button>
                        </div>

                        {allDoctors.length === 0 ? (
                            <p className="text-gray-500">No doctors registered yet.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ background: 'rgba(99,102,241,0.1)', borderRadius: '10px' }}>
                                            {['Doctor Name', 'Specialization', 'Fee', 'Experience', 'Appointments', 'Status', 'Actions'].map(h => (
                                                <th key={h} className="p-3 text-left font-bold text-gray-600">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {allDoctors.map(doc => (
                                            <tr key={doc._id} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                                                <td className="p-3 font-bold">{doc.userId?.name || 'N/A'}</td>
                                                <td className="p-3 text-gray-600">{doc.specialization}</td>
                                                <td className="p-3">₹{doc.consultationFee}</td>
                                                <td className="p-3">{doc.experience} yrs</td>
                                                <td className="p-3">
                                                    <button className="text-blue-500 underline text-xs" onClick={() => openDoctorApts(doc)}>
                                                        {doc.totalAppointments} apts
                                                    </button>
                                                </td>
                                                <td className="p-3">
                                                    <span className={`status-badge ${doc.isApproved ? 'status-confirmed' : 'status-cancelled'}`}>
                                                        {doc.isApproved ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td className="p-3">
                                                    <div className="flex gap-2">
                                                        <button title="Edit" onClick={() => openEditModal(doc)} className="btn btn-outline btn-sm p-1">
                                                            <Edit3 size={15} />
                                                        </button>
                                                        <button title={doc.isApproved ? 'Deactivate' : 'Activate'} onClick={() => handleToggleStatus(doc._id)} className="btn btn-outline btn-sm p-1">
                                                            {doc.isApproved ? <ToggleRight size={15} className="text-green-500" /> : <ToggleLeft size={15} className="text-gray-400" />}
                                                        </button>
                                                        <button title="View Appointments" onClick={() => openDoctorApts(doc)} className="btn btn-outline btn-sm p-1">
                                                            <Eye size={15} />
                                                        </button>
                                                        <button title="Delete" onClick={() => setShowDeleteConfirm(doc._id)} className="btn btn-sm p-1" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid #ef4444' }}>
                                                            <Trash2 size={15} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>
                )}

                {/* ── FRAUD DETECTION TAB ── */}
                {activeTab === 'fraud' && (
                    <section className="glass p-6 rounded-[20px]">
                        <h2 className="mb-4 text-xl">🚨 Fraud Detection — Flagged Users</h2>
                        {fraudUsers.length === 0 ? (<p className="text-gray-500">No flagged users detected.</p>) : (
                            <div className="grid gap-3">
                                {fraudUsers.map((u, i) => (
                                    <div key={i} className="record-card border-l-4 border-red-500">
                                        <div>
                                            <h4 className="font-bold">{u._id?.name || 'Unknown User'}</h4>
                                            <p className="text-sm text-gray-500">{u._id?.email}</p>
                                        </div>
                                        <span className="status-badge status-cancelled">{u.cancelCount} cancellations</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                )}

                {/* ── COMPLAINTS TAB ── */}
                {activeTab === 'complaints' && (
                    <section className="glass p-6 rounded-[20px]">
                        <h2 className="mb-4 text-xl">📋 Patient Complaints</h2>
                        {complaints.length === 0 ? (<p className="text-gray-500">No complaints filed.</p>) : (
                            <div className="grid gap-3">
                                {complaints.map(c => (
                                    <div key={c._id} className="record-card flex-col items-start gap-2">
                                        <div className="flex w-full justify-between">
                                            <h4 className="font-bold">{c.patientId?.name || 'Patient'}</h4>
                                            <span className={`status-badge ${c.status === 'Resolved' ? 'status-confirmed' : 'status-pending'}`}>{c.status}</span>
                                        </div>
                                        <p className="text-sm">{c.message}</p>
                                        {c.status !== 'Resolved' && (
                                            <button onClick={() => resolveComplaint(c._id)} className="btn btn-primary btn-sm mt-1">Mark Resolved</button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                )}

                {/* ── BROADCAST TAB ── */}
                {activeTab === 'broadcast' && (
                    <section className="glass p-6 rounded-[20px]">
                        <h2 className="mb-4 text-xl">📢 Send System Broadcast</h2>
                        <div className="grid gap-4">
                            <select value={broadcastAudience} onChange={e => setBroadcastAudience(e.target.value)} className="form-input">
                                <option>All</option><option>Patients</option><option>Doctors</option>
                            </select>
                            <textarea value={broadcastMsg} onChange={e => setBroadcastMsg(e.target.value)} className="form-input" rows={4} placeholder="Type your message here..." />
                            <button onClick={sendBroadcast} disabled={!broadcastMsg.trim()} className="btn btn-primary flex items-center gap-2 w-fit">
                                <Send size={18} /> Send Broadcast
                            </button>
                        </div>
                    </section>
                )}

                {/* ── PATIENT MANAGEMENT TAB ── */}
                {activeTab === 'patients' && (
                    <section className="glass p-6 rounded-[20px]">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold">👤 Patient Management</h2>
                            <button onClick={() => exportToCSV(allPatients, 'Patients_Report')} className="btn btn-outline btn-sm">Export CSV</button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr style={{ background: 'rgba(99,102,241,0.1)' }}>
                                        <th className="p-3 text-left">Name</th>
                                        <th className="p-3 text-left">Email</th>
                                        <th className="p-3 text-left">Phone</th>
                                        <th className="p-3 text-left">Status</th>
                                        <th className="p-3 text-left">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {allPatients.map(p => (
                                        <tr key={p._id} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                                            <td className="p-3 font-bold">{p.name}</td>
                                            <td className="p-3">{p.email}</td>
                                            <td className="p-3">{p.phone || 'N/A'}</td>
                                            <td className="p-3"><span className={`status-badge ${p.status === 'Active' ? 'status-confirmed' : 'status-cancelled'}`}>{p.status || 'Active'}</span></td>
                                            <td className="p-3">
                                                <div className="flex gap-2">
                                                    <button onClick={() => openEditPatient(p)} className="btn btn-outline btn-sm"><Edit3 size={14}/></button>
                                                    <button onClick={() => handleDeletePatient(p._id)} className="btn btn-sm" style={{color: 'red'}}><Trash2 size={14}/></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}

                {/* ── APPOINTMENTS TAB ── */}
                {activeTab === 'appointments' && (
                    <section className="glass p-6 rounded-[20px]">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold">📅 Global Appointments</h2>
                            <button onClick={() => exportToCSV(allAppointments, 'Appointments_Report')} className="btn btn-outline btn-sm">Export Reports</button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr style={{ background: 'rgba(99,102,241,0.1)' }}>
                                        <th className="p-3 text-left">Patient</th>
                                        <th className="p-3 text-left">Doctor</th>
                                        <th className="p-3 text-left">Date</th>
                                        <th className="p-3 text-left">Status</th>
                                        <th className="p-3 text-left">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {allAppointments.map(a => (
                                        <tr key={a._id} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                                            <td className="p-3">{a.patientId?.name}</td>
                                            <td className="p-3">Dr. {a.doctorId?.userId?.name}</td>
                                            <td className="p-3">{new Date(a.date).toLocaleDateString()}</td>
                                            <td className="p-3"><span className={`status-badge status-${a.status.toLowerCase()}`}>{a.status}</span></td>
                                            <td className="p-3">
                                                <select className="form-input text-xs" style={{padding: '2px'}} value={a.status} onChange={(e) => handleUpdateAptStatus(a._id, e.target.value)}>
                                                    <option>Pending</option><option>Confirmed</option><option>Completed</option><option>Cancelled</option>
                                                </select>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}

                {/* ── PAYMENTS TAB ── */}
                {activeTab === 'payments' && paymentStats && (
                    <section className="glass p-6 rounded-[20px]">
                        <h2 className="text-xl font-bold mb-6">💰 Payment Tracking</h2>
                        <div className="stats-cards mb-6">
                            <div className="stat-card glass">
                                <span className="stat-icon success"><Activity size={28}/></span>
                                <div className="stat-details"><h3>₹{paymentStats.totalRevenue}</h3><p>Total Revenue</p></div>
                            </div>
                            <div className="stat-card glass">
                                <span className="stat-icon primary"><CheckCircle size={28}/></span>
                                <div className="stat-details"><h3>{paymentStats.transactionCount}</h3><p>Completed Transactions</p></div>
                            </div>
                        </div>
                        <h3 className="text-lg font-bold mb-4">Doctor Performance & Fees</h3>
                        <div className="grid gap-3">
                            {paymentStats.doctorEarnings.map((d, i) => (
                                <div key={i} className="record-card">
                                    <div>
                                        <h4 className="font-bold">Doctor ID: {d._id}</h4>
                                        <p className="text-sm text-gray-500">Appointments Completed: {d.total}</p>
                                    </div>
                                    <button onClick={() => exportToCSV(paymentStats.doctorEarnings, 'Revenue_By_Doctor')} className="btn btn-outline btn-sm">Report</button>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* ── REVIEWS TAB ── */}
                {activeTab === 'reviews' && (
                    <section className="glass p-6 rounded-[20px]">
                        <h2 className="text-xl font-bold mb-6">⭐ Patient Feedback Moderation</h2>
                        <div className="grid gap-4">
                            {allReviews.map(r => (
                                <div key={r._id} className="record-card flex-col items-start gap-2">
                                    <div className="flex w-full justify-between">
                                        <h4 className="font-bold">{r.patientId?.name}</h4>
                                        <div className="flex gap-1 text-yellow-500">
                                            {[...Array(r.rating)].map((_, i) => <Star key={i} size={14} fill="currentColor"/>)}
                                        </div>
                                    </div>
                                    <p className="text-sm">To: <strong>Dr. {r.doctorId?.userId?.name}</strong></p>
                                    <p className="text-gray-600 bg-gray-50 p-2 rounded italic text-sm w-full">"{r.comment}"</p>
                                    <button onClick={() => handleDeleteReview(r._id)} className="btn btn-sm mt-3" style={{color: 'red'}}><Trash2 size={16}/> Delete Review</button>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </div>

            {/* ── ADD DOCTOR MODAL ── */}
            {showAddModal && (
                <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="modal-content glass" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold">Add New Doctor</h3>
                            <button onClick={() => setShowAddModal(false)}><X size={20} /></button>
                        </div>
                        {formError && <div className="auth-error mb-4">{formError}</div>}
                        <form onSubmit={handleAddDoctor} className="grid grid-cols-2 gap-3">
                            <DoctorFormFields form={docForm} setForm={setDocForm} isNew />
                            <div className="col-span-2 flex gap-3 mt-2">
                                <button type="submit" className="btn btn-primary flex-1">Add Doctor</button>
                                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-outline flex-1">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── EDIT DOCTOR MODAL ── */}
            {showEditModal && selectedDoctor && (
                <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
                    <div className="modal-content glass" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold">Edit Doctor</h3>
                            <button onClick={() => setShowEditModal(false)}><X size={20} /></button>
                        </div>
                        {formError && <div className="auth-error mb-4">{formError}</div>}
                        <form onSubmit={handleEditDoctor} className="grid grid-cols-2 gap-3">
                            <DoctorFormFields form={docForm} setForm={setDocForm} />
                            <div className="col-span-2 flex gap-3 mt-2">
                                <button type="submit" className="btn btn-primary flex-1">Save Changes</button>
                                <button type="button" onClick={() => setShowEditModal(false)} className="btn btn-outline flex-1">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── EDIT PATIENT MODAL ── */}
            {showEditPatientModal && selectedPatient && (
                <div className="modal-overlay" onClick={() => setShowEditPatientModal(false)}>
                    <div className="modal-content glass" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold">Edit Patient</h3>
                            <button onClick={() => setShowEditPatientModal(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleEditPatient} className="grid gap-4">
                            <div>
                                <label className="form-label">Full Name</label>
                                <input className="form-input" value={patientForm.name} onChange={e => setPatientForm({...patientForm, name: e.target.value})} />
                            </div>
                            <div>
                                <label className="form-label">Email</label>
                                <input className="form-input" value={patientForm.email} onChange={e => setPatientForm({...patientForm, email: e.target.value})} />
                            </div>
                            <div>
                                <label className="form-label">Phone</label>
                                <input className="form-input" value={patientForm.phone} onChange={e => setPatientForm({...patientForm, phone: e.target.value})} />
                            </div>
                            <div>
                                <label className="form-label">Account Status</label>
                                <select className="form-input" value={patientForm.status} onChange={e => setPatientForm({...patientForm, status: e.target.value})}>
                                    <option>Active</option>
                                    <option>Suspended</option>
                                </select>
                            </div>
                            <div className="flex gap-3 mt-4">
                                <button type="submit" className="btn btn-primary flex-1">Save Changes</button>
                                <button type="button" onClick={() => setShowEditPatientModal(false)} className="btn btn-outline flex-1">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── DELETE CONFIRMATION ── */}
            {showDeleteConfirm && (
                <div className="modal-overlay" onClick={() => setShowDeleteConfirm(null)}>
                    <div className="modal-content glass" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold mb-3">⚠️ Confirm Delete</h3>
                        <p className="text-gray-600 mb-6">Are you sure you want to permanently delete this doctor? This action cannot be undone.</p>
                        <div className="flex gap-3">
                            <button onClick={() => handleDeleteDoctor(showDeleteConfirm)} className="btn flex-1" style={{ background: '#ef4444', color: 'white' }}>Yes, Delete</button>
                            <button onClick={() => setShowDeleteConfirm(null)} className="btn btn-outline flex-1">Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── DOCTOR APPOINTMENTS MODAL ── */}
            {showDoctorApts && (
                <div className="modal-overlay" onClick={() => setShowDoctorApts(null)}>
                    <div className="modal-content glass" style={{ maxWidth: '700px' }} onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold">Appointments — {showDoctorApts.userId?.name}</h3>
                            <button onClick={() => setShowDoctorApts(null)}><X size={20} /></button>
                        </div>
                        {docAppointments.length === 0 ? (
                            <p className="text-gray-500">No appointments found.</p>
                        ) : (
                            <div className="grid gap-2 max-h-80 overflow-y-auto">
                                {docAppointments.map(apt => (
                                    <div key={apt._id} className="record-card">
                                        <div>
                                            <h4 className="font-bold">{apt.patientId?.name || 'Patient'}</h4>
                                            <p className="text-sm text-gray-500">{new Date(apt.date).toLocaleDateString()}</p>
                                        </div>
                                        <span className={`status-badge status-${apt.status?.toLowerCase()}`}>{apt.status}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// Reusable form fields component
const DoctorFormFields = ({ form, setForm, isNew }) => {
    const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));
    return (
        <>
            <div className="col-span-2"><label className="form-label">Full Name *</label><input className="form-input" required value={form.name} onChange={set('name')} placeholder="Dr. John Doe" /></div>
            <div><label className="form-label">Email *</label><input className="form-input" type="email" required value={form.email} onChange={set('email')} placeholder="doctor@email.com" disabled={!isNew} /></div>
            <div><label className="form-label">Phone</label><input className="form-input" value={form.phone} onChange={set('phone')} placeholder="9876543210" /></div>
            {isNew && <div className="col-span-2"><label className="form-label">Password (default: doctor123)</label><input className="form-input" value={form.password} onChange={set('password')} placeholder="doctor123" /></div>}
            <div><label className="form-label">Specialization *</label><input className="form-input" required value={form.specialization} onChange={set('specialization')} placeholder="Cardiologist" /></div>
            <div><label className="form-label">Qualification *</label><input className="form-input" required value={form.qualification} onChange={set('qualification')} placeholder="MBBS, MD" /></div>
            <div><label className="form-label">Experience (years) *</label><input className="form-input" type="number" required value={form.experience} onChange={set('experience')} placeholder="5" /></div>
            <div><label className="form-label">Consultation Fee (₹) *</label><input className="form-input" type="number" required value={form.consultationFee} onChange={set('consultationFee')} placeholder="500" /></div>
            <div><label className="form-label">Clinic Name</label><input className="form-input" value={form.clinicName} onChange={set('clinicName')} placeholder="City Hospital" /></div>
            <div><label className="form-label">Clinic Address</label><input className="form-input" value={form.clinicAddress} onChange={set('clinicAddress')} placeholder="MG Road, Bangalore" /></div>
            <div><label className="form-label">Working Hours Start</label><input className="form-input" type="time" value={form.workingHoursStart} onChange={set('workingHoursStart')} /></div>
            <div><label className="form-label">Working Hours End</label><input className="form-input" type="time" value={form.workingHoursEnd} onChange={set('workingHoursEnd')} /></div>
        </>
    );
};

export default AdminDashboard;
