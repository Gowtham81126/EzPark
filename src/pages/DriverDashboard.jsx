import { useState, useEffect, useMemo, useRef } from 'react'
import { useStore, BookingStatus } from '../store/useStore'
import SlotCard from '../components/SlotCard'
import PaymentBreakdown from '../components/PaymentBreakdown'
import InvoiceScreen from '../components/InvoiceScreen'
import RatingForm from '../components/RatingForm'
import BookingPanel from '../components/BookingPanel'
import RouteMap from '../components/RouteMap'
import ErrorBoundary from '../components/ErrorBoundary'
import { formatOverstayTime } from '../utils/overstayCalculator'
import { isParkingOpen } from '../utils/timeAvailability'
import { calculateRouteDistance, formatRouteDistance } from '../utils/distanceCalculator'
import { userDatabase } from '../utils/userDatabase'

const STATUS_BADGE = {
  [BookingStatus.CONFIRMED]: 'bg-green-100 text-green-700 border-green-300',
  [BookingStatus.ACTIVE]: 'bg-emerald-100 text-emerald-700 border-emerald-300',
  [BookingStatus.OVERSTAYING]: 'bg-red-100 text-red-700 border-red-300',
  [BookingStatus.COMPLETED]: 'bg-gray-100 text-gray-600 border-gray-300',
  [BookingStatus.CANCELLED]: 'bg-red-100 text-red-600 border-red-300',
  [BookingStatus.EXPIRED]: 'bg-gray-100 text-gray-500 border-gray-300',
}

const STATUS_ICON = {
  [BookingStatus.CONFIRMED]: '✅',
  [BookingStatus.ACTIVE]: '🚗',
  [BookingStatus.OVERSTAYING]: '⚠️',
  [BookingStatus.COMPLETED]: '✨',
  [BookingStatus.CANCELLED]: '❌',
  [BookingStatus.EXPIRED]: '⏰',
}

