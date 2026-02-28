'use client'

interface DataConnectionStatusProps {
  connected: boolean
  stats: any
  onReconnect: () => void
}

export default function DataConnectionStatus({
  connected,
  stats,
  onReconnect,
}: DataConnectionStatusProps) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-4 border border-slate-200">
      <h3 className="font-semibold text-slate-700 mb-3">Data Connection</h3>
      
      <div className="flex items-center gap-2 mb-3">
        <div
          className={`w-3 h-3 rounded-full ${
            connected ? 'bg-green-500' : 'bg-red-500'
          }`}
        />
        <span className="text-sm font-medium text-slate-700">
          {connected ? 'Connected' : 'Disconnected'}
        </span>
      </div>

      {connected && stats && (
        <div className="space-y-2 text-xs text-slate-600">
          <div className="flex justify-between">
            <span>Customers:</span>
            <span className="font-semibold">{stats.customers}</span>
          </div>
          <div className="flex justify-between">
            <span>Products:</span>
            <span className="font-semibold">{stats.products}</span>
          </div>
          <div className="flex justify-between">
            <span>Transactions:</span>
            <span className="font-semibold">{stats.transactions}</span>
          </div>
          <div className="flex justify-between">
            <span>Alerts:</span>
            <span className="font-semibold">{stats.alerts}</span>
          </div>
        </div>
      )}

      {!connected && (
        <button
          onClick={onReconnect}
          className="w-full mt-2 px-3 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
        >
          Reconnect
        </button>
      )}
    </div>
  )
}
