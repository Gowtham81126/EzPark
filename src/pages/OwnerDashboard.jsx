import { useState, useEffect, useMemo, useRef } from 'react'
import { useStore, BookingStatus } from '../store/useStore'
import SlotCard from '../components/SlotCard'
import ConfirmedBookingCard from '../components/ConfirmedBookingCard'
import RatingForm from '../components/RatingForm'
import SystemLogsPanel from '../components/SystemLogsPanel'
import InvoiceScreen from '../components/InvoiceScreen'
import { getOverstayData, formatOverstayTime } from '../utils/overstayCalculator'
import { userDatabase } from '../utils/userDatabase'

function OwnerDashboard() {
  const currentUser = useStore((s) => s.currentUser)
  const parkingSlots = useStore((s) => s.parkingSlots)
  const bookings = useStore((s) => s.bookings)
  const notifications = useStore((s) => s.notifications)
  const submitRating = useStore((s) => s.submitRating)
  const ownerVerifyExitOTP = useStore((s) => s.ownerVerifyExitOTP)
  const calculatePaymentBreakdown = useStore((s) => s.calculatePaymentBreakdown)
  const markInvoiceShownToOwner = useStore((s) => s.markInvoiceShownToOwner)
  const driverLocation = useStore((s) => s.driverLocation)
  const loadParkingSlotsByOwner = useStore((s) => s.loadParkingSlotsByOwner)
  const initializeDriverLocation = useStore((s) => s.initializeDriverLocation)
  const currentTime = Date.now() // Use local time instead of store time to avoid re-renders
  const [showRatingModal, setShowRatingModal] = useState(false)
  const [ratingBooking, setRatingBooking] = useState(null)
  const [exitOTPInputs, setExitOTPInputs] = useState({})
  const [exitOTPErrors, setExitOTPErrors] = useState({})
  const [completedBooking, setCompletedBooking] = useState(null)
  const [invoiceBreakdown, setInvoiceBreakdown] = useState(null)
  const [parkingTimers, setParkingTimers] = useState({})
  const [driverDetails, setDriverDetails] = useState({})

  // Track active booking IDs to prevent unnecessary timer updates
  const activeBookingIdsRef = useRef([])

  // Load parking slots for this owner on mount
  useEffect(() => {
    if (currentUser?.id) {
      loadParkingSlotsByOwner(currentUser.id)
    }
  }, [currentUser?.id, loadParkingSlotsByOwner])

  // Initialize driver location from localStorage on mount
  useEffect(() => {
    initializeDriverLocation()
  }, [initializeDriverLocation])

  // Listen for localStorage changes to sync driver location across tabs
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'parkeasy_driver_location' && e.newValue) {
        try {
          const newLocation = JSON.parse(e.newValue)
          useStore.setState({ driverLocation: newLocation })
        } catch (error) {
          console.error('Error parsing driver location from storage event:', error)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const ownerBookings = useMemo(() => (bookings || []).filter((b) => b.ownerId === currentUser?.id), [bookings, currentUser?.id])
  const confirmedBookings = useMemo(() => ownerBookings.filter((b) => b.status === BookingStatus.CONFIRMED), [ownerBookings])
  const activeBookings = useMemo(() => ownerBookings.filter((b) => b.status === BookingStatus.ACTIVE), [ownerBookings])
  const overstayingBookings = useMemo(() => ownerBookings.filter((b) => b.status === BookingStatus.OVERSTAYING), [ownerBookings])
  const otherBookings = useMemo(() => ownerBookings.filter((b) => ![BookingStatus.CONFIRMED, BookingStatus.ACTIVE, BookingStatus.OVERSTAYING].includes(b.status)), [ownerBookings])

  const getSlotName = (slotId) => {
    const slot = parkingSlots.find((s) => s.id === slotId)
    return slot?.name || slotId
  }

  // Format parking time as HH:MM:SS
  const formatParkingTime = (ms) => {
    const totalSec = Math.floor(ms / 1000)
    const hours = Math.floor(totalSec / 3600)
    const minutes = Math.floor((totalSec % 3600) / 60)
    const seconds = totalSec % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  // Get remaining time for a booking
  const getRemainingTime = (booking) => {
    if (!booking || !booking.plannedEndTime) return null
    const remaining = new Date(booking.plannedEndTime).getTime() - Date.now()
    return Math.max(0, remaining)
  }

  // Fetch driver details for confirmed/active bookings
  useEffect(() => {
    const fetchDriverDetails = async () => {
      const bookingsToFetch = ownerBookings.filter(b => 
        [BookingStatus.CONFIRMED, BookingStatus.ACTIVE, BookingStatus.OVERSTAYING].includes(b.status)
      )
      
      const details = {}
      for (const booking of bookingsToFetch) {
        if (booking.driverId && !details[booking.driverId]) {
          const driver = await userDatabase.getUserById(booking.driverId)
          details[booking.driverId] = driver
        }
      }
      setDriverDetails(details)
    }
    
    fetchDriverDetails()
  }, [ownerBookings])

  // Format remaining time as "Xh Ym"
  const formatRemainingTime = (ms) => {
    if (ms <= 0) return '0m'
    const totalMin = Math.floor(ms / (60 * 1000))
    const hours = Math.floor(totalMin / 60)
    const minutes = totalMin % 60
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  // Update parking timers for active bookings
  useEffect(() => {
    const currentActiveIds = activeBookings.map(b => b.id).sort()
    const previousActiveIds = activeBookingIdsRef.current.sort()

    // Only restart interval if active bookings changed
    if (JSON.stringify(currentActiveIds) === JSON.stringify(previousActiveIds)) {
      return
    }

    activeBookingIdsRef.current = currentActiveIds

    const interval = setInterval(() => {
      const newTimers = {}
      activeBookings.forEach((booking) => {
        if (booking.startTime && booking.plannedEndTime) {
          const elapsed = Date.now() - new Date(booking.startTime).getTime()
          newTimers[booking.id] = elapsed
        }
      })
      setParkingTimers(newTimers)
    }, 1000)

    return () => clearInterval(interval)
  }, [activeBookings])

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
      submitRating(ratingBooking.id, 'owner', ratings)
      handleCloseRating()
    }
  }

  const handleVerifyExitOTP = (bookingId) => {
    const otpInput = exitOTPInputs[bookingId]
    if (!otpInput) {
      setExitOTPErrors(prev => ({ ...prev, [bookingId]: 'Please enter the exit OTP' }))
      return
    }

    const result = ownerVerifyExitOTP(bookingId, otpInput)
    if (result.success) {
      setExitOTPInputs(prev => ({ ...prev, [bookingId]: '' }))
      setExitOTPErrors(prev => ({ ...prev, [bookingId]: '' }))
    } else {
      if (result.error === 'INVALID_OTP') {
        setExitOTPErrors(prev => ({ ...prev, [bookingId]: 'Invalid exit OTP. Please try again.' }))
      } else {
        setExitOTPErrors(prev => ({ ...prev, [bookingId]: 'Something went wrong. Please try again.' }))
      }
    }
  }

  const handleCloseInvoice = () => {
    setCompletedBooking(null)
    setInvoiceBreakdown(null)
  }

  // Monitor for completed bookings to show invoice
  useEffect(() => {
    const justCompletedBooking = ownerBookings.find(
      b => b.status === BookingStatus.COMPLETED && !b.invoiceShownToOwner
    )
    if (justCompletedBooking) {
      setCompletedBooking(justCompletedBooking)
      setInvoiceBreakdown(calculatePaymentBreakdown(justCompletedBooking.id))
      markInvoiceShownToOwner(justCompletedBooking.id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownerBookings])

  // Find completed bookings that haven't been rated by owner yet
  const unratedCompletedBookings = ownerBookings.filter(
    (b) => b.status === BookingStatus.COMPLETED && !b.ownerHasRated
  )

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

  const avgRating = '5.0'


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
              Manage your parking locations and track bookings
            </p>
          </div>
          <SystemLogsPanel />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-400">Active Bookings</p>
            <p className="text-2xl font-bold text-primary-600">{activeBookings.length + overstayingBookings.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-400">Avg Rating</p>
            <p className="text-2xl font-bold text-amber-600">⭐ {avgRating}</p>
          </div>
        </div>

        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Your Locations</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {parkingSlots.map((slot) => (
            <SlotCard 
              key={slot.id} 
              slot={slot} 
              view="owner" 
            />
          ))}
        </div>

        {parkingSlots.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            No parking locations available.
          </div>
        )}


        {/* ── Confirmed Bookings (Driver Did Not Arrive) ──────────────── */}
        {confirmedBookings.length > 0 && (
          <div className="mt-10">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">
              Confirmed Bookings
              <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                {confirmedBookings.length} confirmed
              </span>
            </h3>
            <div className="grid grid-cols-1 gap-4">
              {confirmedBookings.map((b) => (
                <ConfirmedBookingCard key={b.id} booking={b} />
              ))}
            </div>
          </div>
        )}

        {/* ── Active Parking Sessions ───────────────────────────────── */}
        {activeBookings.length > 0 && (
          <div className="mt-10">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">
              Active Parking Sessions
              <span className="ml-2 text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                {activeBookings.length} active
              </span>
            </h3>
            <div className="grid grid-cols-1 gap-4">
              {activeBookings.map((b) => {
                const driver = driverDetails[b.driverId]
                return (
                  <div key={b.id} className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
                    <div className="flex flex-col md:flex-row gap-4">
                      {/* Left Column: Booking Info */}
                      <div className="flex-1">
                        {/* Driver Details Card */}
                        {driver && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                            <h4 className="font-semibold text-blue-800 mb-3">Driver Details</h4>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div>
                                <p className="text-blue-600">Name</p>
                                <p className="font-medium text-gray-800">{driver.name || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-blue-600">Phone Number</p>
                                <p className="font-medium text-gray-800">{driver.phoneNumber || 'N/A'}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-emerald-800">{getSlotName(b.slotId)}</h3>
                            <p className="text-xs text-emerald-600 mt-1">
                              Started{' '}
                              {new Date(b.startTime).toLocaleTimeString()}
                            </p>
                          </div>
                          <span className="text-xs px-2 py-1 rounded-full font-medium bg-emerald-100 text-emerald-700">
                            {BookingStatus.ACTIVE}
                          </span>
                        </div>

                        {/* Parking Timer - Real-time countdown */}
                        {b.plannedEndTime && (
                          <div className="bg-white rounded-lg p-3 mb-3 border border-emerald-200">
                            <p className="text-sm text-gray-600 mb-1">Parking Ends In:</p>
                            <p className="text-2xl font-bold text-emerald-600">
                              {formatRemainingTime(getRemainingTime(b))}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              Expected end: {new Date(b.plannedEndTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        )}

                        <div className="bg-white rounded-lg p-3 mb-3">
                          <p className="text-sm text-gray-600 mb-1">Driver rating:</p>
                          <p className="text-lg font-bold text-blue-600">⭐ 5.0</p>
                        </div>

                        {/* Exit OTP Input - Owner enters driver's exit OTP */}
                        <div className="bg-white rounded-lg p-3 mb-3 border border-blue-200">
                          <p className="text-sm text-gray-600 mb-2">Enter exit OTP from driver:</p>
                          {b.exitOTP ? (
                            <div className="space-y-3">
                              <input
                                type="text"
                                placeholder="Enter exit OTP"
                                value={exitOTPInputs[b.id] || ''}
                                onChange={(e) => {
                                  setExitOTPInputs(prev => ({ ...prev, [b.id]: e.target.value }))
                                  setExitOTPErrors(prev => ({ ...prev, [b.id]: '' }))
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                maxLength={4}
                            />
                            {exitOTPErrors[b.id] && (
                              <p className="text-sm text-red-600">{exitOTPErrors[b.id]}</p>
                            )}
                            <button
                              onClick={() => handleVerifyExitOTP(b.id)}
                              className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                            >
                              Verify Exit OTP
                            </button>
                          </div>
                        ) : (
                          <p className="text-xs text-gray-500 italic">Waiting for driver to generate exit OTP...</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                )
              })}
          </div>
        </div>
      )}

        {/* ── Overstaying Sessions ─────────────────────────────────── */}
        {overstayingBookings.length > 0 && (
          <div className="mt-10">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">
              Overstaying Sessions
              <span className="ml-2 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                {overstayingBookings.length} overstaying
              </span>
            </h3>
            <div className="grid grid-cols-1 gap-4">
              {overstayingBookings.map((b) => {
                const overstayInfo = getOverstayData(b, currentTime)
                const driver = driverDetails[b.driverId]
                
                return (
                  <div key={b.id} className="bg-red-50 border border-red-200 rounded-xl p-5">
                    <div className="flex flex-col md:flex-row gap-4">
                      {/* Left Column: Booking Info */}
                      <div className="flex-1">
                        {/* Driver Details Card */}
                        {driver && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                            <h4 className="font-semibold text-blue-800 mb-3">Driver Details</h4>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div>
                                <p className="text-blue-600">Name</p>
                                <p className="font-medium text-gray-800">{driver.name || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-blue-600">Phone Number</p>
                                <p className="font-medium text-gray-800">{driver.phoneNumber || 'N/A'}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-red-800">{getSlotName(b.slotId)}</h3>
                            <p className="text-xs text-red-600 mt-1">
                              Overstaying since{' '}
                              {b.graceStartTime ? new Date(b.graceStartTime).toLocaleTimeString() : 'Unknown'}
                            </p>
                          </div>
                          <span className="text-xs px-2 py-1 rounded-full font-medium bg-red-100 text-red-700">
                            {BookingStatus.OVERSTAYING}
                          </span>
                        </div>

                        {/* Grace Period or Extra Time Display */}
                        <div className="bg-white rounded-lg p-3 mb-3 border border-red-200">
                          {overstayInfo.isInGrace ? (
                            <>
                              <p className="text-sm text-gray-600 mb-1">Grace Period Remaining:</p>
                              <p className="text-2xl font-bold text-red-600">
                                {formatParkingTime(Math.max(0, overstayInfo.graceRemaining))}
                              </p>
                              <p className="text-xs text-red-600 mt-1">No extra charges yet</p>
                            </>
                          ) : (
                            <>
                              <p className="text-sm text-gray-600 mb-1">Overstay Time:</p>
                              <p className="text-2xl font-bold text-red-600">
                                +{formatParkingTime(overstayInfo.overstayMs)}
                              </p>
                              <p className="text-xs text-red-600 mt-1">Extra charges apply</p>
                            </>
                          )}
                        </div>

                        {/* Extra Charges Display */}
                        {!overstayInfo.isInGrace && (
                          <div className="bg-red-100 border border-red-300 rounded-lg p-3 mb-3">
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="text-xs text-red-700 font-medium">Extra Charges</p>
                                <p className="text-xs text-red-600">(₹0.50/min after grace)</p>
                              </div>
                              <p className="text-xl font-bold text-red-800">₹{overstayInfo.extraCharges.toFixed(2)}</p>
                            </div>
                          </div>
                        )}

                        <div className="bg-white rounded-lg p-3 mb-3">
                          <p className="text-sm text-gray-600 mb-1">Driver rating:</p>
                          <p className="text-lg font-bold text-blue-600">⭐ 5.0</p>
                        </div>

                        {/* Exit OTP Input - Owner enters driver's exit OTP */}
                        <div className="bg-white rounded-lg p-3 mb-3 border border-blue-200">
                          <p className="text-sm text-gray-600 mb-2">Enter exit OTP from driver:</p>
                          {b.exitOTP ? (
                            <div className="space-y-3">
                              <input
                                type="text"
                                placeholder="Enter exit OTP"
                                value={exitOTPInputs[b.id] || ''}
                                onChange={(e) => {
                                  setExitOTPInputs(prev => ({ ...prev, [b.id]: e.target.value }))
                                  setExitOTPErrors(prev => ({ ...prev, [b.id]: '' }))
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                maxLength={4}
                              />
                              {exitOTPErrors[b.id] && (
                                <p className="text-sm text-red-600">{exitOTPErrors[b.id]}</p>
                              )}
                              <button
                                onClick={() => handleVerifyExitOTP(b.id)}
                                className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                              >
                                Verify Exit OTP
                              </button>
                            </div>
                          ) : (
                            <p className="text-xs text-gray-500 italic">Waiting for driver to generate exit OTP...</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── All Other Bookings ─────────────────────────────────── */}
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
                        Driver: {b.driverId} &middot;{' '}
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
                  {b.status === BookingStatus.COMPLETED && !b.ownerHasRated && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-amber-800">Rate Your Experience</p>
                          <p className="text-xs text-amber-600 mt-1">
                            Please rate the driver for this booking
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

        {/* Rating Form Modal */}
        {showRatingModal && ratingBooking && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <RatingForm
              booking={ratingBooking}
              userType="owner"
              onSubmit={handleSubmitRating}
              onClose={handleCloseRating}
            />
          </div>
        )}

        {/* Invoice Screen Modal */}
        {completedBooking && invoiceBreakdown && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <InvoiceScreen
              booking={completedBooking}
              breakdown={invoiceBreakdown}
              onClose={handleCloseInvoice}
              userType="owner"
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default OwnerDashboard
