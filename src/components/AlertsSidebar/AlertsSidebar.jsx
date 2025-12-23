import './AlertsSidebar.css'

function AlertsSidebar({ alerts, isOpen, onClose }) {
    return (
        <>
            <aside className={`alerts-sidebar ${isOpen ? '' : 'collapsed'}`}>
                <div className="alerts-sidebar-header">
                    <h2>Service Alerts</h2>
                    <button className="close-btn" onClick={onClose} aria-label="Close alerts">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="alerts-sidebar-content">
                    {alerts.length === 0 ? (
                        <div className="no-alerts">
                            <svg
                                width="48"
                                height="48"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                            >
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                <polyline points="22 4 12 14.01 9 11.01" />
                            </svg>
                            <p>No active alerts</p>
                        </div>
                    ) : (
                        <div className="alerts-list">
                            {alerts.map(alert => (
                                <div key={alert.id} className="alert-item">
                                    <div className="alert-header">{alert.header}</div>
                                    <div className="alert-description">{alert.description}</div>
                                    {alert.severity && (
                                        <div className={`alert-severity severity-${typeof alert.severity === 'string' ? alert.severity.toLowerCase() : 'level-' + alert.severity}`}>
                                            {typeof alert.severity === 'string' ? alert.severity : `Level ${alert.severity}`}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </aside>

            {isOpen && <div className="alerts-overlay" onClick={onClose} />}
        </>
    )
}

export default AlertsSidebar
