/**
 * Next Slot Availability Utility
 * Calculates when the next slot will become available for a parking location
 */

/**
 * Get the next available slot time for a parking location
 * @param {object} slot - Parking slot object
 * @param {array} bookings - Array of all bookings
 * @returns {object|null} - { type: 'next_slot', hours: number, minutes: number } or null if no upcoming availability
 */
export function getNextSlotAvailability(slot, bookings) {
  if (!slot || !bookings) {
    return null
  }

  // Filter bookings for this slot that are ACTIVE or CONFIRMED
  const slotBookings = bookings.filter(
    (b) => b.slotId === slot.id && (b.status === 'ACTIVE' || b.status === 'CONFIRMED')
  )

  if (slotBookings.length === 0) {
    return null // No active bookings, slot is available
  }

  // Get all end times from active bookings
  const now = Date.now()
  const endTimes = slotBookings
    .map((b) => {
      // Use plannedEndTime if available, otherwise calculate from startTime + durationMinutes
      if (b.plannedEndTime) {
        return new Date(b.plannedEndTime).getTime()
      }
      if (b.startTime && b.durationMinutes) {
        return new Date(b.startTime).getTime() + b.durationMinutes * 60 * 1000
      }
      return null
    })
    .filter((time) => time !== null && time > now) // Only future end times

  if (endTimes.length === 0) {
    return null // No upcoming end times
  }

  // Find the earliest end time
  const earliestEndTime = Math.min(...endTimes)
  const remainingMs = earliestEndTime - now

  if (remainingMs <= 0) {
    return null // Slot should be available now
  }

  // Convert to hours and minutes
  const remainingMinutes = Math.floor(remainingMs / (60 * 1000))
  const hours = Math.floor(remainingMinutes / 60)
  const minutes = remainingMinutes % 60

  return {
    type: 'next_slot',
    hours,
    minutes,
    endTime: earliestEndTime
  }
}

/**
 * Format next slot availability time for display
 * @param {object} availabilityInfo - Object with hours and minutes
 * @returns {string} - Formatted string like "Next slot in 30m" or "Next slot in 1h 20m"
 */
export function formatNextSlotAvailability(availabilityInfo) {
  if (!availabilityInfo) {
    return null
  }

  const { hours, minutes } = availabilityInfo

  if (hours === 0 && minutes === 0) {
    return 'Available now'
  }

  const parts = []
  if (hours > 0) {
    parts.push(`${hours}h`)
  }
  if (minutes > 0) {
    parts.push(`${minutes}m`)
  }

  return `Next slot in ${parts.join(' ')}`
}
