import './SidebarToggle.css'

function SidebarToggle({ label, side, isOpen, badge, onClick, position }) {
    const sidebarOpenClass = isOpen ? 'sidebar-open' : '';

    return (
        <button
            className={`sidebar-toggle ${side} ${sidebarOpenClass} ${position ? `position-${position}` : ''}`}
            onClick={onClick}
            aria-label={`Toggle ${label}`}
        >
            <span>{label}</span>
            {badge > 0 && <span className="badge">{badge}</span>}
        </button>
    )
}

export default SidebarToggle
