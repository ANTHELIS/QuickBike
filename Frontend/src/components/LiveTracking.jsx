import React, { useState, useEffect, useRef, useCallback, useContext } from 'react'
import { useJsApiLoader, GoogleMap, Marker, DirectionsRenderer } from '@react-google-maps/api'
import axios from 'axios'
import { SocketContext } from '../context/SocketContext'

const containerStyle = { width: '100%', height: '100%' }
const defaultCenter  = { lat: 22.5726, lng: 88.3639 } // Kolkata fallback

// --- Bike marker icon (inline SVG as data URI, no emoji for reliability) ---
const makeBikeIcon = () => ({
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40">
          <circle cx="20" cy="20" r="19" fill="white" stroke="#E67E00" stroke-width="2"/>
          <g transform="translate(8,11)">
            <!-- Simple bike shape -->
            <circle cx="4"  cy="13" r="3.5" fill="none" stroke="#E67E00" stroke-width="2"/>
            <circle cx="20" cy="13" r="3.5" fill="none" stroke="#E67E00" stroke-width="2"/>
            <path d="M4 13 L8 5 L14 5 L20 13" fill="none" stroke="#E67E00" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M14 5 L16 9" fill="none" stroke="#E67E00" stroke-width="2" stroke-linecap="round"/>
            <circle cx="16" cy="9" r="1.5" fill="#E67E00"/>
          </g>
        </svg>`
    )}`,
    scaledSize: { width: 40, height: 40 },
    anchor: { x: 20, y: 20 },
})

