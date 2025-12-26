import { useState, useEffect, useRef } from 'react'
import './LocationSearch.css'

function LocationSearch({ onLocationSelect, reset }) {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState([])
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const containerRef = useRef(null)

    // Reset query when reset prop changes
    useEffect(() => {
        if (reset) {
            setQuery('')
            setResults([])
            setIsOpen(false)
        }
    }, [reset])

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (query.length < 3) {
                setResults([])
                return
            }

            setLoading(true)
            try {
                // Photon API (Komoot) - Excellent for autocomplete and fuzzy search
                // Bias towards Boston (approx center params)
                const lat = 42.3601
                const lon = -71.0589
                const response = await fetch(
                    `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&lat=${lat}&lon=${lon}&limit=5`,
                    {
                        headers: {
                            'User-Agent': 'MBTA-Live-Tracker/1.0'
                        }
                    }
                )
                const data = await response.json()
                // Photon returns GeoJSON features
                setResults(data.features)
                setIsOpen(true)
            } catch (err) {
                console.error("Geocoding error:", err)
            } finally {
                setLoading(false)
            }
        }, 500)

        return () => clearTimeout(timer)
    }, [query])

    const handleSelect = (feature) => {
        const props = feature.properties
        const name = props.name || `${props.housenumber || ''} ${props.street || ''}`.trim() || feature.properties.formatted
        const coords = feature.geometry.coordinates

        setQuery(name)
        setIsOpen(false)
        onLocationSelect({
            lat: coords[1], // GeoJSON is [lon, lat]
            lng: coords[0],
            label: `${name}, ${props.city || ''}, ${props.state || 'MA'}`
        })
    }

    const getDisplayName = (props) => {
        const title = props.name || `${props.housenumber || ''} ${props.street || ''}`.trim()
        const subtitle = [props.city, props.state, props.postcode].filter(Boolean).join(', ')
        return { title, subtitle }
    }

    return (
        <div className="location-search" ref={containerRef}>
            <div className="search-input-wrapper">
                <span className="search-icon">🔍</span>
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => query.length >= 3 && setIsOpen(true)}
                    placeholder="Search address"
                    aria-label="Search location"
                />
                {loading && <div className="search-spinner"></div>}
            </div>

            {isOpen && results.length > 0 && (
                <ul className="search-results">
                    {results.map((feature, index) => {
                        const { title, subtitle } = getDisplayName(feature.properties)
                        return (
                            <li key={index} onClick={() => handleSelect(feature)}>
                                <div className="result-name">{title}</div>
                                <div className="result-detail">{subtitle}</div>
                            </li>
                        )
                    })}
                </ul>
            )}
        </div>
    )
}

export default LocationSearch
