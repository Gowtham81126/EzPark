import { formatPaymentAmount } from '../utils/paymentCalculator'

function PaymentBreakdown({ breakdown, isLoading = false }) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!breakdown) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4 text-center text-gray-400">
        No payment breakdown available
      </div>
    )
  }

  const { base, extra, adjustments, total, adjustmentReason, earlyExitReason, breakdown: items } = breakdown

  // Filter out adjustments from display
  const displayItems = items.filter(item => item.label !== 'Adjustments')

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Payment Breakdown</h3>

      {/* Breakdown Items */}
      <div className="space-y-3 mb-4">
        {displayItems.map((item, index) => (
          <div key={index} className="flex justify-between items-start">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-700">{item.label}</p>
              <p className="text-xs text-gray-500">{item.description}</p>
            </div>
            <p className={`text-sm font-semibold ${item.amount < 0 ? 'text-green-600' : 'text-gray-800'}`}>
              {formatPaymentAmount(item.amount)}
            </p>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200 my-4"></div>

      {/* Total */}
      <div className="flex justify-between items-center">
        <p className="text-base font-semibold text-gray-800">Total</p>
        <p className="text-2xl font-bold text-gray-900">{formatPaymentAmount(total)}</p>
      </div>

      {/* Adjustment Notice */}
      {adjustmentReason && (
        <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <span className="text-green-600 mt-0.5">✓</span>
            <p className="text-xs text-green-800">{adjustmentReason}</p>
          </div>
        </div>
      )}

      {/* Early Exit Discount Notice */}
      {earlyExitReason && (
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <span className="text-blue-600 mt-0.5">↓</span>
            <p className="text-xs text-blue-800">{earlyExitReason}</p>
          </div>
        </div>
      )}

      {/* Fairness Indicator */}
      {breakdown.driverArrivedOnTime !== null && (
        <div className="mt-3 flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${breakdown.driverArrivedOnTime ? 'bg-green-500' : 'bg-amber-500'}`}></div>
          <p className="text-xs text-gray-600">
            Driver {breakdown.driverArrivedOnTime ? 'arrived on time' : 'arrived late'}
          </p>
        </div>
      )}
    </div>
  )
}

export default PaymentBreakdown
