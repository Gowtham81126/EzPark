import React from 'react'

function CancelConfirmationModal({ isOpen, onConfirm, onClose, userType }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-2xl border border-gray-200 p-6 max-w-sm w-full text-center shadow-xl">
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4 text-red-600 text-2xl">
          ⚠️
        </div>

        <h3 className="text-lg font-bold text-gray-900 mb-2">
          Cancel Booking?
        </h3>

        <p className="text-sm text-gray-600 mb-6 leading-relaxed">
          Are you sure you want to cancel this booking? This action cannot be undone.
        </p>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={onConfirm}
            className="w-full py-2.5 bg-red-600 text-white rounded-xl font-semibold text-sm hover:bg-red-700 transition-colors shadow-sm"
          >
            Yes, Cancel Booking
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-200 transition-colors"
          >
            No, Keep Booking
          </button>
        </div>
      </div>
    </div>
  )
}

export default CancelConfirmationModal
