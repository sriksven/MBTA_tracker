// Script to fetch all MBTA stops and save them locally
// Run with: node scripts/fetch-stops.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MBTA_API_KEY = process.env.VITE_MBTA_API_KEY;
const MBTA_API_BASE = 'https://api-v3.mbta.com';

async function fetchAllStops() {
    console.log('Fetching all MBTA stops...');

    try {
        // Fetch all stops (no route filter)
        const response = await fetch(`${MBTA_API_BASE}/stops?api_key=${MBTA_API_KEY}`);
        const data = await response.json();

        if (!data.data) {
            throw new Error('No data received from API');
        }

        console.log(`Received ${data.data.length} stops from API`);

        // Process stops
        const stops = data.data
            .filter(stop => {
                const { latitude, longitude } = stop.attributes;
                return latitude && longitude; // Only include stops with coordinates
            })
            .map(stop => ({
                id: stop.id,
                name: stop.attributes.name,
                latitude: stop.attributes.latitude,
                longitude: stop.attributes.longitude,
                type: stop.attributes.location_type === 1 ? 'Station' : 'Stop',
                wheelchairAccessible: stop.attributes.wheelchair_boarding === 1,
                description: stop.attributes.description
            }));

        console.log(`Processed ${stops.length} stops with coordinates`);

        // Save to file
        const outputPath = path.join(__dirname, '..', 'public', 'data', 'stops.json');
        fs.writeFileSync(outputPath, JSON.stringify(stops, null, 2));

        console.log(`✅ Saved ${stops.length} stops to ${outputPath}`);
        console.log(`File size: ${(fs.statSync(outputPath).size / 1024).toFixed(2)} KB`);

    } catch (error) {
        console.error('❌ Error fetching stops:', error);
        process.exit(1);
    }
}

fetchAllStops();
