const MBTA_API_KEY = import.meta.env.VITE_MBTA_API_KEY
const MBTA_API_BASE = 'https://api-v3.mbta.com'

// Route colors
const ROUTE_COLORS = {
    'Red': '#da291c',
    'Orange': '#ed8b00',
    'Blue': '#003da5',
    'Green-B': '#00843d',
    'Green-C': '#00843d',
    'Green-D': '#00843d',
    'Green-E': '#00843d',
    'Mattapan': '#da291c'
}

// Decode polyline (Google's encoded polyline format)
function decodePolyline(encoded) {
    const points = []
    let index = 0, len = encoded.length
    let lat = 0, lng = 0

    while (index < len) {
        let b, shift = 0, result = 0
        do {
            b = encoded.charCodeAt(index++) - 63
            result |= (b & 0x1f) << shift
            shift += 5
        } while (b >= 0x20)
        const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1))
        lat += dlat

        shift = 0
        result = 0
        do {
            b = encoded.charCodeAt(index++) - 63
            result |= (b & 0x1f) << shift
            shift += 5
        } while (b >= 0x20)
        const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1))
        lng += dlng

        points.push([lat / 1e5, lng / 1e5])
    }

    return points
}

export const MBTAService = {
    // Get all routes (all types: subway, bus, commuter rail)
    async getRoutes() {
        try {
            // Fetch all route types: 0=Light Rail, 1=Heavy Rail, 2=Commuter Rail, 3=Bus
            const response = await fetch(`${MBTA_API_BASE}/routes?filter[type]=0,1,2,3&api_key=${MBTA_API_KEY}`)
            const data = await response.json()

            return data.data.map(route => ({
                id: route.id,
                name: route.attributes.long_name,
                shortName: route.attributes.short_name,
                type: route.attributes.type,
                color: route.attributes.type === 3 ? '#FFC72C' : (ROUTE_COLORS[route.id] || route.attributes.color || '#666666')
            }))
        } catch (error) {
            console.error('Error fetching routes:', error)
            return []
        }
    },

    // Get route shape (polyline)
    async getRouteShape(routeId) {
        try {
            const response = await fetch(`${MBTA_API_BASE}/shapes?filter[route]=${routeId}&api_key=${MBTA_API_KEY}`)
            const data = await response.json()

            if (data.data.length === 0) return null

            const color = ROUTE_COLORS[routeId] || '#666666'
            const polylines = []

            data.data.forEach(shape => {
                if (shape.attributes.polyline) {
                    try {
                        const coordinates = decodePolyline(shape.attributes.polyline)
                        if (coordinates.length > 0) {
                            polylines.push(coordinates)
                        }
                    } catch (e) {
                        console.error(`Error decoding polyline for shape ${shape.id}:`, e)
                    }
                }
            })

            return { color, polylines }
        } catch (error) {
            console.error(`Error fetching route shape for ${routeId}:`, error)
            return null
        }
    },

    // Get vehicles for selected routes
    async getVehicles(routeIds) {
        if (routeIds.length === 0) return []

        try {
            const routeFilter = routeIds.join(',')
            const response = await fetch(
                `${MBTA_API_BASE}/vehicles?filter[route]=${routeFilter}&include=trip,stop,route&api_key=${MBTA_API_KEY}`
            )
            const data = await response.json()

            return data.data.map(vehicle => {
                const route = data.included?.find(i => i.type === 'route' && vehicle.relationships?.route?.data?.id === i.id)
                const trip = data.included?.find(i => i.type === 'trip' && vehicle.relationships?.trip?.data?.id === i.id)
                const stop = data.included?.find(i => i.type === 'stop' && vehicle.relationships?.stop?.data?.id === i.id)

                return {
                    id: vehicle.id,
                    latitude: vehicle.attributes.latitude,
                    longitude: vehicle.attributes.longitude,
                    bearing: vehicle.attributes.bearing,
                    speed: vehicle.attributes.speed,
                    status: vehicle.attributes.current_status,
                    route: route ? {
                        id: route.id,
                        name: route.attributes.long_name,
                        color: ROUTE_COLORS[route.id] || route.attributes.color || '#666666'
                    } : null,
                    trip: trip ? {
                        headsign: trip.attributes.headsign
                    } : null,
                    stop: stop ? {
                        name: stop.attributes.name
                    } : null
                }
            }).filter(v => v.latitude && v.longitude)
        } catch (error) {
            console.error('Error fetching vehicles:', error)
            return []
        }
    },

    // Get stops for specific routes
    async getStopsForRoutes(routeIds) {
        if (routeIds.length === 0) return []

        try {
            console.log(`Fetching stops for ${routeIds.length} routes:`, routeIds)

            // If there are many routes (like buses), batch the requests to avoid URL length limits
            const BATCH_SIZE = 15 // Increased from 5 to reduce number of requests
            let allStops = []

            if (routeIds.length > BATCH_SIZE) {
                console.log(`Batching ${routeIds.length} routes into groups of ${BATCH_SIZE}`)
                const promises = []

                for (let i = 0; i < routeIds.length; i += BATCH_SIZE) {
                    const batch = routeIds.slice(i, i + BATCH_SIZE)
                    const routeFilter = batch.join(',')
                    const url = `${MBTA_API_BASE}/stops?filter[route]=${routeFilter}&api_key=${MBTA_API_KEY}`

                    // Add catch block to ensure one failure doesn't break all
                    promises.push(
                        fetch(url)
                            .then(res => {
                                if (!res.ok) throw new Error(`HTTP ${res.status}`)
                                return res.json()
                            })
                            .catch(err => {
                                console.warn(`Batch fetch failed for routes ${batch[0]}...`, err)
                                return { data: [] } // Return empty result on failure
                            })
                    )
                }

                console.log(`Firing ${promises.length} parallel requests...`)
                const results = await Promise.all(promises)

                results.forEach(data => {
                    if (data.data) {
                        allStops.push(...data.data)
                    }
                })
            } else {
                const routeFilter = routeIds.join(',')
                const response = await fetch(`${MBTA_API_BASE}/stops?filter[route]=${routeFilter}&api_key=${MBTA_API_KEY}`)
                const data = await response.json()

                if (data.data) {
                    allStops = data.data
                }
            }

            console.log(`Received ${allStops.length} total stops from API`)

            // Filter to unique locations
            const uniqueLocations = new Map()

            allStops.forEach(stop => {
                const { latitude, longitude, location_type } = stop.attributes
                if (!latitude || !longitude) return

                const locationKey = `${latitude.toFixed(5)},${longitude.toFixed(5)}`

                if (!uniqueLocations.has(locationKey) || location_type === 1) {
                    uniqueLocations.set(locationKey, {
                        id: stop.id,
                        name: stop.attributes.name,
                        latitude,
                        longitude,
                        type: location_type === 1 ? 'Station' : 'Stop',
                        wheelchairAccessible: stop.attributes.wheelchair_boarding === 1,
                        description: stop.attributes.description
                    })
                }
            })

            const uniqueStopsArray = Array.from(uniqueLocations.values())
            console.log(`Returning ${uniqueStopsArray.length} unique stops`)
            return uniqueStopsArray
        } catch (error) {
            console.error('Error fetching stops:', error)
            return []
        }
    },

    // Get alerts
    async getAlerts() {
        try {
            const response = await fetch(`${MBTA_API_BASE}/alerts?filter[activity]=BOARD,EXIT,RIDE&page[limit]=10&api_key=${MBTA_API_KEY}`)
            const data = await response.json()

            return data.data.map(alert => ({
                id: alert.id,
                header: alert.attributes.header || 'Service Alert',
                description: alert.attributes.short_header || alert.attributes.description || 'Check MBTA.com for details',
                severity: alert.attributes.severity,
                effect: alert.attributes.effect
            }))
        } catch (error) {
            console.error('Error fetching alerts:', error)
            return []
        }
    },

    // Get predictions for a stop
    async getPredictions(stopId) {
        try {
            const response = await fetch(
                `${MBTA_API_BASE}/predictions?filter[stop]=${stopId}&include=route,trip&sort=arrival_time&page[limit]=20&api_key=${MBTA_API_KEY}`
            )
            const data = await response.json()

            return data.data.map(prediction => {
                const routeId = prediction.relationships?.route?.data?.id
                const tripId = prediction.relationships?.trip?.data?.id
                const route = data.included?.find(i => i.type === 'route' && i.id === routeId)
                const trip = data.included?.find(i => i.type === 'trip' && i.id === tripId)

                return {
                    id: prediction.id,
                    arrivalTime: prediction.attributes.arrival_time,
                    departureTime: prediction.attributes.departure_time,
                    status: prediction.attributes.status,
                    directionId: prediction.attributes.direction_id, // 0 or 1
                    route: route ? {
                        id: route.id,
                        shortName: route.attributes.short_name,
                        longName: route.attributes.long_name,
                        color: ROUTE_COLORS[route.id] || route.attributes.color || '#666666',
                        textColor: route.attributes.text_color || '000000',
                        directionNames: route.attributes.direction_names || ['Outbound', 'Inbound'],
                        type: route.attributes.type
                    } : null,
                    headsign: trip?.attributes?.headsign || 'Unknown Destination'
                }
            }).filter(p => p.arrivalTime || p.departureTime)
        } catch (error) {
            console.error(`Error fetching predictions for stop ${stopId}:`, error)
            return []
        }
    },

    // Get stops by location (for nearby feature)
    async getStopsByLocation(latitude, longitude, radiusKm = 0.5) {
        try {
            const response = await fetch(
                `${MBTA_API_BASE}/stops?filter[latitude]=${latitude}&filter[longitude]=${longitude}&filter[radius]=${radiusKm}&api_key=${MBTA_API_KEY}`
            )
            const data = await response.json()

            return data.data.map(stop => ({
                id: stop.id,
                name: stop.attributes.name,
                latitude: stop.attributes.latitude,
                longitude: stop.attributes.longitude,
                type: stop.attributes.location_type === 1 ? 'Station' : 'Stop',
                wheelchairAccessible: stop.attributes.wheelchair_boarding === 1,
                description: stop.attributes.description
            })).filter(s => s.latitude && s.longitude)
        } catch (error) {
            console.error('Error fetching stops by location:', error)
            return []
        }
    },

    // Get stops for a single route (for browse panel)
    async getStops(routeId) {
        try {
            const response = await fetch(
                `${MBTA_API_BASE}/stops?filter[route]=${routeId}&api_key=${MBTA_API_KEY}`
            )
            const data = await response.json()

            return data.data.map(stop => ({
                id: stop.id,
                name: stop.attributes.name,
                latitude: stop.attributes.latitude,
                longitude: stop.attributes.longitude,
                type: stop.attributes.location_type === 1 ? 'Station' : 'Stop',
                wheelchairAccessible: stop.attributes.wheelchair_boarding === 1,
                description: stop.attributes.description
            })).filter(s => s.latitude && s.longitude)
        } catch (error) {
            console.error(`Error fetching stops for route ${routeId}:`, error)
            return []
        }
    }
}
