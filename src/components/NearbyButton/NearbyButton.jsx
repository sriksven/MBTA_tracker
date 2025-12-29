import { useState, useEffect } from 'react'
import { MBTAService } from '../../services/mbta.service'
import './NearbyButton.css'

function NearbyButton({ mapCenter, onStopSelect, onEnterNearbyMode }) {
    const [isOpen, setIsOpen] = useState(false)
    const [nearbyStops, setNearbyStops] = useState([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (!isOpen || !mapCenter) return

        const loadNearbyStops = async () => {
            setLoading(true)
            try {
                // Get stops within ~500m radius
                const stops = await MBTAService.getStopsByLocation(
                    mapCenter.lat,
                    mapCenter.lng,
                    0.5 // radius in km
                )

                // Calculate distance for each stop
                const stopsWithDistance = stops.map(stop => ({
                    ...stop,
                    distance: calculateDistance(
                        mapCenter.lat,
                        mapCenter.lng,
                        stop.latitude,
                        stop.longitude
                    )
                }))

                // Sort by distance
                stopsWithDistance.sort((a, b) => a.distance - b.distance)

                setNearbyStops(stopsWithDistance.slice(0, 10)) // Show top 10
            } catch (error) {
                console.error('Error loading nearby stops:', error)
            } finally {
                setLoading(false)
            }
        }

        loadNearbyStops()
    }, [isOpen, mapCenter])

    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371 // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180
        const dLon = (lon2 - lon1) * Math.PI / 180
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        return R * c
    }

    const handleStopClick = (stop) => {
        onStopSelect(stop)
        setIsOpen(false)
    }

    return (
        <div className="nearby-button-container">
            <button
                className={`nearby-button ${isOpen ? 'active' : ''}`}
                onClick={() => {
                    const newState = !isOpen
                    setIsOpen(newState)
                    if (newState && onEnterNearbyMode) {
                        onEnterNearbyMode()
                    }
                }}
                title="Show nearby stations"
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="12" r="3" fill="currentColor" />
                    <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
                </svg>
                <span className="nearby-label">Nearby</span>
            </button>

            {isOpen && (
                <div className="nearby-panel">
                    <div className="nearby-panel-header">
                        <h3>Nearby Stations</h3>
                        <button className="close-nearby" onClick={() => setIsOpen(false)}>✕</button>
                    </div>
                    <div className="nearby-panel-content">
                        {loading ? (
                            <div className="nearby-loading">Finding stations...</div>
                        ) : nearbyStops.length === 0 ? (
                            <div className="nearby-empty">No stations nearby. Try moving the map.</div>
                        ) : (
                            <div className="nearby-stops-list">
                                {nearbyStops.map(stop => (
                                    <div
                                        key={stop.id}
                                        className="nearby-stop-item"
                                        onClick={() => handleStopClick(stop)}
                                    >
                                        <div className="nearby-stop-info">
                                            <div className="nearby-stop-name">{stop.name}</div>
                                            <div className="nearby-stop-type">{stop.type}</div>
                                        </div>
                                        <div className="nearby-stop-distance">
                                            {(stop.distance * 1000).toFixed(0)}m
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

export default NearbyButton
