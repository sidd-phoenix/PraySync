import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext'; // Import the useAuth hook
import '../styles/SalahMod.css'; // Ensure to import the CSS file

const SalahMod = () => {
  const [times, setTimes] = useState({
    fajr: { adhan: '', salah: '' },
    dhuhr: { adhan: '', salah: '' },
    asr: { adhan: '', salah: '' },
    maghrib: { adhan: '', salah: '' },
    isha: { adhan: '', salah: '' },
  });

  
  const [originalTimes, setOriginalTimes] = useState(null); // Store original times
  const { currentUser } = useAuth(); // Get currentUser from useAuth
  const adminEmail = currentUser?.email;
  
  useEffect(() => {
    const fetchPrayerTimes = async () => {
      if (!adminEmail) return;
      
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/prayer-times?admin_email=${adminEmail}`);
        if (!response.ok) {
          throw new Error('Failed to fetch prayer times');
        }
        const data = await response.json();
        
        if (data.length !== 0) {
          const newTimes = {};
          data.forEach((prayer) => {
            newTimes[prayer.salah_name.toLowerCase()] = {
              adhan: prayer.azan_time,
              salah: prayer.salah_time,
            };
          });
          setTimes(newTimes);
          setOriginalTimes(newTimes); // Store original times
        }
      } catch (error) {
        console.error('Error fetching prayer times:', error);
      }
    };
    
    fetchPrayerTimes();
  }, [adminEmail]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    const [prayer, type] = name.split('_');
    setTimes({
      ...times,
      [prayer]: { ...times[prayer], [type]: value },
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!originalTimes) return;
    
    // Find changes by comparing current times with original times
    const updatedTimes = {};
    for (const prayer in times) {
      if (
        times[prayer].adhan !== originalTimes[prayer]?.adhan ||
        times[prayer].salah !== originalTimes[prayer]?.salah
      ) {
        updatedTimes[prayer] = times[prayer];
      }
    }
    
    // If no changes, do nothing
    if (Object.keys(updatedTimes).length === 0) {
      alert('No changes detected');
      return;
    }

    try {
      console.log({adminEmail,updatedTimes})
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/update-prayer-times`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ adminEmail, updatedTimes }),
      });

      if (!response.ok) {
        throw new Error('Failed to update prayer times');
      }

      const result = await response.json();
      alert('Prayer times updated successfully!');
    } catch (error) {
      console.error('Error updating prayer times:', error);
      alert('Failed to update prayer times');
    }
  };

  return (
    <div className="salah-mod">
      <h1>SalahMod</h1>
      <form onSubmit={handleSubmit}>
        {Object.keys(times).map((prayer) => (
          <div className="prayer-section" key={prayer}>
            <div className="prayer-name">{prayer.charAt(0).toUpperCase() + prayer.slice(1)}</div>
            <div className="time-setters">
              <div className="time-setter">
                <label>Adhan:</label>
                <input
                  type="time"
                  name={`${prayer}_adhan`}
                  value={times[prayer].adhan}
                  onChange={handleChange}
                />
              </div>
              <div className="time-setter">
                <label>Salah:</label>
                <input
                  type="time"
                  name={`${prayer}_salah`}
                  value={times[prayer].salah}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
        ))}
        <button type="submit">Submit</button>
      </form>
    </div>
  );
};

export default SalahMod;