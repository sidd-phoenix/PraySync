import { useState } from 'react'
import { FaSearch } from 'react-icons/fa'
import '../styles/SearchnGrid.css'

const SearchnGrid = () => {
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState([])

    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            // console.warn('Search query is empty. Please enter a search term.');
            return;
        }

        try {
            const serverUrl = 'http://localhost:3001/api/search'
            const response = await fetch(serverUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ query: searchQuery }),
            })
            const data = await response.json()
            // console.log(data)
            setSearchResults(data)
        } catch (error) {
            console.error('Search failed:', error)
        }
    }

    return (
        <div>
            <div className="search-container">
                <input
                    type="text"
                    placeholder="Search mosques..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="search-input"
                />
                <button onClick={handleSearch} className="search-button">
                    <FaSearch />
                </button>
            </div>
            <div className="results-grid">
                {searchResults.map((mosque) => (
                    <div key={mosque.mosque_id} className="mosque-card">
                        <h3>{mosque.name}</h3>
                        <p className="address">
                            {mosque.address_line_1}
                            {mosque.address_line_2 && <br />}
                            {mosque.address_line_2}
                            <br />
                            {mosque.city}, {mosque.state}
                            <br />
                            {mosque.country} {mosque.postal_code}
                        </p>

                        {/* Prayer Times Section */}
                        <div className="prayer-times">
                            {/* <h4>Prayer Times</h4> */}
                            <div className="prayer-table">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Prayer</th>
                                            <th>Adhan</th>
                                            <th>Iqamah</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].map((prayer) => (
                                            <tr key={prayer}>
                                                <td>{prayer}</td>
                                                <td>
                                                    {mosque.prayerTimes[prayer]?.azan
                                                        ? new Date('1970-01-01T' + mosque.prayerTimes[prayer].azan)
                                                            .toLocaleTimeString('en-US', {
                                                                hour: 'numeric',
                                                                minute: '2-digit',
                                                                hour12: true
                                                            })
                                                        : '-'}
                                                </td>
                                                <td>
                                                    {mosque.prayerTimes[prayer]?.salah
                                                        ? new Date('1970-01-01T' + mosque.prayerTimes[prayer].salah)
                                                            .toLocaleTimeString('en-US', {
                                                                hour: 'numeric',
                                                                minute: '2-digit',
                                                                hour12: true
                                                            })
                                                        : '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* <div className="coordinates">
                            <small>
                                Lat: {mosque.latitude}, Long: {mosque.longitude}
                            </small>
                        </div> */}
                    </div>
                ))}
            </div>
        </div>
    )
}

export default SearchnGrid