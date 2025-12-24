import { useState, useEffect, useRef } from 'react'
import './LocationSearch.css'

function LocationSearch({ onLocationSelect }) {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState([])
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const containerRef = useRef(null)

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
                // Bounds for Greater Boston approx
                const viewbox = '-71.1912,42.2279,-70.9228,42.4368'
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&viewbox=${viewbox}&bounded=1&limit=5`,
                    {
                        headers: {
                            'User-Agent': 'MBTA-Live-Tracker/1.0'
                        }
                    }
                )
                const data = await response.json()
                setResults(data)
                setIsOpen(true)
            } catch (err) {
                console.error("Geocoding error:", err)
            } finally {
                setLoading(false)
            }
        }, 500)

        return () => clearTimeout(timer)
    }, [query])

    const handleSelect = (result) => {
        setQuery(result.display_name.split(',')[0]) // Keep short name
        setIsOpen(false)
        onLocationSelect({
            lat: parseFloat(result.lat),
            lng: parseFloat(result.lon),
            label: result.display_name
        })
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
                    placeholder="Check for friend (Enter address)..."
                    aria-label="Search location"
                />
                {loading && <div className="search-spinner"></div>}
            </div>

            {isOpen && results.length > 0 && (
                <ul className="search-results">
                    {results.map((result) => (
                        <li key={result.place_id} onClick={() => handleSelect(result)}>
                            <div className="result-name">{result.display_name.split(',')[0]}</div>
                            <div className="result-detail">
                                {result.display_name.split(',').slice(1).join(',')}
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}

export default LocationSearch
