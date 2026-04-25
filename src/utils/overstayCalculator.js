// Shared function to calculate overstay data for both driver and owner UI
// This ensures single source of truth for overstay calculations

/**
 * Calculate overtime billing rates based on hourly price
 * @param {number} hourlyPrice - Base price per hour (e.g., ₹30/hr)
 * @returns {Object} - { base_rate_per_min, overtime_rate_per_min }
 */
export function calculateOvertimeRates(hourlyPrice) {
  const baseRatePerMin = hourlyPrice / 60
  const overtimeRatePerMin = baseRatePerMin * 1.3 // 30% increase for overtime
  
  return {
    base_rate_per_min: baseRatePerMin,
    overtime_rate_per_min: overtimeRatePerMin
  }
}

/**
 * Get overstay data for a booking at a specific time
 * @param {Object} booking - The booking object
 * @param {number} now - Current timestamp in milliseconds
 * @param {number} hourlyPrice - Hourly price for dynamic rate calculation (optional, defaults to ₹30/hr)
 * @returns {Object} - { overstayMs, extraCharges, isInGrace, rates }
 */
export function getOverstayData(booking, now, hourlyPrice = 30) {
  if (booking.status !== 'OVERSTAYING') {
    return { overstayMs: 0, extraCharges: 0, isInGrace: false }
  }

  // Calculate grace period end time (5 minutes after planned end time)
  const graceStartTime = booking.graceStartTime ? new Date(booking.graceStartTime).getTime() : 
                         (booking.plannedEndTime ? new Date(booking.plannedEndTime).getTime() : now)
  const gracePeriodEnd = graceStartTime + (5 * 60 * 1000)

  // If still within grace period
  if (now <= gracePeriodEnd) {
    const rates = calculateOvertimeRates(hourlyPrice)
    return { 
      overstayMs: 0, 
      extraCharges: 0, 
      isInGrace: true,
      graceRemaining: gracePeriodEnd - now,
      rates
    }
  }

  // After grace period - calculate overstay time and charges
  const overstayMs = now - gracePeriodEnd
  
  // Use Math.ceil for per-minute pricing to ensure charges start immediately
  const overstayMinutes = Math.ceil(overstayMs / (60 * 1000))
  const rates = calculateOvertimeRates(hourlyPrice)
  const extraCharges = overstayMinutes * rates.overtime_rate_per_min

  return {
    overstayMs,
    extraCharges,
    isInGrace: false,
    graceRemaining: 0,
    rates
  }
}

/**
 * Format milliseconds as HH:MM:SS
 * @param {number} ms - Milliseconds
 * @returns {string} - Formatted time string
 */
export function formatOverstayTime(ms) {
  const totalSec = Math.floor(ms / 1000)
  const hours = Math.floor(totalSec / 3600)
  const minutes = Math.floor((totalSec % 3600) / 60)
  const seconds = totalSec % 60
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}
