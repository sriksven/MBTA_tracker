import { useState, useEffect } from 'react'
import LocationSearch from '../LocationSearch/LocationSearch'
import './SearchSidebar.css'

function SearchSidebar({ isOpen, onClose, stops, onRouteSearch, onClearRoute, hasActiveRoute }) {
    const [fromLocation, setFromLocation] = useState(null)
    const [toStation, setToStation] = useState('')
    const [filteredStations, setFilteredStations] = useState([])
    const [showStationDropdown, setShowStationDropdown] = useState(false)
    const [transportMode, setTransportMode] = useState('walking')
    const [resetKey, setResetKey] = useState(0)

    const modes = [
        { id: 'walking', icon: '🚶', label: 'Walking' },
        { id: 'biking', icon: '🚴', label: 'Biking' },
        { id: 'driving', icon: '🚗', label: 'Driving' },
        { id: 'transit', icon: '🚌', label: 'Public Transit' }
    ]

    const handleToStationChange = (value) => {
        setToStation(value)
        if (value.length > 0) {
            const filtered = stops.filter(stop =>
                stop.name.toLowerCase().includes(value.toLowerCase())
            ).slice(0, 10)
            setFilteredStations(filtered)
            setShowStationDropdown(true)
        } else {
            setFilteredStations([])
            setShowStationDropdown(false)
        }
    }

    const handleStationSelect = (station) => {
        setToStation(station.name)
        setShowStationDropdown(false)
    }

    const handleSearch = () => {
        const selectedStation = stops.find(s => s.name === toStation)
        if (fromLocation && selectedStation) {
            onRouteSearch(fromLocation, selectedStation)
        }
    }

    const handleLocationSelect = (location) => {
        setFromLocation({
            latitude: location.lat,
            longitude: location.lng,
            label: location.label
        })
    }

    const handleStopRoute = () => {
        // Reset all form fields
        setFromLocation(null)
        setToStation('')
        setFilteredStations([])
        setShowStationDropdown(false)
        setTransportMode('walking')
        setResetKey(prev => prev + 1) // Increment to trigger LocationSearch reset
        // Clear the route
        onClearRoute()
    }

    // Reset form when route is cleared externally (e.g., from header button)
    useEffect(() => {
        if (!hasActiveRoute) {
            setFromLocation(null)
            setToStation('')
            setFilteredStations([])
            setShowStationDropdown(false)
            setTransportMode('walking')
            setResetKey(prev => prev + 1)
        }
    }, [hasActiveRoute])

    return (
        <aside className={`search-sidebar ${isOpen ? '' : 'collapsed'}`}>
            <div className="search-sidebar-header">
                <h2>Search Route</h2>
                <button className="close-btn" onClick={onClose} aria-label="Close search">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <div className="search-form">
                <div className="search-field">
                    <label htmlFor="from-location">Your Address</label>
                    <LocationSearch onLocationSelect={handleLocationSelect} reset={resetKey} />
                    {fromLocation && (
                        <div className="selected-location">
                            📍 {fromLocation.label}
                        </div>
                    )}
                </div>

                <div className="search-field">
                    <label htmlFor="to-station">Station Name</label>
                    <input
                        id="to-station"
                        type="text"
                        placeholder="Search for a station"
                        value={toStation}
                        onChange={(e) => handleToStationChange(e.target.value)}
                        onFocus={() => toStation && setShowStationDropdown(true)}
                    />
                    {showStationDropdown && filteredStations.length > 0 && (
                        <div className="station-dropdown">
                            {filteredStations.map(station => (
                                <button
                                    key={station.id}
                                    className="station-option"
                                    onClick={() => handleStationSelect(station)}
                                >
                                    {station.name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="transport-mode-section">
                    <label>Transport Mode</label>
                    <div className="mode-grid">
                        {modes.map(mode => (
                            <button
                                key={mode.id}
                                className={`mode-icon-btn ${transportMode === mode.id ? 'active' : ''}`}
                                onClick={() => setTransportMode(mode.id)}
                                title={mode.label}
                                aria-label={mode.label}
                            >
                                <span className="mode-emoji">{mode.icon}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <button className="search-btn" onClick={handleSearch}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8" />
                        <path d="M21 21l-4.35-4.35" />
                    </svg>
                    Find Route
                </button>

                {hasActiveRoute && (
                    <button className="stop-route-btn" onClick={handleStopRoute}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M15 9l-6 6M9 9l6 6" />
                        </svg>
                        Stop Route
                    </button>
                )}
            </div>
        </aside>
    )
}

export default SearchSidebar
