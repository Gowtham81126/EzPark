import { useEffect, useMemo } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useStore, BookingStatus } from './store/useStore'
import Navbar from './components/Navbar'
import ErrorBoundary from './components/ErrorBoundary'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import ProfilePage from './pages/ProfilePage'
import MainScreen from './pages/MainScreen'
import CreateParkingSlotPage from './pages/CreateParkingSlotPage'
import DriverDashboard from './pages/DriverDashboard'
import OwnerDashboard from './pages/OwnerDashboard'

function App() {
  const isLoggedIn = useStore((s) => s.isLoggedIn)
  const currentUser = useStore((s) => s.currentUser)
  const bookings = useStore((s) => s.bookings)
  const checkBookingTimeEvents = useStore((state) => state.checkBookingTimeEvents)
  const startGPSTracking = useStore((s) => s.startGPSTracking)
  const stopGPSTracking = useStore((s) => s.stopGPSTracking)
  const initializeAuth = useStore((s) => s.initializeAuth)
  const initializeBookings = useStore((s) => s.initializeBookings)
  const initializeParkingSlots = useStore((s) => s.initializeParkingSlots)
  const initializeDriverLocation = useStore((s) => s.initializeDriverLocation)

  // Initialize app data on load
  useEffect(() => {
    initializeAuth()
    initializeBookings()
    initializeParkingSlots()
    initializeDriverLocation()
  }, [])

  // Check if current user is a driver with confirmed bookings
  const driverConfirmedBookingId = useMemo(() => {
    if (!currentUser || currentUser.role !== 'driver') return null
    const confirmedBooking = bookings?.find(
      b => b.driverId === currentUser.id && b.status === BookingStatus.CONFIRMED
    )
    return confirmedBooking?.id || null
  }, [currentUser, bookings])

  // Start/stop GPS tracking based on driver's confirmed booking status
  useEffect(() => {
    if (driverConfirmedBookingId) {
      startGPSTracking()
    } else {
      stopGPSTracking()
    }

    return () => {
      stopGPSTracking()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [driverConfirmedBookingId])

  // Global timer to check booking time events every second
  useEffect(() => {
    const interval = setInterval(() => {
      checkBookingTimeEvents()
    }, 1000)

    return () => clearInterval(interval)
  }, [checkBookingTimeEvents])

  // Listen for localStorage changes from other tabs (multi-tab sync)
  useEffect(() => {
    const handleStorageChange = (e) => {
      const { key, newValue } = e
      
      // Reload auth state if login/logout changed in another tab
      if (key === 'isLoggedIn' || key === 'currentUser') {
        initializeAuth()
      }
      
      // Reload bookings if they changed in another tab
      if (key === 'parkeasy_bookings') {
        initializeBookings()
      }
      
      // Reload parking slots if they changed in another tab
      if (key === 'parkeasy_parking_slots') {
        initializeParkingSlots()
      }
      
      // Reload driver location if it changed in another tab
      if (key === 'parkeasy_driver_location') {
        initializeDriverLocation()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [initializeAuth, initializeBookings, initializeParkingSlots, initializeDriverLocation])

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        {isLoggedIn && <Navbar />}
        <Routes>
          <Route
            path="/"
            element={isLoggedIn ? <Navigate to="/main" /> : <ErrorBoundary><LandingPage /></ErrorBoundary>}
          />
          <Route
            path="/login"
            element={isLoggedIn ? <Navigate to="/main" /> : <ErrorBoundary><LoginPage /></ErrorBoundary>}
          />
          <Route
            path="/signup"
            element={isLoggedIn ? <Navigate to="/main" /> : <ErrorBoundary><SignupPage /></ErrorBoundary>}
          />
          <Route
            path="/profile"
            element={isLoggedIn ? <ErrorBoundary><ProfilePage /></ErrorBoundary> : <Navigate to="/" />}
          />
          <Route
            path="/main"
            element={isLoggedIn ? <ErrorBoundary><MainScreen /></ErrorBoundary> : <Navigate to="/" />}
          />
          <Route
            path="/create-slot"
            element={isLoggedIn ? <ErrorBoundary><CreateParkingSlotPage /></ErrorBoundary> : <Navigate to="/" />}
          />
          <Route
            path="/driver"
            element={isLoggedIn ? <ErrorBoundary><DriverDashboard /></ErrorBoundary> : <Navigate to="/" />}
          />
          <Route
            path="/owner"
            element={isLoggedIn ? <ErrorBoundary><OwnerDashboard /></ErrorBoundary> : <Navigate to="/" />}
          />
        </Routes>
      </div>
    </ErrorBoundary>
  )
}

export default App
