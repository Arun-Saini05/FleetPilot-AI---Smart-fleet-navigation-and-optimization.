import React, { useState, useEffect } from 'react';
import API from '../api/axios';

const Shipments = () => {
    const [shipments, setShipments] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [drivers, setDrivers] = useState([]);

    const [formData, setFormData] = useState({
        title: '',
        origin: '',
        destination: '',
        freight_value: '',
        vehicle_id: '',
        driver_id: '',
    });

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Fetch shipments, alongside active asset dropdown options on load
    const fetchData = async () => {
        try {
            const [shipmentRes, vehicleRes, driverRes] = await Promise.all([
                API.get('/api/shipments'),
                API.get('/api/vehicles'),
                API.get('/api/drivers')
            ]);
            setShipments(shipmentRes.data);
            setVehicles(vehicleRes.data);
            setDrivers(driverRes.data);
        } catch (err) {
            console.error('Shipments fetch error:', err?.response?.status, err?.response?.data);
            const detail = err?.response?.data?.detail || err?.message || 'Unknown error';
            setError(`Failed to fetch logistics routing assets. (${err?.response?.status || 'network'}: ${detail})`);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Parse values to fit backend validation schema
        const payload = {
            title: formData.title,
            origin: formData.origin,
            destination: formData.destination,
            freight_value: parseFloat(formData.freight_value),
            vehicle_id: formData.vehicle_id ? parseInt(formData.vehicle_id) : null,
            driver_id: formData.driver_id ? parseInt(formData.driver_id) : null,
        };

        try {
            await API.post('/api/shipments', payload);
            setSuccess('Shipment order route initiated & allocated successfully!');
            setFormData({ title: '', origin: '', destination: '', freight_value: '', vehicle_id: '', driver_id: '' });
            fetchData(); // Hot reload table context
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to dispatch shipment load.');
        }
    };

    return (
        <div style={{ padding: '1rem', fontFamily: 'sans-serif' }}>
            <h2 style={{ color: '#2d1f10', marginBottom: '0.5rem' }}>Shipment Dispatch Control</h2>
            <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                Manifest cargo routes and securely allocate tenant-authorized equipment and crew configurations.
            </p>

            {error && <div style={{ color: '#dc3545', marginBlock: '0.5rem' }}>⚠️ {error}</div>}
            {success && <div style={{ color: '#28a745', marginBlock: '0.5rem' }}>✅ {success}</div>}

            {/* --- SHIPMENT MANIFEST INTAKE FORM --- */}
            <div style={{ backgroundColor: '#fff', border: '1px solid #e9dfd3', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                <h4 style={{ margin: '0 0 1rem 0', color: '#4a3319' }}>Manifest New Cargo Route</h4>
                <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <input type="text" name="title" placeholder="Cargo Description (e.g. Steel Rods)" value={formData.title} onChange={handleChange} required style={{ padding: '0.6rem', borderRadius: '4px', border: '1px solid #ccc', flex: '1', minWidth: '180px' }} />
                    <input type="text" name="origin" placeholder="Origin Hub" value={formData.origin} onChange={handleChange} required style={{ padding: '0.6rem', borderRadius: '4px', border: '1px solid #ccc', flex: '1', minWidth: '150px' }} />
                    <input type="text" name="destination" placeholder="Destination Target" value={formData.destination} onChange={handleChange} required style={{ padding: '0.6rem', borderRadius: '4px', border: '1px solid #ccc', flex: '1', minWidth: '150px' }} />
                    <input type="number" name="freight_value" placeholder="Freight Valuation ($)" value={formData.freight_value} onChange={handleChange} required style={{ padding: '0.6rem', borderRadius: '4px', border: '1px solid #ccc', flex: '1', minWidth: '120px' }} />

                    {/* DYNAMIC VEHICLE SELECTION */}
                    <select name="vehicle_id" value={formData.vehicle_id} onChange={handleChange} style={{ padding: '0.6rem', borderRadius: '4px', border: '1px solid #ccc', flex: '1', minWidth: '180px' }}>
                        <option value="">-- Assign Fleet Truck (Optional) --</option>
                        {vehicles.map(v => <option key={v.id} value={v.id}>{v.make} {v.model} [{v.plate_number}]</option>)}
                    </select>

                    {/* DYNAMIC DRIVER SELECTION */}
                    <select name="driver_id" value={formData.driver_id} onChange={handleChange} style={{ padding: '0.6rem', borderRadius: '4px', border: '1px solid #ccc', flex: '1', minWidth: '180px' }}>
                        <option value="">-- Assign Driver Crew (Optional) --</option>
                        {drivers.map(d => <option key={d.id} value={d.id}>{d.name} (ID: #{d.id})</option>)}
                    </select>

                    <button type="submit" style={{ backgroundColor: '#5c401b', color: 'white', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                        Dispatch Freight
                    </button>
                </form>
            </div>

            {/* --- SHIPMENT ACTIVE GRID VIEW --- */}
            <div style={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e9dfd3', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#fcfaf7', borderBottom: '2px solid #e9dfd3', color: '#5c401b' }}>
                            <th style={{ padding: '1rem' }}>Manifest ID</th>
                            <th style={{ padding: '1rem' }}>Cargo Load</th>
                            <th style={{ padding: '1rem' }}>Route Pipeline</th>
                            <th style={{ padding: '1rem' }}>Valuation</th>
                            <th style={{ padding: '1rem' }}>Assigned Assets</th>
                            <th style={{ padding: '1rem' }}>Tracking Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {shipments.length === 0 ? (
                            <tr><td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>No cargo logs routed via this dispatch terminal yet.</td></tr>
                        ) : (
                            shipments.map((s) => (
                                <tr key={s.id} style={{ borderBottom: '1px solid #f0e7dc' }}>
                                    <td style={{ padding: '1rem' }}>#TRK-{s.id}</td>
                                    <td style={{ padding: '1rem', fontWeight: 'bold' }}>{s.title}</td>
                                    <td style={{ padding: '1rem' }}><code>{s.origin} ➔ {s.destination}</code></td>
                                    <td style={{ padding: '1rem', color: '#28a745', fontWeight: '500' }}>${s.freight_value.toLocaleString()}</td>
                                    <td style={{ padding: '1rem', fontSize: '0.85rem' }}>
                                        <div>🚛 Truck ID: {s.vehicle_id || '⚠️ Unassigned'}</div>
                                        <div>🪪 Crew ID: {s.driver_id || '⚠️ Unassigned'}</div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{ backgroundColor: '#eef7ff', color: '#007bff', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                                            {s.status}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Shipments;