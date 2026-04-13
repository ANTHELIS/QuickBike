import React, { useState, useRef, useCallback, useEffect } from 'react'
import { useJsApiLoader, GoogleMap } from '@react-google-maps/api'
import axios from 'axios'

const DEFAULT_CENTER = { lat: 22.5726, lng: 88.3639 } // Kolkata fallback

/**
 * MapPicker — full-screen map modal where the user drags to pin a location.
 *
 * Props:
 *  - fieldLabel  : 'Pickup' | 'Drop-off'
 *  - onConfirm(address: string) — called with the resolved address string
 *  - onClose()
 *  - initialCenter?: { lat, lng } — pre-center the map on open
 */
const MapPicker = ({ fieldLabel = 'Pickup', onConfirm, onClose, initialCenter }) => {
  const mapRef = useRef(null)
  const [centerLatLng, setCenterLatLng] = useState(null)
  const [address, setAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const debounceRef = useRef(null)

  const { isLoaded } = useJsApiLoader({
    id: 'quickbike-map',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
  })

  // Get user's current position for initial center
  const [mapCenter, setMapCenter] = useState(initialCenter || DEFAULT_CENTER)

  useEffect(() => {
    if (initialCenter) return // already have a center
    navigator.geolocation?.getCurrentPosition(
      (pos) => setMapCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    )
  }, [])

  const reverseGeocode = useCallback(async (lat, lng) => {
    setLoading(true)
    setAddress('')
    try {
      const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/maps/reverse-geocode`, {
        params: { lat, lng },
        headers: { Authorization: `Bearer ${localStorage.getItem('user_token')}` },
      })
      setAddress(res.data?.address || `${lat.toFixed(5)}, ${lng.toFixed(5)}`)
    } catch {
      setAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`)
    } finally {
      setLoading(false)
    }
  }, [])

  const onMapLoad = useCallback((map) => {
    mapRef.current = map
  }, [])

  // Called every time the map idles (after drag / zoom stops)
  const onIdle = useCallback(() => {
    setIsDragging(false)
    if (!mapRef.current) return
    const c = mapRef.current.getCenter()
    const lat = c.lat()
    const lng = c.lng()
    setCenterLatLng({ lat, lng })

    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      reverseGeocode(lat, lng)
    }, 400)
  }, [reverseGeocode])

  const onDragStart = useCallback(() => {
    setIsDragging(true)
    setAddress('')
    clearTimeout(debounceRef.current)
  }, [])

  const handleConfirm = () => {
    if (!address || loading) return
    onConfirm(address, centerLatLng)
    onClose()
  }

  const isPickup = fieldLabel.toLowerCase().includes('pickup')

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col font-['Inter'] bg-black">

      {/* ── Top Bar ── */}
      <header className="absolute top-0 left-0 right-0 z-20 flex items-center gap-3 px-4 pt-12 pb-4 bg-gradient-to-b from-black/70 to-transparent pointer-events-none">
        <button
          onClick={onClose}
          className="pointer-events-auto w-10 h-10 bg-white/95 backdrop-blur rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform"
        >
          <i className="fa-solid fa-arrow-left text-slate-700 text-sm" />
        </button>
        <div className="pointer-events-auto flex-1 bg-white/95 backdrop-blur rounded-2xl px-4 py-2.5 shadow-lg">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {isPickup ? 'Setting Pickup' : 'Setting Drop-off'}
          </p>
          <p className="text-sm font-bold text-slate-800 truncate mt-0.5">
            {loading
              ? 'Finding address…'
              : address || 'Move map to select location'}
          </p>
        </div>
      </header>

      {/* ── Map ── */}
      <div className="absolute inset-0 z-0">
        {isLoaded ? (
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '100%' }}
            center={mapCenter}
            zoom={16}
            onLoad={onMapLoad}
            onIdle={onIdle}
            onDragStart={onDragStart}
            options={{
              disableDefaultUI: true,
              gestureHandling: 'greedy',
              // Keep all POIs, landmarks, institutions visible
              // Only suppress overly aggressive business marker clutter
              styles: [
                {
                  featureType: 'poi.business',
                  elementType: 'labels.icon',
                  stylers: [{ visibility: 'off' }],
                },
              ],
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-200">
            <div className="w-8 h-8 border-2 border-orange-300 border-t-orange-600 rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* ── Fixed Center Pin ── */}
      <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
        <div className={`flex flex-col items-center transition-transform duration-200 ${isDragging ? '-translate-y-4' : ''}`}>
          {/* Pin head */}
          <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-2xl border-4 border-white ${
            isPickup ? 'bg-slate-800' : 'bg-orange-500'
          }`}>
            <i className={`fa-solid ${isPickup ? 'fa-circle-dot' : 'fa-location-dot'} text-white text-lg`} />
          </div>
          {/* Pin stem */}
          <div className={`w-0.5 h-5 ${isPickup ? 'bg-slate-800' : 'bg-orange-500'}`} />
          {/* Pin shadow dot */}
          <div className={`w-3 h-1.5 rounded-full opacity-30 ${isPickup ? 'bg-black' : 'bg-orange-800'} ${
            isDragging ? 'scale-150 opacity-10' : ''
          } transition-all duration-200`} />
        </div>
      </div>

      {/* ── Accuracy hint ring (pulsing) ── */}
      <div className="absolute inset-0 z-[9] flex items-center justify-center pointer-events-none">
        <div className={`w-20 h-20 rounded-full border-2 opacity-20 animate-ping ${
          isPickup ? 'border-slate-800' : 'border-orange-500'
        } ${isDragging ? 'hidden' : ''}`} />
      </div>

      {/* ── Bottom Confirm Bar ── */}
      <div className="absolute bottom-0 left-0 right-0 z-20 bg-white rounded-t-[28px] px-6 pt-5 pb-10 shadow-[0_-10px_30px_rgba(0,0,0,0.15)]">

        {/* Address preview */}
        <div className="flex items-start gap-3 mb-5">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
            isPickup ? 'bg-slate-100' : 'bg-orange-100'
          }`}>
            <i className={`fa-solid ${isPickup ? 'fa-location-crosshairs text-slate-600' : 'fa-location-dot text-orange-500'} text-base`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">
              {isPickup ? 'Pickup Location' : 'Drop-off Location'}
            </p>
            {loading ? (
              <div className="flex items-center gap-2 mt-1">
                <div className={`w-4 h-4 border-2 ${isPickup ? 'border-slate-200 border-t-slate-800' : 'border-orange-200 border-t-orange-500'} rounded-full animate-spin shrink-0`} />
                <span className="text-sm text-slate-400 font-medium">Resolving address…</span>
              </div>
            ) : (
              <p className={`text-sm font-bold leading-snug transition-all ${address ? 'text-slate-800' : 'text-slate-400'}`}>
                {address || 'Move the map to pin your location'}
              </p>
            )}
          </div>
        </div>

        {/* Confirm button */}
        <button
          onClick={handleConfirm}
          disabled={!address || loading}
          className={`w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-lg disabled:opacity-50 ${
            isPickup
              ? 'bg-slate-800 shadow-slate-200 text-white'
              : 'bg-gradient-to-r from-[#904d00] to-[#E67E00] shadow-orange-200 text-white'
          }`}
        >
          {loading ? (
            <i className="fa-solid fa-circle-notch fa-spin" />
          ) : (
            <>
              <i className="fa-solid fa-check" />
              Set {isPickup ? 'Pickup' : 'Drop-off'} Here
            </>
          )}
        </button>
      </div>
    </div>
  )
}

export default MapPicker
