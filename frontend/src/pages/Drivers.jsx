import React, { useState, useEffect } from 'react';
import API from '../api/axios';

const Drivers = () => {
    const [drivers, setDrivers] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        license_number: '',
        phone: '',
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // 1. Fetch tenant-isolated drivers list
    const fetchDrivers = async () => {
        try {
            const response = await API.get('/api/drivers');
            setDrivers(response.data);
        } catch (err) {
            setError('Failed to pull corporate crew profiles.');
        }
    };

    useEffect(() => {
        fetchDrivers();
    }, []);

    // 2. Form state management
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // 3. Register fresh driver context
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        try {
            await API.post('/api/drivers', formData);
            setSuccess('Operator successfully added to tenant profile!');
            setFormData({ name: '', license_number: '', phone: '' });
            fetchDrivers(); // Hot-reload table view
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to authorize driver credential.');
        }
    };

    return (
        <div style={{ padding: '1rem', fontFamily: 'sans-serif' }}>
            <h2 style={{ color: '#2d1f10', marginBottom: '0.5rem' }}>Driver Registry</h2>
            <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                Manage registered operators bound strictly to your corporate transport license context.
            </p>

            {/* Alerts */}
            {error && <div style={{ color: '#dc3545', marginBlock: '0.5rem' }}>⚠️ {error}</div>}
            {success && <div style={{ color: '#28a745', marginBlock: '0.5rem' }}>✅ {success}</div>}

            {/* --- DRIVER INTAKE PANELS --- */}
            <div style={{ backgroundColor: '#fff', border: '1px solid #e9dfd3', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                <h4 style={{ margin: '0 0 1rem 0', color: '#4a3319' }}>Onboard New Operator</h4>
                <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <input
                        type="text" name="name" placeholder="Full Operator Name"
                        value={formData.name} onChange={handleChange} required
                        style={{ padding: '0.6rem', borderRadius: '4px', border: '1px solid #ccc', flex: '1', minWidth: '200px' }}
                    />
                    <input
                        type="text" name="license_number" placeholder="Commercial DL Number"
                        value={formData.license_number} onChange={handleChange} required
                        style={{ padding: '0.6rem', borderRadius: '4px', border: '1px solid #ccc', flex: '1', minWidth: '200px' }}
                    />
                    <input
                        type="text" name="phone" placeholder="Mobile Contact"
                        value={formData.phone} onChange={handleChange} required
                        style={{ padding: '0.6rem', borderRadius: '4px', border: '1px solid #ccc', flex: '1', minWidth: '200px' }}
                    />
                    <button type="submit" style={{ backgroundColor: '#5c401b', color: 'white', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                        Save Profile
                    </button>
                </form>
            </div>

            {/* --- ACTIVE REGISTRY TABLE --- */}
            <div style={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e9dfd3', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#fcfaf7', borderBottom: '2px solid #e9dfd3', color: '#5c401b' }}>
                            <th style={{ padding: '1rem' }}>Operator ID</th>
                            <th style={{ padding: '1rem' }}>Name</th>
                            <th style={{ padding: '1rem' }}>DL Number</th>
                            <th style={{ padding: '1rem' }}>Contact</th>
                            <th style={{ padding: '1rem' }}>Tenant Reference</th>
                        </tr>
                    </thead>
                    <tbody>
                        {drivers.length === 0 ? (
                            <tr>
                                <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>
                                    No vehicle operators assigned to this dispatcher hub yet.
                                </td>
                            </tr>
                        ) : (
                            drivers.map((driver) => (
                                <tr key={driver.id} style={{ borderBottom: '1px solid #f0e7dc' }}>
                                    <td style={{ padding: '1rem' }}>#{driver.id}</td>
                                    <td style={{ padding: '1rem', fontWeight: 'bold' }}>{driver.name}</td>
                                    <td style={{ padding: '1rem' }}><code>{driver.license_number}</code></td>
                                    <td style={{ padding: '1rem' }}>{driver.phone}</td>
                                    <td style={{ padding: '1rem', color: '#888', fontSize: '0.85rem' }}>Company Code: {driver.company_id}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Drivers;