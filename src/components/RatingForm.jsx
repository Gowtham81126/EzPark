import { useState } from 'react'

function RatingForm({ booking, userType, onSubmit, onClose }) {
  const [ratings, setRatings] = useState({
    punctuality: 5,
    behavior: 5,
    reliability: 5,
  })

  const ratingLabels = {
    punctuality: 'Punctuality',
    behavior: 'Behavior',
    reliability: 'Reliability',
  }

  const ratingDescriptions = {
    punctuality: 'How timely was the other person?',
    behavior: 'How was their conduct during the interaction?',
    reliability: 'How dependable were they throughout the process?',
  }

  const handleRatingChange = (field, value) => {
    setRatings((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = () => {
    onSubmit(ratings)
  }

  const getStarColor = (rating, index) => {
    return index < rating ? 'text-yellow-500' : 'text-gray-300'
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-md w-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          Rate {userType === 'driver' ? 'Owner' : 'Driver'}
        </h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="space-y-5">
        {Object.keys(ratings).map((field) => (
          <div key={field}>
            <div className="flex items-center justify-between mb-2">
              <div>
                <label className="font-medium text-gray-700">{ratingLabels[field]}</label>
                <p className="text-xs text-gray-500 mt-0.5">{ratingDescriptions[field]}</p>
              </div>
              <span className="text-lg font-bold text-gray-800">{ratings[field]}.0</span>
            </div>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => handleRatingChange(field, star)}
                  className="text-2xl transition-transform hover:scale-110 focus:outline-none"
                  type="button"
                >
                  <span className={getStarColor(ratings[field], star)}>★</span>
                </button>
              ))}
            </div>
          </div>
        ))}

        <div className="pt-4 border-t border-gray-200">
          <button
            onClick={handleSubmit}
            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Submit Rating
          </button>
          <button
            onClick={onClose}
            className="w-full py-2 mt-2 text-gray-600 hover:text-gray-800 transition-colors text-sm"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  )
}

export default RatingForm
