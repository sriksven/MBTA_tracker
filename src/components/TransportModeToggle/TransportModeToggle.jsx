import './TransportModeToggle.css'

function TransportModeToggle({ onClick, isOpen }) {
    return (
        <button
            className={`transport-mode-toggle ${isOpen ? 'active' : ''}`}
            onClick={onClick}
            aria-label="Toggle transport mode selector"
            title="Choose transport mode"
        >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 17H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-2" />
                <path d="M9 17v5l3-3 3 3v-5" />
            </svg>
        </button>
    )
}

export default TransportModeToggle
