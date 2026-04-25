// ── Payment Calculation Utility ─────────────────────────────────────

import { calculateOvertimeRates } from './overstayCalculator.js'

const GRACE_PERIOD_MINUTES = 5
const ARRIVAL_GRACE_MINUTES = 10 // 10 minutes grace for arrival

/**
 * Calculate payment breakdown for a booking
 * 
 * @param {Object} booking - The booking object
 * @param {Object} slot - The parking slot object
 * @returns {Object} Payment breakdown with base, extra, adjustments, and total
 */
export function calculatePaymentBreakdown(booking, slot) {
  const { startTime, plannedEndTime, actualArrivalTime, estimatedArrivalTime, durationMinutes } = booking
  
  if (!startTime || !plannedEndTime) {
    return {
      base: 0,
      extra: 0,
      adjustments: 0,
      adjustmentReason: null,
      total: 0,
      breakdown: []
    }
  }

  const pricePerMinute = slot ? slot.price / 60 : 0.0833 // Default to ₹5/hour if slot not found
  
  // Calculate actual duration used
  const actualEndTime = booking.endTime || new Date().toISOString()
  const start = new Date(startTime).getTime()
  const actualEnd = new Date(actualEndTime).getTime()
  const actualDurationMinutes = Math.ceil((actualEnd - start) / (60 * 1000))
  
  // Calculate base charge based on actual duration (not booked duration)
  const baseCharge = actualDurationMinutes * pricePerMinute
  const bookedCharge = durationMinutes * pricePerMinute
  
  // Calculate extra time charges
  const plannedEnd = new Date(plannedEndTime).getTime()
  const gracePeriodEnd = plannedEnd + (GRACE_PERIOD_MINUTES * 60 * 1000)
  
  let extraCharge = 0
  let extraMinutes = 0
  
  if (actualEnd > gracePeriodEnd) {
    extraMinutes = Math.ceil((actualEnd - gracePeriodEnd) / (60 * 1000))
    // Use dynamic overtime rate based on slot's hourly price
    const hourlyPrice = slot ? slot.price : 30 // Default to ₹30/hr
    const rates = calculateOvertimeRates(hourlyPrice)
    extraCharge = extraMinutes * rates.overtime_rate_per_min
  }
  
  // Apply fairness rule adjustments
  let adjustmentAmount = 0
  let adjustmentReason = null
  
  // Calculate early exit discount
  let earlyExitDiscount = 0
  let earlyExitReason = null
  
  if (booking.status === 'COMPLETED' && actualDurationMinutes < durationMinutes) {
    // Driver left early - calculate discount for unused time
    const unusedMinutes = durationMinutes - actualDurationMinutes
    earlyExitDiscount = unusedMinutes * pricePerMinute
    earlyExitReason = `Early exit discount: ${unusedMinutes} minutes unused`
  }
  
  if (actualArrivalTime && booking.status === 'COMPLETED') {
    const estimatedArrival = new Date(estimatedArrivalTime).getTime()
    const actualArrival = new Date(actualArrivalTime).getTime()
    const arrivalGraceEnd = estimatedArrival + (ARRIVAL_GRACE_MINUTES * 60 * 1000)
    
    // Check if driver arrived on time (within grace period)
    const driverArrivedOnTime = actualArrival <= arrivalGraceEnd
    
    // Check if owner delayed entry (actual start time is significantly after arrival)
    const start = new Date(startTime).getTime()
    const entryDelayMinutes = (start - actualArrival) / (60 * 1000)
    const ownerDelayedEntry = entryDelayMinutes > 5 // Owner delayed by more than 5 minutes
    
    // Fairness rule: If driver arrived on time AND owner delayed entry,
    // remove extra charges caused by the delay
    if (driverArrivedOnTime && ownerDelayedEntry && extraCharge > 0) {
      // Calculate how much of the overstay was caused by owner's delay
      const delayMinutes = Math.min(entryDelayMinutes, extraMinutes)
      const hourlyPrice = slot ? slot.price : 30 // Default to ₹30/hr
      const rates = calculateOvertimeRates(hourlyPrice)
      const adjustment = delayMinutes * rates.overtime_rate_per_min
      
      // Cap adjustment at the extra charge amount
      adjustmentAmount = Math.min(adjustment, extraCharge)
      adjustmentReason = 'Fairness adjustment: Owner delayed entry after driver arrived on time'
    }
  }
  
  const total = baseCharge + extraCharge - adjustmentAmount
  
  const breakdown = [
    {
      label: 'Base Charge',
      amount: baseCharge,
      description: `${actualDurationMinutes} minutes × ₹${pricePerMinute.toFixed(2)}/min`
    },
    {
      label: 'Extra Time Charge',
      amount: extraCharge,
      description: extraMinutes > 0 ? `${extraMinutes} minutes × ₹${(slot ? calculateOvertimeRates(slot.price).overtime_rate_per_min : calculateOvertimeRates(30).overtime_rate_per_min).toFixed(2)}/min (after grace)` : 'No extra time'
    },
    {
      label: 'Adjustments',
      amount: -adjustmentAmount,
      description: adjustmentReason || 'No adjustments'
    }
  ]
  
  return {
    base: baseCharge,
    extra: extraCharge,
    adjustments: -adjustmentAmount,
    adjustmentReason,
    earlyExitReason,
    total,
    breakdown,
    extraMinutes,
    actualDurationMinutes,
    bookedDurationMinutes: durationMinutes,
    driverArrivedOnTime: actualArrivalTime ? new Date(actualArrivalTime).getTime() <= new Date(estimatedArrivalTime).getTime() + (ARRIVAL_GRACE_MINUTES * 60 * 1000) : null
  }
}

/**
 * Format payment amount for display
 */
export function formatPaymentAmount(amount) {
  return `₹${Math.abs(amount).toFixed(2)}`
}

/**
 * Get payment status based on booking status
 */
export function getPaymentStatus(booking) {
  if (booking.status === 'COMPLETED') {
    return 'PAYMENT_DUE'
  } else if (booking.status === 'CANCELLED') {
    return 'CANCELLED'
  } else if (booking.status === 'ACTIVE' || booking.status === 'OVERSTAYING') {
    return 'IN_PROGRESS'
  }
  return 'PENDING'
}
