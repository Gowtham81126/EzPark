import { useState } from 'react'
import { useStore, BookingStatus } from '../store/useStore'

function WaitingDriverCard({ booking, onConfirm }) {
  const [confirming, setConfirming] = useState(false)
  const { parkingSlots } = useStore()

  const slot = parkingSlots.find((s) => s.id === booking.slotId)
  const slotName = slot?.name || booking.slotId

  const handleConfirm = async () => {
    setConfirming(true)
    try {
      const result = onConfirm(booking.id)
      if (result.success) {
        // Success - the parent component will handle re-rendering
      }
    } finally {
      setConfirming(false)
    }
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-blue-800">{slotName}</h3>
          <p className="text-xs text-blue-600 mt-1">
            Driver: {booking.driverId} &middot; Waiting since{' '}
            {new Date(booking.startTime).toLocaleTimeString()}
          </p>
        </div>
        <span className="text-xs px-2 py-1 rounded-full font-medium bg-blue-100 text-blue-700">
          {BookingStatus.WAITING_FOR_OWNER}
        </span>
      </div>

      <div className="mb-4">
        <div className="bg-white rounded-lg p-3">
          <p className="text-sm text-gray-600 mb-1">Driver's OTP:</p>
          <p className="text-xl font-mono font-bold text-blue-600">{booking.entryOTP}</p>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Verify this matches the driver's code before confirming entry
        </p>
      </div>

      <div className="space-y-2">
        <button
          onClick={handleConfirm}
          disabled={confirming}
          className="w-full py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {confirming ? 'Confirming...' : 'Confirm Driver Entry'}
        </button>
      </div>
    </div>
  )
}

export default WaitingDriverCard
