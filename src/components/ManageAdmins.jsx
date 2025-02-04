import { useState } from "react";
import '../styles/ManageAdmins.css'

const ManageAdmins = () => {

    const [admins, setAdmins] = useState([]);

    const fetchAdmins = async () => {
        // Logic to fetch admins from the database
        try {
            const backend_url=import.meta.env.VITE_BACKEND_URL
            const serverUrl = `${backend_url}/api/admins`;
            const response = await fetch(serverUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            const data = await response.json();
            setAdmins(data);
        } catch (error) {
            console.error('Fetch admins failed:', error);
        }
    };

    return (
        <div className="manage-admins">
            <h2>Admins</h2>
            <button onClick={fetchAdmins}>Load Admins</button>
            <table>
                <thead>
                    <tr>
                        <th>Picture</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Mosque ID</th>
                    </tr>
                </thead>
                <tbody>
                    {admins.map((admin) => (
                        <tr key={admin.email}>
                            <td><img src={admin.profile_pic} alt={admin.name} className="admin-picture" /></td>
                            <td>{admin.name}</td>
                            <td>{admin.email}</td>
                            <td>{admin.mosque_id}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

export default ManageAdmins