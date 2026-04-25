import { useState, useEffect } from 'react'
import { useStore, BookingStatus } from '../store/useStore'
import OwnerRouteMap from './OwnerRouteMap'
import { userDatabase } from '../utils/userDatabase'

function ConfirmedBookingCard({ booking }) {
  const parkingSlots = useStore((s) => s.parkingSlots)
  const cancelBooking = useStore((s) => s.cancelBooking)
  const ownerVerifyOTP = useStore((s) => s.ownerVerifyOTP)
  const globalDriverLocation = useStore((s) => s.driverLocation)
  const bookings = useStore((s) => s.bookings)
  // Use the driver location saved in the booking, fall back to global store
  const [driverLocation, setDriverLocation] = useState(booking.driverLocation || globalDriverLocation)
  const [otpInput, setOtpInput] = useState('')
  const [otpError, setOtpError] = useState('')
  const [driver, setDriver] = useState(null)

  useEffect(() => {
    const fetchDriver = async () => {
      if (booking.driverId) {
        const driverData = await userDatabase.getUserById(booking.driverId)
        setDriver(driverData)
      }
    }
    fetchDriver()
  }, [booking.driverId])

  // Update driver location when booking or global location changes
  useEffect(() => {
    const updatedBooking = bookings.find(b => b.id === booking.id)
    const bookingDriverLocation = updatedBooking?.driverLocation
    const locationToUse = bookingDriverLocation || globalDriverLocation
    setDriverLocation(locationToUse)
  }, [booking.id, bookings, globalDriverLocation])

  // Also update when the booking prop itself changes (e.g., after reload)
  useEffect(() => {
    if (booking.driverLocation) {
      setDriverLocation(booking.driverLocation)
    }
  }, [booking.driverLocation])

  const slot = parkingSlots.find((s) => s.id === booking.slotId)
  const slotName = slot?.name || booking.slotId

  const handleCancel = () => {
    console.log('Cancel clicked for booking:', booking.id, 'Status:', booking.status)
    const result = cancelBooking(booking.id, 'owner_no_show')
    if (!result.success) {
      console.error('Cancel failed:', result.error, result.message)
      alert(result.message || 'Failed to cancel booking')
    } else {
      console.log('Cancel successful for booking:', booking.id)
    }
  }

  const handleVerifyOTP = () => {
    if (!otpInput) {
      setOtpError('Please enter the OTP')
      return
    }

    const result = ownerVerifyOTP(booking.id, otpInput)
    if (result.success) {
      setOtpInput('')
      setOtpError('')
    } else {
      if (result.error === 'INVALID_OTP') {
        setOtpError('Invalid OTP. Please try again.')
      } else {
        setOtpError('Something went wrong. Please try again.')
      }
    }
  }

  return (
    <div className="bg-green-50 border border-green-200 rounded-xl p-5 hover:shadow-md transition-shadow">
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
              <h3 className="font-semibold text-green-800">{slotName}</h3>
              <p className="text-xs text-green-600 mt-1">
                Confirmed{' '}
                {new Date(booking.confirmedAt).toLocaleTimeString()}
              </p>
            </div>
            <span className="text-xs px-2 py-1 rounded-full font-medium bg-green-100 text-green-700">
              {BookingStatus.CONFIRMED}
            </span>
          </div>

          <div className="mb-4 space-y-2">
            <div className="flex justify-between text-xs text-gray-600">
              <span>Estimated arrival:</span>
              <span>{new Date(booking.estimatedArrivalTime).toLocaleTimeString()}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-600">
              <span>Driver rating:</span>
              <span className="font-medium">⭐ 5.0</span>
            </div>
          </div>

          {/* OTP Input - Owner enters driver's OTP */}
          <div className="bg-white rounded-lg p-3 mb-4 border border-gray-200">
            <p className="text-sm text-gray-600 mb-2">Enter OTP from driver:</p>
            <input
              type="text"
              placeholder="Enter OTP"
              value={otpInput}
              onChange={(e) => {
                setOtpInput(e.target.value)
                setOtpError('')
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              maxLength={4}
            />
            {otpError && (
              <p className="text-sm text-red-600 mt-2">{otpError}</p>
            )}
            <button
              onClick={handleVerifyOTP}
              className="mt-3 w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Verify OTP
            </button>
          </div>

          {/* Cancel Button */}
          <button
            onClick={handleCancel}
            className="w-full py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
          >
            Cancel Booking
          </button>
        </div>

        {/* Right Column: Route Map */}
        {slot?.coordinates && (
          <div className="flex-1 bg-white rounded-lg p-4 border border-gray-200">
            <h5 className="font-semibold text-gray-800 mb-3">Driver Route to Parking</h5>
            <OwnerRouteMap
              destination={slot.coordinates}
              driverLocation={driverLocation}
              onRecenter={() => {}}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default ConfirmedBookingCard
