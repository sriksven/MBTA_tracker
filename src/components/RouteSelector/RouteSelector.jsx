import './RouteSelector.css'

function RouteSelector({
    routes,
    selectedRoutes,
    onToggleRoute,
    onResetRoutes,
    isOpen,
    onClose,
    transitMode
}) {
    const handleToggle = (routeId) => {
        onToggleRoute(routeId)
    }

    // Get section header based on transit mode
    const getSectionHeader = () => {
        switch (transitMode) {
            case 'subway':
                return 'Subway & Light Rail'
            case 'bus':
                return 'Bus Routes'
            case 'rail':
                return 'Commuter Rail'
            default:
                return 'Routes'
        }
    }



    return (
        <aside className={`route-selector ${isOpen ? 'open' : ''}`}>
            <div className="route-selector-header">
                <h2>Route Filters</h2>
                <div className="header-buttons">
                    <button className="refresh-btn-small" onClick={onResetRoutes} aria-label="Reset to default routes">
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

            <div className="filter-divider-line"></div>

            <div className="route-list">
                {routes.length > 0 ? (
                    <>
                        <div className="route-section-header">{getSectionHeader()}</div>
                        {routes.map(route => (
                            <button
                                key={route.id}
                                className={`route-item ${selectedRoutes.has(route.id) ? 'active' : ''}`}
                                onClick={() => handleToggle(route.id)}
                                style={{
                                    '--route-color': route.color
                                }}
                            >
                                <div className="route-name">{route.name}</div>
                            </button>
                        ))}
                    </>
                ) : (
                    <div className="no-routes-msg">No routes available</div>
                )}
            </div>
        </aside>
    )
}

export default RouteSelector
