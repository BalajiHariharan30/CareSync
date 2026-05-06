import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Calendar as CalendarIcon, Clock, MapPin, User, ChevronLeft, AlertCircle } from 'lucide-react';
import PaymentMock from '../components/PaymentMock';
import DoctorHeatmap from '../components/DoctorHeatmap';
import './Booking.css';

const Booking = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);

    const [doctor, setDoctor] = useState(null);
    const [timeSlots, setTimeSlots] = useState([]);
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [reason, setReason] = useState('');
    const [isEmergency, setIsEmergency] = useState(false);
    const [loading, setLoading] = useState(true);
    const [booking, setBooking] = useState(false);
    const [showPayment, setShowPayment] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('Offline'); // Default to Pay at Doctor
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchDoctor = async () => {
            try {
                const { data } = await axios.get(`/api/doctors/${id}`);
                setDoctor(data);

                // Set today as default date
                const today = new Date().toISOString().split('T')[0];
                setSelectedDate(today);
            } catch (error) {
                console.error("Error fetching doctor:", error);
                setError('Doctor not found');
            } finally {
                setLoading(false);
            }
        };
        fetchDoctor();
    }, [id]);

    useEffect(() => {
        const fetchSlots = async () => {
            if (!selectedDate) return;
            try {
                const { data } = await axios.get(`/api/doctors/${id}/timeslots?date=${selectedDate}`);
                setTimeSlots(data);
                setSelectedSlot(null); // Reset slot selection when date changes
            } catch (error) {
                console.error("Error fetching slots:", error);
            }
        };
        fetchSlots();
    }, [id, selectedDate]);

    const handleBooking = async (e) => {
        e.preventDefault();

        if (!user) {
            navigate('/login');
            return;
        }

        if (!selectedSlot) {
            setError('Please select a time slot.');
            return;
        }

        setError('');

        if (paymentMethod === 'Online') {
            setShowPayment(true);
        } else {
            // Confirm immediately for Pay at Doctor
            processBookingAPI('Offline', 'Pending');
        }
    };

    const processBookingAPI = async (method = 'Online', status = 'Completed') => {
        setBooking(true);
        setShowPayment(false);

        try {
            const config = { withCredentials: true };
            await axios.post('/api/appointments', {
                doctorId: id,
                timeSlotId: selectedSlot._id,
                date: selectedDate,
                reason,
                isEmergency,
                paymentMethod: method,
                paymentStatus: status
            }, config);

            navigate('/patient-dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to book appointment');
            setBooking(false);
        }
    };

    if (loading) return <div className="loading-state">Loading booking interface...</div>;
    if (!doctor) return <div className="error-state">{error}</div>;

    return (
        <div className="booking-container">
            <button className="back-btn" onClick={() => navigate('/doctors')}>
                <ChevronLeft size={20} /> Back to Doctors
            </button>

            <div className="booking-content">
                {/* Doctor Info Panel */}
                <div className="doctor-profile-panel glass">
                    <div className="doctor-avatar large">
                        {doctor.userId?.name?.charAt(0).toUpperCase()}
                    </div>
                    <h1 className="doctor-name">Dr. {doctor.userId?.name}</h1>
                    <span className="specialty-tag large-tag">{doctor.specialization}</span>

                    <div className="doctor-stats mt-4">
                        <div className="stat-item">
                            <strong>{doctor.experience}</strong>
                            <span>Years Exp.</span>
                        </div>
                        <div className="stat-item">
                            <strong>{doctor.ratings} <StarIcon /></strong>
                            <span>Rating</span>
                        </div>
                    </div>

                    <div className="doctor-details list mt-4">
                        <div className="detail-row">
                            <MapPin size={20} className="primary" />
                            <div>
                                <strong>Clinic</strong>
                                <p>{doctor.clinicName}, {doctor.clinicAddress}</p>
                            </div>
                        </div>
                        <div className="detail-row">
                            <User size={20} className="primary" />
                            <div>
                                <strong>Qualification</strong>
                                <p>{doctor.qualification}</p>
                            </div>
                        </div>
                        <div className="detail-row highlight-fee">
                            <strong>Consultation Fee:</strong>
                            <span className="fee-amount">₹{doctor.consultationFee}</span>
                        </div>
                    </div>
                </div>

                {/* Booking Form Panel */}
                <div className="booking-form-panel glass">
                    <h2>Book Appointment</h2>
                    <p className="subtitle">Select a date and time to schedule your visit.</p>

                    {error && <div className="error-alert">{error}</div>}

                    <form onSubmit={handleBooking} className="booking-form">
                        <div className="form-group">
                            <label className="form-label">
                                <CalendarIcon size={18} /> Select Date and View Availability
                            </label>
                            {doctor && (
                                <DoctorHeatmap
                                    doctorId={doctor._id}
                                    selectedDate={selectedDate}
                                    onDateSelect={setSelectedDate}
                                />
                            )}
                            <input
                                type="date"
                                className="form-input date-input mt-2"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                                required
                            />
                        </div>

                        <div className="form-group time-slots-group">
                            <label className="form-label">
                                <Clock size={18} /> Available Time Slots
                            </label>
                            <div className="slots-grid">
                                {timeSlots.length === 0 ? (
                                    <div className="no-slots">No slots available for this date.</div>
                                ) : (
                                    timeSlots.map(slot => (
                                        <div
                                            key={slot._id}
                                            className={`slot-item ${selectedSlot?._id === slot._id ? 'selected' : ''}`}
                                            onClick={() => setSelectedSlot(slot)}
                                        >
                                            {slot.startTime} - {slot.endTime}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Reason for Visit (Optional)</label>
                            <textarea
                                className="form-input text-area"
                                rows="3"
                                placeholder="Describe your symptoms or reason for visit..."
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                            ></textarea>
                        </div>

                        <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                            <input
                                type="checkbox"
                                id="emergencyCheck"
                                checked={isEmergency}
                                onChange={(e) => setIsEmergency(e.target.checked)}
                                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                            />
                            <label htmlFor="emergencyCheck" style={{ color: '#ef4444', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', margin: 0 }}>
                                Request Emergency/Priority Booking
                            </label>
                        </div>

                        <div className="form-group mb-6">
                            <label className="form-label">Select Payment Method</label>
                            <div className="payment-options-grid">
                                <div
                                    className={`payment-option-card ${paymentMethod === 'Offline' ? 'active' : ''}`}
                                    onClick={() => setPaymentMethod('Offline')}
                                >
                                    <div className="option-icon">🏥</div>
                                    <div className="option-info">
                                        <strong>Pay at Doctor</strong>
                                        <span>Confirm now, pay at clinic</span>
                                    </div>
                                    <div className="option-radio"></div>
                                </div>
                                <div
                                    className={`payment-option-card ${paymentMethod === 'Online' ? 'active' : ''}`}
                                    onClick={() => setPaymentMethod('Online')}
                                >
                                    <div className="option-icon">📱</div>
                                    <div className="option-info">
                                        <strong>Online Payment</strong>
                                        <span>Instant confirmation via GPay</span>
                                    </div>
                                    <div className="option-radio"></div>
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary submit-booking"
                            disabled={booking || !selectedSlot}
                        >
                            {booking ? 'Confirming...' : (paymentMethod === 'Online' ? 'Proceed to Payment' : 'Confirm Booking')}
                        </button>
                    </form>
                </div>
            </div>

            {showPayment && (
                <PaymentMock
                    amount={doctor.consultationFee}
                    onPaymentSuccess={processBookingAPI}
                    onCancel={() => setShowPayment(false)}
                />
            )}
        </div>
    );
};

// Simple star icon for ratings
const StarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#eab308" stroke="#eab308" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
    </svg>
);

export default Booking;
