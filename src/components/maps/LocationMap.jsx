import React, { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const geocodeCache = {};
const distanceCache = {};

async function geocode(location) {
    if (geocodeCache[location]) return geocodeCache[location];
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1`);
        const data = await response.json();
        if (data && data.length > 0) {
            const { lat, lon } = data[0];
            const result = [parseFloat(lat), parseFloat(lon)];
            geocodeCache[location] = result;
            return result;
        }
    } catch (error) { console.error("Geocoding error:", error); }
    return null;
}

async function getDistance(from, to) {
    const key = `${from.join(',')}|${to.join(',')}`;
    if (distanceCache[key]) return distanceCache[key];
    try {
        const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}?overview=false`);
        const data = await response.json();
        if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
            const distanceInMeters = data.routes[0].distance;
            const distanceInMiles = distanceInMeters / 1609.34;
            distanceCache[key] = distanceInMiles;
            return distanceInMiles;
        }
    } catch (error) { console.error("Distance calculation error:", error); }
    return 0;
}

export const LocationMap = ({ locations, origin, onDistanceChange }) => {
    const [positions, setPositions] = useState([]);
    const [loading, setLoading] = useState(true);

    const processLocations = useCallback(async () => {
        let isMounted = true;
        setLoading(true);

        const uniqueLocations = [...new Set(locations.map(l => l.location))];
        const geocoded = await Promise.all(uniqueLocations.map(loc => geocode(loc)));
        
        const locationMap = uniqueLocations.reduce((acc, loc, index) => {
            acc[loc] = geocoded[index];
            return acc;
        }, {});

        const mappedPositions = locations.map(l => ({
            ...l,
            position: locationMap[l.location]
        })).filter(l => l.position);
        
        if (isMounted) {
            setPositions(mappedPositions);
            setLoading(false);
        }

        if (origin && onDistanceChange) {
            const originCoords = await geocode(origin);
            if (originCoords) {
                const distances = await Promise.all(
                    mappedPositions.map(p => getDistance(originCoords, p.position))
                );
                const totalRoundTrip = distances.reduce((sum, dist) => sum + (dist * 2), 0);
                if (isMounted) onDistanceChange(totalRoundTrip);
            }
        }
        return () => { isMounted = false; };
    }, [JSON.stringify(locations), origin, onDistanceChange]);

    useEffect(() => {
        processLocations();
    }, [processLocations]);

    if (loading) {
        return <div className="h-[400px] w-full flex items-center justify-center bg-gray-100 rounded-lg">Loading map...</div>;
    }
    
    if (positions.length === 0) {
        return <div className="h-[400px] w-full flex items-center justify-center bg-gray-100 rounded-lg">No locations to display on map.</div>;
    }

    const center = positions.length > 0 ? positions[0].position : [39.8283, -98.5795];
    
    return (
        <MapContainer center={center} zoom={positions.length > 1 ? 4 : 6} scrollWheelZoom={false} style={{ height: '400px', width: '100%', borderRadius: '0.5rem' }}>
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {positions.map((pos, index) => (
                <Marker key={index} position={pos.position}>
                    <Popup>{pos.tooltip}</Popup>
                </Marker>
            ))}
        </MapContainer>
    );
};