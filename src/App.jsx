import { useState, useEffect, useMemo, useRef } from 'react'
import Header from './components/Header/Header'
import Map from './components/Map/Map'
import RouteSelector from './components/RouteSelector/RouteSelector'
import AlertsSidebar from './components/AlertsSidebar/AlertsSidebar'
import SidebarToggle from './components/SidebarToggle/SidebarToggle'
import SearchSidebar from './components/TransportModeSelector/TransportModeSelector'
import BrowsePanel from './components/BrowsePanel/BrowsePanel'
import NearbyPanel from './components/NearbyPanel/NearbyPanel'
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
    const [showBrowsePanel, setShowBrowsePanel] = useState(false)
    const [showNearbyPanel, setShowNearbyPanel] = useState(false)
    const [isBrowsingMode, setIsBrowsingMode] = useState(false) // Track if in browse mode
    const [browsedRoute, setBrowsedRoute] = useState(null) // Store the browsed route info
    const [isNearbyMode, setIsNearbyMode] = useState(false) // Track if in nearby mode
    const [searchRoute, setSearchRoute] = useState(null)
    const [isLocationEnabled, setIsLocationEnabled] = useState(true)
    const [customLocation, setCustomLocation] = useState(null)
    const [userLocation, setUserLocation] = useState(null) // Track actual GPS location
    const [clickLocation, setClickLocation] = useState(null) // Track map click location for nearby
    const [mapCenter, setMapCenter] = useState(null) // Track map center for nearby
    const [lastUpdate, setLastUpdate] = useState(null)
    const [loading, setLoading] = useState(true)
    const [transitMode, setTransitMode] = useState('subway') // 'subway', 'bus', 'rail'

    // Load initial data
    useEffect(() => {
        // Don't reload if in browse or nearby mode - preserve the current view
        if (isBrowsingMode || isNearbyMode) {
            return
        }

        // IMMEDIATELY clear old data synchronously when transit mode changes
        setStops([])
        setVehicles([])
        setRouteLines({})
        setLoading(true)

        const loadInitialData = async () => {
            try {
                // Load ALL routes (including buses now)
                const allRoutes = await MBTAService.getRoutes()
                setRoutes(allRoutes)

                // Filter routes based on current transit mode
                let filteredRoutes = filterRoutesByMode(allRoutes, transitMode)

                // For bus mode, only select major/key routes to avoid freezing
                if (transitMode === 'bus') {
                    // Top 3 most popular bus routes in Boston (reduced for performance)
                    const keyBusRoutes = ['1', '28', '57']
                    filteredRoutes = filteredRoutes.filter(r => keyBusRoutes.includes(r.id))
                    console.log(`Bus mode: Showing ${filteredRoutes.length} key routes out of ${allRoutes.filter(r => r.type === 3).length} total bus routes`)
                }

                // For commuter rail, only select key routes to avoid freezing
                if (transitMode === 'rail') {
                    // Key commuter rail lines (most popular)
                    const keyRailRoutes = ['CR-Fitchburg', 'CR-Worcester', 'CR-Providence', 'CR-Franklin', 'CR-Lowell']
                    filteredRoutes = filteredRoutes.filter(r => keyRailRoutes.includes(r.id))
                    console.log(`Rail mode: Showing ${filteredRoutes.length} key routes out of ${allRoutes.filter(r => r.type === 2).length} total rail routes`)
                }

                console.log(`Transit mode: ${transitMode}, Filtered routes:`, filteredRoutes)
                const selectedIds = new Set(filteredRoutes.map(r => r.id))
                setSelectedRoutes(selectedIds)

                // Load route shapes for all modes IN PARALLEL
                console.log(`Fetching shapes for ${filteredRoutes.length} routes in parallel...`)
                const shapePromises = filteredRoutes.map(async (route) => {
                    const shape = await MBTAService.getRouteShape(route.id)
                    if (shape) {
                        shape.color = route.color
                        console.log(`✓ Shape loaded for ${route.id}`)
                        return { routeId: route.id, shape }
                    } else {
                        console.log(`✗ No shape data for ${route.id}`)
                        return null
                    }
                })

                // Load shapes and alerts in parallel
                const [shapeResults, alertsData] = await Promise.all([
                    Promise.all(shapePromises),
                    MBTAService.getAlerts()
                ])

                const shapes = {}
                shapeResults.forEach(result => {
                    if (result) {
                        shapes[result.routeId] = result.shape
                    }
                })
                console.log(`All ${Object.keys(shapes).length} route shapes loaded`)
                setRouteLines(shapes)
                setAlerts(alertsData)

                setLoading(false)
            } catch (error) {
                console.error('Error loading initial data:', error)
                setLoading(false)
            }
        }

        loadInitialData()
    }, [transitMode, isBrowsingMode, isNearbyMode]) // Reload when transit mode changes (but not in browse/nearby mode)

    // Track user's GPS location
    useEffect(() => {
        if (!isLocationEnabled || customLocation) {
            setUserLocation(null)
            return
        }

        if ('geolocation' in navigator) {
            const watchId = navigator.geolocation.watchPosition(
                (position) => {
                    setUserLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    })
                },
                (error) => console.error("Geolocation error:", error),
                { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
            )

            return () => navigator.geolocation.clearWatch(watchId)
        }
    }, [isLocationEnabled, customLocation])

    // Helper function to filter routes by transit mode
    const filterRoutesByMode = (allRoutes, mode) => {
        switch (mode) {
            case 'subway':
                // Type 0 = Light Rail, Type 1 = Heavy Rail (Subway)
                return allRoutes.filter(r => r.type === 0 || r.type === 1)
            case 'bus':
                // Type 3 = Bus - Return all bus routes (filtering to key routes happens in loadInitialData)
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

    // Load preloaded stops data on startup
    const [allStopsData, setAllStopsData] = useState([])
    const [stopsLoaded, setStopsLoaded] = useState(false)

    useEffect(() => {
        const loadPreloadedStops = async () => {
            try {
                console.log('Loading preloaded stops data...')
                const response = await fetch('/data/stops.json')
                const data = await response.json()
                console.log(`✅ Loaded ${data.length} preloaded stops`)
                setAllStopsData(data)
                setStopsLoaded(true)
            } catch (error) {
                console.error('Error loading preloaded stops:', error)
                // Fallback to API if preloaded data fails
                setStopsLoaded(true)
            }
        }

        loadPreloadedStops()
    }, [])

    // Update stops based on selected routes (using preloaded data)
    const currentTransitModeRef = useRef(transitMode)

    useEffect(() => {
        currentTransitModeRef.current = transitMode
    }, [transitMode])

    useEffect(() => {
        if (!stopsLoaded) return

        // IMMEDIATELY clear stops when transit mode or routes change
        setStops([])

        const loadStops = async () => {
            // Capture the current mode at the start of this async operation
            const modeAtStart = currentTransitModeRef.current

            if (effectiveSelectedRoutes.size === 0) {
                console.log('No routes selected, clearing stops')
                setStops([])
                return
            }

            try {
                console.log(`Loading stops for ${modeAtStart} mode, routes:`, Array.from(effectiveSelectedRoutes))

                let stopsData

                // For bus and rail, fetch stops from API for selected routes only
                // Preloaded data contains ALL stops which is too much
                if (modeAtStart === 'bus' || modeAtStart === 'rail') {
                    console.log('Fetching stops from API for selected routes')
                    stopsData = await MBTAService.getStopsForRoutes(Array.from(effectiveSelectedRoutes))
                } else if (allStopsData.length > 0) {
                    // Use preloaded data for subway - much faster!
                    console.log('Using preloaded stops data')
                    stopsData = allStopsData
                } else {
                    // Fallback to API
                    console.log('Falling back to API for stops')
                    stopsData = await MBTAService.getStopsForRoutes(Array.from(effectiveSelectedRoutes))
                }

                // Check if mode changed while we were loading - if so, discard these results
                if (currentTransitModeRef.current !== modeAtStart) {
                    console.log(`Transit mode changed from ${modeAtStart} to ${currentTransitModeRef.current} - discarding stale stops`)
                    return
                }

                // Filter stops based on transit mode
                let filteredStops = stopsData

                if (modeAtStart === 'subway') {
                    // Only show stations (location_type 1) for subway, not individual stops
                    filteredStops = stopsData.filter(stop => stop.type === 'Station')
                } else if (modeAtStart === 'rail') {
                    // Show all commuter rail stations (already filtered by route from API)
                    filteredStops = stopsData
                    console.log(`Rail mode: Showing ${filteredStops.length} commuter rail stations`)
                } else if (modeAtStart === 'bus') {
                    // Show all bus stops for selected routes (already filtered by route from API)
                    filteredStops = stopsData
                    console.log(`Bus mode: Showing ${filteredStops.length} bus stops`)
                }

                // Final check before setting stops
                if (currentTransitModeRef.current !== modeAtStart) {
                    console.log(`Transit mode changed during filtering - discarding stale stops`)
                    return
                }

                console.log(`Loaded ${filteredStops.length} stops for ${modeAtStart} mode (filtered from ${stopsData.length})`)
                setStops(filteredStops)
            } catch (error) {
                console.error('Error loading stops:', error)
            }
        }

        loadStops()
    }, [effectiveSelectedRoutes, transitMode, stopsLoaded, allStopsData])

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

    const handleBrowseStopSelect = async (stop, route, direction) => {
        // Close browse panel
        setShowBrowsePanel(false)

        // Enter browsing mode
        setIsBrowsingMode(true)
        setBrowsedRoute({ route, stop, direction })

        // Disable location by default in browse mode
        setIsLocationEnabled(false)
        setCustomLocation(null)

        // AGGRESSIVELY CLEAR EVERYTHING FIRST
        setStops([])
        setVehicles([])
        setRouteLines({})

        // REPLACE all routes with only the selected route
        const newSelected = new Set([route.id])
        setSelectedRoutes(newSelected)

        // Load route shape
        const shape = await MBTAService.getRouteShape(route.id)
        if (shape) {
            shape.color = route.color
            setRouteLines({ [route.id]: shape })
        }

        // Wait a bit for the map to update with the new route/stops
        setTimeout(() => {
            // Trigger the map to focus on this stop
            const event = new CustomEvent('focusStop', { detail: stop })
            window.dispatchEvent(event)
        }, 800)
    }

    const handleStopBrowsing = async () => {
        // Exit browsing mode and return to normal view
        setIsBrowsingMode(false)
        setBrowsedRoute(null)
        setIsLocationEnabled(true)

        // Clear everything first
        setStops([])
        setVehicles([])
        setRouteLines({})

        // Reload all routes for current transit mode
        const filteredRoutes = filterRoutesByMode(routes, transitMode)
        const selectedIds = new Set(filteredRoutes.map(r => r.id))
        setSelectedRoutes(selectedIds)

        // Load route shapes
        const shapePromises = filteredRoutes.map(async (route) => {
            const shape = await MBTAService.getRouteShape(route.id)
            if (shape) {
                shape.color = route.color
                return { routeId: route.id, shape }
            }
            return null
        })

        const shapeResults = await Promise.all(shapePromises)
        const shapes = {}
        shapeResults.forEach(result => {
            if (result) {
                shapes[result.routeId] = result.shape
            }
        })
        setRouteLines(shapes)
    }

    const handleStopNearby = async () => {
        // Exit nearby mode and return to normal view
        setIsNearbyMode(false)
        setIsLocationEnabled(true)
        setClickLocation(null) // Clear click location

        // Clear everything first
        setStops([])
        setVehicles([])
        setRouteLines({})

        // Reload all routes for current transit mode
        const filteredRoutes = filterRoutesByMode(routes, transitMode)
        const selectedIds = new Set(filteredRoutes.map(r => r.id))
        setSelectedRoutes(selectedIds)

        // Load route shapes
        const shapePromises = filteredRoutes.map(async (route) => {
            const shape = await MBTAService.getRouteShape(route.id)
            if (shape) {
                shape.color = route.color
                return { routeId: route.id, shape }
            }
            return null
        })

        const shapeResults = await Promise.all(shapePromises)
        const shapes = {}
        shapeResults.forEach(result => {
            if (result) {
                shapes[result.routeId] = result.shape
            }
        })
        setRouteLines(shapes)
    }

    const handleMapClick = (location) => {
        // Only set click location if nearby panel is open
        if (showNearbyPanel) {
            setClickLocation(location)
        }
    }

    return (
        <div className="app">
            <Header
                vehicleCount={vehicles.length}
                alertCount={alerts.length}
                lastUpdate={lastUpdate}
                isLocationEnabled={isLocationEnabled}
                onToggleLocation={() => {
                    if (isBrowsingMode) handleStopBrowsing() // Exit browse mode
                    if (isNearbyMode) handleStopNearby() // Exit nearby mode
                    setIsLocationEnabled(!isLocationEnabled)
                    if (!isLocationEnabled) setCustomLocation(null)
                }}
                onCustomLocation={handleCustomLocation}
                searchRoute={searchRoute}
                onClearRoute={handleClearRoute}
                transitMode={transitMode}
                onTransitModeChange={(mode) => {
                    if (isBrowsingMode) handleStopBrowsing() // Exit browse mode
                    if (isNearbyMode) handleStopNearby() // Exit nearby mode
                    console.log(`Transit mode changing from ${transitMode} to ${mode}`)
                    setTransitMode(mode)
                }}
                loading={loading}
                onBrowseClick={() => {
                    setShowBrowsePanel(true)
                    setShowRouteSelector(false)
                    setShowAlertsSidebar(false)
                }}
                onNearbyClick={() => {
                    setShowNearbyPanel(true)
                    setShowRouteSelector(false)
                    setShowAlertsSidebar(false)
                }}
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
                    isBrowsingMode={isBrowsingMode}
                    onStopBrowsing={handleStopBrowsing}
                    isNearbyMode={isNearbyMode}
                    onStopNearby={handleStopNearby}
                    onEnterNearbyMode={() => setIsNearbyMode(true)}
                    transitMode={transitMode}
                    onMapClick={handleMapClick}
                    onMapCenterChange={setMapCenter}
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

                <AlertsSidebar
                    alerts={alerts}
                    isOpen={showAlertsSidebar}
                    onClose={() => setShowAlertsSidebar(false)}
                    transitMode={transitMode}
                    selectedRoutes={selectedRoutes}
                />

                <BrowsePanel
                    isOpen={showBrowsePanel}
                    onClose={() => setShowBrowsePanel(false)}
                    onStopSelect={handleBrowseStopSelect}
                    transitMode={transitMode}
                />

                <NearbyPanel
                    isOpen={showNearbyPanel}
                    onClose={() => {
                        setShowNearbyPanel(false)
                        setClickLocation(null)
                    }}
                    userLocation={userLocation}
                    clickLocation={clickLocation}
                    mapCenter={mapCenter}
                    stops={stops}
                    vehicles={vehicles}
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

            {!showBrowsePanel && !showNearbyPanel && (
                <>
                    <SidebarToggle
                        label="Routes"
                        side="right"
                        position="top"
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
                        position="bottom"
                        isOpen={showAlertsSidebar}
                        badge={alerts.length}
                        onClick={() => {
                            setShowAlertsSidebar(!showAlertsSidebar)
                            if (!showAlertsSidebar) {
                                setShowRouteSelector(false)
                            }
                        }}
                    />
                </>
            )}
        </div>
    )
}

export default App
