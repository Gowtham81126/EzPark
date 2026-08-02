import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import PaymentBreakdown from './PaymentBreakdown'
import { userDatabase } from '../utils/userDatabase'

function InvoiceScreen({ booking, breakdown, onClose, onContinue, userType }) {
  const navigate = useNavigate()
  const [otherUser, setOtherUser] = useState(null)

  useEffect(() => {
    const fetchOtherUser = async () => {
      if (!booking) return
      const userId = userType === 'owner' ? booking.driverId : booking.ownerId
      const user = await userDatabase.getUserById(userId)
      setOtherUser(user)
    }
    fetchOtherUser()
  }, [booking, userType])

  if (!booking || !breakdown) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
        No invoice data available
      </div>
    )
  }

  const handleContinue = () => {
    if (onContinue) {
      onContinue()
    } else if (onClose) {
      onClose()
    } else {
      navigate('/driver')
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="border-b border-gray-200 pb-3 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Parking Invoice</h2>
            <p className="text-xs text-gray-500 mt-1">Booking ID: {booking.id}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Status</p>
            <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 mt-1">
              COMPLETED
            </span>
          </div>
        </div>
      </div>

      {/* Horizontal Layout */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        {/* Other Party Details */}
        {otherUser && (
          <div className="bg-blue-50 rounded-lg p-3">
            <h3 className="text-xs font-semibold text-blue-700 mb-2">
              {userType === 'owner' ? 'Driver Details' : 'Owner Details'}
            </h3>
            <div className="text-xs space-y-1">
              <div>
                <p className="text-blue-600">Name</p>
                <p className="font-medium text-gray-800">{otherUser.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-blue-600">Phone</p>
                <p className="font-medium text-gray-800">{otherUser.phoneNumber || 'N/A'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Booking Details */}
        <div className="bg-gray-50 rounded-lg p-3">
          <h3 className="text-xs font-semibold text-gray-700 mb-2">Session Details</h3>
          <div className="text-xs space-y-1">
            <div>
              <p className="text-gray-500">Start</p>
              <p className="font-medium text-gray-800">
                {booking.startTime ? new Date(booking.startTime).toLocaleString() : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-gray-500">End</p>
              <p className="font-medium text-gray-800">
                {booking.endTime ? new Date(booking.endTime).toLocaleString() : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Duration</p>
              <p className="font-medium text-gray-800">{booking.durationMinutes} min</p>
            </div>
            <div>
              <p className="text-gray-500">Slot ID</p>
              <p className="font-medium text-gray-800">{booking.slotId}</p>
            </div>
          </div>
        </div>

        {/* Payment Breakdown */}
        <div className="bg-gray-50 rounded-lg p-3">
          <h3 className="text-xs font-semibold text-gray-700 mb-2">Payment Details</h3>
          <PaymentBreakdown breakdown={breakdown} />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleContinue}
          className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
        >
          Continue to Dashboard
        </button>
      </div>
    </div>
  )
}

export default InvoiceScreen
