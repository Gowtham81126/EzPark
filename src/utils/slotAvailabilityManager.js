/**
 * Slot Availability Manager
 * Handles slot inventory management during booking lifecycle
 */

/**
 * Updates slot availability by a specified change amount
 * @param {Object} slot - The parking slot object
 * @param {number} change - The change amount (+1 to increase, -1 to decrease)
 * @returns {Object} - { success: boolean, slot: Object, error: string }
 */
export function updateSlotAvailability(slot, change) {
  if (!slot) {
    return { success: false, error: 'Slot not found' }
  }

  const newAvailableSlots = slot.availableSlots + change

  // Safety rule: availableSlots must NOT go below 0
  if (newAvailableSlots < 0) {
    console.error(
      `[SlotAvailabilityManager] ❌ Cannot decrease slots below 0. Current: ${slot.availableSlots}, Change: ${change}`
    )
    return { success: false, error: 'Cannot decrease slots below 0' }
  }

  // Safety rule: availableSlots must NOT exceed totalSlots
  if (newAvailableSlots > slot.totalSlots) {
    console.error(
      `[SlotAvailabilityManager] ❌ Cannot increase slots above total. Current: ${slot.availableSlots}, Total: ${slot.totalSlots}, Change: ${change}`
    )
    return { success: false, error: 'Cannot increase slots above total' }
  }

  const updatedSlot = {
    ...slot,
    availableSlots: newAvailableSlots,
  }

  console.log(
    `[SlotAvailabilityManager] ✅ Slot ${slot.id}: ${slot.availableSlots} → ${newAvailableSlots} (change: ${change > 0 ? '+' : ''}${change})`
  )

  return { success: true, slot: updatedSlot, error: null }
}

/**
 * Checks if a slot has available slots for booking
 * @param {Object} slot - The parking slot object
 * @returns {boolean} - True if slot is available for booking
 */
export function isSlotAvailableForBooking(slot) {
  if (!slot) return false
  return slot.availableSlots > 0
}

/**
 * Gets the display text for slot availability
 * @param {Object} slot - The parking slot object
 * @returns {string} - Display text
 */
export function getSlotAvailabilityText(slot) {
  if (!slot) return 'N/A'
  
  if (slot.availableSlots === 0) {
    return `Fully Booked / ${slot.totalSlots} total`
  }
  
  return `${slot.availableSlots} slots available / ${slot.totalSlots} total`
}
