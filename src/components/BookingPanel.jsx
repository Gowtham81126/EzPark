import { useState, useEffect } from 'react'
import { getMaxBookingDuration } from '../utils/timeAvailability'

function BookingPanel({ slot, onConfirm, onCancel }) {
  const [selectedDuration, setSelectedDuration] = useState(1) // Default 1 hour
  const [customDuration, setCustomDuration] = useState({ days: 0, hours: 0, minutes: 15 }) // Default 15 minutes
  const [isCustom, setIsCustom] = useState(false)

  // Minimum booking duration in minutes
  const MIN_DURATION = 15

  // Determine if parking is 24/7
  const is24x7 = slot?.availability?.type === '24/7'

  const maxDuration = is24x7 ? Infinity : getMaxBookingDuration(slot)
  const pricePerHour = slot.price

  // Duration options in hours
  const durationOptions = [1, 2, 3, 5, 8]

  // Calculate which options are valid based on availability
  const getValidDurations = () => {
    const maxHours = Math.floor(maxDuration / 60)
    return durationOptions.filter(d => d * 60 <= maxDuration)
  }

  const validDurations = getValidDurations()

  // Calculate total duration in minutes
  const totalDurationMinutes = isCustom
    ? (customDuration.days * 24 * 60) + (customDuration.hours * 60) + customDuration.minutes
    : selectedDuration * 60

  // Calculate total price
  const totalPrice = isCustom
    ? (totalDurationMinutes / 60) * pricePerHour
    : selectedDuration * pricePerHour

  const handleDurationChange = (hours) => {
    setIsCustom(false)
    setSelectedDuration(hours)
    setCustomDuration({ days: 0, hours: 0, minutes: 0 }) // Reset custom values
  }

  const handleCustomDurationChange = (field, value) => {
    setIsCustom(true)
    const numValue = parseInt(value) || 0
    if (numValue >= 0) {
      setCustomDuration(prev => ({ ...prev, [field]: numValue }))
    }
  }

  const handleConfirm = () => {
    onConfirm(totalDurationMinutes)
  }

  const isConfirmDisabled = isCustom
    ? totalDurationMinutes <= 0 || totalDurationMinutes < MIN_DURATION || (!is24x7 && totalDurationMinutes > maxDuration)
    : !selectedDuration

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-800">Book Parking</h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Slot Info */}
        <div className="bg-blue-50 rounded-xl p-4 mb-4">
          <p className="font-semibold text-blue-800">{slot.name}</p>
          <p className="text-sm text-blue-600">{slot.address}</p>
          <p className="text-sm text-blue-600 mt-1">
            Available: {slot.availableSlots} / {slot.totalSlots} slots
          </p>
        </div>

        {/* Availability Info */}
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">
            <span className="font-medium">Availability:</span> {slot.availability?.label || '24/7'}
          </p>
          {maxDuration < 24 * 60 && (
            <p className="text-xs text-amber-600">
              ⚠️ Maximum booking: {Math.floor(maxDuration / 60)}h {maxDuration % 60}m
            </p>
          )}
        </div>

        {/* Duration Selection */}
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-3">Select Duration</p>
          
          <div className="grid grid-cols-3 gap-2 mb-3">
            {durationOptions.map((hours) => {
              const isValid = hours * 60 <= maxDuration
              return (
                <button
                  key={hours}
                  onClick={() => isValid && handleDurationChange(hours)}
                  disabled={!isValid}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    !isCustom && selectedDuration === hours
                      ? 'bg-blue-600 text-white'
                      : isValid
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {hours}h
                </button>
              )
            })}
          </div>

          {/* Custom Duration */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCustom(true)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isCustom
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Custom
            </button>
          </div>

          {/* Custom Duration Inputs */}
          {isCustom && (
            <div className="mt-3 space-y-2">
              {/* Days - Only for 24/7 parking */}
              {is24x7 && (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    value={customDuration.days || ''}
                    onChange={(e) => handleCustomDurationChange('days', e.target.value)}
                    placeholder="0"
                    className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-500">Days</span>
                </div>
              )}

              {/* Hours */}
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max={is24x7 ? 23 : (maxDuration === Infinity ? 23 : Math.floor(maxDuration / 60))}
                  value={customDuration.hours || ''}
                  onChange={(e) => handleCustomDurationChange('hours', e.target.value)}
                  placeholder="0"
                  className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-500">Hours</span>
              </div>

              {/* Minutes */}
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={customDuration.minutes || ''}
                  onChange={(e) => handleCustomDurationChange('minutes', e.target.value)}
                  placeholder="0"
                  className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-500">Minutes</span>
              </div>

              {/* Validation Error */}
              {totalDurationMinutes > 0 && totalDurationMinutes < MIN_DURATION && (
                <p className="text-xs text-red-600 mt-2">
                  ⚠️ Minimum booking time is 15 minutes
                </p>
              )}
              {!is24x7 && totalDurationMinutes > maxDuration && (
                <p className="text-xs text-red-600 mt-2">
                  ⚠️ Exceeds available time window (max: {Math.floor(maxDuration / 60)}h {maxDuration % 60}m)
                </p>
              )}
            </div>
          )}
        </div>

        {/* Price Estimate */}
        <div className="bg-gray-50 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Total Estimate</span>
            <span className="text-2xl font-bold text-gray-800">
              ₹{totalPrice.toFixed(2)}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            ₹{pricePerHour}/hr × {isCustom ? (totalDurationMinutes / 60).toFixed(1) : selectedDuration}h
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isConfirmDisabled}
            className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
              isConfirmDisabled
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            Confirm Booking
          </button>
        </div>
      </div>
    </div>
  )
}

export default BookingPanel
