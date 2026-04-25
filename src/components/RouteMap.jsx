import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix for default marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

function RouteMap({ destination, driverLocation, routeData, driverBearing }) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const routingControlRef = useRef(null)
  const driverMarkerRef = useRef(null)
  const routeLineRef = useRef(null)
  const fullscreenControlRef = useRef(null)
  const [distance, setDistance] = useState(null)
  const [duration, setDuration] = useState(null)
  const [locationError, setLocationError] = useState(null)
  const [isFullscreenSupported, setIsFullscreenSupported] = useState(false)
  const [mapRotation, setMapRotation] = useState(0)
  const [isRotationSupported, setIsRotationSupported] = useState(false)

  // Check for Fullscreen API support
  useEffect(() => {
    const supported = !!(
      document.fullscreenEnabled ||
      document.webkitFullscreenEnabled ||
      document.mozFullScreenEnabled ||
      document.msFullscreenEnabled
    )
    setIsFullscreenSupported(supported)
  }, [])

  // Check for CSS transform support (for map rotation)
  useEffect(() => {
    const testEl = document.createElement('div')
    const transformSupported = 'transform' in testEl.style || 
                               'webkitTransform' in testEl.style || 
                               'msTransform' in testEl.style || 
                               'mozTransform' in testEl.style
    setIsRotationSupported(transformSupported)
  }, [])

  // Update map rotation based on driver bearing
  useEffect(() => {
    if (!isRotationSupported || driverBearing === null || driverBearing === undefined) {
      setMapRotation(0)
      return
    }
    
    // Convert bearing to rotation angle (negative because CSS rotation is clockwise)
    // Bearing: 0 = North, 90 = East
    // Rotation: 0 = no rotation, positive = clockwise
    const rotation = -driverBearing
    setMapRotation(rotation)
  }, [driverBearing, isRotationSupported])

  useEffect(() => {
    // Initialize map
    if (!mapInstanceRef.current && mapRef.current) {
      mapInstanceRef.current = L.map(mapRef.current).setView(
        [destination.lat, destination.lng],
        13
      )

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapInstanceRef.current)

      // Add destination marker (red pin)
      const redPinIcon = L.divIcon({
        className: 'custom-red-pin-icon',
        html: '<div style="position: relative; width: 30px; height: 30px;"><div style="position: absolute; top: 0; left: 50%; transform: translateX(-50%); width: 20px; height: 20px; background-color: #ef4444; border-radius: 50% 50% 50% 0; transform: translateX(-50%) rotate(-45deg); border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div><div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 8px; height: 8px; background-color: white; border-radius: 50%;"></div></div>',
        iconSize: [30, 30],
        iconAnchor: [15, 30]
      })
      L.marker([destination.lat, destination.lng], { icon: redPinIcon })
        .addTo(mapInstanceRef.current)
        .bindPopup('Parking Slot Location')
        .openPopup()

      // Add fullscreen control button if supported
      if (isFullscreenSupported) {
        const FullscreenControl = L.Control.extend({
          options: {
            position: 'bottomright'
          },
          onAdd: function(map) {
            const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control')
            const button = L.DomUtil.create('button', '', container)
            
            button.innerHTML = '⛶'
            button.style.cssText = `
              width: 36px;
              height: 36px;
              border: none;
              background: white;
              cursor: pointer;
              font-size: 18px;
              border-radius: 4px;
              box-shadow: 0 1px 3px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
            `
            button.title = 'Toggle Fullscreen'

            L.DomEvent.disableClickPropagation(button)
            L.DomEvent.on(button, 'click', (e) => {
              e.preventDefault()
              const mapContainer = mapRef.current
              if (!document.fullscreenElement &&
                  !document.webkitFullscreenElement &&
                  !document.mozFullScreenElement &&
                  !document.msFullscreenElement) {
                // Enter fullscreen
                if (mapContainer.requestFullscreen) {
                  mapContainer.requestFullscreen()
                } else if (mapContainer.webkitRequestFullscreen) {
                  mapContainer.webkitRequestFullscreen()
                } else if (mapContainer.mozRequestFullScreen) {
                  mapContainer.mozRequestFullScreen()
                } else if (mapContainer.msRequestFullscreen) {
                  mapContainer.msRequestFullscreen()
                }
              } else {
                // Exit fullscreen
                if (document.exitFullscreen) {
                  document.exitFullscreen()
                } else if (document.webkitExitFullscreen) {
                  document.webkitExitFullscreen()
                } else if (document.mozCancelFullScreen) {
                  document.mozCancelFullScreen()
                } else if (document.msExitFullscreen) {
                  document.msExitFullscreen()
                }
              }
            })

            return container
          }
        })

        fullscreenControlRef.current = new FullscreenControl()
        fullscreenControlRef.current.addTo(mapInstanceRef.current)
      }
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [destination, isFullscreenSupported])

  useEffect(() => {
    if (!mapInstanceRef.current || !driverLocation) return

    // Remove existing routing control if any
    if (routingControlRef.current) {
      mapInstanceRef.current.removeControl(routingControlRef.current)
      routingControlRef.current = null
    }

    // Remove existing driver marker if any
    if (driverMarkerRef.current) {
      mapInstanceRef.current.removeLayer(driverMarkerRef.current)
      driverMarkerRef.current = null
    }

    // Remove existing route line if any
    if (routeLineRef.current) {
      mapInstanceRef.current.removeLayer(routeLineRef.current)
      routeLineRef.current = null
    }

    // Add/update driver location marker
    driverMarkerRef.current = L.marker([driverLocation.lat, driverLocation.lng], {
      icon: L.divIcon({
        className: 'custom-driver-icon',
        html: '<div style="background-color: #3b82f6; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      })
    }).addTo(mapInstanceRef.current)
    driverMarkerRef.current.bindPopup('Your Location').openPopup()

    // Calculate distance using Haversine formula and draw straight line
    const updateRoute = () => {
      try {
        // Calculate Haversine distance
        const R = 6371 // Earth's radius in km
        const dLat = (destination.lat - driverLocation.lat) * Math.PI / 180
        const dLon = (destination.lng - driverLocation.lng) * Math.PI / 180
        const a = 
          Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(driverLocation.lat * Math.PI / 180) * Math.cos(destination.lat * Math.PI / 180) * 
          Math.sin(dLon/2) * Math.sin(dLon/2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
        const distance = R * c
        
        // Estimate duration assuming average speed of 30 km/h in city
        const duration = (distance / 30) * 60 // minutes
        
        // Draw straight line
        const latLngs = [
          [driverLocation.lat, driverLocation.lng],
          [destination.lat, destination.lng]
        ]
        routeLineRef.current = L.polyline(latLngs, {
          color: '#2563eb',
          weight: 5,
          opacity: 0.8,
          dashArray: '10, 10' // Dashed line to indicate it's straight-line distance
        }).addTo(mapInstanceRef.current)
        
        setDistance(distance.toFixed(2))
        setDuration(Math.round(duration))
        setLocationError('Straight-line distance')
      } catch (error) {
        console.error('Distance calculation failed:', error)
        setLocationError('Unable to calculate distance.')
      }
    }

    updateRoute()

    // Fit bounds to show both points
    const bounds = L.latLngBounds([
      [driverLocation.lat, driverLocation.lng],
      [destination.lat, destination.lng]
    ])
    mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] })

    return () => {
      if (driverMarkerRef.current && mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(driverMarkerRef.current)
      }
      if (routeLineRef.current && mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(routeLineRef.current)
      }
    }
  }, [driverLocation, destination])

  const handleRecenter = () => {
    if (!mapInstanceRef.current || !driverLocation) return
    
    mapInstanceRef.current.panTo([driverLocation.lat, driverLocation.lng])
  }

  // Use routeData prop for consistent distance display
  useEffect(() => {
    if (routeData && routeData.distance !== null) {
      setDistance(routeData.distance.toFixed(1))
      setDuration(routeData.duration ? Math.round(routeData.duration) : null)
    }
  }, [routeData])

  return (
    <div className="w-full">
      {/* Map Container */}
      <div 
        ref={mapRef} 
        className="w-full h-80 rounded-lg border border-gray-200 mb-3"
        style={{ 
          zIndex: 1,
          transform: isRotationSupported && mapRotation !== 0 ? `rotate(${mapRotation}deg)` : 'none',
          transition: 'transform 0.5s ease-out',
          transformOrigin: 'center center'
        }}
      />

      {/* Location Error Message */}
      {locationError && (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 px-3 py-2 rounded-lg text-sm mb-3">
          {locationError}
        </div>
      )}

      {/* Distance and Time Info */}
      {distance && duration && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">📍</span>
              <div>
                <p className="text-xs text-blue-600">Distance</p>
                <p className="text-lg font-bold text-blue-800">{distance} km</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">⏱️</span>
              <div className="text-right">
                <p className="text-xs text-blue-600">Est. Time</p>
                <p className="text-lg font-bold text-blue-800">{duration} min</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recenter Button */}
      <button
        onClick={handleRecenter}
        disabled={!driverLocation}
        className="w-full py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        <span>🎯</span> Recenter to My Location
      </button>
    </div>
  )
}

export default RouteMap
