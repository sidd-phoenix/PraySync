import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useView } from '../contexts/ViewContext';
import '../styles/Dashboard.css';

const Dashboard = () => {
    const { userRole } = useAuth();
    const { setView } = useView();

    // Fetch data based on user role
    useEffect(() => {
        // Fetch data logic here
    }, [userRole]);

    if (userRole === 'viewer') return null;


    return (
        <div className="dashboard">
            {userRole === 'manager' && (
                <div className="manager-controls">
                    <button className="dashboard-btn" onClick={() => setView('home')}>Home</button>
                    <button className="dashboard-btn" onClick={() => setView('addMosque')}>Add New Mosque</button>
                    <button className="dashboard-btn" onClick={() => setView('manageAdmins')}>Manage Admins</button>
                </div>
            )}

            {userRole === 'admin' && (
                <div className="admin-controls">
                    <button className="dashboard-btn" onClick={() => setView('home')}>Home</button>
                    <button className="dashboard-btn" onClick={() => setView('salah_mod')}>Salah Modification</button>
                    {/* Add admin controls here if needed */}
                </div>
            )}
        </div>
    );
};

export default Dashboard; 