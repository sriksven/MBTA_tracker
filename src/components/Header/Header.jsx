import { useEffect, useState } from 'react'
import './Header.css'

function Header({
    vehicleCount,
    alertCount,
    lastUpdate
}) {
    const [timeString, setTimeString] = useState('--:--:--')

    useEffect(() => {
        if (lastUpdate) {
            setTimeString(lastUpdate.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            }))
        }
    }, [lastUpdate])

    return (
        <header className="header">
            <div className="header-content">
                <div className="logo">
                    <div className="logo-icon">T</div>
                    <h1>MBTA Live Tracker</h1>
                </div>

                <div className="header-stats">
                    <div className="stat-item">
                        <span className="stat-label">Active Vehicles</span>
                        <span className="stat-value">{vehicleCount}</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">Last Update</span>
                        <span className="stat-value">{timeString}</span>
                    </div>
                </div>
            </div>
        </header>
    )
}

export default Header
