import { useState, useEffect } from 'react';
import { Video, Mic, MicOff, VideoOff, PhoneOff, MonitorUp } from 'lucide-react';
import './Telemedicine.css';

const Telemedicine = ({ doctorName, onEndCall }) => {
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [timeElapsed, setTimeElapsed] = useState(0);

    // Call timer
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeElapsed(prev => prev + 1);
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    return (
        <div className="telemedicine-overlay">
            <div className="video-container">
                {/* Doctor's Video (Main View) */}
                <div className="main-video-view glass">
                    <img
                        src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=2070&auto=format&fit=crop"
                        alt="Doctor Video Stream"
                        className="video-stream"
                    />
                    <div className="video-overlay-info">
                        <span className="participant-name">Dr. {doctorName || 'Specialist'}</span>
                        <div className="call-status">
                            <div className="live-indicator"></div>
                            {formatTime(timeElapsed)}
                        </div>
                    </div>
                </div>

                {/* Patient's Video (PiP) */}
                <div className="pip-video-view glass">
                    {isVideoOff ? (
                        <div className="pip-fallback">
                            <User size={40} />
                        </div>
                    ) : (
                        <img
                            src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1976&auto=format&fit=crop"
                            alt="Your Video Stream"
                            className="video-stream"
                        />
                    )}
                    <span className="pip-name">You</span>
                </div>

                {/* Call Controls */}
                <div className="call-controls glass">
                    <button
                        className={`control-btn ${isMuted ? 'danger' : ''}`}
                        onClick={() => setIsMuted(!isMuted)}
                        title={isMuted ? "Unmute" : "Mute"}
                    >
                        {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
                    </button>

                    <button
                        className={`control-btn ${isVideoOff ? 'danger' : ''}`}
                        onClick={() => setIsVideoOff(!isVideoOff)}
                        title={isVideoOff ? "Turn Video On" : "Turn Video Off"}
                    >
                        {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
                    </button>

                    <button
                        className="control-btn"
                        title="Share Screen"
                    >
                        <MonitorUp size={24} />
                    </button>

                    <button
                        className="control-btn end-call"
                        onClick={onEndCall}
                        title="End Call"
                    >
                        <PhoneOff size={24} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Telemedicine;
