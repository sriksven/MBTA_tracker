import './RouteSelector.css'

function RouteSelector({
    routes,
    selectedRoutes,
    onToggleRoute,
    onRefresh,
    isOpen,
    onClose,
    showTrams,
    setShowTrams,
    showBuses,
    setShowBuses
}) {
    const handleToggle = (routeId) => {
        onToggleRoute(routeId)
    }

    // Filter routes for display list based on toggles as well?
    // User said "keep only buses and keep only trams" filter.
    // If I uncheck "Trams", should they disappear from the LIST?
    // "when either is togglrd off the lines and stops for that specific filter should turn off"
    // It doesn't explicitly say they should disappear from the LIST, but it's good UX.
    // If they disappear from list, how do I re-enable them? 
    // Ah, the filter acts as a "View Filter". So yes, list should probably filter too, or at least be grouped?
    // I'll filter the list too.

    const visibleRoutes = routes.filter(r => {
        if (r.type === 3) return showBuses
        return showTrams // 0 or 1
    })

    return (
        <aside className={`route-selector ${isOpen ? '' : 'collapsed'}`}>
            <div className="route-selector-header">
                <h2>Route Filters</h2>
                <div className="header-buttons">
                    <button className="refresh-btn-small" onClick={onRefresh} aria-label="Refresh">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
                        </svg>
                    </button>
                    <button className="close-btn" onClick={onClose} aria-label="Close routes">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>

            <div className="type-filters">
                <div className="filter-toggle">
                    <span className="filter-label">🚆 Trams & Subways</span>
                    <label className="switch">
                        <input
                            type="checkbox"
                            checked={showTrams}
                            onChange={(e) => setShowTrams(e.target.checked)}
                        />
                        <span className="slider round"></span>
                    </label>
                </div>
                <div className="filter-toggle">
                    <span className="filter-label">🚌 Buses</span>
                    <label className="switch">
                        <input
                            type="checkbox"
                            checked={showBuses}
                            onChange={(e) => setShowBuses(e.target.checked)}
                        />
                        <span className="slider round"></span>
                    </label>
                </div>
            </div>

            <div className="filter-divider-line"></div>

            <div className="route-list">
                {visibleRoutes.map(route => (
                    <button
                        key={route.id}
                        className={`route-item ${selectedRoutes.has(route.id) ? 'active' : ''}`}
                        onClick={() => handleToggle(route.id)}
                        style={{
                            '--route-color': route.color
                        }}
                    >
                        <div className="route-badge" style={{ background: route.color }}>
                            {route.shortName || route.id}
                        </div>
                        <div className="route-name">{route.name}</div>
                    </button>
                ))}
                {visibleRoutes.length === 0 && (
                    <div className="no-routes-msg">Enable filters to see routes</div>
                )}
            </div>
        </aside>
    )
}

export default RouteSelector
