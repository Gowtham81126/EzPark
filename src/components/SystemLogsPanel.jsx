import { useState } from 'react'
import { useStore } from '../store/useStore'

function SystemLogsPanel() {
  const { systemLogs, clearSystemLogs } = useStore()
  const [isOpen, setIsOpen] = useState(false)
  const [filter, setFilter] = useState('all')

  const filteredLogs = filter === 'all' 
    ? systemLogs 
    : systemLogs.filter(log => log.type === filter)

  const getLogIcon = (type) => {
    switch (type) {
      case 'transition':
        return '🔄'
      case 'action':
        return '⚡'
      case 'error':
        return '❌'
      case 'warning':
        return '⚠️'
      case 'info':
        return 'ℹ️'
      case 'booking':
        return '🚗'
      default:
        return '📝'
    }
  }

  const getLogColor = (type) => {
    switch (type) {
      case 'transition':
        return 'bg-blue-50 border-blue-200 text-blue-700'
      case 'action':
        return 'bg-green-50 border-green-200 text-green-700'
      case 'error':
        return 'bg-red-50 border-red-200 text-red-700'
      case 'warning':
        return 'bg-amber-50 border-amber-200 text-amber-700'
      case 'info':
        return 'bg-gray-50 border-gray-200 text-gray-700'
      case 'booking':
        return 'bg-purple-50 border-purple-200 text-purple-700'
      default:
        return 'bg-gray-50 border-gray-200 text-gray-600'
    }
  }

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      fractionalSecondDigits: 3
    })
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
      >
        <span>📋</span>
        <span>System Logs</span>
        {systemLogs.length > 0 && (
          <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
            {systemLogs.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-[500px] max-h-[600px] bg-white rounded-lg shadow-2xl border border-gray-200 z-50 flex flex-col">
          <div className="p-4 border-b border-gray-100 bg-gray-50 rounded-t-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800">System Activity Logs</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Filter:</span>
              {['all', 'transition', 'action', 'error', 'warning', 'info', 'booking'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-2 py-1 rounded text-xs font-medium capitalize transition-colors ${
                    filter === f
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                >
                  {f}
                </button>
              ))}
              {systemLogs.length > 0 && (
                <button
                  onClick={clearSystemLogs}
                  className="ml-auto px-2 py-1 bg-red-100 text-red-600 rounded text-xs font-medium hover:bg-red-200 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <p className="text-4xl mb-2">📭</p>
                <p className="text-sm">No system logs yet</p>
              </div>
            ) : (
              filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className={`${getLogColor(log.type)} border rounded-lg p-3 transition-all hover:shadow-md`}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-lg">{getLogIcon(log.type)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-medium uppercase tracking-wide opacity-70">
                          {log.type}
                        </p>
                        <p className="text-xs font-mono opacity-60">
                          {formatTimestamp(log.timestamp)}
                        </p>
                      </div>
                      <p className="text-sm font-medium mb-1">{log.message}</p>
                      {log.details && (
                        <div className="bg-white bg-opacity-50 rounded p-2 mt-2">
                          <pre className="text-xs font-mono overflow-x-auto">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-3 border-t border-gray-100 bg-gray-50 rounded-b-lg">
            <p className="text-xs text-gray-500 text-center">
              Showing {filteredLogs.length} of {systemLogs.length} logs
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default SystemLogsPanel
