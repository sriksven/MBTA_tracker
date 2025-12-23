import './SidebarToggle.css'

function SidebarToggle({ label, side, isOpen, badge, onClick }) {
    return (
        <button
            className={`sidebar-toggle ${side} ${isOpen ? 'hidden' : ''}`}
            onClick={onClick}
            aria-label={`Toggle ${label}`}
        >
            <span>{label}</span>
            {badge > 0 && <span className="badge">{badge}</span>}
        </button>
    )
}

export default SidebarToggle
