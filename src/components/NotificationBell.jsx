import { useState, useEffect } from 'react'
import { useStore } from '../store/useStore'

function NotificationBell() {
  const { notifications, clearNotifications } = useStore()
  const [open, setOpen] = useState(false)
  const [hasNewNotification, setHasNewNotification] = useState(false)
  const [prevCount, setPrevCount] = useState(0)

  useEffect(() => {
    if (notifications.length > prevCount) {
      setHasNewNotification(true)
      setTimeout(() => setHasNewNotification(false), 3000)
    }
    setPrevCount(notifications.length)
  }, [notifications.length, prevCount])

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'booking':
        return '🚗'
      case 'rating':
        return '⭐'
      case 'payment':
        return '💳'
      default:
        return '📢'
    }
  }

  const getNotificationColor = (type) => {
    switch (type) {
      case 'booking':
        return 'bg-blue-50 border-blue-200'
      case 'rating':
        return 'bg-amber-50 border-amber-200'
      case 'payment':
        return 'bg-green-50 border-green-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`relative p-2 rounded-lg transition-all duration-300 ${
          hasNewNotification 
            ? 'bg-amber-100 text-amber-600 animate-pulse' 
            : 'text-gray-500 hover:bg-gray-100'
        }`}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.058-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {notifications.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold shadow-md">
            {notifications.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-800">Notifications</h3>
                <p className="text-xs text-gray-500">{notifications.length} unread</p>
              </div>
              {notifications.length > 0 && (
                <button
                  onClick={clearNotifications}
                  className="px-3 py-1 bg-red-100 text-red-600 rounded-lg text-xs font-medium hover:bg-red-200 transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-4xl mb-2">🔔</div>
                <p className="text-sm text-gray-400">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-4 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors ${getNotificationColor(n.type)} border-l-4`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-xl">{getNotificationIcon(n.type)}</span>
                    <div className="flex-1">
                      <p className="text-sm text-gray-800 font-medium leading-relaxed">{n.message}</p>
                      <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                        <span>🕐</span>
                        <span>{formatTimestamp(n.timestamp)}</span>
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationBell
