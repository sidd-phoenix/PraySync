import { useState } from 'react';
import '../styles/AddMosqueForm.css'

const AddMosqueForm = () => {

    const [newMosque, setNewMosque] = useState({});
    const backend_url=import.meta.env.VITE_BACKEND_URL;

    const handleAddMosque = async (e) => {
        e.preventDefault();
        console.log('Adding mosque:', newMosque);
        
        try {
            const response = await fetch(`${backend_url}/api/mosques`, { // Update the endpoint as needed
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newMosque),
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();
            console.log('Mosque added successfully:', data);
            alert('Mosque added successfully');
            // Optionally, reset the form or handle success
        } catch (error) {
            console.error('Error adding mosque:', error);
            alert('Error adding mosque');
        }
    };


    return (
        <form onSubmit={handleAddMosque} className="add-mosque-form">
            <div className="form-section grid-section">
                <div className="form-group mosque-name">
                    <label>
                        Mosque Name <span className="required">*</span>
                    </label>
                    <input
                        type="text"
                        required
                        onChange={(e) => setNewMosque({ ...newMosque, name: e.target.value })}
                        placeholder="Enter mosque name"
                        className="form-input"
                    />
                </div>
                <div className="form-group email">
                    <label>
                        Admin Email <span className="required">*</span>
                    </label>
                    <input
                        type="email"
                        required
                        onChange={(e) => setNewMosque({ ...newMosque, admin_email: e.target.value })}
                        placeholder="Enter admin email"
                        className="form-input"
                    />
                </div>
            </div>

            <div className="form-section grid-section">
                <div className="form-group address-large">
                    <label>
                        Address Line 1 <span className="required">*</span>
                    </label>
                    <input
                        type="text"
                        required
                        onChange={(e) => setNewMosque({ ...newMosque, address_line_1: e.target.value })}
                        placeholder="Enter address line 1"
                        className="form-input"
                    />
                </div>
                <div className="form-group address-large">
                    <label>
                        Address Line 2 <span className="required">*</span>
                    </label>
                    <input
                        type="text"
                        required
                        onChange={(e) => setNewMosque({ ...newMosque, address_line_2: e.target.value })}
                        placeholder="Enter address line 2"
                        className="form-input"
                    />
                </div>
                <div className="form-group address-small">
                    <label>
                        Postal Code <span className="required">*</span>
                    </label>
                    <input
                        type="text"
                        required
                        onChange={(e) => setNewMosque({ ...newMosque, postal_code: e.target.value })}
                        placeholder="Enter postal code"
                        className="form-input"
                    />
                </div>
                <div className="form-group address-small">
                    <label>
                        City <span className="required">*</span>
                    </label>
                    <input
                        type="text"
                        required
                        onChange={(e) => setNewMosque({ ...newMosque, city: e.target.value })}
                        placeholder="Enter city"
                        className="form-input"
                    />
                </div>
                <div className="form-group address-small">
                    <label>
                        State <span className="required">*</span>
                    </label>
                    <input
                        type="text"
                        required
                        onChange={(e) => setNewMosque({ ...newMosque, state: e.target.value })}
                        placeholder="Enter state"
                        className="form-input"
                    />
                </div>
                <div className="form-group address-small">
                    <label>
                        Country <span className="required">*</span>
                    </label>
                    <input
                        type="text"
                        required
                        onChange={(e) => setNewMosque({ ...newMosque, country: e.target.value })}
                        placeholder="Enter country"
                        className="form-input"
                    />
                </div>
            </div>

            <div className="form-section grid-section">
                <div className="form-group map-small">
                    <label>
                        Longitude (Optional)
                    </label>
                    <input
                        type="text"
                        onChange={(e) => setNewMosque({ ...newMosque, longitude: e.target.value })}
                        placeholder="Enter longitude"
                        className="form-input"
                    />
                </div>
                <div className="form-group map-small">
                    <label>
                        Latitude (Optional)
                    </label>
                    <input
                        type="text"
                        onChange={(e) => setNewMosque({ ...newMosque, latitude: e.target.value })}
                        placeholder="Enter latitude"
                        className="form-input"
                    />
                </div>
            </div>

            <button type="submit" className="submit-button">Add Mosque</button>
        </form>
    )
}

export default AddMosqueForm