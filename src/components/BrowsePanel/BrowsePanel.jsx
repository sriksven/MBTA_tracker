import { useState, useEffect } from 'react'
import { MBTAService } from '../../services/mbta.service'
import './BrowsePanel.css'

function BrowsePanel({ isOpen, onClose, onStopSelect, transitMode }) {
    const [routes, setRoutes] = useState([])
    const [selectedRoute, setSelectedRoute] = useState(null)
    const [selectedDirection, setSelectedDirection] = useState(0)
    const [stops, setStops] = useState([])
    const [loading, setLoading] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')

    // Load routes based on transit mode
    useEffect(() => {
        if (!isOpen) return

        const loadRoutes = async () => {
            setLoading(true)
            try {
                const allRoutes = await MBTAService.getRoutes()

                // Filter routes by transit mode
                let filtered = []
                if (transitMode === 'subway') {
                    filtered = allRoutes.filter(r => r.type === 0 || r.type === 1)
                } else if (transitMode === 'bus') {
                    filtered = allRoutes.filter(r => r.type === 3)
                } else if (transitMode === 'rail') {
                    filtered = allRoutes.filter(r => r.type === 2)
                }

                setRoutes(filtered)
            } catch (error) {
                console.error('Error loading routes:', error)
            } finally {
                setLoading(false)
            }
        }

        loadRoutes()
    }, [isOpen, transitMode])

    // Load stops when route/direction changes
    useEffect(() => {
        if (!selectedRoute) {
            setStops([])
            return
        }

        const loadStops = async () => {
            setLoading(true)
            try {
                const routeStops = await MBTAService.getStops(selectedRoute.id)
                setStops(routeStops)
            } catch (error) {
                console.error('Error loading stops:', error)
            } finally {
                setLoading(false)
            }
        }

        loadStops()
    }, [selectedRoute, selectedDirection])

    const handleRouteClick = (route) => {
        setSelectedRoute(route)
        setSelectedDirection(0)
    }

    const handleBackToRoutes = () => {
        setSelectedRoute(null)
        setStops([])
    }

    const handleStopClick = (stop) => {
        onStopSelect(stop, selectedRoute, selectedDirection)
    }

    const filteredRoutes = routes.filter(route =>
        route.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        route.shortName?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const getRouteTypeLabel = (type) => {
        switch (type) {
            case 0:
            case 1:
                return 'Rapid Transit'
            case 2:
                return 'Commuter Rail'
            case 3:
                return 'Bus'
            default:
                return 'Transit'
        }
    }

    if (!isOpen) return null

    return (
        <div className="browse-panel-overlay" onClick={onClose}>
            <div className="browse-panel" onClick={(e) => e.stopPropagation()}>
                <div className="browse-panel-header">
                    <h2>
                        {selectedRoute ? (
                            <>
                                <button className="back-btn" onClick={handleBackToRoutes}>
                                    ← Back
                                </button>
                                {selectedRoute.shortName || selectedRoute.name}
                            </>
                        ) : (
                            'Browse Routes'
                        )}
                    </h2>
                    <button className="close-btn" onClick={onClose}>✕</button>
                </div>

                {!selectedRoute ? (
                    <>
                        <div className="browse-search">
                            <input
                                type="text"
                                placeholder="Search routes..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <div className="browse-content">
                            {loading ? (
                                <div className="loading-state">Loading routes...</div>
                            ) : (
                                <div className="routes-list">
                                    {filteredRoutes.map(route => (
                                        <div
                                            key={route.id}
                                            className="route-item"
                                            onClick={() => handleRouteClick(route)}
                                            style={{
                                                borderLeft: `4px solid #${route.color || '666'}`
                                            }}
                                        >
                                            <div className="route-badge" style={{
                                                background: `#${route.color || '666'}`,
                                                color: `#${route.textColor || 'fff'}`
                                            }}>
                                                {route.shortName || route.name.substring(0, 2)}
                                            </div>
                                            <div className="route-info">
                                                <div className="route-name">{route.name}</div>
                                                <div className="route-type">{getRouteTypeLabel(route.type)}</div>
                                            </div>
                                            <div className="route-arrow">→</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <>
                        <div className="direction-tabs">
                            {selectedRoute.directionNames?.map((name, idx) => (
                                <button
                                    key={idx}
                                    className={`direction-tab ${selectedDirection === idx ? 'active' : ''}`}
                                    onClick={() => setSelectedDirection(idx)}
                                >
                                    {name}
                                </button>
                            )) || (
                                    <>
                                        <button
                                            className={`direction-tab ${selectedDirection === 0 ? 'active' : ''}`}
                                            onClick={() => setSelectedDirection(0)}
                                        >
                                            Outbound
                                        </button>
                                        <button
                                            className={`direction-tab ${selectedDirection === 1 ? 'active' : ''}`}
                                            onClick={() => setSelectedDirection(1)}
                                        >
                                            Inbound
                                        </button>
                                    </>
                                )}
                        </div>

                        <div className="browse-content">
                            {loading ? (
                                <div className="loading-state">Loading stops...</div>
                            ) : (
                                <div className="stops-list">
                                    {stops.map(stop => (
                                        <div
                                            key={stop.id}
                                            className="stop-item"
                                            onClick={() => handleStopClick(stop)}
                                        >
                                            <div className="stop-name">{stop.name}</div>
                                            {stop.wheelchairAccessible && <span className="accessibility-icon">♿</span>}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

export default BrowsePanel
