import { useState, useEffect } from 'react';
import axios from 'axios';

const DoctorHeatmap = ({ doctorId, selectedDate, onDateSelect }) => {
    const [heatmapData, setHeatmapData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHeatmap = async () => {
            try {
                const { data } = await axios.get(`/api/doctors/${doctorId}/heatmap`);
                setHeatmapData(data);
            } catch (error) {
                console.error("Failed to load doctor heatmap", error);
            } finally {
                setLoading(false);
            }
        };

        if (doctorId) {
            fetchHeatmap();
        }
    }, [doctorId]);

    if (loading) return <div className="text-sm text-gray-500">Loading availability...</div>;

    // We'll generate a simple horizontal row of upcoming 7 days
    const upcomingDays = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() + i);
        return d.toISOString().split('T')[0];
    });

    return (
        <div className="heatmap-calendar" style={{ display: 'flex', gap: '8px', overflowX: 'auto', padding: '10px 0' }}>
            {upcomingDays.map(dateStr => {
                const dataForDate = heatmapData.find(d => d.date === dateStr);
                const ratio = dataForDate ? dataForDate.availabilityRatio : 0;

                // Color scaling: Red (busy/full) to Green (free)
                let bgColor = '#ef4444'; // default fully booked / no slots
                let tooltipText = 'No slots available';

                if (dataForDate && dataForDate.total > 0) {
                    if (ratio > 0.6) {
                        bgColor = '#22c55e'; // mostly free
                        tooltipText = 'High availability';
                    } else if (ratio > 0.2) {
                        bgColor = '#eab308'; // partial
                        tooltipText = 'Limited availability';
                    } else {
                        bgColor = '#f97316'; // mostly booked
                        tooltipText = 'Almost full';
                    }
                }

                const d = new Date(dateStr);
                const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
                const dayNum = d.getDate();

                return (
                    <div
                        key={dateStr}
                        onClick={() => onDateSelect(dateStr)}
                        style={{
                            minWidth: '60px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            padding: '8px',
                            borderRadius: '8px',
                            border: selectedDate === dateStr ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
                            backgroundColor: selectedDate === dateStr ? 'rgba(37,99,235,0.1)' : 'transparent',
                            cursor: 'pointer',
                            opacity: (dataForDate && dataForDate.total > 0) ? 1 : 0.5
                        }}
                        title={tooltipText}
                    >
                        <span style={{ fontSize: '0.8rem', color: 'var(--light-text)' }}>{dayName}</span>
                        <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{dayNum}</span>
                        <div style={{
                            width: '100%',
                            height: '6px',
                            borderRadius: '3px',
                            backgroundColor: bgColor,
                            marginTop: '4px'
                        }}></div>
                    </div>
                );
            })}
        </div>
    );
};

export default DoctorHeatmap;
