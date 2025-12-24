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
    // Get all routes
    async getRoutes() {
        try {
            const response = await fetch(`${MBTA_API_BASE}/routes?filter[type]=0,1,3&api_key=${MBTA_API_KEY}`)
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
            const routeFilter = routeIds.join(',')
            const response = await fetch(`${MBTA_API_BASE}/stops?filter[route]=${routeFilter}&api_key=${MBTA_API_KEY}`)
            const data = await response.json()

            // Filter to unique locations
            const uniqueLocations = new Map()

            data.data.forEach(stop => {
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

            return Array.from(uniqueLocations.values())
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
                        directionNames: route.attributes.direction_names || ['Outbound', 'Inbound']
                    } : null,
                    headsign: trip?.attributes?.headsign || 'Unknown Destination'
                }
            }).filter(p => p.arrivalTime || p.departureTime)
        } catch (error) {
            console.error(`Error fetching predictions for stop ${stopId}:`, error)
            return []
        }
    }
}
