import { useState, useEffect } from 'react'
import { useStore } from '../store/useStore'
import { userDatabase } from '../utils/userDatabase'

function ProfilePage() {
  const { currentUser, isLoggedIn } = useStore()
  const [showPassword, setShowPassword] = useState(false)
  const [userDetails, setUserDetails] = useState(null)

  useEffect(() => {
    const fetchUserDetails = async () => {
      if (currentUser?.phoneNumber) {
        const users = await userDatabase.getUsers()
        const user = users.find(u => u.phoneNumber === currentUser.phoneNumber)
        if (user) {
          setUserDetails(user)
        }
      }
    }
    fetchUserDetails()
  }, [currentUser])

  const displayUser = userDetails || currentUser

  if (!isLoggedIn || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Please login to view your profile</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-8">Profile</h1>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Name
                </label>
                <p className="text-lg text-gray-800 font-medium">{displayUser.name || 'N/A'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Gender
                </label>
                <p className="text-lg text-gray-800 font-medium capitalize">
                  {displayUser.gender || 'N/A'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Phone Number
                </label>
                <p className="text-lg text-gray-800 font-medium">
                  {displayUser.phoneNumber ? `+91 ${displayUser.phoneNumber}` : 'N/A'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Password
                </label>
                <div className="flex items-center gap-2">
                  <p className="text-lg text-gray-800 font-medium">
                    {showPassword ? displayUser.password : '•'.repeat(8)}
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Date of Birth
                </label>
                <p className="text-lg text-gray-800 font-medium">
                  {displayUser.dateOfBirth 
                    ? new Date(displayUser.dateOfBirth).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric'
                      })
                    : 'N/A'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Account Created
                </label>
                <p className="text-lg text-gray-800 font-medium">
                  {displayUser.createdAt 
                    ? new Date(displayUser.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric'
                      })
                    : 'N/A'}
                </p>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                User ID: <span className="font-mono text-gray-700">{displayUser.id || 'N/A'}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage
