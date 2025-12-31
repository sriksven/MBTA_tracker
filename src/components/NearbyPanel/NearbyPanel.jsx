import { useState, useEffect } from 'react'
import { MBTAService } from '../../services/mbta.service'
import './NearbyPanel.css'

function NearbyPanel({ isOpen, onClose, userLocation, clickLocation, stops, vehicles, transitMode }) {
    const [nearbyStops, setNearbyStops] = useState([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (!isOpen) return

        const location = userLocation || clickLocation
        if (!location) {
            setNearbyStops([])
            return
        }

        findNearbyStops(location)
    }, [isOpen, userLocation, clickLocation, stops])

    const findNearbyStops = async (location) => {
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

        // Fetch predictions for each stop
        const stopsWithPredictions = await Promise.all(
            stopsWithDistance.map(async (stop) => {
                try {
                    const predictions = await MBTAService.getPredictions(stop.id)

                    // Process predictions to show next 3 arrivals
                    const now = new Date()
                    const upcomingPredictions = predictions
                        .map(p => {
                            const time = new Date(p.arrivalTime || p.departureTime)
                            const diffMs = time - now
                            const diffMins = Math.floor(diffMs / 60000)

                            return {
                                routeName: p.route?.shortName || p.route?.name || 'Unknown',
                                routeColor: p.route?.color ? `#${p.route.color}` : '#666',
                                routeTextColor: p.route?.textColor ? `#${p.route.textColor}` : '#ffffff',
                                headsign: p.headsign || 'Unknown',
                                minutes: diffMins,
                                status: p.status,
                                arrivalTime: time
                            }
                        })
                        .filter(p => p.minutes >= 0) // Only future arrivals
                        .sort((a, b) => a.minutes - b.minutes)
                        .slice(0, 3) // Show next 3 arrivals

                    return {
                        ...stop,
                        predictions: upcomingPredictions
                    }
                } catch (error) {
                    console.error(`Error fetching predictions for stop ${stop.id}:`, error)
                    return {
                        ...stop,
                        predictions: []
                    }
                }
            })
        )

        setNearbyStops(stopsWithPredictions)
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
                                <div className="stop-header">
                                    <div className="stop-info">
                                        <h3 className="stop-name">{stop.name}</h3>
                                        <div className="stop-meta">
                                            <span className="stop-distance">
                                                🚶 {stop.distance < 0.1
                                                    ? `${Math.round(stop.distance * 1000)}m`
                                                    : `${stop.distance.toFixed(2)}km`}
                                            </span>
                                            <span className="walk-time">
                                                ~{Math.ceil(stop.distance * 12)} min walk
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {stop.predictions && stop.predictions.length > 0 ? (
                                    <div className="predictions-list">
                                        {stop.predictions.map((pred, pIndex) => (
                                            <div key={pIndex} className="prediction-item">
                                                <div
                                                    className="route-badge"
                                                    style={{
                                                        backgroundColor: pred.routeColor,
                                                        color: pred.routeTextColor
                                                    }}
                                                >
                                                    {pred.routeName}
                                                </div>
                                                <div className="prediction-info">
                                                    <span className="headsign">{pred.headsign}</span>
                                                    <span className="arrival-time">
                                                        {pred.minutes <= 0 ? 'Arriving' :
                                                            pred.minutes === 1 ? '1 min' :
                                                                `${pred.minutes} mins`}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="no-predictions">
                                        <span>No upcoming arrivals</span>
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
