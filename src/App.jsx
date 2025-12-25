import { useState, useEffect, useMemo } from 'react'
import Header from './components/Header/Header'
import Map from './components/Map/Map'
import RouteSelector from './components/RouteSelector/RouteSelector'
import AlertsSidebar from './components/AlertsSidebar/AlertsSidebar'
import SidebarToggle from './components/SidebarToggle/SidebarToggle'
import TransportModeSelector from './components/TransportModeSelector/TransportModeSelector'
import { MBTAService } from './services/mbta.service'
import './App.css'

function App() {
    const [vehicles, setVehicles] = useState([])
    const [stops, setStops] = useState([])
    const [alerts, setAlerts] = useState([])
    const [routes, setRoutes] = useState([])
    const [selectedRoutes, setSelectedRoutes] = useState(new Set())
    const [routeLines, setRouteLines] = useState({})

    // UI State
    const [showRouteSelector, setShowRouteSelector] = useState(false)
    const [showAlertsSidebar, setShowAlertsSidebar] = useState(false)
    const [showTransportMode, setShowTransportMode] = useState(false)
    const [transportMode, setTransportMode] = useState('walking')
    const [isLocationEnabled, setIsLocationEnabled] = useState(true)
    const [customLocation, setCustomLocation] = useState(null)
    const [lastUpdate, setLastUpdate] = useState(null)
    const [loading, setLoading] = useState(true)

    // No filter state needed - buses are hardcoded to be excluded

    // Load initial data
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                setLoading(true)

                // Load only non-bus routes (exclude type 3)
                const allRoutes = await MBTAService.getRoutes()
                const nonBusRoutes = allRoutes.filter(r => r.type !== 3)
                setRoutes(nonBusRoutes)

                // Auto-select subway routes only (type 0 and 1) by default
                const subwayRoutes = nonBusRoutes.filter(r => r.type === 0 || r.type === 1)
                const selectedIds = new Set(subwayRoutes.map(r => r.id))
                setSelectedRoutes(selectedIds)

                // Load route shapes for initially selected routes
                const shapes = {}
                for (const route of subwayRoutes) {
                    const shape = await MBTAService.getRouteShape(route.id)
                    if (shape) {
                        shape.color = route.color
                        shapes[route.id] = shape
                    }
                }
                setRouteLines(shapes)

                // Load alerts
                const alertsData = await MBTAService.getAlerts()
                setAlerts(alertsData)

                setLoading(false)
            } catch (error) {
                console.error('Error loading initial data:', error)
                setLoading(false)
            }
        }

        loadInitialData()
    }, [])

    // All selected routes are already non-bus (filtered on load)
    const effectiveSelectedRoutes = useMemo(() => {
        return selectedRoutes
    }, [selectedRoutes])

    // Update stops
    useEffect(() => {
        const loadStops = async () => {
            if (effectiveSelectedRoutes.size === 0) {
                setStops([])
                return
            }

            try {
                const stopsData = await MBTAService.getStopsForRoutes(Array.from(effectiveSelectedRoutes))
                setStops(stopsData)
            } catch (error) {
                console.error('Error loading stops:', error)
            }
        }

        loadStops()
    }, [effectiveSelectedRoutes])

    // Update vehicles
    useEffect(() => {
        if (effectiveSelectedRoutes.size === 0) {
            setVehicles([])
            return
        }

        const updateVehicles = async () => {
            try {
                const vehiclesData = await MBTAService.getVehicles(Array.from(effectiveSelectedRoutes))
                setVehicles(vehiclesData)
                setLastUpdate(new Date())
            } catch (error) {
                console.error('Error updating vehicles:', error)
            }
        }

        updateVehicles()
        const interval = setInterval(updateVehicles, 1000)
        return () => clearInterval(interval)
    }, [effectiveSelectedRoutes])

    const handleToggleRoute = async (routeId) => {
        const newSelected = new Set(selectedRoutes)
        if (newSelected.has(routeId)) {
            newSelected.delete(routeId)
        } else {
            newSelected.add(routeId)
            // Lazy load shape if needed
            if (!routeLines[routeId]) {
                const shape = await MBTAService.getRouteShape(routeId)
                if (shape) {
                    const route = routes.find(r => r.id === routeId)
                    if (route) shape.color = route.color
                    setRouteLines(prev => ({ ...prev, [routeId]: shape }))
                }
            }
        }
        setSelectedRoutes(newSelected)
    }

    const handleRefresh = async () => {
        // Use effective routes for refresh
        const visibleRoutesList = Array.from(effectiveSelectedRoutes)
        if (visibleRoutesList.length === 0) return

        try {
            const [vehiclesData, alertsData] = await Promise.all([
                MBTAService.getVehicles(visibleRoutesList),
                MBTAService.getAlerts()
            ])
            setVehicles(vehiclesData)
            setAlerts(alertsData)
            setLastUpdate(new Date())
        } catch (error) {
            console.error('Error refreshing data:', error)
        }
    }

    const handleCustomLocation = (location) => {
        setCustomLocation(location)
        setIsLocationEnabled(false)
    }

    return (
        <div className="app">
            <Header
                vehicleCount={vehicles.length}
                alertCount={alerts.length}
                lastUpdate={lastUpdate}
                isLocationEnabled={isLocationEnabled}
                onToggleLocation={() => {
                    setIsLocationEnabled(!isLocationEnabled)
                    if (!isLocationEnabled) setCustomLocation(null)
                }}
                onCustomLocation={handleCustomLocation}
            />

            <div className="app-content">
                <TransportModeSelector
                    isOpen={showTransportMode}
                    onClose={() => setShowTransportMode(false)}
                    selectedMode={transportMode}
                    onModeChange={setTransportMode}
                />

                <RouteSelector
                    routes={routes}
                    selectedRoutes={selectedRoutes}
                    onToggleRoute={handleToggleRoute}
                    onRefresh={handleRefresh}
                    isOpen={showRouteSelector}
                    onClose={() => setShowRouteSelector(false)}
                />

                <Map
                    vehicles={vehicles}
                    stops={stops}
                    routeLines={routeLines}
                    selectedRoutes={effectiveSelectedRoutes}
                    loading={loading}
                    onRefresh={handleRefresh}
                    showLocation={isLocationEnabled}
                    customLocation={customLocation}
                />

                <AlertsSidebar
                    alerts={alerts}
                    isOpen={showAlertsSidebar}
                    onClose={() => setShowAlertsSidebar(false)}
                />
            </div>

            <SidebarToggle
                label="Transport"
                side="left"
                position="top"
                isOpen={showTransportMode}
                onClick={() => {
                    setShowTransportMode(!showTransportMode)
                    if (!showTransportMode) setShowRouteSelector(false)
                }}
            />

            <SidebarToggle
                label="Routes"
                side="left"
                position="bottom"
                isOpen={showRouteSelector}
                onClick={() => {
                    setShowRouteSelector(!showRouteSelector)
                    if (!showRouteSelector) setShowTransportMode(false)
                }}
            />

            <SidebarToggle
                label="Alerts"
                side="right"
                isOpen={showAlertsSidebar}
                badge={alerts.length}
                onClick={() => setShowAlertsSidebar(!showAlertsSidebar)}
            />
        </div>
    )
}

export default App
