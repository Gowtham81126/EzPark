import { useState, useEffect } from 'react'
import { useStore } from '../store/useStore'
import { formatAvailability } from '../utils/availabilityFormatter'
import { getSlotAvailabilityText, isSlotAvailableForBooking } from '../utils/slotAvailabilityManager'
import { isParkingOpen, getRemainingOpenTime, formatCountdown } from '../utils/timeAvailability'
import { getNextSlotAvailability, formatNextSlotAvailability } from '../utils/nextSlotAvailability'

function SlotCard({ slot, view, onBook, calculatedDistance }) {
  const { bookings, toggleSlotAvailability, removeEntireLocation } = useStore()
  const [countdown, setCountdown] = useState(null)
  const [nextSlotCountdown, setNextSlotCountdown] = useState(null)
  const [removeError, setRemoveError] = useState(null)
  const isAvailable = slot.isAvailable
  const isFull = slot.availableSlots === 0
  const isOpen = isParkingOpen(slot)

  // Update countdown every minute
  useEffect(() => {
    const updateCountdown = () => {
      const remaining = getRemainingOpenTime(slot)
      setCountdown(formatCountdown(remaining))
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [slot])

  // Update next slot countdown every minute when full
  useEffect(() => {
    if (!isFull) {
      setNextSlotCountdown(null)
      return
    }

    const updateNextSlotCountdown = () => {
      const nextSlotInfo = getNextSlotAvailability(slot, bookings)
      setNextSlotCountdown(formatNextSlotAvailability(nextSlotInfo))
    }

    updateNextSlotCountdown()
    const interval = setInterval(updateNextSlotCountdown, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [slot, bookings, isFull])

  if (view === 'driver') {
    const isTimeClosed = !isOpen && !isFull
    const isOwnerClosed = !isAvailable
    const isDisabled = isFull || isTimeClosed || isOwnerClosed

    return (
      <div className={`bg-white rounded-2xl shadow-lg p-5 transition-all duration-300 hover:shadow-xl hover:-translate-y-1`}>
        {/* Top Row: Slot Name + Status Badge */}
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-bold text-gray-800 text-lg">{slot.name}</h3>
          <span
            className={`text-xs px-3 py-1.5 rounded-full font-semibold ${
              isFull
                ? 'bg-red-100 text-red-700'
                : isOwnerClosed
                  ? 'bg-red-100 text-red-700'
                  : isTimeClosed
                    ? 'bg-gray-100 text-gray-600'
                    : 'bg-green-100 text-green-700'
            }`}
          >
            {isFull ? 'FULL' : isOwnerClosed ? 'CLOSED' : isTimeClosed ? 'CLOSED' : 'OPEN'}
          </span>
        </div>

        {/* Second Row: Distance + Rating */}
        <div className="flex items-center gap-4 mb-3">
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <span className="text-gray-400">📍</span>
            <span>{calculatedDistance || 'Distance unavailable'}</span>
          </div>
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <span className="text-yellow-400">⭐</span>
            <span>5.0</span>
          </div>
        </div>

        {/* Availability Badge */}
        <div className="mb-3">
          <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 font-medium">
            <span>🕐</span>
            <span>{formatAvailability(slot.availability)}</span>
          </span>
        </div>

        {/* Countdown when closed due to time (not owner-closed) */}
        {isTimeClosed && countdown && !isOwnerClosed && (
          <div className="mb-3">
            <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 font-medium">
              <span>⏱️</span>
              <span>{countdown}</span>
            </span>
          </div>
        )}

        {/* Slot Availability */}
        <div className="mb-4 text-sm">
          {isFull ? (
            <span className="text-red-600 font-semibold">Fully Booked / {slot.totalSlots} total</span>
          ) : (
            <>
              <span className="text-green-600 font-semibold">{slot.availableSlots}</span>
              <span className="text-gray-400"> slots available / </span>
              <span className="text-gray-400">{slot.totalSlots} total</span>
            </>
          )}
        </div>

        {/* Bottom Row: Price + Book Button */}
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold text-gray-800">
            <span className="text-blue-600">₹</span>
            {slot.price}
            <span className="text-sm font-normal text-gray-500">/hr</span>
          </div>
          <button
            disabled={isDisabled}
            onClick={() => !isDisabled && onBook?.(slot)}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md transition-all duration-200 ${
              isDisabled
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-105 active:scale-95'
            }`}
          >
            {isFull ? 'Unavailable' : isOwnerClosed ? 'Closed' : isTimeClosed ? 'Closed' : '⚡ Book Now'}
          </button>
        </div>
      </div>
    )
  }

  // Owner view (matching Find Parking design, without Edit/Delete)
  const isTimeClosed = !isOpen && !isFull
  const isOwnerClosed = !isAvailable
  const isDisabled = isFull || isTimeClosed
  const is247 = slot.availability?.type === '24/7'
  const hasBookedSlots = slot.availableSlots !== slot.totalSlots

  const handleToggleAvailability = async () => {
    await toggleSlotAvailability(slot.id)
  }

  const handleRemoveLocation = async () => {
    setRemoveError(null)
    const result = removeEntireLocation(slot.id)
    if (!result.success) {
      setRemoveError(result.message || 'Failed to remove location')
    }
  }

  return (
    <div className={`bg-white rounded-2xl shadow-lg p-5 transition-all duration-300 hover:shadow-xl hover:-translate-y-1`}>
      {/* Top Row: Slot Name + Status Badge */}
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-bold text-gray-800 text-lg">{slot.name}</h3>
        <span
          className={`text-xs px-3 py-1.5 rounded-full font-semibold ${
            isFull
              ? 'bg-red-100 text-red-700'
              : isOwnerClosed
                ? 'bg-red-100 text-red-700'
                : isTimeClosed
                  ? 'bg-gray-100 text-gray-600'
                  : 'bg-green-100 text-green-700'
          }`}
        >
          {isFull ? 'FULL' : isOwnerClosed ? 'CLOSED' : isTimeClosed ? 'CLOSED' : 'OPEN'}
        </span>
      </div>

      {/* Second Row: Rating */}
      <div className="flex items-center gap-4 mb-3">
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <span className="text-yellow-400">⭐</span>
          <span>5.0</span>
        </div>
      </div>

      {/* Availability Badge */}
      <div className="mb-3">
        <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 font-medium">
          <span>🕐</span>
          <span>{formatAvailability(slot.availability)}</span>
        </span>
      </div>

      {/* Countdown when closed due to time (not owner-closed) */}
      {isTimeClosed && countdown && !isOwnerClosed && (
        <div className="mb-3">
          <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 font-medium">
            <span>⏱️</span>
            <span>{countdown}</span>
          </span>
        </div>
      )}

      {/* Slot Availability */}
      <div className="mb-4 text-sm">
        {isFull ? (
          <span className="text-red-600 font-semibold">Fully Booked / {slot.totalSlots} total</span>
        ) : (
          <>
            <span className="text-green-600 font-semibold">{slot.availableSlots}</span>
            <span className="text-gray-400"> slots available / </span>
            <span className="text-gray-400">{slot.totalSlots} total</span>
          </>
        )}
      </div>

      {/* Bottom Row: Price + Toggle Button + Remove Button */}
      <div className="flex items-center justify-between gap-2">
        <div className="text-2xl font-bold text-gray-800">
          <span className="text-blue-600">₹</span>
          {slot.price}
          <span className="text-sm font-normal text-gray-500">/hr</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleToggleAvailability}
            className={`px-4 py-2 rounded-xl text-sm font-semibold shadow-md transition-all duration-200 ${
              isAvailable
                ? 'bg-red-600 text-white hover:bg-red-700 hover:scale-105 active:scale-95'
                : 'bg-green-600 text-white hover:bg-green-700 hover:scale-105 active:scale-95'
            }`}
          >
            {isAvailable ? '🔒 Close' : '🔓 Open'}
          </button>
          <button
            onClick={handleRemoveLocation}
            disabled={hasBookedSlots}
            className={`px-4 py-2 rounded-xl text-sm font-semibold shadow-md transition-all duration-200 ${
              hasBookedSlots
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-red-600 text-white hover:bg-red-700 hover:scale-105 active:scale-95'
            }`}
            title={hasBookedSlots ? 'Cannot remove location with booked slots' : 'Remove location'}
          >
            🗑️ Remove
          </button>
        </div>
      </div>

      {/* Remove error message */}
      {removeError && (
        <div className="mt-3 text-xs text-red-600 font-medium">
          {removeError}
        </div>
      )}
    </div>
  )
}

export default SlotCard
