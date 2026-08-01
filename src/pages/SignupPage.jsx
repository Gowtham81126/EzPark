import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { userDatabase } from '../utils/userDatabase'

function SignupPage() {
  const [formData, setFormData] = useState({
    name: '',
    gender: '',
    phoneNumber: '',
    password: '',
    dateOfBirth: ''
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value } = e.target
    let processedValue = value
    
    // Auto-capitalize first letter for name field
    if (name === 'name' && value.length > 0) {
      processedValue = value.charAt(0).toUpperCase() + value.slice(1)
    }
    
    setFormData({
      ...formData,
      [name]: processedValue
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Validate all fields
    if (!formData.name.trim() || !formData.gender || !formData.phoneNumber.trim() || 
        !formData.password.trim() || !formData.dateOfBirth) {
      setError('Please fill in all fields')
      return
    }

    // Validate phone number format (basic validation)
    const phoneRegex = /^[0-9]{10}$/
    if (!phoneRegex.test(formData.phoneNumber.trim())) {
      setError('Phone number must be 10 digits')
      return
    }

    // Validate password length
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    // Validate date of birth (must be in the past)
    const dob = new Date(formData.dateOfBirth)
    const today = new Date()
    if (dob >= today) {
      setError('Date of birth must be in the past')
      return
    }

    // Check phone number uniqueness
    const isUnique = await userDatabase.isPhoneUnique(formData.phoneNumber.trim())
    if (!isUnique) {
      setError('This phone number is already registered')
      return
    }

    // Save user to database
    const result = await userDatabase.addUser({
      name: formData.name.trim(),
      gender: formData.gender,
      phoneNumber: formData.phoneNumber.trim(),
      password: formData.password,
      dateOfBirth: formData.dateOfBirth
    })

    if (result.success) {
      setSuccess(true)
      // Redirect to login page after 2 seconds
      setTimeout(() => {
        navigate('/login')
      }, 2000)
    } else {
      setError(result.error || 'Signup failed. Please try again.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat relative" style={{ backgroundImage: "url('/images/bg.png')" }}>
      <div className="absolute inset-0 bg-white/30 pointer-events-none"></div>
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <img src="/images/logo.svg" alt="EzPark" className="h-12 w-auto" />
            <h1 className="text-4xl font-bold text-gray-800">EzPark</h1>
          </div>
          <p className="text-gray-500">Find and book parking spots instantly</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-lg p-8 space-y-6"
        >
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg text-sm">
              Signup successful! Redirecting to login...
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gender
            </label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <div className="flex">
              <span className="inline-flex items-center px-4 py-2.5 border border-r-0 border-gray-300 rounded-l-lg bg-gray-50 text-gray-600 text-sm">
                +91
              </span>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                placeholder="Enter 10-digit phone number"
                maxLength={10}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Create a password (min 6 characters)"
                className="w-full px-4 py-2.5 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date of Birth
            </label>
            <input
              type="date"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={!formData.name.trim() || !formData.gender || !formData.phoneNumber.trim() || 
                     !formData.password.trim() || !formData.dateOfBirth || success}
            className={`w-full py-3 rounded-lg text-sm font-semibold transition-all ${
              formData.name.trim() && formData.gender && formData.phoneNumber.trim() && 
              formData.password.trim() && formData.dateOfBirth && !success
                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {success ? 'Signup Successful!' : 'Sign Up'}
          </button>

          <div className="text-center">
            <p className="text-sm text-gray-500">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Login
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}

export default SignupPage
