import { useEffect, useState } from 'react'
import './Header.css'

function Header({
    vehicleCount,
    alertCount,
    lastUpdate,
    isLocationEnabled,
    onToggleLocation
}) {
    const [timeString, setTimeString] = useState('--:--:--')

    useEffect(() => {
        if (lastUpdate) {
            setTimeString(lastUpdate.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            }))
        }
    }, [lastUpdate])

    return (
        <header className="header">
            <div className="header-content">
                <div className="logo">
                    <div className="logo-icon">T</div>
                    <h1>MBTA Live Tracker</h1>
                </div>

                <div className="header-stats">
                    <button
                        className={`location-toggle-btn ${isLocationEnabled ? 'active' : ''}`}
                        onClick={onToggleLocation}
                        title={isLocationEnabled ? "Disable User Location" : "Enable User Location"}
                        aria-label="Toggle user location"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            {isLocationEnabled ? (
                                <path d="M12 2L2 22L12 18L22 22L12 2Z" fill="currentColor" />
                            ) : (
                                <path d="M12 2L2 22L12 18L22 22L12 2Z" />
                            )}
                        </svg>
                    </button>
                    <div className="stat-item">
                        <span className="stat-label">Active Vehicles</span>
                        <span className="stat-value">{vehicleCount}</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">Last Update</span>
                        <span className="stat-value">{timeString}</span>
                    </div>
                </div>
            </div>
        </header>
    )
}

export default Header
