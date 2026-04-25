import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'

function MainScreen() {
  const navigate = useNavigate()
  const logout = useStore((s) => s.logout)
  const currentUser = useStore((s) => s.currentUser)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-cover bg-center bg-no-repeat flex flex-col relative" style={{ backgroundImage: "url('/images/bg.png')" }}>
      <div className="absolute inset-0 bg-white/30 pointer-events-none"></div>
      {/* Main Content - Centered */}
      <div className="flex-1 flex items-center justify-center px-4 relative z-10">
        <div className="text-center max-w-2xl">
          {/* Logo */}
          <img src="/images/logo.png" alt="ParkEasy" className="w-48 h-auto mb-6 mx-auto" />

          {/* Subtitle */}
          <p className="text-lg text-gray-600 mb-10 max-w-lg mx-auto leading-relaxed">
            Find the perfect parking spot in seconds, or share yours and earn effortlessly.
          </p>

          {/* Buttons */}
          <div className="space-y-4">
            {/* Primary Button - Find Parking */}
            <button
              onClick={() => navigate('/driver')}
              className="w-full max-w-xs mx-auto block py-4 px-8 bg-blue-600 text-white rounded-xl font-semibold text-lg shadow-lg hover:bg-blue-700 hover:shadow-xl transition-all"
            >
              Find Parking
            </button>

            {/* Secondary Button - List My Space */}
            <button
              onClick={() => navigate('/create-slot')}
              className="w-full max-w-xs mx-auto block py-4 px-8 bg-white text-blue-600 border-2 border-blue-600 rounded-xl font-semibold text-lg shadow-md hover:bg-blue-50 hover:shadow-lg transition-all"
            >
              List My Space
            </button>

            {/* Tertiary Button - Manage My Spaces */}
            <button
              onClick={() => navigate('/owner')}
              className="w-full max-w-xs mx-auto block py-4 px-8 bg-gray-100 text-gray-700 rounded-xl font-semibold text-lg shadow-md hover:bg-gray-200 hover:shadow-lg transition-all"
            >
              Manage My Spaces
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MainScreen
