import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import NotificationBell from './NotificationBell'

function Navbar() {
  const { currentUser, logout } = useStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img src="/images/logo.png" alt="ParkEasy" className="h-8 w-auto" />
          <span className="text-xl font-bold text-primary-600 tracking-tight">ParkEasy</span>
        </Link>

        <div className="flex items-center gap-4">
          <Link
            to="/profile"
            className="text-sm text-gray-600 hover:text-primary-600 transition-colors"
          >
            Profile
          </Link>

          <NotificationBell />

          <div className="flex items-center gap-2 border-l border-gray-200 pl-4">
            <span className="text-sm text-gray-500">
              {currentUser?.name}
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-red-500 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
