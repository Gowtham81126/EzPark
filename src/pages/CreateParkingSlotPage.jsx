import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix for default marker icon in Leaflet with React
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

function CreateParkingSlotPage() {
  const navigate = useNavigate()
  const createParkingSlot = useStore((s) => s.createParkingSlot)
  const currentUser = useStore((s) => s.currentUser)

  const [locationName, setLocationName] = useState('')
  const [price, setPrice] = useState('')
  const [slots, setSlots] = useState('')
  const [availability, setAvailability] = useState('24/7')
  const [showCustomTimePicker, setShowCustomTimePicker] = useState(false)
  const [customTimeRange, setCustomTimeRange] = useState({
    from: { hour: 9, minute: 0, period: 'AM' },
    to: { hour: 6, minute: 0, period: 'PM' }
  })
  const [errors, setErrors] = useState({})
  
  // Map state
  const [markerPosition, setMarkerPosition] = useState(null)
  const [coordinates, setCoordinates] = useState(null)
  const mapRef = useRef(null)

  // Reverse geocoding: Get address from coordinates
  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      )
      const data = await response.json()
      if (data.display_name) {
        setLocationName(data.display_name)
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error)
    }
  }

  // Forward geocoding: Get coordinates from address
  const forwardGeocode = async (address) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
      )
      const data = await response.json()
      if (data && data.length > 0) {
        const { lat, lon } = data[0]
        const position = [parseFloat(lat), parseFloat(lon)]
        setMarkerPosition(position)
        setCoordinates({ lat: parseFloat(lat), lng: parseFloat(lon) })
        if (mapRef.current) {
          mapRef.current.setView(position, 16)
        }
      }
    } catch (error) {
      console.error('Forward geocoding error:', error)
    }
  }

  // Handle map click for manual pin placement
  const MapClickHandler = () => {
    useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng
        setMarkerPosition([lat, lng])
        setCoordinates({ lat, lng })
        reverseGeocode(lat, lng)
      },
    })
    return null
  }

  // Handle "Locate Me" button click
  const handleLocateMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setMarkerPosition([latitude, longitude])
          setCoordinates({ lat: latitude, lng: longitude })
          if (mapRef.current) {
            mapRef.current.setView([latitude, longitude], 16)
          }
          reverseGeocode(latitude, longitude)
        },
        (error) => {
          console.error('Geolocation error:', error)
          alert('Unable to get your location. Please enable location services.')
        }
      )
    } else {
      alert('Geolocation is not supported by your browser.')
    }
  }

  // Handle clearing the marker
  const handleClearMarker = () => {
    setMarkerPosition(null)
    setCoordinates(null)
    setLocationName('')
  }

  // Handle location name input change with debounced geocoding
  let geocodeTimeout
  const handleLocationNameChange = (e) => {
    const value = e.target.value
    setLocationName(value)
    setErrors((prev) => ({ ...prev, locationName: '' }))

    // Debounced forward geocoding
    clearTimeout(geocodeTimeout)
    if (value.trim()) {
      geocodeTimeout = setTimeout(() => {
        forwardGeocode(value)
      }, 1000)
    }
  }

  // Helper function to convert 12-hour format to 24-hour format
  const to24Hour = (hour, minute, period) => {
    let hour24 = hour
    if (period === 'AM') {
      hour24 = hour === 12 ? 0 : hour
    } else {
      hour24 = hour === 12 ? 12 : hour + 12
    }
    return { hour: hour24, minute }
  }

  // Helper function to format time for display
  const formatTime = (hour, minute, period) => {
    if (minute === 0) {
      return `${hour} ${period}`
    }
    return `${hour}:${minute.toString().padStart(2, '0')} ${period}`
  }

  // Calculate duration in hours
  const calculateDuration = () => {
    const from24 = to24Hour(customTimeRange.from.hour, customTimeRange.from.minute, customTimeRange.from.period)
    const to24 = to24Hour(customTimeRange.to.hour, customTimeRange.to.minute, customTimeRange.to.period)
    const fromMinutes = from24.hour * 60 + from24.minute
    const toMinutes = to24.hour * 60 + to24.minute
    let durationMinutes = toMinutes - fromMinutes
    if (durationMinutes <= 0) durationMinutes += 24 * 60 // Handle overnight ranges
    return (durationMinutes / 60).toFixed(1)
  }

  // Validate custom time range
  const validateCustomTimeRange = () => {
    const from24 = to24Hour(customTimeRange.from.hour, customTimeRange.from.minute, customTimeRange.from.period)
    const to24 = to24Hour(customTimeRange.to.hour, customTimeRange.to.minute, customTimeRange.to.period)
    const fromMinutes = from24.hour * 60 + from24.minute
    const toMinutes = to24.hour * 60 + to24.minute
    return fromMinutes !== toMinutes // Allow overnight ranges (from > to)
  }

  // Handle custom time range selection
  const handleCustomTimeRangeClick = () => {
    if (availability === 'custom') {
      setShowCustomTimePicker(!showCustomTimePicker)
    } else {
      setAvailability('custom')
      setShowCustomTimePicker(true)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const newErrors = {}

    if (!locationName.trim()) {
      newErrors.locationName = 'Location name is required'
    }
    if (!price || parseFloat(price) <= 0) {
      newErrors.price = 'Price must be greater than 0'
    }
    if (!slots || parseInt(slots) <= 0) {
      newErrors.slots = 'Number of slots must be greater than 0'
    }

    // Validate custom time range
    if (availability === 'custom' && !validateCustomTimeRange()) {
      newErrors.availability = 'To time must be different from From time'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    // Prepare availability data with proper structure
    let availabilityData
    if (availability === '24/7') {
      availabilityData = {
        type: '24/7',
        label: '24/7'
      }
    } else if (availability === '6 AM – 10 PM') {
      availabilityData = {
        type: 'fixed',
        label: '6 AM – 10 PM',
        startTime: '06:00',
        endTime: '22:00'
      }
    } else if (availability === 'custom') {
      // Convert custom time range to 24-hour format
      const to24Hour = (hour, minute, period) => {
        let hour24 = hour
        if (period === 'AM') {
          hour24 = hour === 12 ? 0 : hour
        } else {
          hour24 = hour === 12 ? 12 : hour + 12
        }
        return { hour: hour24, minute }
      }

      const start24 = to24Hour(customTimeRange.from.hour, customTimeRange.from.minute, customTimeRange.from.period)
      const end24 = to24Hour(customTimeRange.to.hour, customTimeRange.to.minute, customTimeRange.to.period)

      availabilityData = {
        type: 'custom',
        from: customTimeRange.from,
        to: customTimeRange.to,
        display: `${formatTime(customTimeRange.from.hour, customTimeRange.from.minute, customTimeRange.from.period)} – ${formatTime(customTimeRange.to.hour, customTimeRange.to.minute, customTimeRange.to.period)}`,
        startTime: `${start24.hour.toString().padStart(2, '0')}:${start24.minute.toString().padStart(2, '0')}`,
        endTime: `${end24.hour.toString().padStart(2, '0')}:${end24.minute.toString().padStart(2, '0')}`
      }
    }

    const result = await createParkingSlot({
      locationName: locationName.trim(),
      price: parseFloat(price),
      totalSlots: parseInt(slots),
      availability: availabilityData,
      ownerId: currentUser?.id,
      coordinates: coordinates,
    })

    if (result.success) {
      navigate('/owner')
    } else {
      setErrors({ submit: result.error || 'Failed to create parking slot' })
    }
  }

  return (
    <div className="min-h-screen bg-cover bg-center bg-no-repeat flex items-center justify-center p-4 relative" style={{ backgroundImage: "url('/images/bg.png')" }}>
      <div className="absolute inset-0 bg-white/30 pointer-events-none"></div>
      <div className="w-full max-w-lg relative z-10">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Page Title */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Space Details</h1>
            <p className="text-sm text-gray-500">
              Fill in the information below to start earning from your parking space.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Location Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">📍</span>
                <input
                  type="text"
                  value={locationName}
                  onChange={handleLocationNameChange}
                  placeholder="e.g. My Driveway, Downtown Garage"
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm ${
                    errors.locationName ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.locationName && (
                <p className="mt-1 text-xs text-red-600">{errors.locationName}</p>
              )}
            </div>

            {/* Map Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Map Location
              </label>
              
              {/* Map Controls */}
              <div className="flex gap-2 mb-3">
                <button
                  type="button"
                  onClick={handleLocateMe}
                  className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                >
                  <span>🎯</span> Locate Me
                </button>
                <button
                  type="button"
                  onClick={handleClearMarker}
                  className="py-2 px-4 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-all"
                >
                  Clear
                </button>
              </div>

              {/* Map Container */}
              <div className="relative">
                <MapContainer
                  center={[13.0827, 80.2707]} // Chennai, India
                  zoom={12}
                  style={{ height: '300px', width: '100%', borderRadius: '0.5rem', zIndex: 1 }}
                  ref={mapRef}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <MapClickHandler />
                  {markerPosition && <Marker position={markerPosition} />}
                </MapContainer>
              </div>

              {/* Coordinates Display */}
              {coordinates && (
                <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-xs font-medium text-gray-600 mb-1">📍 Selected Coordinates</p>
                  <p className="text-sm text-gray-800">
                    Lat: {coordinates.lat.toFixed(6)}, Lng: {coordinates.lng.toFixed(6)}
                  </p>
                </div>
              )}

              <p className="mt-2 text-xs text-gray-500">
                Click on the map to place a pin, or use "Locate Me" to detect your current location.
              </p>
            </div>

            {/* Price per Hour */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price per hour (₹) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => {
                    setPrice(e.target.value)
                    setErrors((prev) => ({ ...prev, price: '' }))
                  }}
                  placeholder="e.g. 5.00"
                  step="0.01"
                  min="0"
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm ${
                    errors.price ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.price && <p className="mt-1 text-xs text-red-600">{errors.price}</p>}
            </div>

            {/* Number of Slots */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Slots <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={slots}
                onChange={(e) => {
                  setSlots(e.target.value)
                  setErrors((prev) => ({ ...prev, slots: '' }))
                }}
                placeholder="e.g. 3"
                min="1"
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm ${
                  errors.slots ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.slots && <p className="mt-1 text-xs text-red-600">{errors.slots}</p>}
            </div>

            {/* Availability Hours */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Availability Hours <span className="text-red-500">*</span>
              </label>
              
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <p className="text-xs font-medium text-gray-600 mb-3">⚡ QUICK SELECT</p>
                
                <div className="space-y-2">
                  {/* 24/7 Option */}
                  <button
                    type="button"
                    onClick={() => setAvailability('24/7')}
                    className={`w-full py-3 px-4 rounded-lg text-sm font-medium transition-all ${
                      availability === '24/7'
                        ? 'bg-blue-50 border-2 border-blue-500 text-blue-700'
                        : 'bg-white border-2 border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    24/7
                  </button>

                  {/* 6 AM – 10 PM Option */}
                  <button
                    type="button"
                    onClick={() => setAvailability('6 AM – 10 PM')}
                    className={`w-full py-3 px-4 rounded-lg text-sm font-medium transition-all ${
                      availability === '6 AM – 10 PM'
                        ? 'bg-blue-50 border-2 border-blue-500 text-blue-700'
                        : 'bg-white border-2 border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    6 AM – 10 PM
                  </button>

                  {/* Custom Time Range */}
                  <button
                    type="button"
                    onClick={handleCustomTimeRangeClick}
                    className={`w-full py-3 px-4 rounded-lg text-sm font-medium transition-all ${
                      availability === 'custom'
                        ? 'bg-blue-50 border-2 border-blue-500 text-blue-700'
                        : 'bg-white border-2 border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    Custom time range {showCustomTimePicker ? '▼' : '▶'}
                  </button>

                  {/* Expanded Time Picker */}
                  {showCustomTimePicker && availability === 'custom' && (
                    <div className="mt-4 p-4 bg-white rounded-xl border-2 border-gray-200 space-y-6">
                      {/* FROM TIME */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-3">FROM</label>
                        <div className="flex gap-4">
                          {/* Hour Grid */}
                          <div className="flex-1">
                            <div className="grid grid-cols-4 gap-2">
                              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((hour) => (
                                <button
                                  key={`from-${hour}`}
                                  type="button"
                                  onClick={() => setCustomTimeRange(prev => ({
                                    ...prev,
                                    from: { ...prev.from, hour }
                                  }))}
                                  className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                                    customTimeRange.from.hour === hour
                                      ? 'bg-blue-600 text-white'
                                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                  }`}
                                >
                                  {hour}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Minute Dropdown */}
                          <div className="w-24">
                            <select
                              value={customTimeRange.from.minute}
                              onChange={(e) => setCustomTimeRange(prev => ({
                                ...prev,
                                from: { ...prev.from, minute: parseInt(e.target.value) }
                              }))}
                              className="w-full py-2 px-3 rounded-lg text-sm font-medium border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              {[0, 15, 30, 45].map((minute) => (
                                <option key={minute} value={minute}>
                                  {minute.toString().padStart(2, '0')}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* AM/PM Toggle */}
                          <div className="flex flex-col gap-2">
                            <button
                              type="button"
                              onClick={() => setCustomTimeRange(prev => ({
                                ...prev,
                                from: { ...prev.from, period: 'AM' }
                              }))}
                              className={`py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                                customTimeRange.from.period === 'AM'
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              AM
                            </button>
                            <button
                              type="button"
                              onClick={() => setCustomTimeRange(prev => ({
                                ...prev,
                                from: { ...prev.from, period: 'PM' }
                              }))}
                              className={`py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                                customTimeRange.from.period === 'PM'
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              PM
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* TO TIME */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-3">TO</label>
                        <div className="flex gap-4">
                          {/* Hour Grid */}
                          <div className="flex-1">
                            <div className="grid grid-cols-4 gap-2">
                              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((hour) => (
                                <button
                                  key={`to-${hour}`}
                                  type="button"
                                  onClick={() => setCustomTimeRange(prev => ({
                                    ...prev,
                                    to: { ...prev.to, hour }
                                  }))}
                                  className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                                    customTimeRange.to.hour === hour
                                      ? 'bg-blue-600 text-white'
                                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                  }`}
                                >
                                  {hour}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Minute Dropdown */}
                          <div className="w-24">
                            <select
                              value={customTimeRange.to.minute}
                              onChange={(e) => setCustomTimeRange(prev => ({
                                ...prev,
                                to: { ...prev.to, minute: parseInt(e.target.value) }
                              }))}
                              className="w-full py-2 px-3 rounded-lg text-sm font-medium border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              {[0, 15, 30, 45].map((minute) => (
                                <option key={minute} value={minute}>
                                  {minute.toString().padStart(2, '0')}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* AM/PM Toggle */}
                          <div className="flex flex-col gap-2">
                            <button
                              type="button"
                              onClick={() => setCustomTimeRange(prev => ({
                                ...prev,
                                to: { ...prev.to, period: 'AM' }
                              }))}
                              className={`py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                                customTimeRange.to.period === 'AM'
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              AM
                            </button>
                            <button
                              type="button"
                              onClick={() => setCustomTimeRange(prev => ({
                                ...prev,
                                to: { ...prev.to, period: 'PM' }
                              }))}
                              className={`py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                                customTimeRange.to.period === 'PM'
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              PM
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Time Range Slider */}
                      <div>
                        <div className="relative h-8 bg-gray-200 rounded-full overflow-hidden">
                          {/* Timeline bar */}
                          <div className="absolute inset-0 flex items-center justify-between px-2 text-xs text-gray-500">
                            <span>12 AM</span>
                            <span>6 AM</span>
                            <span>12 PM</span>
                            <span>6 PM</span>
                            <span>12 AM</span>
                          </div>
                          {/* Highlighted range */}
                          <div
                            className="absolute h-full bg-blue-500 opacity-50"
                            style={{
                              left: `${(to24Hour(customTimeRange.from.hour, customTimeRange.from.minute, customTimeRange.from.period).hour / 24) * 100}%`,
                              width: `${(calculateDuration() / 24) * 100}%`
                            }}
                          />
                        </div>
                      </div>

                      {/* Summary Section */}
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-xs text-gray-500">Selected window</p>
                          <p className="text-sm font-medium text-gray-800">
                            {formatTime(customTimeRange.from.hour, customTimeRange.from.minute, customTimeRange.from.period)} – {formatTime(customTimeRange.to.hour, customTimeRange.to.minute, customTimeRange.to.period)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Duration</p>
                          <p className="text-sm font-medium text-gray-800">{calculateDuration()}h window</p>
                        </div>
                      </div>

                      {/* Validation Error */}
                      {!validateCustomTimeRange() && (
                        <p className="text-xs text-red-600">To time must be different from From time</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {errors.submit}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-4 bg-blue-600 text-white rounded-xl font-semibold text-lg shadow-lg hover:bg-blue-700 hover:shadow-xl transition-all"
            >
              📍 List Space Now
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default CreateParkingSlotPage
