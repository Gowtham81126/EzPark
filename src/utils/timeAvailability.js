/**
 * Time-based Availability Utility
 * Handles parking slot time availability logic
 */

/**
 * Convert time string "HH:MM" to minutes from midnight
 * @param {string|object} time - Time in "HH:MM" format (24-hour) or object with hour/minute/period
 * @returns {number} - Minutes from midnight
 */
function timeToMinutes(time) {
  if (!time) return 0

  // Handle object structure (hour, minute, period)
  if (typeof time === 'object' && time.hour !== undefined) {
    let hour = time.hour
    const minute = time.minute || 0
    const period = time.period || 'AM'

    if (period.toUpperCase() === 'PM' && hour !== 12) {
      hour += 12
    } else if (period.toUpperCase() === 'AM' && hour === 12) {
      hour = 0
    }

    return hour * 60 + minute
  }

  // Handle string structure "HH:MM"
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

/**
 * Convert minutes from midnight to "HH:MM" format
 * @param {number} minutes - Minutes from midnight
 * @returns {string} - Time in "HH:MM" format
 */
function minutesToTime(minutes) {
  const hours = Math.floor(minutes / 60) % 24
  const mins = minutes % 60
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}

/**
 * Convert label like "6 AM – 10 PM" to start/end time in minutes
 * @param {string} label - Label like "6 AM – 10 PM"
 * @returns {object} - { startTime: number, endTime: number } in minutes
 */
function labelToMinutes(label) {
  if (!label || label === '24/7') {
    return { startTime: 0, endTime: 24 * 60 } // 24/7
  }

  // Parse "6 AM – 10 PM" format
  const parts = label.split(' – ')
  if (parts.length !== 2) {
    return { startTime: 0, endTime: 24 * 60 }
  }

  const parseTime = (str) => {
    const [time, period] = str.trim().split(' ')
    let [hours, minutes = '0'] = time.split(':').map(Number)
    
    if (period.toUpperCase() === 'PM' && hours !== 12) {
      hours += 12
    } else if (period.toUpperCase() === 'AM' && hours === 12) {
      hours = 0
    }
    
    return hours * 60 + minutes
  }

  return {
    startTime: parseTime(parts[0]),
    endTime: parseTime(parts[1])
  }
}

/**
 * Get current time in minutes from midnight
 * @returns {number} - Current time in minutes from midnight
 */
function getCurrentTimeMinutes() {
  const now = new Date()
  return now.getHours() * 60 + now.getMinutes()
}

/**
 * Check if parking slot is currently open based on availability
 * @param {object} slot - Parking slot object
 * @returns {boolean} - True if parking is open
 */
export function isParkingOpen(slot) {
  if (!slot) {
    return true // Default to open if no slot info
  }

  // Handle string availability (backward compatibility)
  if (typeof slot.availability === 'string') {
    return slot.availability === 'true' || slot.availability === true
  }

  // Handle boolean availability (backward compatibility)
  if (typeof slot.availability === 'boolean') {
    return slot.availability
  }

  // Handle object structure
  const availability = slot.availability

  if (availability.type === '24/7') {
    return true
  }

  // Get time range
  let startTime, endTime

  if (availability.startTime && availability.endTime) {
    // New structure with explicit startTime/endTime
    startTime = timeToMinutes(availability.startTime)
    endTime = timeToMinutes(availability.endTime)
  } else if (availability.label) {
    // Old structure with label
    const times = labelToMinutes(availability.label)
    startTime = times.startTime
    endTime = times.endTime
  } else if (availability.from && availability.to) {
    // Custom structure with from/to
    startTime = timeToMinutes(availability.from)
    endTime = timeToMinutes(availability.to)
  } else {
    return true // Default to open
  }

  const currentTime = getCurrentTimeMinutes()

  // Check if current time is within the range
  return currentTime >= startTime && currentTime < endTime
}

/**
 * Get remaining time until parking opens or closes
 * @param {object} slot - Parking slot object
 * @returns {object} - { type: 'opens'|'closes', hours: number, minutes: number }
 */
export function getRemainingOpenTime(slot) {
  if (!slot) {
    return { type: 'always', hours: 0, minutes: 0 }
  }

  // Handle string/boolean availability (backward compatibility)
  if (typeof slot.availability === 'string' || typeof slot.availability === 'boolean') {
    return { type: 'always', hours: 0, minutes: 0 }
  }

  const availability = slot.availability

  if (availability.type === '24/7') {
    return { type: 'always', hours: 0, minutes: 0 }
  }

  // Get time range
  let startTime, endTime

  if (availability.startTime && availability.endTime) {
    startTime = timeToMinutes(availability.startTime)
    endTime = timeToMinutes(availability.endTime)
  } else if (availability.label) {
    const times = labelToMinutes(availability.label)
    startTime = times.startTime
    endTime = times.endTime
  } else if (availability.from && availability.to) {
    startTime = timeToMinutes(availability.from)
    endTime = timeToMinutes(availability.to)
  } else {
    return { type: 'always', hours: 0, minutes: 0 }
  }

  const currentTime = getCurrentTimeMinutes()

  // Before opening time
  if (currentTime < startTime) {
    const remaining = startTime - currentTime
    return {
      type: 'opens',
      hours: Math.floor(remaining / 60),
      minutes: remaining % 60
    }
  }

  // After closing time
  if (currentTime >= endTime) {
    // Calculate time until next day's opening
    const remaining = (24 * 60 - currentTime) + startTime
    return {
      type: 'opens',
      hours: Math.floor(remaining / 60),
      minutes: remaining % 60
    }
  }

  // Currently open - show time until closing
  const remaining = endTime - currentTime
  return {
    type: 'closes',
    hours: Math.floor(remaining / 60),
    minutes: remaining % 60
  }
}

/**
 * Get maximum booking duration in minutes based on current time and availability
 * @param {object} slot - Parking slot object
 * @returns {number} - Maximum duration in minutes (0 if closed)
 */
export function getMaxBookingDuration(slot) {
  if (!slot) {
    return 24 * 60 // Default to 24 hours if no slot info
  }

  // Handle string/boolean availability (backward compatibility)
  if (typeof slot.availability === 'string' || typeof slot.availability === 'boolean') {
    return slot.availability === 'true' || slot.availability === true ? 24 * 60 : 0
  }

  const availability = slot.availability

  if (availability.type === '24/7') {
    return 24 * 60 // 24 hours
  }

  // Get time range
  let endTime

  if (availability.endTime) {
    endTime = timeToMinutes(availability.endTime)
  } else if (availability.label) {
    const times = labelToMinutes(availability.label)
    endTime = times.endTime
  } else if (availability.to) {
    endTime = timeToMinutes(availability.to)
  } else {
    return 24 * 60
  }

  const currentTime = getCurrentTimeMinutes()

  // If currently closed, return 0
  if (currentTime >= endTime) {
    return 0
  }

  // Calculate remaining time until closing
  const remaining = endTime - currentTime
  return remaining
}

/**
 * Format countdown time for display
 * @param {object} timeInfo - Object with hours and minutes
 * @returns {string} - Formatted string like "Opens in 2h 30m"
 */
export function formatCountdown(timeInfo) {
  if (timeInfo.type === 'always') {
    return 'Open 24/7'
  }

  const { hours, minutes, type } = timeInfo

  if (hours === 0 && minutes === 0) {
    return type === 'opens' ? 'Opens now' : 'Closes now'
  }

  const parts = []
  if (hours > 0) {
    parts.push(`${hours}h`)
  }
  if (minutes > 0) {
    parts.push(`${minutes}m`)
  }

  const timeStr = parts.join(' ')
  return type === 'opens' ? `Opens in ${timeStr}` : `Closes in ${timeStr}`
}
