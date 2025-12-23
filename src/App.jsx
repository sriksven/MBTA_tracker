import { useState, useEffect } from 'react'
import Header from './components/Header/Header'
import Map from './components/Map/Map'
import RouteSelector from './components/RouteSelector/RouteSelector'
import AlertsSidebar from './components/AlertsSidebar/AlertsSidebar'
import SidebarToggle from './components/SidebarToggle/SidebarToggle'
import { MBTAService } from './services/mbta.service'
import './App.css'

function App() {
    const [vehicles, setVehicles] = useState([])
    const [stops, setStops] = useState([])
    const [alerts, setAlerts] = useState([])
    const [routes, setRoutes] = useState([])
    const [selectedRoutes, setSelectedRoutes] = useState(new Set())
    const [routeLines, setRouteLines] = useState({})
    const [showRouteSelector, setShowRouteSelector] = useState(false)
    const [showAlertsSidebar, setShowAlertsSidebar] = useState(false)
    const [isLocationEnabled, setIsLocationEnabled] = useState(false)
    const [lastUpdate, setLastUpdate] = useState(null)
    const [loading, setLoading] = useState(true)

    // Load initial data
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                setLoading(true)

                // Load routes
                const routesData = await MBTAService.getRoutes()
                setRoutes(routesData)

                // Auto-select subway routes
                const subwayRoutes = routesData.filter(r => r.type === 0 || r.type === 1)
                const selectedIds = new Set(subwayRoutes.map(r => r.id))
                setSelectedRoutes(selectedIds)

                // Load route shapes
                const shapes = {}
                for (const route of subwayRoutes) {
                    const shape = await MBTAService.getRouteShape(route.id)
                    if (shape) shapes[route.id] = shape
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

    // Update stops when selected routes change
    useEffect(() => {
        const loadStops = async () => {
            if (selectedRoutes.size === 0) {
                setStops([])
                return
            }

            try {
                const stopsData = await MBTAService.getStopsForRoutes(Array.from(selectedRoutes))
                setStops(stopsData)
            } catch (error) {
                console.error('Error loading stops:', error)
            }
        }

        loadStops()
    }, [selectedRoutes])

    // Update vehicles periodically
    useEffect(() => {
        if (selectedRoutes.size === 0) return

        const updateVehicles = async () => {
            try {
                const vehiclesData = await MBTAService.getVehicles(Array.from(selectedRoutes))
                setVehicles(vehiclesData)
                setLastUpdate(new Date())
            } catch (error) {
                console.error('Error updating vehicles:', error)
            }
        }

        updateVehicles()
        const interval = setInterval(updateVehicles, 1000) // Update every 1 second

        return () => clearInterval(interval)
    }, [selectedRoutes])

    const handleRefresh = async () => {
        try {
            const [vehiclesData, alertsData] = await Promise.all([
                MBTAService.getVehicles(Array.from(selectedRoutes)),
                MBTAService.getAlerts()
            ])
            setVehicles(vehiclesData)
            setAlerts(alertsData)
            setLastUpdate(new Date())
        } catch (error) {
            console.error('Error refreshing data:', error)
        }
    }

    const handleToggleRoute = (routeId) => {
        const newSelected = new Set(selectedRoutes)
        if (newSelected.has(routeId)) {
            newSelected.delete(routeId)
        } else {
            newSelected.add(routeId)
        }
        setSelectedRoutes(newSelected)
    }

    return (
        <div className="app">
            <Header
                vehicleCount={vehicles.length}
                alertCount={alerts.length}
                lastUpdate={lastUpdate}
                isLocationEnabled={isLocationEnabled}
                onToggleLocation={() => setIsLocationEnabled(!isLocationEnabled)}
            />

            <SidebarToggle
                label="Routes"
                side="left"
                isOpen={showRouteSelector}
                onClick={() => setShowRouteSelector(!showRouteSelector)}
            />

            <SidebarToggle
                label="Alerts"
                side="right"
                isOpen={showAlertsSidebar}
                badge={alerts.length}
                onClick={() => setShowAlertsSidebar(!showAlertsSidebar)}
            />

            <div className="app-content">
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
                    selectedRoutes={selectedRoutes}
                    loading={loading}
                    onRefresh={handleRefresh}
                    showLocation={isLocationEnabled}
                />

                <AlertsSidebar
                    alerts={alerts}
                    isOpen={showAlertsSidebar}
                    onClose={() => setShowAlertsSidebar(false)}
                />
            </div>
        </div>
    )
}

export default App
