import { useState } from 'react'

function RatingForm({ booking, userType, onSubmit, onClose }) {
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)

  const handleSubmit = () => {
    if (rating === 0) return
    onSubmit({ overall: rating, punctuality: rating, behavior: rating, reliability: rating })
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-8 max-w-sm w-full text-center shadow-xl">
      <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
        <span className="text-3xl">⭐</span>
      </div>

      <h3 className="text-xl font-bold text-gray-900 mb-1">
        Rate {userType === 'driver' ? 'the Owner' : 'the Driver'}
      </h3>
      <p className="text-gray-400 text-sm mb-7">
        How was your overall experience?
      </p>

      {/* 5-star selector */}
      <div className="flex justify-center gap-3 mb-3">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            className="text-5xl transition-transform hover:scale-110 focus:outline-none leading-none"
          >
            <span className={(hovered || rating) >= star ? 'text-amber-400' : 'text-gray-200'}>
              ★
            </span>
          </button>
        ))}
      </div>

      <p className="text-sm text-gray-400 mb-7 h-5">
        {(hovered || rating) > 0 && ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'][hovered || rating]}
      </p>

      <button
        onClick={handleSubmit}
        disabled={rating === 0}
        className={`w-full py-3 rounded-xl text-sm font-semibold transition-all mb-3 ${
          rating > 0
            ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
        }`}
      >
        Submit Rating
      </button>
      <button
        onClick={onClose}
        className="w-full py-2 text-gray-400 hover:text-gray-600 text-sm transition-colors"
      >
        Skip
      </button>
    </div>
  )
}

export default RatingForm
