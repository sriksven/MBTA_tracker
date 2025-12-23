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
                        <span className="stat-label">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '4px', verticalAlign: 'text-top' }}>
                                <path d="M19 17h2l.64-2.54c.24-.959.24-1.962 0-2.92l-1.07-4.27C20.26 6.13 19.26 5.39 18.12 5.09c-.66-.18-1.35-.29-2.03-.34V3.5a1.5 1.5 0 0 0-3 0v1.17c-1.38.03-2.76 0-4.13.06V3.5a1.5 1.5 0 0 0-3 0v1.27c-1.39.27-2.7.77-3.87 1.48l-1.07 4.27c-.24.958-.24 1.96 0 2.92L2 17h2" />
                            </svg>
                            Active Vehicles
                        </span>
                        <span className="stat-value">{vehicleCount}</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '4px', verticalAlign: 'text-top' }}>
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                            </svg>
                            Last Update
                        </span>
                        <span className="stat-value">{timeString}</span>
                    </div>
                </div>
            </div>
        </header>
    )
}

export default Header
