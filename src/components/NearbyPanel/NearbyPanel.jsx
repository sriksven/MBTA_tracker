import { useState, useEffect } from 'react'
import { MBTAService } from '../../services/mbta.service'
import './NearbyPanel.css'

function NearbyPanel({ isOpen, onClose, userLocation, clickLocation, stops, vehicles, transitMode }) {
    const [nearbyStops, setNearbyStops] = useState([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (!isOpen) return

        const location = userLocation || clickLocation
        if (!location) return

        findNearbyStops(location)
    }, [isOpen, userLocation, clickLocation, stops, vehicles])

    const findNearbyStops = (location) => {
        setLoading(true)

        // Calculate distance between two coordinates
        const getDistance = (lat1, lon1, lat2, lon2) => {
            const R = 6371 // Earth's radius in km
            const dLat = (lat2 - lat1) * Math.PI / 180
            const dLon = (lon2 - lon1) * Math.PI / 180
            const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2)
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
            return R * c
        }

        // Find stops within 1km and sort by distance
        const stopsWithDistance = stops.map(stop => ({
            ...stop,
            distance: getDistance(location.lat, location.lng, stop.latitude, stop.longitude)
        })).filter(stop => stop.distance <= 1) // Within 1km
            .sort((a, b) => a.distance - b.distance)
            .slice(0, 6) // Max 6 stops

        // For each stop, find nearby vehicles
        const stopsWithVehicles = stopsWithDistance.map(stop => {
            const nearbyVehicles = vehicles
                .filter(vehicle => {
                    const dist = getDistance(stop.latitude, stop.longitude, vehicle.latitude, vehicle.longitude)
                    return dist <= 0.5 // Within 500m
                })
                .slice(0, 3) // Max 3 vehicles per stop

            return {
                ...stop,
                vehicles: nearbyVehicles
            }
        })

        setNearbyStops(stopsWithVehicles)
        setLoading(false)
    }

    if (!isOpen) return null

    return (
        <div className={`nearby-panel ${isOpen ? 'open' : ''}`}>
            <div className="nearby-panel-header">
                <h2>Nearby Stops</h2>
                <button className="close-btn" onClick={onClose} aria-label="Close nearby panel">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>
            </div>

            <div className="nearby-panel-content">
                {loading ? (
                    <div className="loading-state">
                        <div className="spinner"></div>
                        <p>Finding nearby stops...</p>
                    </div>
                ) : nearbyStops.length === 0 ? (
                    <div className="no-stops">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        <p>No stops found nearby</p>
                        <span className="hint">
                            {!userLocation && !clickLocation
                                ? 'Enable location or click on the map'
                                : 'Try a different location'}
                        </span>
                    </div>
                ) : (
                    <div className="nearby-stops-list">
                        {nearbyStops.map((stop, index) => (
                            <div key={stop.id || index} className="nearby-stop-item">
                                <div className="stop-info">
                                    <h3 className="stop-name">{stop.name}</h3>
                                    <span className="stop-distance">
                                        {stop.distance < 0.1
                                            ? `${Math.round(stop.distance * 1000)}m`
                                            : `${stop.distance.toFixed(2)}km`}
                                    </span>
                                </div>

                                {stop.vehicles && stop.vehicles.length > 0 ? (
                                    <div className="stop-vehicles">
                                        {stop.vehicles.map((vehicle, vIndex) => (
                                            <div key={vehicle.id || vIndex} className="vehicle-item">
                                                <div
                                                    className="vehicle-badge"
                                                    style={{ backgroundColor: vehicle.routeColor || '#666' }}
                                                >
                                                    {vehicle.routeName}
                                                </div>
                                                <span className="vehicle-status">
                                                    {vehicle.status || 'In Transit'}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="no-vehicles">
                                        <span>No vehicles nearby</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default NearbyPanel