function DriverDashboard() {
  const currentUser = useStore((s) => s.currentUser)
  const parkingSlots = useStore((s) => s.parkingSlots)
  const bookings = useStore((s) => s.bookings)
  const notifications = useStore((s) => s.notifications)
  const createBooking = useStore((s) => s.createBooking)
  const addNotification = useStore((s) => s.addNotification)
  const cancelBooking = useStore((s) => s.cancelBooking)
  const calculatePaymentBreakdown = useStore((s) => s.calculatePaymentBreakdown)
  const submitRating = useStore((s) => s.submitRating)
  const getDriverAverageRating = useStore((s) => s.getDriverAverageRating)
  const markInvoiceShown = useStore((s) => s.markInvoiceShown)
  const driverLocation = useStore((s) => s.driverLocation)
  const startGPSTracking = useStore((s) => s.startGPSTracking)
  const stopGPSTracking = useStore((s) => s.stopGPSTracking)
  const initializeParkingSlots = useStore((s) => s.initializeParkingSlots)
  const generateExitOTP = useStore((s) => s.generateExitOTP)
  const cancelExitOTP = useStore((s) => s.cancelExitOTP)
  const currentTime = Date.now() // Use local time instead of store time to avoid re-renders
  const [bookingSlotId, setBookingSlotId] = useState(null)
  const [showBookingPanel, setShowBookingPanel] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [parkingTimer, setParkingTimer] = useState(0)
  const [completedBooking, setCompletedBooking] = useState(null)
  const [invoiceBreakdown, setInvoiceBreakdown] = useState(null)
  const [showRatingModal, setShowRatingModal] = useState(false)
  const [ratingBooking, setRatingBooking] = useState(null)
  const [locationError, setLocationError] = useState(null)
  const [routeDistances, setRouteDistances] = useState({})
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [driverBearing, setDriverBearing] = useState(null)
  const [ownerDetails, setOwnerDetails] = useState({})

  const myBookings = useMemo(() => (bookings || []).filter((b) => b.driverId === currentUser?.id), [bookings, currentUser?.id])
  const otherBookings = useMemo(
    () =>
      myBookings.filter(
        (b) =>
          b.status === BookingStatus.COMPLETED ||
          b.status === BookingStatus.CANCELLED ||
          b.status === BookingStatus.EXPIRED
      ),
    [myBookings]
  )
  
  // Track last driver location to prevent redundant route calculations
  const lastDriverLocationRef = useRef(null)

  // Continuous GPS tracking for auto-updating parking slots as user moves
  useEffect(() => {
    let watchId = null
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude, heading } = position.coords
          console.log('Location updated:', { latitude, longitude, heading })
          useStore.setState({ driverLocation: { lat: latitude, lng: longitude } })
          
          // Update bearing if available (heading is in degrees, 0 = North, null if not moving)
          if (heading !== null && heading !== undefined && !isNaN(heading)) {
            setDriverBearing(heading)
          }
          
          setLocationError(null)
        },
        (error) => {
          console.error('GPS tracking error:', error)
          if (error.code === 1) {
            setLocationError('Location permission denied. Please allow location access.')
          } else if (error.code === 2) {
            setLocationError('Location unavailable. Please check your GPS.')
          } else if (error.code === 3) {
            setLocationError('Location request timed out.')
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 5000
        }
      )
    }
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId)
      }
    }
  }, [])

  // Calculate route distances for all parking slots when driver location changes
  useEffect(() => {
    console.log('Distance calculation useEffect triggered, driverLocation:', driverLocation)
    if (!driverLocation || !parkingSlots || parkingSlots.length === 0) {
      console.log('Skipping distance calculation - missing data')
      return
    }

    // Skip if location hasn't changed significantly (prevent redundant calculations)
    const locationKey = `${driverLocation.lat.toFixed(5)},${driverLocation.lng.toFixed(5)}`
    if (lastDriverLocationRef.current === locationKey) {
      console.log('Skipping - location unchanged')
      return
    }
    lastDriverLocationRef.current = locationKey

    let isMounted = true

    const calculateAllDistances = async () => {
      console.log('Starting distance calculations for', parkingSlots.length, 'slots')
      const distances = {}

      for (const slot of parkingSlots) {
        if (!isMounted) return
        if (slot.coordinates && slot.coordinates.lat && slot.coordinates.lng) {
          const routeData = await calculateRouteDistance(driverLocation, slot.coordinates)
          distances[slot.id] = routeData
          console.log(`Distance calculated for ${slot.id}:`, routeData)
        }
      }

      if (isMounted) {
        console.log('Setting route distances:', distances)
        setRouteDistances(distances)
      }
    }

    calculateAllDistances()

    return () => {
      isMounted = false
    }
  }, [driverLocation, parkingSlots])

  // Filter parking slots - apply filter and sort by distance
  const filteredSlots = (parkingSlots || [])
    .map((slot) => {
      // Use route distance for sorting and display
      const routeData = routeDistances[slot.id] || { distance: null, duration: null, isApproximate: false }
      const distance = routeData.distance !== null ? routeData.distance : Infinity
      
      return { 
        ...slot, 
        calculatedDistance: distance,
        routeData: routeData
      }
    })
    .filter((slot) => {
      // Exclude current user's own parking slots from find parkings
      if (slot.ownerId === currentUser?.id) {
        return false
      }

      const isFull = slot.availableSlots === 0
      const isOpen = isParkingOpen(slot)
      const isOwnerClosed = !slot.isAvailable
      
      switch (selectedFilter) {
        case 'all':
          return true
        case 'open':
          return !isFull && isOpen && !isOwnerClosed
        case 'closed':
          return (!isOpen && !isFull) || isOwnerClosed
        case 'full':
          return isFull
        default:
          return true
      }
    })
    .sort((a, b) => {
      // Handle Infinity values in sorting - put them at the end
      const aDist = a.calculatedDistance === Infinity ? 99999 : a.calculatedDistance
      const bDist = b.calculatedDistance === Infinity ? 99999 : b.calculatedDistance
      return aDist - bDist
    })

  const activeBooking = myBookings.find(b => b.status === BookingStatus.ACTIVE)
  const overstayingBooking = myBookings.find(b => b.status === BookingStatus.OVERSTAYING)
  const confirmedBooking = myBookings.find(b => b.status === BookingStatus.CONFIRMED)

  const currentSessionBooking = activeBooking || overstayingBooking

  // Persist timer during navigation
  useEffect(() => {
    if (currentSessionBooking && currentSessionBooking.startTime) {
      try {
        const savedTimer = localStorage.getItem(`parkingTimer_${currentSessionBooking.id}`)
        if (savedTimer) {
          setParkingTimer(parseInt(savedTimer, 10))
        }
      } catch (error) {
        console.error('Error reading from localStorage:', error)
      }
    }
  }, [currentSessionBooking])

  // Save timer to localStorage on changes
  useEffect(() => {
    if (currentSessionBooking && currentSessionBooking.startTime) {
      try {
        localStorage.setItem(`parkingTimer_${currentSessionBooking.id}`, parkingTimer.toString())
      } catch (error) {
        console.error('Error writing to localStorage:', error)
      }
    }
  }, [parkingTimer, currentSessionBooking])

  // Fetch owner details for confirmed/active bookings
  useEffect(() => {
    const fetchOwnerDetails = async () => {
      const bookingsToFetch = myBookings.filter(b => 
        [BookingStatus.CONFIRMED, BookingStatus.ACTIVE, BookingStatus.OVERSTAYING].includes(b.status)
      )
      
      const details = {}
      for (const booking of bookingsToFetch) {
        if (booking.ownerId && !details[booking.ownerId]) {
          const owner = await userDatabase.getUserById(booking.ownerId)
          details[booking.ownerId] = owner
        }
      }
      setOwnerDetails(details)
    }
    
    fetchOwnerDetails()
  }, [myBookings])

  // Monitor for completed bookings to show invoice
  useEffect(() => {
    const justCompletedBooking = myBookings.find(
      b => b.status === BookingStatus.COMPLETED && !b.invoiceShownToDriver
    )
    if (justCompletedBooking) {
      setCompletedBooking(justCompletedBooking)
      setInvoiceBreakdown(calculatePaymentBreakdown(justCompletedBooking.id))
      markInvoiceShown(justCompletedBooking.id)
    }
  }, [myBookings, calculatePaymentBreakdown, markInvoiceShown])

  // Timer for active/overstaying parking session
  useEffect(() => {
    let interval
    if (currentSessionBooking && currentSessionBooking.startTime) {
      interval = setInterval(() => {
        const elapsed = Date.now() - new Date(currentSessionBooking.startTime).getTime()
        setParkingTimer(elapsed)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [currentSessionBooking])

  // Auto-start GPS tracking when there's a CONFIRMED booking for live route updates
  useEffect(() => {
    if (confirmedBooking) {
      // Start continuous GPS tracking for live route updates
      startGPSTracking()
    } else {
      // Stop GPS tracking when no CONFIRMED booking to save battery
      stopGPSTracking()
    }
  }, [confirmedBooking, startGPSTracking, stopGPSTracking])

  // Load all parking slots globally on mount (for Find Parking flow)
  // This ensures drivers see all available slots regardless of which owner created them
  useEffect(() => {
    initializeParkingSlots()
  }, [initializeParkingSlots])

  const formatParkingTime = (ms) => {
    const totalSec = Math.floor(ms / 1000)
    const hours = Math.floor(totalSec / 3600)
    const minutes = Math.floor((totalSec % 3600) / 60)
    const seconds = totalSec % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  const getRemainingTime = () => {
    if (!currentSessionBooking || !currentSessionBooking.plannedEndTime) return null
    const remaining = new Date(currentSessionBooking.plannedEndTime).getTime() - currentTime
    return Math.max(0, remaining)
  }

  const getOverstayData = () => {
    if (!currentSessionBooking) return { overstayMs: 0, extraCharges: 0, isInGrace: false, graceRemaining: 0 }
    return calculateOverstayData(currentSessionBooking, currentTime)
  }

  const getProgressPercent = () => {
    if (!currentSessionBooking || !currentSessionBooking.startTime || !currentSessionBooking.plannedEndTime) return 0
    const totalDuration = new Date(currentSessionBooking.plannedEndTime).getTime() - new Date(currentSessionBooking.startTime).getTime()
    const elapsed = parkingTimer
    return Math.min(100, Math.max(0, (elapsed / totalDuration) * 100))
  }

  // Helper function to calculate overstay data
  function calculateOverstayData(booking, now) {
    if (booking.status !== 'OVERSTAYING') {
      return { overstayMs: 0, extraCharges: 0, isInGrace: false, graceRemaining: 0 }
    }

    const graceStartTime = booking.graceStartTime ? new Date(booking.graceStartTime).getTime() :
                           (booking.plannedEndTime ? new Date(booking.plannedEndTime).getTime() : now)
    const gracePeriodEnd = graceStartTime + (5 * 60 * 1000)

    if (now <= gracePeriodEnd) {
      return {
        overstayMs: 0,
        extraCharges: 0,
        isInGrace: true,
        graceRemaining: gracePeriodEnd - now
      }
    }

    const overstayMs = now - gracePeriodEnd
    const overstayMinutes = Math.ceil(overstayMs / (60 * 1000))
    const extraCharges = overstayMinutes * 0.50

    return {
      overstayMs,
      extraCharges,
      isInGrace: false,
      graceRemaining: 0
    }
  }

  const handleCancelBooking = (bookingId) => {
    const result = cancelBooking(bookingId, 'driver_no_show')
    if (!result.success) {
      console.error('Cancel failed:', result.error)
    }
  }

  const handleBook = (slot) => {
    setSelectedSlot(slot)
    setShowBookingPanel(true)
  }

  const handleConfirmBooking = (durationMinutes) => {
    if (!selectedSlot || !currentUser) return

    setBookingSlotId(selectedSlot.id)
    const booking = createBooking({
      driverId: currentUser.id,
      ownerId: selectedSlot.ownerId,
      slotId: selectedSlot.id,
      durationMinutes,
      driverLocation, // Pass driver's current location for route display
    })

    if (!booking) {
      // Booking failed (likely no slots available)
      addNotification({
        message: `No slots available for ${selectedSlot.name}`,
        type: 'error',
        timestamp: new Date().toISOString(),
        forRole: 'driver',
        forUserId: currentUser.id,
      })
      setShowBookingPanel(false)
      setSelectedSlot(null)
      setBookingSlotId(null)
      return
    }

    addNotification({
      message: `New booking confirmed for ${selectedSlot.name}`,
      type: 'booking',
      timestamp: new Date().toISOString(),
      forRole: 'owner',
      forUserId: selectedSlot.ownerId,
      bookingId: booking.id,
    })

    setShowBookingPanel(false)
    setSelectedSlot(null)
    setBookingSlotId(null)
  }

  const handleCloseBookingPanel = () => {
    setShowBookingPanel(false)
    setSelectedSlot(null)
  }

  const handleCloseInvoice = () => {
    setCompletedBooking(null)
    setInvoiceBreakdown(null)
  }

  const handleContinueToRating = () => {
    const bookingToRate = completedBooking
    setCompletedBooking(null)
    setInvoiceBreakdown(null)
    setRatingBooking(bookingToRate)
    setShowRatingModal(true)
  }

  const handleOpenRating = (booking) => {
    setRatingBooking(booking)
    setShowRatingModal(true)
  }

  const handleCloseRating = () => {
    setShowRatingModal(false)
    setRatingBooking(null)
  }

  const handleSubmitRating = (ratings) => {
    if (ratingBooking) {
      submitRating(ratingBooking.id, 'driver', ratings)
      handleCloseRating()
    }
  }

  const handleRefreshLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          console.log('Location refreshed:', { latitude, longitude })
          useStore.setState({ driverLocation: { lat: latitude, lng: longitude } })
          setLocationError(null)
        },
        (error) => {
          console.error('Location refresh error:', error)
          if (error.code === 1) {
            setLocationError('Location permission denied. Please allow location access.')
          } else if (error.code === 2) {
            setLocationError('Location unavailable. Please check your GPS.')
          } else if (error.code === 3) {
            setLocationError('Location request timed out.')
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      )
    } else {
      setLocationError('Geolocation is not supported by your browser.')
    }
  }

  const getSlotName = (slotId) => {
    const slot = parkingSlots.find((s) => s.id === slotId)
    return slot?.name || slotId
  }

  // Find completed bookings that haven't been rated by driver yet
  const unratedCompletedBookings = myBookings.filter(
    (b) => b.status === BookingStatus.COMPLETED && !b.driverHasRated
  )

  return (
    <div className="min-h-screen bg-cover bg-center bg-no-repeat relative" style={{ backgroundImage: "url('/images/bg.png')" }}>
      <div className="absolute inset-0 bg-white/30 pointer-events-none"></div>
      <div className="max-w-6xl mx-auto px-4 py-6 relative z-10">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Welcome, {currentUser?.name} 👋
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              Find the perfect parking spot near you
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-400">Average Rating</p>
          <p className="text-2xl font-bold text-amber-600">⭐ {getDriverAverageRating(currentUser?.id)}</p>
        </div>
      </div>

      {/* ── Parking Slots ─────────────────────────────────────── */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-700">Parking Slots</h3>
          
          {/* Filter Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefreshLocation}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all bg-blue-600 text-white shadow-md hover:bg-blue-700 flex items-center gap-2"
            >
              📍 Locate Me
            </button>
            {['all', 'open', 'closed', 'full'].map((filter) => (
              <button
                key={filter}
                onClick={() => setSelectedFilter(filter)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedFilter === filter
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>
        </div>
        
        {/* Location Error Message */}
        {locationError && (
          <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-700 px-4 py-2 rounded-lg text-sm">
            {locationError}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSlots.map((slot) => (
          <SlotCard
            key={slot.id}
            slot={slot}
            view="driver"
            onBook={handleBook}
            calculatedDistance={formatRouteDistance(slot.routeData)}
          />
        ))}
      </div>

      {filteredSlots.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          No parking slots available.
        </div>
      )}

      {/* ── My Bookings (Confirmed/Active/Overstaying) ─────────────── */}
      {(confirmedBooking || currentSessionBooking) && (
        <div className="mt-10">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">
            My Booking
            <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
              {confirmedBooking ? 'Confirmed' : currentSessionBooking?.status?.replace(/_/g, ' ')}
            </span>
          </h3>
          <div className="grid grid-cols-1 gap-4">
            {confirmedBooking && (
              <div key={confirmedBooking.id} className="bg-green-50 border border-green-200 rounded-xl p-5">
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Left Column: Booking Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-green-800">{getSlotName(confirmedBooking.slotId)}</h3>
                        <p className="text-xs text-green-600 mt-1">
                          Confirmed{' '}
                          {new Date(confirmedBooking.confirmedAt).toLocaleTimeString()}
                        </p>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full font-medium bg-green-100 text-green-700">
                        {BookingStatus.CONFIRMED}
                      </span>
                    </div>

                    <div className="mb-4 space-y-2">
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>Estimated arrival:</span>
                        <span>{new Date(confirmedBooking.estimatedArrivalTime).toLocaleTimeString()}</span>
                      </div>
                    </div>

                    {/* Entry OTP Display - Driver shares this with owner */}
                    <div className="bg-white rounded-lg p-3 mb-4 border border-gray-200">
                      <p className="text-sm text-gray-600 mb-2">Your Entry OTP (share with owner):</p>
                      <p className="text-3xl font-mono font-bold text-green-600 text-center tracking-wider">
                        {confirmedBooking.entryOTP}
                      </p>
                      <p className="text-xs text-gray-500 mt-2 text-center">
                        Show this OTP to the parking owner to enter
                      </p>
                    </div>

                    {/* Cancel Button */}
                    <button
                      onClick={() => handleCancelBooking(confirmedBooking.id)}
                      className="w-full py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
                    >
                      Cancel Booking
                    </button>
                  </div>

                  {/* Right Column: Route Map */}
                  {(() => {
                    const slot = parkingSlots.find((s) => s.id === confirmedBooking.slotId)
                    return slot?.coordinates && (
                      <div className="flex-1 bg-white rounded-lg p-4 border border-gray-200">
                        <h5 className="font-semibold text-gray-800 mb-3">Route to Parking</h5>
                        <RouteMap
                          destination={slot.coordinates}
                          driverLocation={driverLocation}
                          onRecenter={handleRefreshLocation}
                        />
                      </div>
                    )
                  })()}
                </div>
              </div>
            )}

            {currentSessionBooking && (
              <div key={currentSessionBooking.id} className={`rounded-xl p-5 border ${
                currentSessionBooking.status === BookingStatus.OVERSTAYING 
                  ? 'bg-red-50 border-red-200' 
                  : 'bg-emerald-50 border-emerald-200'
              }`}>
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Left Column: Booking Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className={`font-semibold ${
                          currentSessionBooking.status === BookingStatus.OVERSTAYING 
                            ? 'text-red-800' 
                            : 'text-emerald-800'
                        }`}>
                          {getSlotName(currentSessionBooking.slotId)}
                        </h3>
                        <p className={`text-xs mt-1 ${
                          currentSessionBooking.status === BookingStatus.OVERSTAYING 
                            ? 'text-red-600' 
                            : 'text-emerald-600'
                        }`}>
                          Started{' '}
                          {new Date(currentSessionBooking.startTime).toLocaleTimeString()}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        currentSessionBooking.status === BookingStatus.OVERSTAYING 
                          ? 'bg-red-100 text-red-700' 
                          : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {currentSessionBooking.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    {/* Parking Timer */}
                    {currentSessionBooking.plannedEndTime && (
                      <div className="bg-white rounded-lg p-3 mb-3 border border-gray-200">
                        <p className="text-sm text-gray-600 mb-1">Parking Timer:</p>
                        <p className="text-2xl font-bold text-gray-800">
                          {formatParkingTime(parkingTimer)}
                        </p>
                        {currentSessionBooking.status === BookingStatus.OVERSTAYING ? (
                          <p className="text-xs text-red-600 mt-1">Overstaying - extra charges may apply</p>
                        ) : (
                          <p className="text-xs text-gray-400 mt-1">
                            Ends at {new Date(currentSessionBooking.plannedEndTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Exit OTP Section */}
                    <div className="bg-white rounded-lg p-3 mb-3 border border-blue-200">
                      <p className="text-sm text-gray-600 mb-2">Exit OTP:</p>
                      {currentSessionBooking.exitOTP ? (
                        <div>
                          <p className="text-3xl font-mono font-bold text-blue-600 text-center tracking-wider mb-2">
                            {currentSessionBooking.exitOTP}
                          </p>
                          <p className="text-xs text-gray-500 text-center">
                            Share this OTP with the owner to exit
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <button
                            onClick={() => generateExitOTP(currentSessionBooking.id)}
                            className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                          >
                            Generate Exit OTP
                          </button>
                          <p className="text-xs text-gray-500 text-center">
                            Generate OTP when ready to leave
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Route Map */}
                  {(() => {
                    const slot = parkingSlots.find((s) => s.id === currentSessionBooking.slotId)
                    return slot?.coordinates && (
                      <div className="flex-1 bg-white rounded-lg p-4 border border-gray-200">
                        <h5 className="font-semibold text-gray-800 mb-3">Route to Parking</h5>
                        <RouteMap
                          destination={slot.coordinates}
                          driverLocation={driverLocation}
                          onRecenter={handleRefreshLocation}
                        />
                      </div>
                    )
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Booking History ─────────────────────────────────── */}
      {otherBookings.length > 0 && (
        <div className="mt-10">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">
            Booking History
          </h3>
          <div className="space-y-3">
            {otherBookings.map((b) => (
              <div key={b.id} className="space-y-3">
                <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between hover:shadow-md transition-shadow">
                  <div>
                    <p className="font-medium text-gray-800">
                      {getSlotName(b.slotId)}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Slot ID: {b.slotId} &middot;{' '}
                      {new Date(b.requestedAt).toLocaleString()}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-3 py-1.5 rounded-full font-medium border flex items-center gap-1.5 ${
                      STATUS_BADGE[b.status] || 'bg-gray-100 text-gray-600 border-gray-300'
                    }`}
                  >
                    <span>{STATUS_ICON[b.status] || '📋'}</span>
                    <span>{b.status.replace(/_/g, ' ')}</span>
                  </span>
                </div>

                {/* Rating Prompt for Completed Bookings */}
                {b.status === BookingStatus.COMPLETED && !b.driverHasRated && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-amber-800">Rate Your Experience</p>
                        <p className="text-xs text-amber-600 mt-1">
                          Please rate the owner for this booking
                        </p>
                      </div>
                      <button
                        onClick={() => handleOpenRating(b)}
                        className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm font-medium"
                      >
                        Rate Now
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invoice Screen Modal */}
      {completedBooking && invoiceBreakdown && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <InvoiceScreen
            booking={completedBooking}
            breakdown={invoiceBreakdown}
            onClose={handleCloseInvoice}
            onContinue={handleContinueToRating}
            userType="driver"
          />
        </div>
      )}

      {/* Rating Form Modal */}
      {showRatingModal && ratingBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <RatingForm
            booking={ratingBooking}
            userType="driver"
            onSubmit={handleSubmitRating}
            onClose={handleCloseRating}
          />
        </div>
      )}

      {/* Booking Panel Modal */}
      {showBookingPanel && selectedSlot && (
        <BookingPanel
          slot={selectedSlot}
          onConfirm={handleConfirmBooking}
          onCancel={handleCloseBookingPanel}
        />
      )}
      </div>
    </div>
  )
}

export default DriverDashboard
