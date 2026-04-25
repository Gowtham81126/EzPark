/**
 * Formats availability data for display
 * @param {Object|string} availability - The availability data (object or string for backward compatibility)
 * @returns {string} - Formatted availability string
 */
export const formatAvailability = (availability) => {
  // Handle backward compatibility for string values
  if (typeof availability === 'string') {
    return availability
  }

  // Handle missing availability
  if (!availability) {
    return '24/7'
  }

  // Handle object structure
  if (availability.type === '24/7') {
    return '24/7'
  }

  if (availability.type === 'fixed') {
    return availability.label || '24/7'
  }

  if (availability.type === 'custom') {
    const from = availability.from
    const to = availability.to
    if (from && to) {
      const formatTimePart = (hour, minute, period) => {
        if (minute === 0) {
          return `${hour} ${period}`
        }
        return `${hour}:${minute.toString().padStart(2, '0')} ${period}`
      }
      return `${formatTimePart(from.hour, from.minute || 0, from.period)} – ${formatTimePart(to.hour, to.minute || 0, to.period)}`
    }
    return availability.display || '24/7'
  }

  // Fallback for any other case
  return '24/7'
}
