import { create } from 'zustand'
import { mockParkingSlots, mockNotifications } from '../utils/mockData'
import { createBooking, transitionBooking, BookingStatus } from '../utils/bookingStateMachine'
import { updateSlotAvailability } from '../utils/slotAvailabilityManager'
import { calculatePaymentBreakdown, formatPaymentAmount } from '../utils/paymentCalculator'
import { calculateOvertimeRates } from '../utils/overstayCalculator'
import { userDatabase } from '../utils/userDatabase'

const useStore = create((set, get) => ({
  currentUser: null,
  isLoggedIn: false,
  bookings: [],
  parkingSlots: [],
  notifications: mockNotifications,
  systemLogs: [],
  currentTime: Date.now(),
  driverLocation: null,
  watchId: null,

  login: async (user) => {
    if (user && user.id) {
      // Determine role: use user's role if set, otherwise infer from parking slots
      let userRole = user.role
      if (!userRole) {
        // For existing users without role, check if they own parking slots
        const parkingSlots = await userDatabase.getParkingSlots()
        const hasParkingSlots = parkingSlots.some(slot => slot.ownerId === user.id)
        userRole = hasParkingSlots ? 'owner' : 'driver'
        
        // Update user in localStorage with the inferred role
        const users = await userDatabase.getUsers()
        const userIndex = users.findIndex(u => u.id === user.id)
        if (userIndex !== -1) {
          users[userIndex].role = userRole
          localStorage.setItem('parkeasy_users', JSON.stringify(users))
        }
      }
      
      const userWithRole = {
        ...user,
        username: user.name,
        role: userRole,
      }
      localStorage.setItem('isLoggedIn', 'true')
      localStorage.setItem('currentUser', JSON.stringify(userWithRole))
      
      // Reload bookings and parking slots from localStorage on login
      const bookings = await userDatabase.getBookings()
      const slots = await userDatabase.getParkingSlots()
      
      set(() => ({
        currentUser: userWithRole,
        isLoggedIn: true,
        bookings,
        parkingSlots: slots,
      }))
      return { success: true }
    }
    return { success: false, error: 'Invalid user data' }
  },

  logout: () => {
    const { currentUser, watchId } = get()
    localStorage.removeItem('isLoggedIn')
    localStorage.removeItem('currentUser')
    
    // Stop GPS tracking and clear driver location only if current user is a driver
    if (currentUser?.role === 'driver') {
      if (watchId !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId)
      }
      // Clear driver location from localStorage when driver logs out
      try {
        localStorage.removeItem('parkeasy_driver_location')
      } catch (error) {
        console.error('Error clearing driver location from localStorage:', error)
      }
    }
    
    set(() => ({
      currentUser: null,
      isLoggedIn: false,
      parkingSlots: [],
      bookings: [],
      notifications: mockNotifications,
      // Only clear driverLocation and watchId if current user is a driver
      driverLocation: currentUser?.role === 'driver' ? null : get().driverLocation,
      watchId: currentUser?.role === 'driver' ? null : get().watchId,
    }))
  },

  // Start GPS tracking using watchPosition for continuous updates
  startGPSTracking: () => {
    const { watchId, currentUser, bookings } = get()
    
    // Clear existing watch if any
    if (watchId !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId)
    }

    if (!navigator.geolocation) {
      console.error('Geolocation is not supported')
      return { success: false, error: 'GEOLOCATION_NOT_SUPPORTED' }
    }

    const newWatchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        const newLocation = { lat: latitude, lng: longitude }
        
        // Update global driver location
        set(() => ({
          driverLocation: newLocation
        }))
        
        // Also update driverLocation in the driver's active confirmed booking
        // so the owner can see the real-time location
        if (currentUser?.id) {
          const driverConfirmedBooking = bookings.find(
            b => b.driverId === currentUser.id && b.status === BookingStatus.CONFIRMED
          )
          if (driverConfirmedBooking) {
            const updatedBookings = bookings.map(b =>
              b.id === driverConfirmedBooking.id ? { ...b, driverLocation: newLocation } : b
            )
            set({ bookings: updatedBookings })
            // Persist to localStorage
            try {
              localStorage.setItem('parkeasy_bookings', JSON.stringify(updatedBookings))
            } catch (error) {
              console.error('Error saving bookings to localStorage:', error)
            }
          }
        }
        
        // Persist to localStorage for cross-tab sync
        try {
          localStorage.setItem('parkeasy_driver_location', JSON.stringify(newLocation))
        } catch (error) {
          console.error('Error saving driver location to localStorage:', error)
        }
      },
      (error) => {
        console.error('GPS tracking error:', error)
        // Don't clear the watch on error, let it retry
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000
      }
    )

    set({ watchId: newWatchId })
    return { success: true }
  },

  // Stop GPS tracking
  stopGPSTracking: () => {
    const { watchId } = get()
    
    if (watchId !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId)
      set(() => ({
        watchId: null,
        driverLocation: null
      }))
      // Clear from localStorage
      try {
        localStorage.removeItem('parkeasy_driver_location')
      } catch (error) {
        console.error('Error clearing driver location from localStorage:', error)
      }
      return { success: true }
    }
    
    return { success: false, error: 'NO_ACTIVE_TRACKING' }
  },

  // Initialize auth state from localStorage
  initializeAuth: () => {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true'
    const currentUserStr = localStorage.getItem('currentUser')
    let currentUser = currentUserStr ? JSON.parse(currentUserStr) : null
    
    // Add default role for existing users who don't have it
    if (currentUser && !currentUser.role) {
      currentUser = { ...currentUser, role: 'driver' }
      localStorage.setItem('currentUser', JSON.stringify(currentUser))
    }
    
    set(() => ({
      isLoggedIn,
      currentUser,
    }))
  },

  // Initialize driver location from localStorage
  initializeDriverLocation: () => {
    try {
      const driverLocationStr = localStorage.getItem('parkeasy_driver_location')
      if (driverLocationStr) {
        const driverLocation = JSON.parse(driverLocationStr)
        set({ driverLocation })
        
        // Also update the driverLocation in all confirmed bookings
        const { bookings } = get()
        const updatedBookings = bookings.map(b => {
          if (b.status === BookingStatus.CONFIRMED) {
            return { ...b, driverLocation }
          }
          return b
        })
        
        // Only update if there are changes
        if (JSON.stringify(updatedBookings) !== JSON.stringify(bookings)) {
          set({ bookings: updatedBookings })
          // Persist to localStorage
          try {
            localStorage.setItem('parkeasy_bookings', JSON.stringify(updatedBookings))
          } catch (error) {
            console.error('Error saving bookings to localStorage:', error)
          }
        }
      }
    } catch (error) {
      console.error('Error loading driver location from localStorage:', error)
    }
  },

  // Initialize bookings from API
  initializeBookings: async () => {
    try {
      const bookings = await userDatabase.getBookings()
      set({ bookings })
    } catch (error) {
      console.error('Error loading bookings from API:', error)
    }
  },

  // Initialize parking slots from API
  initializeParkingSlots: async () => {
    try {
      const slots = await userDatabase.getParkingSlots()
      set({ parkingSlots: slots })
    } catch (error) {
      console.error('Error loading parking slots from API:', error)
    }
  },

  // Load parking slots by owner ID
  loadParkingSlotsByOwner: async (ownerId) => {
    try {
      const slots = await userDatabase.getParkingSlotsByOwner(ownerId)
      set({ parkingSlots: slots })
      return slots
    } catch (error) {
      console.error('Error loading parking slots by owner:', error)
      return []
    }
  },

  // Helper function to save bookings to localStorage
  saveBookingsToStorage: async () => {
    const { bookings } = get()
    try {
      localStorage.setItem('parkeasy_bookings', JSON.stringify(bookings))
    } catch (error) {
      console.error('Error saving bookings to localStorage:', error)
    }
  },

  // Helper function to save parking slots to localStorage
  saveParkingSlotsToStorage: async () => {
    const { parkingSlots } = get()
    try {
      localStorage.setItem('parkeasy_parking_slots', JSON.stringify(parkingSlots))
    } catch (error) {
      console.error('Error saving parking slots to localStorage:', error)
    }
  },

  addNotification: (notification) =>
    set((state) => ({
      notifications: [
        { id: Date.now(), ...notification },
        ...state.notifications,
      ],
    })),

  clearNotifications: () =>
    set(() => ({
      notifications: [],
    })),

  addSystemLog: (log) =>
    set((state) => ({
      systemLogs: [
        { id: Date.now(), timestamp: new Date().toISOString(), ...log },
        ...state.systemLogs,
      ].slice(0, 100), // Keep only last 100 logs
    })),

  clearSystemLogs: () =>
    set(() => ({
      systemLogs: [],
    })),

  // ── Booking actions ──────────────────────────────────────────
  createBooking: async ({ driverId, ownerId, slotId, durationMinutes = 60, driverLocation = null }) => {
    const { addSystemLog, parkingSlots } = get()

    // Check if slot has available slots
    const slot = parkingSlots.find((s) => s.id === slotId)
    if (!slot) {
      console.error(`[Store] ❌ Slot ${slotId} not found`)
      return null
    }

    // Check if slot is available (not closed by owner)
    if (!slot.isAvailable) {
      console.error(`[Store] ❌ Slot ${slotId} is closed by owner`)
      addSystemLog({
        type: 'error',
        message: `Booking failed: ${slot.name} is closed by owner`,
        details: { slotId, isAvailable: slot.isAvailable }
      })
      return null
    }

    if (slot.availableSlots <= 0) {
      console.error(`[Store] ❌ No slots available for slot ${slotId}`)
      addSystemLog({
        type: 'error',
        message: `Booking failed: No slots available for ${slot.name}`,
        details: { slotId, availableSlots: slot.availableSlots }
      })
      return null
    }

    const booking = createBooking({ driverId, ownerId, slotId, durationMinutes, driverLocation })

    // Persist booking to API
    const apiResult = await userDatabase.createBooking(booking)
    if (!apiResult.success) {
      console.error('[Store] ❌ Failed to persist booking to API:', apiResult.error)
      addSystemLog({
        type: 'error',
        message: `Failed to persist booking to API`,
        details: { error: apiResult.error }
      })
      return null
    }

    set((state) => ({ bookings: [...state.bookings, apiResult.booking] }))

    // Decrease availableSlots since booking is now CONFIRMED immediately
    const slotUpdateResult = updateSlotAvailability(slot, -1)
    if (slotUpdateResult.success) {
      const updatedSlots = parkingSlots.map((s) => s.id === slotId ? slotUpdateResult.slot : s)
      set({ parkingSlots: updatedSlots })

      // Persist slot availability to localStorage
      await userDatabase.updateParkingSlot(slotId, { availableSlots: slotUpdateResult.slot.availableSlots })
      get().saveParkingSlotsToStorage()

      addSystemLog({
        type: 'action',
        message: `Slot availability updated for ${slot.name}: ${slot.availableSlots} → ${slotUpdateResult.slot.availableSlots}`,
        details: { slotId, change: -1, newAvailableSlots: slotUpdateResult.slot.availableSlots }
      })
    }

    addSystemLog({
      type: 'booking',
      message: `New booking created: ${booking.id}`,
      details: { bookingId: booking.id, driverId, ownerId, slotId, durationMinutes }
    })

    return apiResult.booking
  },

  transitionBooking: async (bookingId, newState) => {
    const { bookings, addSystemLog, parkingSlots } = get()
    const idx = bookings.findIndex((b) => b.id === bookingId)

    if (idx === -1) {
      console.error(
        `[Store] ❌ Booking ${bookingId} not found`
      )
      addSystemLog({
        type: 'error',
        message: `Booking ${bookingId} not found for transition`,
        details: { requestedState: newState }
      })
      return { success: false, booking: null, error: 'NOT_FOUND' }
    }

    const oldState = bookings[idx].status
    const result = transitionBooking(bookings[idx], newState)

    if (!result.success) {
      addSystemLog({
        type: 'error',
        message: `Invalid transition for booking ${bookingId}`,
        details: { from: oldState, to: newState, error: result.error }
      })
      return result
    }

    // Handle slot availability changes based on booking lifecycle
    const slotId = bookings[idx].slotId
    const slot = parkingSlots.find((s) => s.id === slotId)

    if (slot) {
      let slotChange = 0

      // When booking is cancelled: increase availableSlots by 1
      if (newState === BookingStatus.CANCELLED && (oldState === BookingStatus.CONFIRMED || oldState === BookingStatus.ACTIVE)) {
        slotChange = 1
      }
      // When booking is completed: increase availableSlots by 1
      else if (newState === BookingStatus.COMPLETED && (oldState === BookingStatus.ACTIVE || oldState === BookingStatus.OVERSTAYING)) {
        slotChange = 1
      }

      if (slotChange !== 0) {
        const slotUpdateResult = updateSlotAvailability(slot, slotChange)
        if (slotUpdateResult.success) {
          const updatedSlots = parkingSlots.map((s) => s.id === slotId ? slotUpdateResult.slot : s)
          set({ parkingSlots: updatedSlots })

          // Persist the slot availability update to localStorage
          await userDatabase.updateParkingSlot(slotId, { availableSlots: slotUpdateResult.slot.availableSlots })
          get().saveParkingSlotsToStorage()

          addSystemLog({
            type: 'action',
            message: `Slot availability updated for ${slot.name}: ${slot.availableSlots} → ${slotUpdateResult.slot.availableSlots}`,
            details: { slotId, change: slotChange, newAvailableSlots: slotUpdateResult.slot.availableSlots }
          })
        }
      }
    }

    // Persist booking update to API
    const apiResult = await userDatabase.updateBooking(bookingId, result.booking)
    if (!apiResult.success) {
      console.error('[Store] ❌ Failed to persist booking transition to API:', apiResult.error)
      addSystemLog({
        type: 'error',
        message: `Failed to persist booking transition to API`,
        details: { bookingId, error: apiResult.error }
      })
      return { success: false, booking: null, error: 'API_PERSIST_FAILED' }
    }

    addSystemLog({
      type: 'transition',
      message: `Booking ${bookingId}: ${oldState} → ${newState}`,
      details: { bookingId, from: oldState, to: newState }
    })

    const updated = [...bookings]
    updated[idx] = apiResult.booking
    set({ bookings: updated })
    return result
  },

  getBooking: (bookingId) => {
    return get().bookings.find((b) => b.id === bookingId) || null
  },

  getBookingsByDriver: (driverId) => {
    return get().bookings.filter((b) => b.driverId === driverId)
  },

  getBookingsByOwner: (ownerId) => {
    return get().bookings.filter((b) => b.ownerId === ownerId)
  },

  verifyOTP: (bookingId, enteredOTP) => {
    const { bookings, transitionBooking, addNotification, addSystemLog } = get()
    const booking = bookings.find((b) => b.id === bookingId)

    if (!booking) {
      addSystemLog({
        type: 'error',
        message: `OTP verification failed: booking ${bookingId} not found`,
        details: { bookingId }
      })
      return { success: false, error: 'BOOKING_NOT_FOUND' }
    }

    if (booking.status !== BookingStatus.CONFIRMED) {
      addSystemLog({
        type: 'error',
        message: `OTP verification failed: invalid status for booking ${bookingId}`,
        details: { bookingId, status: booking.status }
      })
      return { success: false, error: 'INVALID_STATUS' }
    }

    if (booking.entryOTP !== enteredOTP) {
      addSystemLog({
        type: 'warning',
        message: `Invalid OTP entered for booking ${bookingId}`,
        details: { bookingId, enteredOTP }
      })
      return { success: false, error: 'INVALID_OTP' }
    }

    // Transition directly to ACTIVE (driver verified OTP and starts parking)
    const activeResult = transitionBooking(bookingId, BookingStatus.ACTIVE)
    if (!activeResult.success) {
      return activeResult
    }

    addSystemLog({
      type: 'action',
      message: `Driver verified OTP and started parking for booking ${bookingId}`,
      details: { bookingId }
    })

    // Add notification to owner
    addNotification({
      message: `Driver has arrived and started parking for booking ${bookingId}`,
      type: 'booking',
      timestamp: new Date().toISOString(),
      forRole: 'owner',
      forUserId: booking.ownerId,
      bookingId: booking.id,
    })

    return { success: true, booking: activeResult.booking }
  },

  ownerVerifyOTP: (bookingId, enteredOTP) => {
    const { bookings, transitionBooking, addNotification, addSystemLog } = get()
    const booking = bookings.find((b) => b.id === bookingId)

    if (!booking) {
      addSystemLog({
        type: 'error',
        message: `Owner OTP verification failed: booking ${bookingId} not found`,
        details: { bookingId }
      })
      return { success: false, error: 'BOOKING_NOT_FOUND' }
    }

    if (booking.status !== BookingStatus.CONFIRMED) {
      addSystemLog({
        type: 'error',
        message: `Owner OTP verification failed: invalid status for booking ${bookingId}`,
        details: { bookingId, status: booking.status }
      })
      return { success: false, error: 'INVALID_STATUS' }
    }

    if (booking.entryOTP !== enteredOTP) {
      addSystemLog({
        type: 'warning',
        message: `Owner entered invalid OTP for booking ${bookingId}`,
        details: { bookingId, enteredOTP }
      })
      return { success: false, error: 'INVALID_OTP' }
    }

    // Transition to ACTIVE (owner verified driver's OTP and allows entry)
    const activeResult = transitionBooking(bookingId, BookingStatus.ACTIVE)
    if (!activeResult.success) {
      return activeResult
    }

    addSystemLog({
      type: 'action',
      message: `Owner verified OTP and allowed driver entry for booking ${bookingId}`,
      details: { bookingId }
    })

    // Add notification to driver
    addNotification({
      message: `Owner has verified your OTP. You can now enter parking for booking ${bookingId}`,
      type: 'booking',
      timestamp: new Date().toISOString(),
      forRole: 'driver',
      forUserId: booking.driverId,
      bookingId: booking.id,
    })

    return { success: true, booking: activeResult.booking }
  },

  cancelBooking: (bookingId, reason = 'user_cancelled') => {
    const { bookings, transitionBooking, addNotification, addSystemLog } = get()
    const booking = bookings.find((b) => b.id === bookingId)

    if (!booking) {
      addSystemLog({
        type: 'error',
        message: `Cancel failed: booking ${bookingId} not found`,
        details: { bookingId }
      })
      return { success: false, error: 'BOOKING_NOT_FOUND' }
    }

    // Check if owner is trying to cancel
    if (reason === 'owner_no_show' || reason === 'owner_cancel') {
      // Rule: Owner cannot cancel if driver is active or overstaying
      if (booking.status === BookingStatus.ACTIVE || booking.status === BookingStatus.OVERSTAYING) {
        addSystemLog({
          type: 'warning',
          message: `Owner tried to cancel active/overstaying booking ${bookingId}`,
          details: { bookingId, reason, status: booking.status }
        })
        return { success: false, error: 'OWNER_CANNOT_CANCEL_ACTIVE', message: 'Ask driver to cancel' }
      }
    }

    // Do not alter ratings on cancellation
    let updatedBooking = { ...booking }

    // Update the booking with new ratings before transitioning
    const { bookings: currentBookings } = get()
    const idx = currentBookings.findIndex((b) => b.id === bookingId)
    if (idx !== -1) {
      const updated = [...currentBookings]
      updated[idx] = updatedBooking
      set({ bookings: updated })
      get().saveBookingsToStorage()
    }

    // Transition to CANCELLED
    const result = transitionBooking(bookingId, BookingStatus.CANCELLED)
    
    if (result.success) {
      addSystemLog({
        type: 'action',
        message: `Booking ${bookingId} cancelled: ${reason}`,
        details: { bookingId, reason }
      })

      const message = reason === 'owner_no_show' 
        ? `Booking cancelled - driver did not arrive. Driver rating decreased.`
        : reason === 'driver_no_show'
          ? `Booking cancelled - owner did not arrive. Owner rating decreased.`
          : `Booking cancelled by user`

      addNotification({
        message,
        type: 'booking',
        timestamp: new Date().toISOString(),
        forRole: 'both',
        forUserId: booking.driverId,
        bookingId: bookingId,
      })
    }

    return result
  },

  canOwnerCancel: (bookingId) => {
    const { bookings } = get()
    const booking = bookings.find((b) => b.id === bookingId)

    if (!booking) {
      return { canCancel: false, reason: 'BOOKING_NOT_FOUND' }
    }

    // Owner can cancel CONFIRMED bookings immediately
    // Owner cannot cancel ACTIVE or OVERSTAYING bookings
    if (booking.status === BookingStatus.ACTIVE || booking.status === BookingStatus.OVERSTAYING) {
      return { 
        canCancel: false, 
        reason: 'CANNOT_CANCEL_ACTIVE', 
        message: 'Ask driver to cancel'
      }
    }

    return { canCancel: true, reason: null }
  },

  // ── Payment Calculation ──────────────────────────────────────────
  calculatePaymentBreakdown: (bookingId) => {
    const { bookings, parkingSlots } = get()
    const booking = bookings.find((b) => b.id === bookingId)
    
    if (!booking) {
      return null
    }

    const slot = parkingSlots.find((s) => s.id === booking.slotId)
    return calculatePaymentBreakdown(booking, slot)
  },

  // ── Exit Flow ───────────────────────────────────────────────────
  generateExitOTP: (bookingId) => {
    const { bookings, addSystemLog } = get()
    const idx = bookings.findIndex((b) => b.id === bookingId)

    if (idx === -1) {
      addSystemLog({
        type: 'error',
        message: `Exit OTP generation failed: booking ${bookingId} not found`,
        details: { bookingId }
      })
      return { success: false, error: 'BOOKING_NOT_FOUND' }
    }

    const booking = bookings[idx]
    
    // Only generate exit OTP for active or overstaying bookings
    if (booking.status !== BookingStatus.ACTIVE && booking.status !== BookingStatus.OVERSTAYING) {
      addSystemLog({
        type: 'error',
        message: `Exit OTP generation failed: invalid status for booking ${bookingId}`,
        details: { bookingId, status: booking.status }
      })
      return { success: false, error: 'INVALID_STATUS' }
    }

    // Generate exit OTP
    const exitOTP = Math.floor(1000 + Math.random() * 9000).toString()
    
    const updated = [...bookings]
    updated[idx] = { ...booking, exitOTP }
    set({ bookings: updated })
    get().saveBookingsToStorage()

    addSystemLog({
      type: 'action',
      message: `Exit OTP generated for booking ${bookingId}`,
      details: { bookingId, exitOTP }
    })

    return { success: true, exitOTP }
  },

  cancelExitOTP: (bookingId) => {
    const { bookings, addSystemLog } = get()
    const idx = bookings.findIndex((b) => b.id === bookingId)

    if (idx === -1) {
      addSystemLog({
        type: 'error',
        message: `Exit OTP cancellation failed: booking ${bookingId} not found`,
        details: { bookingId }
      })
      return { success: false, error: 'BOOKING_NOT_FOUND' }
    }

    const booking = bookings[idx]
    
    // Remove exit OTP
    const updated = [...bookings]
    updated[idx] = { ...booking, exitOTP: null }
    set({ bookings: updated })
    get().saveBookingsToStorage()

    addSystemLog({
      type: 'action',
      message: `Exit OTP cancelled for booking ${bookingId}`,
      details: { bookingId }
    })

    return { success: true }
  },

  verifyExitOTP: (bookingId, enteredOTP) => {
    const { bookings, transitionBooking, addNotification, addSystemLog } = get()
    const booking = bookings.find((b) => b.id === bookingId)

    if (!booking) {
      addSystemLog({
        type: 'error',
        message: `Exit OTP verification failed: booking ${bookingId} not found`,
        details: { bookingId }
      })
      return { success: false, error: 'BOOKING_NOT_FOUND' }
    }

    if (booking.status !== BookingStatus.ACTIVE && booking.status !== BookingStatus.OVERSTAYING) {
      addSystemLog({
        type: 'error',
        message: `Exit OTP verification failed: invalid status for booking ${bookingId}`,
        details: { bookingId, status: booking.status }
      })
      return { success: false, error: 'INVALID_STATUS' }
    }

    if (!booking.exitOTP) {
      addSystemLog({
        type: 'error',
        message: `Exit OTP verification failed: exit OTP not generated for booking ${bookingId}`,
        details: { bookingId }
      })
      return { success: false, error: 'EXIT_OTP_NOT_GENERATED' }
    }

    if (booking.exitOTP !== enteredOTP) {
      addSystemLog({
        type: 'warning',
        message: `Invalid exit OTP entered for booking ${bookingId}`,
        details: { bookingId, enteredOTP }
      })
      return { success: false, error: 'INVALID_OTP' }
    }

    // Transition to COMPLETED
    const result = transitionBooking(bookingId, BookingStatus.COMPLETED)
    
    if (result.success) {
      addSystemLog({
        type: 'action',
        message: `Driver exited parking for booking ${bookingId}`,
        details: { bookingId, slotId: booking.slotId }
      })

      // Free the parking slot
      const { parkingSlots } = get()
      const updatedSlots = parkingSlots.map((slot) =>
        slot.id === booking.slotId ? { ...slot, availability: true } : slot
      )
      set({ parkingSlots: updatedSlots })

      // Add notification
      addNotification({
        message: `Parking session completed for booking ${bookingId}`,
        type: 'booking',
        timestamp: new Date().toISOString(),
        forRole: 'both',
        forUserId: booking.driverId,
        bookingId: bookingId,
      })
    }

    return result
  },

  ownerVerifyExitOTP: (bookingId, enteredOTP) => {
    const { bookings, transitionBooking, addNotification, addSystemLog } = get()
    const booking = bookings.find((b) => b.id === bookingId)

    if (!booking) {
      addSystemLog({
        type: 'error',
        message: `Owner exit OTP verification failed: booking ${bookingId} not found`,
        details: { bookingId }
      })
      return { success: false, error: 'BOOKING_NOT_FOUND' }
    }

    if (booking.status !== BookingStatus.ACTIVE && booking.status !== BookingStatus.OVERSTAYING) {
      addSystemLog({
        type: 'error',
        message: `Owner exit OTP verification failed: invalid status for booking ${bookingId}`,
        details: { bookingId, status: booking.status }
      })
      return { success: false, error: 'INVALID_STATUS' }
    }

    if (!booking.exitOTP) {
      addSystemLog({
        type: 'error',
        message: `Owner exit OTP verification failed: exit OTP not generated for booking ${bookingId}`,
        details: { bookingId }
      })
      return { success: false, error: 'EXIT_OTP_NOT_GENERATED' }
    }

    if (booking.exitOTP !== enteredOTP) {
      addSystemLog({
        type: 'warning',
        message: `Owner entered invalid exit OTP for booking ${bookingId}`,
        details: { bookingId, enteredOTP }
      })
      return { success: false, error: 'INVALID_OTP' }
    }

    // Transition to COMPLETED
    const result = transitionBooking(bookingId, BookingStatus.COMPLETED)
    
    if (result.success) {
      addSystemLog({
        type: 'action',
        message: `Owner verified exit OTP and allowed driver to leave for booking ${bookingId}`,
        details: { bookingId, slotId: booking.slotId }
      })

      // Free the parking slot
      const { parkingSlots } = get()
      const updatedSlots = parkingSlots.map((slot) =>
        slot.id === booking.slotId ? { ...slot, availability: true } : slot
      )
      set({ parkingSlots: updatedSlots })

      // Add notification to driver
      addNotification({
        message: `Owner has verified your exit OTP. Parking session completed for booking ${bookingId}`,
        type: 'booking',
        timestamp: new Date().toISOString(),
        forRole: 'driver',
        forUserId: booking.driverId,
        bookingId: bookingId,
      })
    }

    return result
  },

  // ── Booking Monitoring for Time-Based Events ───────────────────
  checkBookingTimeEvents: () => {
    const { bookings, transitionBooking, addNotification, addSystemLog } = get()
    const now = Date.now()

    const updatedBookings = [...bookings]
    let hasChanges = false

    bookings.forEach((booking, index) => {
      // Only monitor ACTIVE bookings with planned end time
      if (booking.status !== BookingStatus.ACTIVE || !booking.plannedEndTime) {
        return
      }

      const plannedEnd = new Date(booking.plannedEndTime).getTime()
      const tenMinutesBeforeEnd = plannedEnd - (10 * 60 * 1000)
      const gracePeriodEnd = plannedEnd + (5 * 60 * 1000) // 5 min grace after planned end

      // Check if 10 minutes before end - notify driver
      if (now >= tenMinutesBeforeEnd && now < plannedEnd && !booking.nearEndNotified) {
        addSystemLog({
          type: 'info',
          message: `10-minute warning sent for booking ${booking.id}`,
          details: { bookingId: booking.id }
        })
        addNotification({
          message: `Your parking session at slot ${booking.slotId} ends in 10 minutes`,
          type: 'booking',
          timestamp: new Date().toISOString(),
          forRole: 'driver',
          forUserId: booking.driverId,
          bookingId: booking.id,
        })
        updatedBookings[index] = { ...booking, nearEndNotified: true }
        hasChanges = true
      }

      // Check if at planned end time - transition to OVERSTAYING
      if (now >= plannedEnd && booking.status === BookingStatus.ACTIVE) {
        const result = transitionBooking(booking.id, BookingStatus.OVERSTAYING)
        if (result.success) {
          addSystemLog({
            type: 'info',
            message: `Booking ${booking.id} transitioned to OVERSTAYING (time expired)`,
            details: { bookingId: booking.id }
          })
          addNotification({
            message: `Your parking session has ended. 5-minute grace period started.`,
            type: 'booking',
            timestamp: new Date().toISOString(),
            forRole: 'driver',
            forUserId: booking.driverId,
            bookingId: booking.id,
          })
          // Update the booking in our local array with graceStartTime
          const updatedIdx = updatedBookings.findIndex((b) => b.id === booking.id)
          if (updatedIdx !== -1) {
            updatedBookings[updatedIdx] = {
              ...result.booking,
              graceStartTime: new Date(plannedEnd).toISOString()
            }
          }
          hasChanges = true
        }
      }

      // Check if grace period ended - notify again and start charging
      if (now >= gracePeriodEnd && !booking.graceEndNotified) {
        addSystemLog({
          type: 'info',
          message: `Grace period ended for booking ${booking.id}, extra charges apply`,
          details: { bookingId: booking.id }
        })
        addNotification({
          message: `Grace period ended. Extra charges now apply for overstay.`,
          type: 'booking',
          timestamp: new Date().toISOString(),
          forRole: 'driver',
          forUserId: booking.driverId,
          bookingId: booking.id,
        })
        updatedBookings[index] = { 
          ...booking, 
          graceEndNotified: true,
          gracePeriodUsed: true 
        }
        hasChanges = true
      }

      // Calculate extra charges for overstay after grace period
      if (now >= gracePeriodEnd && booking.status === BookingStatus.OVERSTAYING) {
        const overstayMilliseconds = now - gracePeriodEnd
        const overstayMinutes = Math.ceil(overstayMilliseconds / (60 * 1000))
        
        // Get the slot to determine hourly price for dynamic overtime rate
        const slot = parkingSlots.find((s) => s.id === booking.slotId)
        const hourlyPrice = slot ? slot.price : 30 // Default to ₹30/hr
        const rates = calculateOvertimeRates(hourlyPrice)
        const newCharges = overstayMinutes * rates.overtime_rate_per_min

        // Only update when charges actually change (new minute starts), not every millisecond
        if (newCharges !== booking.extraCharges) {
          updatedBookings[index] = { ...booking, extraCharges: newCharges, extraTime: overstayMilliseconds }
          hasChanges = true
        }
      }
    })

    if (hasChanges) {
      set({ bookings: updatedBookings })
    }
  },

  // ── Rating System ──────────────────────────────────────────────
  getDriverAverageRating: (driverId) => {
    const { bookings, currentUser } = get()
    const targetId = driverId || currentUser?.id
    if (!targetId) return '0.0'

    const ratedBookings = (bookings || []).filter(
      (b) => b.driverId === targetId && b.status === BookingStatus.COMPLETED && b.ownerHasRated && Number(b.driverRating) > 0
    )

    if (ratedBookings.length === 0) return '0.0'

    const total = ratedBookings.reduce((sum, b) => sum + Number(b.driverRating), 0)
    return (total / ratedBookings.length).toFixed(1)
  },

  getOwnerAverageRating: (ownerId) => {
    const { bookings, currentUser } = get()
    const targetId = ownerId || currentUser?.id
    if (!targetId) return '0.0'

    const ratedBookings = (bookings || []).filter(
      (b) => b.ownerId === targetId && b.status === BookingStatus.COMPLETED && b.driverHasRated && Number(b.ownerRating) > 0
    )

    if (ratedBookings.length === 0) return '0.0'

    const total = ratedBookings.reduce((sum, b) => sum + Number(b.ownerRating), 0)
    return (total / ratedBookings.length).toFixed(1)
  },

  getSlotAverageRating: (slotId, ownerId) => {
    const { bookings } = get()
    if (!slotId) return '0.0'

    const ratedBookings = (bookings || []).filter(
      (b) => b.slotId === slotId && b.status === BookingStatus.COMPLETED && b.driverHasRated && Number(b.ownerRating) > 0
    )

    if (ratedBookings.length > 0) {
      const total = ratedBookings.reduce((sum, b) => sum + Number(b.ownerRating), 0)
      return (total / ratedBookings.length).toFixed(1)
    }

    if (ownerId) {
      return get().getOwnerAverageRating(ownerId)
    }

    return '0.0'
  },

  submitRating: async (bookingId, userType, ratings) => {
    const { bookings, parkingSlots, addNotification, addSystemLog } = get()
    const idx = bookings.findIndex((b) => b.id === bookingId)

    if (idx === -1) {
      addSystemLog({
        type: 'error',
        message: `Rating submission failed: booking ${bookingId} not found`,
        details: { bookingId }
      })
      return { success: false, error: 'BOOKING_NOT_FOUND' }
    }

    const booking = bookings[idx]
    
    // Calculate numeric rating value submitted
    let ratingNum = 0
    if (typeof ratings === 'number') {
      ratingNum = ratings
    } else if (ratings.overall) {
      ratingNum = Number(ratings.overall)
    } else if (ratings.punctuality || ratings.behavior || ratings.reliability) {
      const p = Number(ratings.punctuality || 0)
      const b = Number(ratings.behavior || 0)
      const r = Number(ratings.reliability || 0)
      ratingNum = (p + b + r) / 3
    }

    const ratingValue = parseFloat(ratingNum.toFixed(1))
    const avgRatingStr = ratingValue.toFixed(1)

    const updatedBooking = { ...booking }
    
    if (userType === 'driver') {
      // Driver is rating the owner
      updatedBooking.ownerRatings = ratings
      updatedBooking.ownerRating = ratingValue
      updatedBooking.driverHasRated = true
    } else {
      // Owner is rating the driver
      updatedBooking.driverRatings = ratings
      updatedBooking.driverRating = ratingValue
      updatedBooking.ownerHasRated = true
    }

    // Update bookings state
    const updatedBookings = [...bookings]
    updatedBookings[idx] = updatedBooking
    set({ bookings: updatedBookings })
    get().saveBookingsToStorage()

    // Persist booking rating update
    await userDatabase.updateBooking(bookingId, updatedBooking)

    // Recalculate slot's owner rating dynamically
    const slotId = booking.slotId
    const slotBookings = updatedBookings.filter(
      (b) => b.slotId === slotId && b.status === BookingStatus.COMPLETED && b.driverHasRated && Number(b.ownerRating) > 0
    )
    let newSlotRating = 0.0
    if (slotBookings.length > 0) {
      const sum = slotBookings.reduce((acc, b) => acc + Number(b.ownerRating), 0)
      newSlotRating = parseFloat((sum / slotBookings.length).toFixed(1))
    }

    const updatedSlots = parkingSlots.map((slot) => {
      if (slot.id === slotId) {
        return { ...slot, ownerRating: newSlotRating }
      }
      return slot
    })
    set({ parkingSlots: updatedSlots })
    get().saveParkingSlotsToStorage()
    await userDatabase.updateParkingSlot(slotId, { ownerRating: newSlotRating })

    addSystemLog({
      type: 'action',
      message: `${userType} submitted rating for booking ${bookingId}: ${avgRatingStr}/5`,
      details: { bookingId, userType, avgRating: avgRatingStr }
    })

    // Notify the other user if they haven't rated yet
    const otherUserId = userType === 'driver' ? booking.ownerId : booking.driverId
    const otherRole = userType === 'driver' ? 'owner' : 'driver'
    
    if (!updatedBooking[otherRole === 'driver' ? 'driverHasRated' : 'ownerHasRated']) {
      addNotification({
        message: `Your booking partner has submitted their rating. Please rate them as well.`,
        type: 'rating',
        timestamp: new Date().toISOString(),
        forRole: otherRole,
        forUserId: otherUserId,
        bookingId: bookingId,
      })
    }

    return { success: true, booking: updatedBooking }
  },

  // ── Slot Visibility Logic (based on owner rating) ──────────────
  getVisibleSlots: (minOwnerRating = 0.0) => {
    const { parkingSlots } = get()
    return parkingSlots.filter((slot) => slot.ownerRating >= minOwnerRating)
  },

  // ── Booking Priority Logic (based on driver rating) ────────────
  getDriverPriorityScore: (driverId) => {
    return get().getDriverAverageRating(driverId)
  },

  sortBookingsByDriverPriority: (bookings) => {
    return [...bookings].sort((a, b) => {
      const priorityA = parseFloat(get().getDriverPriorityScore(a.driverId))
      const priorityB = parseFloat(get().getDriverPriorityScore(b.driverId))
      return priorityB - priorityA // Higher priority first
    })
  },

  markInvoiceShown: async (bookingId) => {
    const { bookings } = get()
    const updated = bookings.map(b =>
      b.id === bookingId ? { ...b, invoiceShownToDriver: true } : b
    )
    set({ bookings: updated })
    get().saveBookingsToStorage()
    await userDatabase.updateBooking(bookingId, { invoiceShownToDriver: true })
  },

  markInvoiceShownToOwner: async (bookingId) => {
    const { bookings } = get()
    const updated = bookings.map(b =>
      b.id === bookingId ? { ...b, invoiceShownToOwner: true } : b
    )
    set({ bookings: updated })
    get().saveBookingsToStorage()
    await userDatabase.updateBooking(bookingId, { invoiceShownToOwner: true })
  },

  // ── Slot Management ──────────────────────────────────────────────
  addSlot: (slotId) => {
    const { parkingSlots, addSystemLog } = get()
    const idx = parkingSlots.findIndex((s) => s.id === slotId)

    if (idx === -1) {
      addSystemLog({
        type: 'error',
        message: `Add slot failed: slot ${slotId} not found`,
        details: { slotId }
      })
      return { success: false, error: 'SLOT_NOT_FOUND' }
    }

    const updatedSlots = [...parkingSlots]
    updatedSlots[idx] = {
      ...updatedSlots[idx],
      totalSlots: (updatedSlots[idx].totalSlots || 1) + 1,
      availableSlots: (updatedSlots[idx].availableSlots || 0) + 1
    }
    set({ parkingSlots: updatedSlots })
    get().saveParkingSlotsToStorage()

    addSystemLog({
      type: 'action',
      message: `Added 1 slot to ${updatedSlots[idx].name}`,
      details: { slotId, newTotal: updatedSlots[idx].totalSlots }
    })

    return { success: true, slot: updatedSlots[idx] }
  },

  removeOneSlot: (slotId) => {
    const { parkingSlots, addSystemLog } = get()
    const idx = parkingSlots.findIndex((s) => s.id === slotId)

    if (idx === -1) {
      addSystemLog({
        type: 'error',
        message: `Remove slot failed: slot ${slotId} not found`,
        details: { slotId }
      })
      return { success: false, error: 'SLOT_NOT_FOUND' }
    }

    const slot = parkingSlots[idx]
    if (slot.totalSlots <= 1) {
      addSystemLog({
        type: 'warning',
        message: `Cannot remove slot: ${slot.name} has only 1 slot`,
        details: { slotId }
      })
      return { success: false, error: 'CANNOT_REMOVE_LAST_SLOT', message: 'Use "Remove Entire Location" instead' }
    }

    const updatedSlots = [...parkingSlots]
    updatedSlots[idx] = {
      ...updatedSlots[idx],
      totalSlots: updatedSlots[idx].totalSlots - 1,
      availableSlots: Math.max(0, updatedSlots[idx].availableSlots - 1)
    }
    set({ parkingSlots: updatedSlots })
    get().saveParkingSlotsToStorage()

    addSystemLog({
      type: 'action',
      message: `Removed 1 slot from ${slot.name}`,
      details: { slotId, newTotal: updatedSlots[idx].totalSlots }
    })

    return { success: true, slot: updatedSlots[idx] }
  },

  removeEntireLocation: (slotId) => {
    const { parkingSlots, addSystemLog } = get()

    const slot = parkingSlots.find((s) => s.id === slotId)
    if (!slot) {
      addSystemLog({
        type: 'error',
        message: `Remove location failed: slot ${slotId} not found`,
        details: { slotId }
      })
      return { success: false, error: 'SLOT_NOT_FOUND' }
    }

    // Enforce rule: location can only be removed when all slots are free
    if (slot.availableSlots !== slot.totalSlots) {
      addSystemLog({
        type: 'warning',
        message: `Remove location blocked: ${slot.name} has occupied slots`,
        details: { slotId, availableSlots: slot.availableSlots, totalSlots: slot.totalSlots }
      })
      return { 
        success: false, 
        error: 'SLOTS_OCCUPIED', 
        message: 'All parking slots must be free before removing this location' 
      }
    }

    const updatedSlots = parkingSlots.filter((s) => s.id !== slotId)
    set({ parkingSlots: updatedSlots })
    get().saveParkingSlotsToStorage()

    addSystemLog({
      type: 'action',
      message: `Removed entire location ${slot.name}`,
      details: { slotId }
    })

    return { success: true }
  },

  createParkingSlot: async ({ locationName, price, totalSlots, availability, ownerId, coordinates }) => {
    const { parkingSlots, addSystemLog } = get()

    const slotData = {
      name: locationName,
      address: locationName,
      price,
      distance: 0,
      isAvailable: true,
      ownerRating: 0.0,
      ownerId,
      type: 'open',
      totalSlots,
      availableSlots: totalSlots,
      availability: availability || { type: '24/7', label: '24/7' },
      coordinates: coordinates || null,
    }

    // Save to localStorage
    const result = await userDatabase.addParkingSlot(slotData)

    if (result.success) {
      // Update local state with the returned slot (which includes the generated ID)
      set({ parkingSlots: [...parkingSlots, result.slot] })
      get().saveParkingSlotsToStorage()

      addSystemLog({
        type: 'action',
        message: `Created new parking location: ${locationName}`,
        details: { locationName, totalSlots, price, coordinates }
      })

      return { success: true, slot: result.slot }
    } else {
      addSystemLog({
        type: 'error',
        message: `Failed to create parking location: ${locationName}`,
        details: { error: result.error }
      })
      return { success: false, error: result.error }
    }
  },

  toggleSlotAvailability: async (slotId) => {
    const { parkingSlots, addSystemLog } = get()
    const idx = parkingSlots.findIndex((s) => s.id === slotId)

    if (idx === -1) {
      addSystemLog({
        type: 'error',
        message: `Toggle availability failed: slot ${slotId} not found`,
        details: { slotId }
      })
      return { success: false, error: 'SLOT_NOT_FOUND' }
    }

    const slot = parkingSlots[idx]
    const newAvailability = !slot.isAvailable

    const updatedSlots = [...parkingSlots]
    updatedSlots[idx] = {
      ...updatedSlots[idx],
      isAvailable: newAvailability
    }
    set({ parkingSlots: updatedSlots })
    get().saveParkingSlotsToStorage()

    // Persist to localStorage via userDatabase
    await userDatabase.updateParkingSlot(slotId, { isAvailable: newAvailability })

    addSystemLog({
      type: 'action',
      message: `Slot availability toggled for ${slot.name}: ${slot.isAvailable ? 'OPEN' : 'CLOSED'}`,
      details: { slotId, newAvailability }
    })

    return { success: true, slot: updatedSlots[idx] }
  },

}))

export { useStore, BookingStatus }
