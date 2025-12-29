import { useEffect, useState } from 'react'
import './Header.css'

function Header({
    vehicleCount,
    lastUpdate,
    isLocationEnabled,
    onToggleLocation,
    searchRoute,
    onClearRoute,
    transitMode,
    onTransitModeChange,
    loading,
    onBrowseClick
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
                <div className="header-left">
                    <div className="logo">
                        <svg className="logo-icon-svg" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="8" />
                            <path d="M25 25H75V40H58V75H42V40H25V25Z" fill="currentColor" />
                        </svg>
                        <h1>MBTA Live Tracker</h1>
                    </div>

                    <div className="transit-mode-nav">
                        <button
                            className={`transit-mode-btn ${transitMode === 'subway' ? 'active' : ''}`}
                            onClick={() => onTransitModeChange('subway')}
                            title="Subway & Light Rail Lines"
                        >
                            🚇 Subway
                        </button>
                        <button
                            className={`transit-mode-btn ${transitMode === 'bus' ? 'active' : ''}`}
                            onClick={() => onTransitModeChange('bus')}
                            title="Bus Routes"
                        >
                            🚌 Bus
                        </button>
                        <button
                            className={`transit-mode-btn ${transitMode === 'rail' ? 'active' : ''}`}
                            onClick={() => onTransitModeChange('rail')}
                            title="Commuter Rail"
                        >
                            🚆 Rail
                        </button>
                    </div>
                </div>

                <div className="header-actions">
                    <button
                        className={`location-toggle-btn ${isLocationEnabled ? 'active' : ''}`}
                        onClick={onToggleLocation}
                        title={isLocationEnabled ? "Disable User Location" : "Enable User Location"}
                        aria-label="Toggle user location"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            {isLocationEnabled ? (
                                <path d="M12 2L2 22L12 18L22 22L12 2Z" fill="currentColor" />
                            ) : (
                                <path d="M12 2L2 22L12 18L22 22L12 2Z" />
                            )}
                        </svg>
                        <span className="location-btn-text">{isLocationEnabled ? 'My Location' : 'Locate Me'}</span>
                    </button>

                    <button
                        className="browse-btn"
                        onClick={onBrowseClick}
                        title="Browse all routes and stops"
                        aria-label="Browse routes"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                            <polyline points="9 22 9 12 15 12 15 22" />
                        </svg>
                        <span className="browse-btn-text">Browse</span>
                    </button>

                    {searchRoute && (
                        <button
                            className="stop-route-header-btn"
                            onClick={onClearRoute}
                            title="Stop active route"
                            aria-label="Stop route"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <path d="M15 9l-6 6M9 9l6 6" />
                            </svg>
                            <span className="location-btn-text">Stop Route</span>
                        </button>
                    )}

                    <div className="header-stats">
                        {loading && (
                            <div className="stat-item loading-indicator">
                                <span className="stat-label">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '4px', verticalAlign: 'text-top', animation: 'spin 1s linear infinite' }}>
                                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                                    </svg>
                                    Loading...
                                </span>
                            </div>
                        )}
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
            </div>
        </header>
    )
}

export default Header
