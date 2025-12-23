import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './Map.css'

// Fix for default marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

function Map({ vehicles, stops, routeLines, selectedRoutes, loading, onRefresh, showLocation }) {
    const mapRef = useRef(null)
    const mapInstanceRef = useRef(null)
    const vehicleMarkersRef = useRef({})
    const stopMarkersRef = useRef({})
    const routeLinesRef = useRef({})
    const userMarkerRef = useRef(null)
    const watchIdRef = useRef(null)

    // Initialize map
    useEffect(() => {
        if (!mapInstanceRef.current) {
            mapInstanceRef.current = L.map(mapRef.current).setView([42.3601, -71.0589], 12)

            L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                attribution:
                    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
                subdomains: 'abcd',
                maxZoom: 19,
            }).addTo(mapInstanceRef.current)
        }

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove()
                mapInstanceRef.current = null
            }
        }
    }, [])

    // Handle Geolocation
    useEffect(() => {
        if (!mapInstanceRef.current) return

        if (showLocation) {
            if ('geolocation' in navigator) {
                watchIdRef.current = navigator.geolocation.watchPosition(
                    (position) => {
                        const { latitude, longitude, heading } = position.coords
                        const latlng = [latitude, longitude]

                        // Create or update marker
                        if (!userMarkerRef.current) {
                            const icon = L.divIcon({
                                className: 'user-location-marker',
                                html: `
                                    <div class="user-marker-pulse"></div>
                                    <div class="user-marker-dot"></div>
                                `,
                                iconSize: [20, 20],
                                iconAnchor: [10, 10]
                            })

                            userMarkerRef.current = L.marker(latlng, {
                                icon,
                                zIndexOffset: 2000 // Topmost
                            }).addTo(mapInstanceRef.current)

                            userMarkerRef.current.bindPopup("You are here")

                            // Fly to location on first fix
                            mapInstanceRef.current.flyTo(latlng, 15)
                        } else {
                            userMarkerRef.current.setLatLng(latlng)
                        }
                    },
                    (error) => {
                        console.error("Geolocation error:", error)
                    },
                    {
                        enableHighAccuracy: true,
                        maximumAge: 0,
                        timeout: 5000
                    }
                )
            }
        } else {
            // Cleanup
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current)
                watchIdRef.current = null
            }
            if (userMarkerRef.current) {
                mapInstanceRef.current.removeLayer(userMarkerRef.current)
                userMarkerRef.current = null
            }
        }

        return () => {
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current)
            }
        }
    }, [showLocation])

    // Update route lines (always show for selected routes)
    useEffect(() => {
        if (!mapInstanceRef.current) return

        // Remove old route lines
        Object.values(routeLinesRef.current).forEach(layerGroup => {
            mapInstanceRef.current.removeLayer(layerGroup)
        })
        routeLinesRef.current = {}

        // Add route lines for selected routes
        Object.entries(routeLines).forEach(([routeId, routeData]) => {
            if (!selectedRoutes.has(routeId)) return

            const layerGroup = L.layerGroup().addTo(mapInstanceRef.current)

            routeData.polylines.forEach(coordinates => {
                const polyline = L.polyline(coordinates, {
                    color: routeData.color,
                    weight: 5,
                    opacity: 0.7,
                    smoothFactor: 1,
                })
                layerGroup.addLayer(polyline)
            })

            routeLinesRef.current[routeId] = layerGroup
        })
    }, [routeLines, selectedRoutes])

    // Update stop markers (already filtered by selected routes in App.jsx)
    useEffect(() => {
        if (!mapInstanceRef.current) return

        // Remove old stop markers
        Object.values(stopMarkersRef.current).forEach(marker => {
            mapInstanceRef.current.removeLayer(marker)
        })
        stopMarkersRef.current = {}

        // Add stop markers
        stops.forEach(stop => {
            const icon = L.divIcon({
                className: 'custom-stop-marker',
                html: `
          <div style="
            width: 8px;
            height: 8px;
            background: white;
            border: 2px solid #333;
            border-radius: 50%;
            box-shadow: 0 1px 3px rgba(0,0,0,0.3);
          "></div>
        `,
                iconSize: [8, 8],
                iconAnchor: [4, 4],
            })

            const marker = L.marker([stop.latitude, stop.longitude], { icon }).addTo(
                mapInstanceRef.current
            )

            const popupContent = `
        <div class="popup-content">
          <div class="popup-title">${stop.name}</div>
          <div class="popup-info">
            <strong>Type:</strong> ${stop.type}<br>
            ${stop.description ? `<strong>Description:</strong> ${stop.description}<br>` : ''}
            ${stop.wheelchairAccessible ? '<strong>♿ Wheelchair Accessible</strong>' : ''}
          </div>
        </div>
      `

            marker.bindTooltip(stop.name, {
                permanent: true,
                direction: 'top',
                offset: [0, -6],
                className: 'stop-label-tooltip',
                opacity: 0.9
            })

            marker.bindPopup(popupContent)
            stopMarkersRef.current[stop.id] = marker
        })
    }, [stops])

    // Update vehicle markers
    useEffect(() => {
        if (!mapInstanceRef.current) return

        const activeVehicleIds = new Set(vehicles.map(v => v.id))

        // Remove vehicles that are no longer active
        Object.keys(vehicleMarkersRef.current).forEach(vehicleId => {
            if (!activeVehicleIds.has(vehicleId)) {
                mapInstanceRef.current.removeLayer(vehicleMarkersRef.current[vehicleId])
                delete vehicleMarkersRef.current[vehicleId]
            }
        })

        // Add or update vehicle markers
        vehicles.forEach(vehicle => {
            const existingMarker = vehicleMarkersRef.current[vehicle.id]
            const routeColor = vehicle.route?.color || '#4299e1'

            if (existingMarker) {
                // Update existing marker
                existingMarker.setLatLng([vehicle.latitude, vehicle.longitude])
            } else {
                // Create new marker
                const icon = L.divIcon({
                    className: 'custom-vehicle-marker',
                    html: `
            <div class="vehicle-marker-inner" style="
              width: 30px;
              height: 30px;
              transform: rotate(${vehicle.bearing || 0}deg);
              display: flex;
              align-items: center;
              justify-content: center;
              filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));
            ">
              <svg width="30" height="30" viewBox="0 0 24 24">
                <path d="M12 2L3 22L12 17L21 22L12 2Z" fill="white" stroke="${routeColor}" stroke-width="2" stroke-linejoin="round"/>
              </svg>
            </div>
          `,
                    iconSize: [30, 30],
                    iconAnchor: [15, 15],
                })

                const marker = L.marker([vehicle.latitude, vehicle.longitude], {
                    icon,
                    zIndexOffset: 1000 // Ensure vehicles are always on top of stops
                }).addTo(mapInstanceRef.current)

                const popupContent = `
          <div class="popup-content">
            <div class="popup-title">${vehicle.route?.name || 'Vehicle'}</div>
            <div class="popup-info">
              <strong>Status:</strong> ${vehicle.status || 'In Transit'}<br>
              ${vehicle.stop ? `<strong>Current Stop:</strong> ${vehicle.stop.name}<br>` : ''}
              ${vehicle.trip ? `<strong>Direction:</strong> ${vehicle.trip.headsign || 'N/A'}<br>` : ''}
              <strong>Speed:</strong> ${vehicle.speed ? `${Math.round(vehicle.speed * 2.237)} mph` : 'N/A'}
            </div>
          </div>
        `

                marker.bindPopup(popupContent)
                vehicleMarkersRef.current[vehicle.id] = marker
            }
        })
    }, [vehicles])

    return (
        <div className="map-wrapper">
            <button className="map-refresh-btn" onClick={onRefresh} aria-label="Refresh data">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
                </svg>
                <span>Refresh</span>
            </button>
            <div ref={mapRef} className="map" />
            {loading && (
                <div className="map-loading">
                    <div className="loading-spinner" />
                    <p>Loading MBTA data...</p>
                </div>
            )}
        </div>
    )
}

export default Map
