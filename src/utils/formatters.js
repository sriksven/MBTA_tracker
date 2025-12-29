/**
 * Utility functions for MBTA Live Tracker
 */

/**
 * Format vehicle status from API format to human-readable format
 * @param {string} status - Raw status from MBTA API
 * @returns {string} - Human-readable status
 */
export const formatVehicleStatus = (status) => {
    if (!status) return 'In Transit'

    const statusMap = {
        'STOPPED_AT': 'Stopped at',
        'IN_TRANSIT_TO': 'In transit to',
        'INCOMING_AT': 'Incoming at',
        'ARRIVED': 'Arrived',
        'DEPARTED': 'Departed'
    }

    return statusMap[status] || status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
}

/**
 * Get route category based on route ID and type
 * @param {string} routeId - Route ID
 * @param {number} type - Route type (0=Light Rail, 1=Heavy Rail, 2=Commuter Rail, 3=Bus)
 * @returns {string} - Route category
 */
export const getRouteCategory = (routeId, type) => {
    // Green Line and Mattapan are Light Rail (Tram)
    if (routeId?.startsWith('Green-') || routeId === 'Mattapan') {
        return 'Light Rail'
    }

    // Red, Orange, Blue are Heavy Rail (Subway)
    if (['Red', 'Orange', 'Blue'].includes(routeId)) {
        return 'Heavy Rail'
    }

    // Commuter Rail
    if (type === 2 || routeId?.startsWith('CR-')) {
        return 'Commuter Rail'
    }

    // Bus
    if (type === 3) {
        return 'Bus'
    }

    // Default based on type
    const typeMap = {
        0: 'Light Rail',
        1: 'Heavy Rail',
        2: 'Commuter Rail',
        3: 'Bus',
        4: 'Ferry'
    }

    return typeMap[type] || 'Transit'
}

/**
 * Get transit mode label
 * @param {string} mode - Transit mode ('subway', 'bus', 'rail')
 * @returns {string} - Human-readable label
 */
export const getTransitModeLabel = (mode) => {
    const labels = {
        'subway': 'Subway & Light Rail',
        'bus': 'Bus Routes',
        'rail': 'Commuter Rail'
    }
    return labels[mode] || 'Transit'
}

/**
 * Filter alerts by transit mode and selected routes
 * @param {Array} alerts - All alerts
 * @param {string} transitMode - Current transit mode
 * @param {Set} selectedRoutes - Currently selected routes
 * @returns {Array} - Filtered alerts
 */
export const filterAlertsByMode = (alerts, transitMode, selectedRoutes) => {
    if (!alerts || alerts.length === 0) return []

    return alerts.filter(alert => {
        // If alert has affected routes, check if any match our selected routes
        if (alert.affectedRoutes && alert.affectedRoutes.length > 0) {
            return alert.affectedRoutes.some(routeId => selectedRoutes.has(routeId))
        }

        // If alert has route type, filter by transit mode
        if (alert.routeType !== undefined) {
            switch (transitMode) {
                case 'subway':
                    return alert.routeType === 0 || alert.routeType === 1
                case 'bus':
                    return alert.routeType === 3
                case 'rail':
                    return alert.routeType === 2
                default:
                    return true
            }
        }

        // If no specific route info, show all alerts
        return true
    })
}

/**
 * Format speed for display
 * @param {number} speed - Speed in meters per second
 * @returns {string} - Formatted speed string
 */
export const formatSpeed = (speed) => {
    if (!speed || speed === 0) return null
    const mph = Math.round(speed * 2.237)
    return `${mph} mph`
}

/**
 * Get color for route
 * @param {string} routeId - Route ID
 * @param {string} defaultColor - Default color if not found
 * @returns {string} - Color hex code
 */
export const getRouteColor = (routeId, defaultColor = '#666666') => {
    const colors = {
        'Red': '#DA291C',
        'Orange': '#ED8B00',
        'Blue': '#003DA5',
        'Green-B': '#00843D',
        'Green-C': '#00843D',
        'Green-D': '#00843D',
        'Green-E': '#00843D',
        'Mattapan': '#DA291C'
    }

    return colors[routeId] || defaultColor
}
