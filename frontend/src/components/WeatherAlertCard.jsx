import React from 'react';

export default function WeatherAlertCard({ meteorologicalConditions, predictiveAnalytics }) {
    if (!meteorologicalConditions) return null;

    const { destination_temp, condition } = meteorologicalConditions;
    const { probability_of_delay } = predictiveAnalytics || { probability_of_delay: 0.04 };

    // Calculate danger threshold dynamically
    const isHighRisk = probability_of_delay > 0.10;

    return (
        <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '1.25rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            borderLeft: isHighRisk ? '5px solid #ef4444' : '5px solid #10b981',
            marginTop: '1rem',
            fontFamily: 'sans-serif'
        }}>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', color: '#1f2937', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {isHighRisk ? '⚠️ Weather Delay Warning' : '☀️ En-Route Weather Conditions'}
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
                <div style={{ background: '#f9fafb', padding: '10px', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.75rem', color: '#6b7280', display: 'block', fontWeight: 'bold' }}>DESTINATION TEMP</span>
                    <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111827' }}>{destination_temp}°C</span>
                </div>

                <div style={{ background: '#f9fafb', padding: '10px', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.75rem', color: '#6b7280', display: 'block', fontWeight: 'bold' }}>DELAY RISK SCORE</span>
                    <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: isHighRisk ? '#ef4444' : '#10b981' }}>
                        {(probability_of_delay * 100).toFixed(0)}%
                    </span>
                </div>
            </div>

            <p style={{
                margin: '12px 0 0 0',
                fontSize: '0.9rem',
                color: '#4b5563',
                background: isHighRisk ? '#fef2f2' : '#f0fdf4',
                padding: '8px 12px',
                borderRadius: '6px'
            }}>
                <strong>Status:</strong> {condition}
            </p>
        </div>
    );
}