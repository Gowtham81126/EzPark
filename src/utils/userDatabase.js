// localStorage-based user and parking slot database for ParkEasy
// All data is stored in browser localStorage for fast, offline-first operation

const STORAGE_KEYS = {
  USERS: 'parkeasy_users',
  PARKING_SLOTS: 'parkeasy_parking_slots',
  BOOKINGS: 'parkeasy_bookings'
}

// Helper function to get data from localStorage
const getFromStorage = (key) => {
  try {
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : []
  } catch (error) {
    console.error(`Error reading ${key} from localStorage:`, error)
    return []
  }
}

// Helper function to save data to localStorage
const saveToStorage = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data))
    return { success: true }
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error)
    return { success: false, error: 'Failed to save data' }
  }
}

export const userDatabase = {
  // ── User Operations ──────────────────────────────────────────────

  // Get all users from localStorage
  getUsers: async () => {
    return getFromStorage(STORAGE_KEYS.USERS)
  },

  // Check if phone number is already registered
  isPhoneUnique: async (phoneNumber) => {
    try {
      const users = getFromStorage(STORAGE_KEYS.USERS)
      return !users.some(user => user.phoneNumber === phoneNumber)
    } catch (error) {
      console.error('Error checking phone uniqueness:', error)
      return false
    }
  },

  // Add a new user
  addUser: async (userData) => {
    try {
      const users = getFromStorage(STORAGE_KEYS.USERS)
      
      // Check phone number uniqueness
      if (users.some(user => user.phoneNumber === userData.phoneNumber)) {
        return { success: false, error: 'Phone number already registered' }
      }

      // Create user object with ID and timestamp
      const newUser = {
        id: `u_${Date.now()}`,
        ...userData,
        createdAt: new Date().toISOString()
      }

      users.push(newUser)
      const saveResult = saveToStorage(STORAGE_KEYS.USERS, users)

      if (saveResult.success) {
        return { success: true, user: newUser }
      } else {
        return saveResult
      }
    } catch (error) {
      console.error('Error adding user:', error)
      return { success: false, error: 'Failed to add user' }
    }
  },

  // Validate login credentials
  validateLogin: async (phoneNumber, password) => {
    try {
      const users = getFromStorage(STORAGE_KEYS.USERS)
      const user = users.find(
        u => u.phoneNumber === phoneNumber && u.password === password
      )

      if (user) {
        return { success: true, user }
      } else {
        return { 
          success: false, 
          error: 'Invalid credentials. Please check your phone number and password, or sign up if you haven\'t already.' 
        }
      }
    } catch (error) {
      console.error('Error validating login:', error)
      return { 
        success: false, 
        error: 'Failed to validate credentials' 
      }
    }
  },

  // Get user by ID
  getUserById: async (userId) => {
    try {
      const users = getFromStorage(STORAGE_KEYS.USERS)
      const user = users.find(u => u.id === userId)
      return user || null
    } catch (error) {
      console.error('Error fetching user by ID:', error)
      return null
    }
  },

  // Clear all users (for testing purposes)
  clearAllUsers: async () => {
    return saveToStorage(STORAGE_KEYS.USERS, [])
  },

  // ── Parking Slot Operations ───────────────────────────────────────

  // Get all parking slots
  getParkingSlots: async () => {
    return getFromStorage(STORAGE_KEYS.PARKING_SLOTS)
  },

  // Get parking slots by owner ID
  getParkingSlotsByOwner: async (ownerId) => {
    try {
      const slots = getFromStorage(STORAGE_KEYS.PARKING_SLOTS)
      return slots.filter(slot => slot.ownerId === ownerId)
    } catch (error) {
      console.error('Error reading parking slots by owner:', error)
      return []
    }
  },

  // Add a new parking slot
  addParkingSlot: async (slotData) => {
    try {
      const slots = getFromStorage(STORAGE_KEYS.PARKING_SLOTS)

      // Create slot object with ID and timestamp
      const newSlot = {
        id: `slot-${Date.now()}`,
        ...slotData,
        createdAt: new Date().toISOString(),
        isAvailable: true,
        availableSlots: slotData.totalSlots
      }

      slots.push(newSlot)
      const saveResult = saveToStorage(STORAGE_KEYS.PARKING_SLOTS, slots)

      if (saveResult.success) {
        return { success: true, slot: newSlot }
      } else {
        return saveResult
      }
    } catch (error) {
      console.error('Error adding parking slot:', error)
      return { success: false, error: 'Failed to add parking slot' }
    }
  },

  // Delete a parking slot by ID
  deleteParkingSlot: async (slotId) => {
    try {
      const slots = getFromStorage(STORAGE_KEYS.PARKING_SLOTS)
      const filteredSlots = slots.filter(slot => slot.id !== slotId)
      return saveToStorage(STORAGE_KEYS.PARKING_SLOTS, filteredSlots)
    } catch (error) {
      console.error('Error deleting parking slot:', error)
      return { success: false, error: 'Failed to delete parking slot' }
    }
  },

  // Update parking slot availability
  updateParkingSlot: async (slotId, updateData) => {
    try {
      const slots = getFromStorage(STORAGE_KEYS.PARKING_SLOTS)
      const slotIndex = slots.findIndex(slot => slot.id === slotId)
      
      if (slotIndex === -1) {
        return { success: false, error: 'Slot not found' }
      }

      // Update the slot with new data
      const updatedSlot = { ...slots[slotIndex], ...updateData }
      slots[slotIndex] = updatedSlot

      const saveResult = saveToStorage(STORAGE_KEYS.PARKING_SLOTS, slots)

      if (saveResult.success) {
        return { success: true, slot: updatedSlot }
      } else {
        return saveResult
      }
    } catch (error) {
      console.error('Error updating parking slot:', error)
      return { success: false, error: 'Failed to update parking slot' }
    }
  },

  // Clear all parking slots (for testing purposes)
  clearAllParkingSlots: async () => {
    return saveToStorage(STORAGE_KEYS.PARKING_SLOTS, [])
  },

  // ── Bookings API ─────────────────────────────────────────────────────

  // Get all bookings
  getBookings: async () => {
    return getFromStorage(STORAGE_KEYS.BOOKINGS)
  },

  // Get bookings by driver ID
  getBookingsByDriver: async (driverId) => {
    try {
      const bookings = getFromStorage(STORAGE_KEYS.BOOKINGS)
      return bookings.filter(b => b.driverId === driverId)
    } catch (error) {
      console.error('Error fetching bookings by driver:', error)
      return []
    }
  },

  // Get bookings by owner ID
  getBookingsByOwner: async (ownerId) => {
    try {
      const bookings = getFromStorage(STORAGE_KEYS.BOOKINGS)
      return bookings.filter(b => b.ownerId === ownerId)
    } catch (error) {
      console.error('Error fetching bookings by owner:', error)
      return []
    }
  },

  // Get booking by ID
  getBooking: async (bookingId) => {
    try {
      const bookings = getFromStorage(STORAGE_KEYS.BOOKINGS)
      const booking = bookings.find(b => b.id === bookingId)
      return booking || null
    } catch (error) {
      console.error('Error fetching booking:', error)
      return null
    }
  },

  // Create a new booking
  createBooking: async (bookingData) => {
    try {
      const bookings = getFromStorage(STORAGE_KEYS.BOOKINGS)

      // Create booking object with ID and timestamp
      const newBooking = {
        id: `booking-${Date.now()}`,
        ...bookingData,
        createdAt: new Date().toISOString()
      }

      bookings.push(newBooking)
      const saveResult = saveToStorage(STORAGE_KEYS.BOOKINGS, bookings)

      if (saveResult.success) {
        return { success: true, booking: newBooking }
      } else {
        return saveResult
      }
    } catch (error) {
      console.error('Error creating booking:', error)
      return { success: false, error: 'Failed to create booking' }
    }
  },

  // Update a booking
  updateBooking: async (bookingId, updateData) => {
    try {
      const bookings = getFromStorage(STORAGE_KEYS.BOOKINGS)
      const bookingIndex = bookings.findIndex(b => b.id === bookingId)
      
      if (bookingIndex === -1) {
        return { success: false, error: 'Booking not found' }
      }

      // Update the booking with new data
      const updatedBooking = { ...bookings[bookingIndex], ...updateData }
      bookings[bookingIndex] = updatedBooking

      const saveResult = saveToStorage(STORAGE_KEYS.BOOKINGS, bookings)

      if (saveResult.success) {
        return { success: true, booking: updatedBooking }
      } else {
        return saveResult
      }
    } catch (error) {
      console.error('Error updating booking:', error)
      return { success: false, error: 'Failed to update booking' }
    }
  },

  // Delete a booking
  deleteBooking: async (bookingId) => {
    try {
      const bookings = getFromStorage(STORAGE_KEYS.BOOKINGS)
      const filteredBookings = bookings.filter(b => b.id !== bookingId)
      return saveToStorage(STORAGE_KEYS.BOOKINGS, filteredBookings)
    } catch (error) {
      console.error('Error deleting booking:', error)
      return { success: false, error: 'Failed to delete booking' }
    }
  },

  // Clear all bookings (for testing)
  clearAllBookings: async () => {
    return saveToStorage(STORAGE_KEYS.BOOKINGS, [])
  },
}
