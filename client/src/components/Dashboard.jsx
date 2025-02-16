import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useView } from '../contexts/ViewContext';
import '../styles/Dashboard.css';
import { IoIosPeople } from 'react-icons/io';
import { IoHome } from 'react-icons/io5';
import { FaMosque } from 'react-icons/fa6';
import { LuClock } from 'react-icons/lu';

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
                <div className="sidebar">
                    <button className="dashboard-btn" onClick={() => setView('home')}><IoHome /></button>
                    <button className="dashboard-btn" onClick={() => setView('addMosque')}><FaMosque /></button>
                    <button className="dashboard-btn" onClick={() => setView('manageAdmins')}><IoIosPeople /></button>
                </div>
            )}

            {userRole === 'admin' && (
                <div className="sidebar">
                    <button className="dashboard-btn" onClick={() => setView('home')}><IoHome /></button>
                    <button className="dashboard-btn" onClick={() => setView('salah_mod')}><LuClock /></button>
                    {/* Add admin controls here if needed */}
                </div>
            )}
        </div>
    );
};

export default Dashboard; 