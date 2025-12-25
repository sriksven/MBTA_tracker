import './TransportModeSelector.css'

function TransportModeSelector({ isOpen, onClose, selectedMode, onModeChange }) {
    const modes = [
        { id: 'walking', icon: '🚶', label: 'Walking' },
        { id: 'biking', icon: '🚴', label: 'Biking' },
        { id: 'driving', icon: '🚗', label: 'Driving' },
        { id: 'transit', icon: '🚌', label: 'Public Transit' }
    ]

    return (
        <aside className={`transport-mode-selector ${isOpen ? '' : 'collapsed'}`}>
            <div className="transport-mode-header">
                <h2>Transport Mode</h2>
                <button className="close-btn" onClick={onClose} aria-label="Close transport mode">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <div className="mode-grid">
                {modes.map(mode => (
                    <button
                        key={mode.id}
                        className={`mode-icon-btn ${selectedMode === mode.id ? 'active' : ''}`}
                        onClick={() => onModeChange(mode.id)}
                        title={mode.label}
                        aria-label={mode.label}
                    >
                        <span className="mode-emoji">{mode.icon}</span>
                    </button>
                ))}
            </div>
        </aside>
    )
}

export default TransportModeSelector
