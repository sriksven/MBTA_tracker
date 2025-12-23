// MBTA API Configuration
const MBTA_API_KEY = 'd5dbafa546244e839c05bc7e3d5955d4';
const MBTA_API_BASE = 'https://api-v3.mbta.com';

// Map Configuration
let map;
let vehicleMarkers = {};
let stopMarkers = {};
let routeLines = {};
let selectedRoutes = new Set();
let updateInterval;

// Route Type Colors
const ROUTE_TYPE_COLORS = {
    0: '#00843d', // Light Rail (Green Line)
    1: '#003da5', // Heavy Rail (Blue, Orange, Red Lines)
    2: '#7c878e', // Commuter Rail
    3: '#ffc72c', // Bus
    4: '#008eaa'  // Ferry
};

// Specific Route Colors
const ROUTE_COLORS = {
    'Red': '#da291c',
    'Orange': '#ed8b00',
    'Blue': '#003da5',
    'Green-B': '#00843d',
    'Green-C': '#00843d',
    'Green-D': '#00843d',
    'Green-E': '#00843d',
    'Mattapan': '#da291c'
};

// Initialize the application
document.addEventListener('DOMContentLoaded', async () => {
    initMap();
    await loadRoutes();
    await loadAlerts();
    startAutoUpdate();

    // Event Listeners
    document.getElementById('refreshBtn').addEventListener('click', handleRefresh);
    document.getElementById('modalClose').addEventListener('click', closeModal);
});

// Initialize Leaflet Map
function initMap() {
    // Center on Boston
    map = L.map('map').setView([42.3601, -71.0589], 12);

    // Add tile layer with dark theme
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(map);
}

// Load Routes
async function loadRoutes() {
    try {
        const response = await fetch(`${MBTA_API_BASE}/routes?filter[type]=0,1&api_key=${MBTA_API_KEY}`);
        const data = await response.json();

        const routeFilters = document.getElementById('routeFilters');
        routeFilters.innerHTML = '';

        data.data.forEach(route => {
            const routeItem = createRouteFilterItem(route);
            routeFilters.appendChild(routeItem);
        });

        // Auto-select subway routes
        const subwayRoutes = data.data.filter(r => r.attributes.type === 0 || r.attributes.type === 1);
        subwayRoutes.forEach(route => {
            selectedRoutes.add(route.id);
            document.querySelector(`[data-route-id="${route.id}"]`)?.classList.add('active');
        });

        // Load initial data
        await updateVehicles();

    } catch (error) {
        console.error('Error loading routes:', error);
        document.getElementById('routeFilters').innerHTML = '<div class="filter-loading">Error loading routes</div>';
    }
}

// Create Route Filter Item
function createRouteFilterItem(route) {
    const div = document.createElement('div');
    div.className = 'route-filter-item';
    div.dataset.routeId = route.id;

    const color = ROUTE_COLORS[route.id] || ROUTE_TYPE_COLORS[route.attributes.type] || '#666';
    const textColor = getContrastColor(color);

    div.innerHTML = `
        <div class="route-color" style="background-color: ${color}; color: ${textColor};">
            ${route.attributes.short_name || route.id.substring(0, 2).toUpperCase()}
        </div>
        <div class="route-info">
            <div class="route-name">${route.attributes.long_name}</div>
            <div class="route-type">${getRouteTypeName(route.attributes.type)}</div>
        </div>
    `;

    div.addEventListener('click', () => toggleRoute(route.id, div));

    return div;
}

// Toggle Route Selection
function toggleRoute(routeId, element) {
    if (selectedRoutes.has(routeId)) {
        selectedRoutes.delete(routeId);
        element.classList.remove('active');
    } else {
        selectedRoutes.add(routeId);
        element.classList.add('active');
    }

    updateVehicles();
}

// Update Vehicles
async function updateVehicles() {
    if (selectedRoutes.size === 0) {
        clearVehicles();
        return;
    }

    try {
        const routeFilter = Array.from(selectedRoutes).join(',');
        const response = await fetch(
            `${MBTA_API_BASE}/vehicles?filter[route]=${routeFilter}&include=trip,stop&api_key=${MBTA_API_KEY}`
        );
        const data = await response.json();

        // Track which vehicles are still active
        const activeVehicleIds = new Set();

        // Update or add vehicle markers with smooth animation
        data.data.forEach(vehicle => {
            activeVehicleIds.add(vehicle.id);
            updateOrAddVehicleMarker(vehicle, data.included);
        });

        // Remove vehicles that are no longer active
        Object.keys(vehicleMarkers).forEach(vehicleId => {
            if (!activeVehicleIds.has(vehicleId)) {
                map.removeLayer(vehicleMarkers[vehicleId]);
                delete vehicleMarkers[vehicleId];
            }
        });

        // Update stats
        document.getElementById('vehicleCount').textContent = data.data.length;
        updateLastUpdateTime();

        // Hide loading overlay
        document.getElementById('loadingOverlay').classList.add('hidden');

    } catch (error) {
        console.error('Error updating vehicles:', error);
    }
}

