import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import { MBTAService } from '../../services/mbta.service'
import 'leaflet/dist/leaflet.css'
import './Map.css'

// Fix for default marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

function Map({ vehicles, stops, routeLines, selectedRoutes, loading, onRefresh, showLocation, customLocation, showBuses }) {
    const mapRef = useRef(null)
    const mapInstanceRef = useRef(null)
    const vehicleMarkersRef = useRef({})
    const stopMarkersRef = useRef({})
    const routeLinesRef = useRef({})
    const userMarkerRef = useRef(null)
    const watchIdRef = useRef(null)

    // New Feature State
    const [followedVehicleId, setFollowedVehicleId] = useState(null)

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

            // Stop following when user interacts with map
            mapInstanceRef.current.on('dragstart', () => setFollowedVehicleId(null))
            mapInstanceRef.current.on('zoomstart', () => setFollowedVehicleId(null))
        }

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove()
                mapInstanceRef.current = null
            }
        }
    }, [])

    // Handle Geolocation & Custom Location
    const userLocationCoords = useRef(null)

    useEffect(() => {
        if (!mapInstanceRef.current) return

        const createMarker = (lat, lng, isCustom) => {
            const latlng = [lat, lng]
            const icon = L.divIcon({
                className: isCustom ? 'user-location-marker custom' : 'user-location-marker',
                html: isCustom ? `
                    <div class="user-marker-pulse custom"></div>
                    <div class="user-marker-dot custom"></div>
                ` : `
                    <div class="user-marker-pulse"></div>
                    <div class="user-marker-dot"></div>
                `,
                iconSize: [20, 20],
                iconAnchor: [10, 10]
            })

            const marker = L.marker(latlng, {
                icon,
                zIndexOffset: 2000
            }).addTo(mapInstanceRef.current)

            marker.bindPopup(isCustom ? "Custom Origin" : "You are here")
            return marker
        }

        if (customLocation) {
            // Custom Location Active
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current)
                watchIdRef.current = null
            }

            if (userMarkerRef.current) {
                mapInstanceRef.current.removeLayer(userMarkerRef.current)
            }

            userLocationCoords.current = { latitude: customLocation.lat, longitude: customLocation.lng }
            userMarkerRef.current = createMarker(customLocation.lat, customLocation.lng, true)
            userMarkerRef.current.setPopupContent(`<strong>Origin</strong><br>${customLocation.label}`)
            userMarkerRef.current.openPopup()

            mapInstanceRef.current.flyTo([customLocation.lat, customLocation.lng], 15)

        } else if (showLocation) {
            if (!userLocationCoords.current && userMarkerRef.current) {
                mapInstanceRef.current.removeLayer(userMarkerRef.current)
                userMarkerRef.current = null
            }

            if ('geolocation' in navigator) {
                watchIdRef.current = navigator.geolocation.watchPosition(
                    (position) => {
                        const { latitude, longitude } = position.coords
                        const latlng = [latitude, longitude]
                        userLocationCoords.current = { latitude, longitude }

                        if (!userMarkerRef.current) {
                            userMarkerRef.current = createMarker(latitude, longitude, false)
                            mapInstanceRef.current.flyTo(latlng, 15)
                        } else {
                            userMarkerRef.current.setLatLng(latlng)
                        }
                    },
                    (error) => console.error("Geolocation error:", error),
                    { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
                )
            }
        } else {
            userLocationCoords.current = null
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
    }, [showLocation, customLocation])

    // Handle Zoom Levels to declutter labels
    useEffect(() => {
        if (!mapInstanceRef.current) return
        const map = mapInstanceRef.current

        const updateZoomClass = () => {
            const z = map.getZoom()
            const container = map.getContainer()

            // Reset classes
            container.classList.remove('zoom-low', 'zoom-mid', 'zoom-high')

            if (z < 12.5) {
                // Low zoom: Lines only (City view)
                container.classList.add('zoom-low')
            } else if (z < 14) {
                // Mid zoom: Lines + Stops (Neighborhood view)
                container.classList.add('zoom-mid')
            } else {
                // High zoom: Everything (Vehicle markers & Names visible sooner)
                container.classList.add('zoom-high')
            }
        }

        map.on('zoomend', updateZoomClass)
        // Set initial state
        updateZoomClass()

        return () => {
            map.off('zoomend', updateZoomClass)
        }
    }, [loading])

    // Helper: Calculate walking time (approximate backup)
    const getHaversineWalkInfo = (start, endLat, endLng) => {
        if (!start) return null
        const R = 6371
        const dLat = (endLat - start.latitude) * (Math.PI / 180)
        const dLon = (endLng - start.longitude) * (Math.PI / 180)
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(start.latitude * (Math.PI / 180)) * Math.cos(endLat * (Math.PI / 180)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        const d = R * c
        const realDistance = d * 1.3
        const walkingMinutes = Math.ceil(realDistance * 12)
        return { distance: realDistance.toFixed(2), minutes: walkingMinutes }
    }

    // Helper: Fetch OSRM Real Walking Time
    const getRealWalkInfo = async (start, endLat, endLng) => {
        if (!start) return null
        try {
            const url = `https://router.project-osrm.org/route/v1/foot/${start.longitude},${start.latitude};${endLng},${endLat}?overview=false`
            const res = await fetch(url)
            const data = await res.json()
            if (data.code === 'Ok' && data.routes.length > 0) {
                const durationSec = data.routes[0].duration
                const distMeters = data.routes[0].distance
                return {
                    minutes: Math.ceil(durationSec / 60),
                    distance: (distMeters / 1000).toFixed(2),
                    isReal: true
                }
            }
        } catch (e) {
            console.warn("OSRM routing failed, falling back to Haversine", e)
        }
        return getHaversineWalkInfo(start, endLat, endLng)
    }

    // Update route lines
    useEffect(() => {
        if (!mapInstanceRef.current) return
        Object.values(routeLinesRef.current).forEach(layerGroup => mapInstanceRef.current.removeLayer(layerGroup))
        routeLinesRef.current = {}
        Object.entries(routeLines).forEach(([routeId, routeData]) => {
            if (!selectedRoutes.has(routeId)) return
            const layerGroup = L.layerGroup().addTo(mapInstanceRef.current)
            routeData.polylines.forEach(coordinates => {
                const polyline = L.polyline(coordinates, {
                    color: routeData.color,
                    weight: 2,
                    opacity: 0.8,
                    smoothFactor: 1,
                })
                layerGroup.addLayer(polyline)
            })
            routeLinesRef.current[routeId] = layerGroup
        })
    }, [routeLines, selectedRoutes])

    // Update stop markers
    useEffect(() => {
        if (!mapInstanceRef.current) return

        Object.values(stopMarkersRef.current).forEach(marker => mapInstanceRef.current.removeLayer(marker))
        stopMarkersRef.current = {}

        stops.forEach(stop => {
            const icon = L.divIcon({
                className: 'custom-stop-marker',
                html: `
          <div style="
            width: 12px;
            height: 12px;
            background: white;
            border: 2px solid #333;
            border-radius: 50%;
            box-shadow: 0 1px 3px rgba(0,0,0,0.4);
            cursor: pointer;
            transition: transform 0.2s ease;
          "></div>
        `,
                iconSize: [12, 12],
                iconAnchor: [6, 6],
            })

            const marker = L.marker([stop.latitude, stop.longitude], { icon }).addTo(mapInstanceRef.current)

            const baseContent = `
                <div class="popup-content" style="padding: 2px;">
                  <div class="popup-title" style="font-size: 11px; margin-bottom: 1px; line-height: 1.1;">${stop.name}</div>
                  <div class="popup-info" style="font-size: 9px; line-height: 1.1; color: #cbd5e0;">
                    ${stop.type}
                    ${stop.wheelchairAccessible ? '<span style="margin-left: 4px">♿</span>' : ''}
                  </div>
                  <div id="predictions-${stop.id}" class="popup-predictions" style="margin-top: 3px; padding-top: 3px; border-top: 1px solid rgba(255,255,255,0.1); min-width: 140px;">
                    <div class="loading-predictions" style="font-size: 9px;">Loading...</div>
                  </div>
                </div>
            `

            marker.bindPopup(baseContent, { minWidth: 170 })

            marker.on('popupopen', async () => {
                // Wait for DOM to completely render
                await new Promise(resolve => setTimeout(resolve, 50))

                let resultsContainer = document.getElementById(`predictions-${stop.id}`)
                if (!resultsContainer) {
                    await new Promise(resolve => setTimeout(resolve, 100))
                    resultsContainer = document.getElementById(`predictions-${stop.id}`)
                }

                if (!resultsContainer) return

                resultsContainer.innerHTML = '<div class="loading-predictions">Calculating best route & schedule...</div>'

                // Parallel Fetch: Predictions + Real Walk Time
                const now = new Date()
                const [predictions, walkInfo] = await Promise.all([
                    MBTAService.getPredictions(stop.id),
                    getRealWalkInfo(userLocationCoords.current, stop.latitude, stop.longitude)
                ])

                if (predictions.length === 0) {
                    resultsContainer.innerHTML = '<div class="no-predictions">No upcoming arrivals</div>'
                    return
                }

                let walkHtml = ''
                if (walkInfo) {
                    const walkLabel = walkInfo.isReal ? 'Fastest Walk' : 'Est. Walk'
                    walkHtml = `
                        <div class="walk-info" style="margin-bottom: 3px; font-size: 8px; display: flex; align-items: center; gap: 4px; color: #4a5568; background: #f7fafc; padding: 1px 4px; border-radius: 3px;">
                            <span>🚶</span> <strong>${walkInfo.minutes} min</strong> <span style="color: #718096">(${walkInfo.distance} km) - ${walkLabel}</span>
                        </div>
                    `
                }

                const byDirection = {}
                predictions.forEach(p => {
                    // Filter out buses if showBuses is false
                    if (!showBuses && p.route?.type === 3) return

                    const time = new Date(p.arrivalTime || p.departureTime)
                    const diffMs = time - now
                    const diffMins = Math.floor(diffMs / 60000)

                    if (walkInfo) {
                        const spareTime = diffMins - walkInfo.minutes
                        if (spareTime < -2) return
                    }

                    const dirId = p.directionId ?? 0
                    if (!byDirection[dirId]) byDirection[dirId] = []
                    byDirection[dirId].push(p)
                })

                const html = Object.keys(byDirection).sort().map(dirId => {
                    const preds = byDirection[dirId]
                    const route = preds[0].route
                    const dirName = route?.directionNames?.[dirId] || (dirId == 0 ? 'Outbound' : 'Inbound')

                    // Limit logic
                    const byHeadsign = {}
                    preds.forEach(p => {
                        if (!byHeadsign[p.headsign]) byHeadsign[p.headsign] = []
                        if (byHeadsign[p.headsign].length < 2) {
                            byHeadsign[p.headsign].push(p)
                        }
                    })

                    const subset = Object.values(byHeadsign).flat().sort((a, b) => {
                        const tA = new Date(a.arrivalTime || a.departureTime)
                        const tB = new Date(b.arrivalTime || b.departureTime)
                        return tA - tB
                    })

                    const rows = subset.map(p => {
                        const time = new Date(p.arrivalTime || p.departureTime)
                        const diffMs = time - now
                        const diffMins = Math.floor(diffMs / 60000)
                        const timeString = diffMins <= 0 ? 'Now' : `${diffMins} min`
                        const routeColor = p.route?.color ? `#${p.route.color}` : '#666'

                        let statusHtml = ''
                        if (walkInfo) {
                            const spareTime = diffMins - walkInfo.minutes
                            let statusColor = '#38a169' // Green
                            let statusText = `Start walking in ${spareTime} min`

                            if (spareTime <= 1) {
                                statusColor = '#d69e2e' // Orange
                                statusText = `Start walking NOW!`
                            }

                            statusHtml = `<div style="font-size: 7px; color: ${statusColor}; font-weight: 700; margin-top: 0px;">${statusText}</div>`
                        } else {
                            statusHtml = `<div style="font-size: 7px; color: #718096; margin-top: 0px;">${p.status || 'Scheduled'}</div>`
                        }

                        return `
                            <div class="prediction-row" style="border-left: 3px solid ${routeColor}; flex-direction: column; align-items: stretch; gap: 0; padding-bottom: 8px;">
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <div class="pred-route-badge" style="background: ${routeColor}; color: #${p.route?.textColor || 'ffffff'}">${p.route?.shortName || ''}</div>
                                    <div class="pred-dest">${p.headsign}</div>
                                    <div class="pred-time" style="margin-left: auto;">${timeString}</div>
                                </div>
                                <div style="display: flex; justify-content: flex-end;">
                                    ${statusHtml}
                                </div>
                            </div>
                        `
                    }).join('')

                    return `<div class="direction-header">${dirName}</div>` + rows
                }).join('')

                if (!html) {
                    resultsContainer.innerHTML = walkHtml + '<div class="no-predictions">No reachable arrivals</div>'
                } else {
                    resultsContainer.innerHTML = walkHtml + html
                }
            })

            marker.bindTooltip(stop.name, {
                permanent: true,
                direction: 'top',
                offset: [0, -6],
                className: 'stop-label-tooltip',
                opacity: 0.9,
                interactive: true
            })

            // Ensure clicking the label opens the popup
            const tooltip = marker.getTooltip()
            if (tooltip) tooltip.on('click', () => marker.openPopup())

            stopMarkersRef.current[stop.id] = marker
        })
    }, [stops])

    // Update vehicle markers
    useEffect(() => {
        if (!mapInstanceRef.current) return

        const activeVehicleIds = new Set(vehicles.map(v => v.id))

        Object.keys(vehicleMarkersRef.current).forEach(vehicleId => {
            if (!activeVehicleIds.has(vehicleId)) {
                mapInstanceRef.current.removeLayer(vehicleMarkersRef.current[vehicleId])
                delete vehicleMarkersRef.current[vehicleId]
            }
        })

        vehicles.forEach(vehicle => {
            const existingMarker = vehicleMarkersRef.current[vehicle.id]
            const routeColor = vehicle.route?.color || '#4299e1'

            if (existingMarker) {
                existingMarker.setLatLng([vehicle.latitude, vehicle.longitude])
                existingMarker.setZIndexOffset(vehicle.id === followedVehicleId ? 2000 : 1000)
                // If the bearing changes, we need to update the icon
                const currentIconHtml = existingMarker.options.icon.options.html;
                const newIconHtml = `
            <div class="vehicle-marker-inner" style="
              width: 24px;
              height: 24px;
              transform: rotate(${vehicle.bearing || 0}deg);
              display: flex;
              align-items: center;
              justify-content: center;
              filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));
            ">
              <svg width="24" height="24" viewBox="0 0 24 24">
                <path d="M12 2L3 22L12 17L21 22L12 2Z" fill="white" stroke="${routeColor}" stroke-width="2" stroke-linejoin="round"/>
              </svg>
            </div>
          `;
                if (currentIconHtml !== newIconHtml) {
                    const newIcon = L.divIcon({
                        className: 'custom-vehicle-marker',
                        html: newIconHtml,
                        iconSize: [24, 24],
                        iconAnchor: [12, 12],
                    });
                    existingMarker.setIcon(newIcon);
                }
            } else {
                const icon = L.divIcon({
                    className: 'custom-vehicle-marker',
                    html: `
            <div class="vehicle-marker-inner" style="
              width: 24px;
              height: 24px;
              transform: rotate(${vehicle.bearing || 0}deg);
              display: flex;
              align-items: center;
              justify-content: center;
              filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));
            ">
              <svg width="24" height="24" viewBox="0 0 24 24">
                <path d="M12 2L3 22L12 17L21 22L12 2Z" fill="white" stroke="${routeColor}" stroke-width="2" stroke-linejoin="round"/>
              </svg>
            </div>
          `,
                    iconSize: [24, 24],
                    iconAnchor: [12, 12],
                })

                const marker = L.marker([vehicle.latitude, vehicle.longitude], {
                    icon,
                    zIndexOffset: 1000
                }).addTo(mapInstanceRef.current)

                const popupContent = `
          <div class="popup-content">
            <div class="popup-title">${vehicle.route?.name || 'Vehicle'}</div>
            <div class="popup-info">
              <strong>Status:</strong> ${vehicle.status || 'In Transit'}<br>
              ${vehicle.stop ? `<strong>Current Stop:</strong> ${vehicle.stop.name}<br>` : ''}
              ${vehicle.trip ? `<strong>Direction:</strong> ${vehicle.trip.headsign || 'N/A'}<br>` : ''}
              <strong>Speed:</strong> ${vehicle.speed ? `${Math.round(vehicle.speed * 2.237)} mph` : 'N/A'}
              <div class="vehicle-follow-hint" style="margin-top: 8px; font-size: 0.8em; color: #666; font-style: italic;">
                (Tracking this vehicle)
              </div>
            </div>
          </div>
        `

                marker.bindPopup(popupContent)

                marker.on('click', () => {
                    setFollowedVehicleId(vehicle.id)
                })

                vehicleMarkersRef.current[vehicle.id] = marker
            }
        })
    }, [vehicles, followedVehicleId])

    useEffect(() => {
        if (!mapInstanceRef.current || !followedVehicleId) return

        const vehicle = vehicles.find(v => v.id === followedVehicleId)
        if (vehicle) {
            mapInstanceRef.current.panTo([vehicle.latitude, vehicle.longitude], {
                animate: true,
                duration: 1.0
            })
        }
    }, [vehicles, followedVehicleId])

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
