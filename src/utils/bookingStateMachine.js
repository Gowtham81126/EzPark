// ── Booking States ──────────────────────────────────────────────
export const BookingStatus = {
  CONFIRMED: 'CONFIRMED',
  ACTIVE: 'ACTIVE',
  OVERSTAYING: 'OVERSTAYING',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  EXPIRED: 'EXPIRED',
}

// ── Valid Transitions Map ───────────────────────────────────────
// Key = current state, Value = Set of allowed next states
const VALID_TRANSITIONS = {
  [BookingStatus.CONFIRMED]: new Set([
    BookingStatus.ACTIVE,
    BookingStatus.CANCELLED,
    BookingStatus.EXPIRED,
  ]),
  [BookingStatus.ACTIVE]: new Set([
    BookingStatus.OVERSTAYING,
    BookingStatus.COMPLETED,
  ]),
  [BookingStatus.OVERSTAYING]: new Set([
    BookingStatus.COMPLETED,
  ]),
  // Terminal states — no outgoing transitions
  [BookingStatus.COMPLETED]: new Set(),
  [BookingStatus.CANCELLED]: new Set(),
  [BookingStatus.EXPIRED]: new Set(),
}

// ── Helpers ─────────────────────────────────────────────────────

function generateOTP() {
  return Math.floor(1000 + Math.random() * 9000).toString()
}

export function isValidTransition(currentState, newState) {
  const allowed = VALID_TRANSITIONS[currentState]
  if (!allowed) return false
  return allowed.has(newState)
}

export function getValidTransitions(currentState) {
  const allowed = VALID_TRANSITIONS[currentState]
  return allowed ? [...allowed] : []
}

export function isTerminalState(state) {
  return (
    state === BookingStatus.COMPLETED ||
    state === BookingStatus.CANCELLED ||
    state === BookingStatus.EXPIRED
  )
}

// ── Timestamp field per state ───────────────────────────────────
const TIMESTAMP_FIELD = {
  [BookingStatus.CONFIRMED]: 'confirmedAt',
  [BookingStatus.ACTIVE]: 'startTime',
  [BookingStatus.OVERSTAYING]: 'endTime',
  [BookingStatus.COMPLETED]: 'endTime',
  [BookingStatus.CANCELLED]: 'endTime',
  [BookingStatus.EXPIRED]: 'endTime',
}

// ── Core Transition Utility ─────────────────────────────────────

export function transitionBooking(booking, newState) {
  const currentState = booking.status

  if (currentState === newState) {
    console.warn(
      `[BookingStateMachine] ⚠️  Booking ${booking.id} is already in ${newState}. No-op.`
    )
    return { success: false, booking, error: 'ALREADY_IN_STATE' }
  }

  if (!isValidTransition(currentState, newState)) {
    console.error(
      `[BookingStateMachine] ❌ INVALID transition for booking ${booking.id}: ${currentState} → ${newState}`
    )
    console.error(
      `[BookingStateMachine]    Allowed from ${currentState}: [${getValidTransitions(currentState).join(', ')}]`
    )
    return { success: false, booking, error: 'INVALID_TRANSITION' }
  }

  const timestampField = TIMESTAMP_FIELD[newState]
  let additionalFields = {}
  
  if (timestampField) {
    additionalFields[timestampField] = new Date().toISOString()
  }
  
  if (newState === BookingStatus.CONFIRMED) {
    additionalFields.entryOTP = generateOTP()
    // plannedEndTime will be set when driver actually arrives (ACTIVE state)
    console.log(
      `[BookingStateMachine] ✅ OTP generated for booking ${booking.id}: ${additionalFields.entryOTP}`
    )
  }

  if (newState === BookingStatus.ACTIVE) {
    // Track when driver actually arrived (verified OTP)
    additionalFields.actualArrivalTime = new Date().toISOString()
    // Recalculate plannedEndTime based on actual arrival time to ensure full duration
    if (booking.durationMinutes) {
      additionalFields.plannedEndTime = new Date(Date.now() + booking.durationMinutes * 60 * 1000).toISOString()
    }
    // Generate exit OTP immediately when entry is verified
    additionalFields.exitOTP = generateOTP()
    console.log(
      `[BookingStateMachine] ✅ Driver arrived and started parking at ${additionalFields.actualArrivalTime} for booking ${booking.id}`
    )
    console.log(
      `[BookingStateMachine] ✅ Planned end time recalculated: ${additionalFields.plannedEndTime}`
    )
    console.log(
      `[BookingStateMachine] ✅ Exit OTP generated automatically: ${additionalFields.exitOTP}`
    )
  }

  const updatedBooking = {
    ...booking,
    status: newState,
    ...additionalFields,
  }

  console.log(
    `[BookingStateMachine] ✅ Booking ${booking.id}: ${currentState} → ${newState}`
  )
  console.log(
    `[BookingStateMachine]    Timestamp set: ${timestampField || 'none'} = ${updatedBooking[timestampField] || 'N/A'}`
  )

  return { success: true, booking: updatedBooking, error: null }
}

// ── Booking Factory ─────────────────────────────────────────────

export function createBooking({ driverId, ownerId, slotId, estimatedArrivalMinutes = 15, durationMinutes = 60, driverLocation = null }) {
  // Minimum booking duration validation
  const MIN_DURATION = 15
  if (durationMinutes < MIN_DURATION) {
    console.error(
      `[BookingStateMachine] ❌ Invalid duration: ${durationMinutes} minutes (minimum: ${MIN_DURATION} minutes)`
    )
    return null
  }

  const booking = {
    id: `bk-${Date.now()}`,
    driverId,
    ownerId,
    slotId,
    status: BookingStatus.CONFIRMED,
    requestedAt: null,
    confirmedAt: new Date().toISOString(),
    startTime: null,
    endTime: null,
    plannedEndTime: null,
    durationMinutes,
    entryOTP: generateOTP(),
    exitOTP: null,
    estimatedArrivalTime: new Date(Date.now() + estimatedArrivalMinutes * 60 * 1000).toISOString(),
    actualArrivalTime: null,
    driverLocation, // Store driver's starting location for route display
    driverRating: 0.0,
    ownerRating: 0.0,
    // Detailed ratings (to be filled after completion)
    driverRatings: {
      punctuality: null,
      behavior: null,
      reliability: null,
    },
    ownerRatings: {
      punctuality: null,
      behavior: null,
      reliability: null,
    },
    // Rating submission status
    driverHasRated: false,
    ownerHasRated: false,
    // Overstay tracking
    extraCharges: 0,
    gracePeriodUsed: false,
    nearEndNotified: false,
    graceEndNotified: false,
    graceStartTime: null,
    extraTime: 0,
  }

  console.log(
    `[BookingStateMachine] 🚗 Booking created: ${booking.id} | slot=${slotId} | driver=${driverId} | owner=${ownerId}`
  )

  return booking
}