// Update or Add Vehicle Marker with smooth animation
function updateOrAddVehicleMarker(vehicle, included) {
    const { latitude, longitude, bearing } = vehicle.attributes;

    if (!latitude || !longitude) return;

    // Get route info
    const route = included?.find(i => i.type === 'route' && vehicle.relationships?.route?.data?.id === i.id);
    const routeColor = route ? (ROUTE_COLORS[route.id] || ROUTE_TYPE_COLORS[route.attributes.type]) : '#4299e1';

    // Check if marker already exists
    const existingMarker = vehicleMarkers[vehicle.id];

    if (existingMarker) {
        // Smoothly animate to new position
        const currentLatLng = existingMarker.getLatLng();
        const newLatLng = L.latLng(latitude, longitude);

        // Only animate if position has changed
        if (currentLatLng.lat !== newLatLng.lat || currentLatLng.lng !== newLatLng.lng) {
            animateMarker(existingMarker, currentLatLng, newLatLng, bearing, routeColor);
        } else if (bearing !== null && bearing !== undefined) {
            // Update rotation even if position hasn't changed
            updateMarkerRotation(existingMarker, bearing, routeColor);
        }

        // Update popup content
        updateVehiclePopup(existingMarker, vehicle, route, included);
    } else {
        // Create new marker
        addVehicleMarker(vehicle, included, routeColor);
    }
}

// Animate marker from old position to new position
function animateMarker(marker, startLatLng, endLatLng, bearing, routeColor) {
    const duration = 1000; // 1 second to match update interval
    const startTime = Date.now();

    function animate() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Ease-in-out function for smooth animation
        const easeProgress = progress < 0.5
            ? 2 * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 2) / 2;

        // Interpolate position
        const lat = startLatLng.lat + (endLatLng.lat - startLatLng.lat) * easeProgress;
        const lng = startLatLng.lng + (endLatLng.lng - startLatLng.lng) * easeProgress;

        marker.setLatLng([lat, lng]);

        // Update rotation
        if (bearing !== null && bearing !== undefined) {
            updateMarkerRotation(marker, bearing, routeColor);
        }

        if (progress < 1) {
            requestAnimationFrame(animate);
        }
    }

    animate();
}

// Update marker rotation
function updateMarkerRotation(marker, bearing, routeColor) {
    const iconElement = marker.getElement();
    if (iconElement) {
        const markerDiv = iconElement.querySelector('div');
        if (markerDiv) {
            markerDiv.style.transform = `rotate(${bearing || 0}deg)`;
            markerDiv.style.transition = 'transform 1s ease-out';
        }
    }
}

// Update vehicle popup content
function updateVehiclePopup(marker, vehicle, route, included) {
    const trip = included?.find(i => i.type === 'trip' && vehicle.relationships?.trip?.data?.id === i.id);
    const stop = included?.find(i => i.type === 'stop' && vehicle.relationships?.stop?.data?.id === i.id);

    const popupContent = `
        <div class="popup-content">
            <div class="popup-title">${route?.attributes.long_name || 'Vehicle'}</div>
            <div class="popup-info">
                <strong>Status:</strong> ${vehicle.attributes.current_status || 'In Transit'}<br>
                ${stop ? `<strong>Current Stop:</strong> ${stop.attributes.name}<br>` : ''}
                ${trip ? `<strong>Direction:</strong> ${trip.attributes.headsign || 'N/A'}<br>` : ''}
                <strong>Speed:</strong> ${vehicle.attributes.speed ? `${Math.round(vehicle.attributes.speed * 2.237)} mph` : 'N/A'}
            </div>
        </div>
    `;

    marker.setPopupContent(popupContent);
}

