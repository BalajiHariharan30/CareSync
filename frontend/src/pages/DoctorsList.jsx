import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, MapPin, Star, Calendar as CalendarIcon, UserCheck, Clock, AlertCircle, EyeOff } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import './DoctorsList.css';

const DoctorsList = () => {
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const initialSpecialty = queryParams.get('specialization') || '';

    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [specialtyFilter, setSpecialtyFilter] = useState(initialSpecialty);

    useEffect(() => {
        const fetchDoctors = async () => {
            try {
                const { data } = await axios.get('/api/doctors');
                setDoctors(data);
            } catch (error) {
                console.error("Error fetching doctors:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDoctors();
    }, []);

    const filteredDoctors = doctors.filter(doctor => {
        const matchesSearch = doctor.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            doctor.specialization.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesSpecialty = specialtyFilter === '' || doctor.specialization.toLowerCase() === specialtyFilter.toLowerCase();

        return matchesSearch && matchesSpecialty;
    });

    const uniqueSpecialties = [...new Set(doctors.map(d => d.specialization))];

    if (loading) return <div className="loading-state">Loading doctors...</div>;

    return (
        <div className="doctors-container">
            <div className="search-header glass">
                <h1 className="search-title">Find Your Specialist</h1>
                <p className="search-subtitle">Search by name, specialty, or location to find the best care for you.</p>

                <div className="search-controls">
                    <div className="search-input-wrapper">
                        <Search className="search-icon" size={20} />
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Search doctors, specialties..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <select
                        className="specialty-filter"
                        value={specialtyFilter}
                        onChange={(e) => setSpecialtyFilter(e.target.value)}
                    >
                        <option value="">All Specialties</option>
                        {uniqueSpecialties.map((spec, idx) => (
                            <option key={idx} value={spec}>{spec}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="doctors-grid">
                {filteredDoctors.length === 0 ? (
                    <div className="no-results">No doctors found matching your criteria.</div>
                ) : (
                    filteredDoctors.map(doctor => (
                        <div key={doctor._id} className="doctor-card glass">
                            <div className="doctor-card-header">
                                <div className="doctor-avatar">
                                    {doctor.userId?.name?.charAt(0).toUpperCase() || 'D'}
                                </div>
                                <div className="doctor-title-info">
                                    <div className="flex items-center gap-2">
                                        <h3>Dr. {doctor.userId?.name}</h3>
                                        <div className={`status-pill ${doctor.availabilityStatus?.toLowerCase() || 'offline'}`}>
                                            {doctor.availabilityStatus === 'Available' && <UserCheck size={12} />}
                                            {doctor.availabilityStatus === 'Busy' && <Clock size={12} />}
                                            {doctor.availabilityStatus === 'Break' && <AlertCircle size={12} />}
                                            {doctor.availabilityStatus === 'Offline' && <EyeOff size={12} />}
                                            {doctor.availabilityStatus || 'Offline'}
                                        </div>
                                    </div>
                                    <span className="specialty-tag">{doctor.specialization}</span>
                                </div>
                            </div>

                            <div className="doctor-card-body">
                                <div className="info-row">
                                    <MapPin size={16} className="text-muted" />
                                    <span>{doctor.clinicName}, {doctor.clinicAddress}</span>
                                </div>
                                <div className="info-row">
                                    <Star size={16} className="text-warning text-yellow-500" />
                                    <span>{doctor.ratings} Rating • {doctor.experience} Yrs Exp</span>
                                </div>
                                <div className="info-row fee">
                                    <strong>Consultation Fee:</strong> ₹{doctor.consultationFee}
                                </div>
                            </div>

                            <div className="doctor-card-footer">
                                {(doctor.availabilityStatus === 'Busy' || doctor.availabilityStatus === 'Offline') && (
                                    <div className={`availability-warning ${doctor.availabilityStatus === 'Offline' ? 'error' : ''} animate-pulse`}>
                                        <AlertCircle size={14} /> 
                                        {doctor.availabilityStatus === 'Busy' ? 'Currently in consultation' : 'Currently Offline - Booking Disabled'}
                                    </div>
                                )}
                                
                                {doctor.availabilityStatus === 'Offline' ? (
                                    <button className="btn btn-primary w-full btn-disabled" disabled>
                                        <CalendarIcon size={18} /> Booking Unavailable
                                    </button>
                                ) : (
                                    <Link to={`/book/${doctor._id}`} className={`btn btn-primary w-full ${doctor.availabilityStatus === 'Busy' ? 'btn-warning' : ''}`}>
                                        <CalendarIcon size={18} /> Book Appointment
                                    </Link>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default DoctorsList;