const LiveTracking = ({ pickup, destination, liveRoute = false }) => {
    const [currentPosition, setCurrentPosition] = useState(defaultCenter)
    const [nearbyCaptains, setNearbyCaptains] = useState([])
    const [captainCount, setCaptainCount] = useState(0)
    const [gpsLoading, setGpsLoading] = useState(false)
    const [directionsResponse, setDirectionsResponse] = useState(null)
    const mapRef      = useRef(null)
    const positionRef = useRef(defaultCenter)
    const bikeIcon    = useRef(null)

    const { socket } = useContext(SocketContext)

    const { isLoaded } = useJsApiLoader({
        id: 'quickbike-map',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    })

    const onMapLoad = useCallback((map) => {
        mapRef.current = map
        bikeIcon.current = makeBikeIcon()
    }, [])

    // ── Route Directions (Static A-B vs Dynamic Current-B) ──
    const lastCalculatedPos = useRef(null)

    useEffect(() => {
        if (!isLoaded || !window.google || !destination) return;
        
        // If not liveRoute, we just need pickup and destination
        if (!liveRoute && !pickup) return;

        let origin = pickup;

        // If liveRoute, the origin is the current GPS position
        if (liveRoute) {
            // Wait for real GPS data (don't route from fallback Kolkata if not there)
            if (currentPosition.lat === defaultCenter.lat && currentPosition.lng === defaultCenter.lng) return;
            
            // To prevent spamming Google Maps Directions API, only recalculate if moved > 50 meters
            if (lastCalculatedPos.current) {
                const distance = window.google.maps.geometry.spherical.computeDistanceBetween(
                    lastCalculatedPos.current, currentPosition
                );
                if (distance < 50) return; // Haven't moved enough to recalculate
            }
            origin = currentPosition;
        }
        
        const directionsService = new window.google.maps.DirectionsService();
        directionsService.route(
            {
                origin: origin,
                destination: destination,
                travelMode: window.google.maps.TravelMode.DRIVING,
            },
            (result, status) => {
                if (status === window.google.maps.DirectionsStatus.OK) {
                    setDirectionsResponse(result);
                    if (liveRoute) lastCalculatedPos.current = currentPosition;
                } else {
                    console.error(`Directions request failed due to ${status}`);
                }
            }
        );
    }, [isLoaded, pickup, destination, currentPosition, liveRoute]);

    // ── Fetch nearby active captains ── defined FIRST so recenterMap can use it
    const fetchNearbyCaptains = useCallback(async (lat, lng) => {
        const token = localStorage.getItem('user_token')
        if (!token) return
        try {
            const res = await axios.get(
                `${import.meta.env.VITE_BASE_URL}/maps/nearby-captains`,
                {
                    params: { lat, lng, radius: 5, _t: Date.now() },
                    headers: { Authorization: `Bearer ${token}`, 'Cache-Control': 'no-cache' },
                }
            )
            const list = res.data?.captains || []
            setNearbyCaptains(list)
            setCaptainCount(list.length)
        } catch {
            // fail silently — non-critical
        }
    }, [])

    const recenterMap = useCallback(() => {
        if (!navigator.geolocation) return
        setGpsLoading(true)
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }
                setCurrentPosition(loc)
                positionRef.current = loc
                if (mapRef.current) {
                    mapRef.current.panTo(loc)
                    mapRef.current.setZoom(16)
                }
                fetchNearbyCaptains(loc.lat, loc.lng)
                setGpsLoading(false)
            },
            () => {
                if (mapRef.current && positionRef.current) {
                    mapRef.current.panTo(positionRef.current)
                    mapRef.current.setZoom(16)
                }
                setGpsLoading(false)
            },
            { enableHighAccuracy: true, timeout: 8000 }
        )
    }, [fetchNearbyCaptains])

    // ── Geolocation + polling ─────────────────────────────────────────────
    useEffect(() => {
        if (!navigator.geolocation) return

        // One-time position to bootstrap the map
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }
                setCurrentPosition(loc)
                positionRef.current = loc
                fetchNearbyCaptains(loc.lat, loc.lng)
            },
            () => {},
            { enableHighAccuracy: true, timeout: 8000 }
        )

        // Watch for user walking/moving
        const watchId = navigator.geolocation.watchPosition(
            (pos) => {
                const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }
                setCurrentPosition(loc)
                positionRef.current = loc
            },
            () => {},
            { enableHighAccuracy: true, maximumAge: 3000 }
        )

        // Refresh nearby captains every 8 seconds (near-realtime)
        const interval = setInterval(() => {
            if (positionRef.current) {
                fetchNearbyCaptains(positionRef.current.lat, positionRef.current.lng)
            }
        }, 8000)

        return () => {
            navigator.geolocation.clearWatch(watchId)
            clearInterval(interval)
        }
    }, [fetchNearbyCaptains])

    // ── Socket: refresh when any captain nearby moves ─────────────────────
    useEffect(() => {
        if (!socket) return

        const handleCaptainMove = () => {
            if (positionRef.current) {
                fetchNearbyCaptains(positionRef.current.lat, positionRef.current.lng)
            }
        }

        // 'nearby-captain-moved' = broadcast from any captain updating location
        // 'captain-location-update' = from the captain on our active ride
        socket.on('nearby-captain-moved', handleCaptainMove)
        socket.on('captain-location-update', handleCaptainMove)
        return () => {
            socket.off('nearby-captain-moved', handleCaptainMove)
            socket.off('captain-location-update', handleCaptainMove)
        }
    }, [socket, fetchNearbyCaptains])

    // ── User marker (pin) ─────────────────────────────────────────────────
    const userMarkerIcon = {
        path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
        fillColor:    '#1e293b',
        fillOpacity:  1,
        strokeColor:  '#ffffff',
        strokeWeight: 2,
        scale:        2,
        anchor:       { x: 12, y: 24 },
    }

    if (!isLoaded) {
        return (
            <div className="w-full h-full bg-slate-100 animate-pulse flex items-center justify-center">
                <p className="text-slate-400 text-sm font-bold">Loading Map...</p>
            </div>
        )
    }

    return (
        <div className="relative w-full h-full">
            <GoogleMap
                mapContainerStyle={containerStyle}
                center={currentPosition}
                zoom={15}
                onLoad={onMapLoad}
                options={{
                    disableDefaultUI: true,
                    clickableIcons: true,
                    styles: [
                        // Only hide road direction arrows — keep landmarks, POIs, transit visible
                        { featureType: 'road', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
                    ],
                }}
            >
                {/* User position */}
                <Marker
                    position={currentPosition}
                    icon={userMarkerIcon}
                    title="Your location"
                    zIndex={100}
                />

                {/* Nearby captain markers */}
                {nearbyCaptains.map((c, idx) =>
                    c.lat && c.lng ? (
                        <Marker
                            key={`captain-${idx}-${c.lat}-${c.lng}`}
                            position={{ lat: c.lat, lng: c.lng }}
                            icon={bikeIcon.current || makeBikeIcon()}
                            title="Nearby QuickBike rider"
                            zIndex={50}
                        />
                    ) : null
                )}
                {/* Directions Route */}
                {directionsResponse && (
                    <DirectionsRenderer
                        options={{
                            directions: directionsResponse,
                            suppressMarkers: false, // shows default A-B markers
                            polylineOptions: {
                                strokeColor: '#0088CC',
                                strokeOpacity: 0.8,
                                strokeWeight: 5,
                            },
                        }}
                    />
                )}
            </GoogleMap>

            {/* Recenter / GPS refresh button */}
            <button
                onClick={recenterMap}
                disabled={gpsLoading}
                className="absolute bottom-24 right-4 z-50 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center border border-gray-100 active:scale-90 transition-all disabled:opacity-70"
                title="Refresh my location"
            >
                {gpsLoading ? (
                    <div className="w-5 h-5 border-2 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <circle cx="12" cy="12" r="3" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v3M12 19v3M2 12h3M19 12h3" />
                    </svg>
                )}
            </button>

            {/* Live captain count badge */}
            {captainCount > 0 && (
                <div className="absolute top-4 right-4 z-50 bg-white/90 backdrop-blur-sm border border-orange-200 text-orange-600 text-xs font-bold px-3 py-1.5 rounded-full shadow flex items-center gap-1.5 pointer-events-none">
                    <span className="w-2 h-2 rounded-full bg-green-500 inline-block animate-pulse" />
                    {captainCount} rider{captainCount > 1 ? 's' : ''} nearby
                </div>
            )}
        </div>
    )
}

export default LiveTracking