// Add Vehicle Marker (for new vehicles)
function addVehicleMarker(vehicle, included, routeColor) {
    const { latitude, longitude, bearing } = vehicle.attributes;

    if (!latitude || !longitude) return;

    const route = included?.find(i => i.type === 'route' && vehicle.relationships?.route?.data?.id === i.id);

    // Create custom icon with animation support
    const icon = L.divIcon({
        className: 'custom-vehicle-marker',
        html: `
            <div class="vehicle-marker-inner" style="
                width: 24px;
                height: 24px;
                background: ${routeColor};
                border: 3px solid white;
                border-radius: 50%;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3), 0 0 0 0 ${routeColor};
                transform: rotate(${bearing || 0}deg);
                display: flex;
                align-items: center;
                justify-content: center;
                animation: pulse 2s infinite;
            ">
                <div style="
                    width: 0;
                    height: 0;
                    border-left: 4px solid transparent;
                    border-right: 4px solid transparent;
                    border-bottom: 8px solid white;
                    transform: translateY(-2px);
                "></div>
            </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
    });

    const marker = L.marker([latitude, longitude], { icon })
        .addTo(map);

    // Add popup
    const trip = included?.find(i => i.type === 'trip' && vehicle.relationships?.trip?.data?.id === i.id);
    const stop = included?.find(i => i.type === 'stop' && vehicle.relationships?.stop?.data?.id === i.id);

    const popupContent = `
        <div class="popup-content">
            <div class="popup-title">${route?.attributes.long_name || 'Vehicle'}</div>
            <div class="popup-info">
                <strong>Status:</strong> ${vehicle.attributes.current_status || 'In Transit'}<br>
                ${stop ? `<strong>Current Stop:</strong> ${stop.attributes.name}<br>` : ''}
                ${trip ? `<strong>Direction:</strong> ${trip.attributes.headsign || 'N/A'}<br>` : ''}
                <strong>Speed:</strong> ${vehicle.attributes.speed ? `${Math.round(vehicle.attributes.speed * 2.237)} mph` : 'N/A'}
            </div>
        </div>
    `;

    marker.bindPopup(popupContent);

    vehicleMarkers[vehicle.id] = marker;
}

// Clear Vehicles
function clearVehicles() {
    Object.values(vehicleMarkers).forEach(marker => map.removeLayer(marker));
    vehicleMarkers = {};
}

// Load Alerts
async function loadAlerts() {
    try {
        const response = await fetch(`${MBTA_API_BASE}/alerts?filter[activity]=BOARD,EXIT,RIDE&page[limit]=5&api_key=${MBTA_API_KEY}`);
        const data = await response.json();

        const alertsContainer = document.getElementById('alertsContainer');

        if (data.data.length === 0) {
            alertsContainer.innerHTML = '<div class="alert-loading">No active alerts</div>';
            return;
        }

        alertsContainer.innerHTML = '';

        data.data.forEach(alert => {
            const alertItem = document.createElement('div');
            alertItem.className = 'alert-item';
            alertItem.innerHTML = `
                <div class="alert-header">${alert.attributes.header || 'Service Alert'}</div>
                <div class="alert-description">${alert.attributes.short_header || alert.attributes.description || 'Check MBTA.com for details'}</div>
            `;
            alertsContainer.appendChild(alertItem);
        });

    } catch (error) {
        console.error('Error loading alerts:', error);
        document.getElementById('alertsContainer').innerHTML = '<div class="alert-loading">Error loading alerts</div>';
    }
}

// Start Auto Update
function startAutoUpdate() {
    // Update vehicles every 1 second
    updateInterval = setInterval(() => {
        if (selectedRoutes.size > 0) {
            updateVehicles();
        }
    }, 1000);
}

// Handle Refresh
async function handleRefresh() {
    const btn = document.getElementById('refreshBtn');
    btn.classList.add('spinning');

    await Promise.all([
        updateVehicles(),
        loadAlerts()
    ]);

    setTimeout(() => {
        btn.classList.remove('spinning');
    }, 1000);
}

// Update Last Update Time
function updateLastUpdateTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    document.getElementById('lastUpdate').textContent = timeString;
}

// Close Modal
function closeModal() {
    document.getElementById('vehicleModal').classList.remove('active');
}

// Helper Functions
function getRouteTypeName(type) {
    const types = {
        0: 'Light Rail',
        1: 'Heavy Rail',
        2: 'Commuter Rail',
        3: 'Bus',
        4: 'Ferry'
    };
    return types[type] || 'Transit';
}

function getContrastColor(hexColor) {
    // Convert hex to RGB
    const r = parseInt(hexColor.substr(1, 2), 16);
    const g = parseInt(hexColor.substr(3, 2), 16);
    const b = parseInt(hexColor.substr(5, 2), 16);

    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    return luminance > 0.5 ? '#000000' : '#ffffff';
}

// Handle page visibility change (pause updates when tab is hidden)
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        clearInterval(updateInterval);
    } else {
        startAutoUpdate();
        updateVehicles();
    }
});

// Mobile Menu Setup
function setupMobileMenu() {
    const menuToggle = document.getElementById('mobileMenuToggle');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('mobileOverlay');

    // Toggle sidebar
    menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('open');
        overlay.classList.toggle('active');
    });

    // Close sidebar when clicking overlay
    overlay.addEventListener('click', () => {
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
    });

    // Close sidebar when selecting a route on mobile
    document.addEventListener('click', (e) => {
        if (e.target.closest('.route-filter-item') && window.innerWidth <= 768) {
            setTimeout(() => {
                sidebar.classList.remove('open');
                overlay.classList.remove('active');
            }, 300);
        }
    });
}

// Initialize mobile menu on load
document.addEventListener('DOMContentLoaded', () => {
    setupMobileMenu();
});
