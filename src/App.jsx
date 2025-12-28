import { useState, useEffect, useMemo } from 'react'
import Header from './components/Header/Header'
import Map from './components/Map/Map'
import RouteSelector from './components/RouteSelector/RouteSelector'
import AlertsSidebar from './components/AlertsSidebar/AlertsSidebar'
import SidebarToggle from './components/SidebarToggle/SidebarToggle'
import SearchSidebar from './components/TransportModeSelector/TransportModeSelector'
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
    const [showSearchSidebar, setShowSearchSidebar] = useState(false)
    const [searchRoute, setSearchRoute] = useState(null)
    const [isLocationEnabled, setIsLocationEnabled] = useState(true)
    const [customLocation, setCustomLocation] = useState(null)
    const [lastUpdate, setLastUpdate] = useState(null)
    const [loading, setLoading] = useState(true)
    const [transitMode, setTransitMode] = useState('subway') // 'subway', 'bus', 'rail'

    // Load initial data
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                setLoading(true)

                // Load ALL routes (including buses now)
                const allRoutes = await MBTAService.getRoutes()
                setRoutes(allRoutes)

                // Filter routes based on current transit mode
                const filteredRoutes = filterRoutesByMode(allRoutes, transitMode)
                console.log(`Transit mode: ${transitMode}, Filtered routes:`, filteredRoutes)
                const selectedIds = new Set(filteredRoutes.map(r => r.id))
                setSelectedRoutes(selectedIds)

                // Load route shapes for initially selected routes
                const shapes = {}
                for (const route of filteredRoutes) {
                    console.log(`Fetching shape for route: ${route.id} (${route.name})`)
                    const shape = await MBTAService.getRouteShape(route.id)
                    if (shape) {
                        shape.color = route.color
                        shapes[route.id] = shape
                        console.log(`✓ Shape loaded for ${route.id}:`, shape)
                    } else {
                        console.log(`✗ No shape data for ${route.id}`)
                    }
                }
                console.log('All route shapes:', shapes)
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
    }, [transitMode]) // Reload when transit mode changes

    // Helper function to filter routes by transit mode
    const filterRoutesByMode = (allRoutes, mode) => {
        switch (mode) {
            case 'subway':
                // Type 0 = Light Rail, Type 1 = Heavy Rail (Subway)
                return allRoutes.filter(r => r.type === 0 || r.type === 1)
            case 'bus':
                // Type 3 = Bus
                return allRoutes.filter(r => r.type === 3)
            case 'rail':
                // Type 2 = Commuter Rail
                return allRoutes.filter(r => r.type === 2)
            default:
                return []
        }
    }

    // Filter routes for current transit mode (for display in RouteSelector)
    const filteredRoutes = useMemo(() => {
        return filterRoutesByMode(routes, transitMode)
    }, [routes, transitMode])

    // All selected routes are already filtered by mode
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

    const handleResetRoutes = () => {
        // Reset to all routes for the current transit mode
        const filteredRoutes = filterRoutesByMode(routes, transitMode)
        const selectedIds = new Set(filteredRoutes.map(r => r.id))
        setSelectedRoutes(selectedIds)
    }

    const handleCustomLocation = (location) => {
        setCustomLocation(location)
        setIsLocationEnabled(false)
    }

    const handleRouteSearch = (fromAddress, toStation, transportMode) => {
        console.log('App: handleRouteSearch called with:', { fromAddress, toStation, transportMode })
        setSearchRoute({ from: fromAddress, to: toStation, mode: transportMode })
        // Disable GPS location tracking when using search route
        setIsLocationEnabled(false)
        setCustomLocation(null)
        // The Map component will handle drawing the route
    }

    const handleClearRoute = () => {
        setSearchRoute(null)
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
                searchRoute={searchRoute}
                onClearRoute={handleClearRoute}
                transitMode={transitMode}
                onTransitModeChange={setTransitMode}
            />

            <div className="app-content">
                <SearchSidebar
                    isOpen={showSearchSidebar}
                    onClose={() => setShowSearchSidebar(false)}
                    stops={stops}
                    onRouteSearch={handleRouteSearch}
                    onClearRoute={handleClearRoute}
                    hasActiveRoute={!!searchRoute}
                    transitMode={transitMode}
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
                    searchRoute={searchRoute}
                />

                <AlertsSidebar
                    alerts={alerts}
                    isOpen={showAlertsSidebar}
                    onClose={() => setShowAlertsSidebar(false)}
                    transitMode={transitMode}
                    selectedRoutes={selectedRoutes}
                />

                <RouteSelector
                    routes={filteredRoutes}
                    selectedRoutes={selectedRoutes}
                    onToggleRoute={handleToggleRoute}
                    onRefresh={handleRefresh}
                    onResetRoutes={handleResetRoutes}
                    isOpen={showRouteSelector}
                    onClose={() => setShowRouteSelector(false)}
                    transitMode={transitMode}
                />
            </div>

            <SidebarToggle
                label="Search"
                side="left"
                position="top"
                isOpen={showSearchSidebar}
                onClick={() => {
                    setShowSearchSidebar(!showSearchSidebar)
                    if (!showSearchSidebar) setShowRouteSelector(false)
                }}
            />

            <SidebarToggle
                label="Routes"
                side="right"
                position="bottom"
                isOpen={showRouteSelector}
                onClick={() => {
                    setShowRouteSelector(!showRouteSelector)
                    if (!showRouteSelector) {
                        setShowSearchSidebar(false)
                        setShowAlertsSidebar(false)
                    }
                }}
            />

            <SidebarToggle
                label="Alerts"
                side="right"
                position="top"
                isOpen={showAlertsSidebar}
                badge={alerts.length}
                onClick={() => {
                    setShowAlertsSidebar(!showAlertsSidebar)
                    if (!showAlertsSidebar) setShowRouteSelector(false)
                }}
            />
        </div>
    )
}

export default App
