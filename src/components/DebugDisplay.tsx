import React from 'react'

interface DebugDisplayProps {
  logs: string[]
  photosRemaining: number
}

const DebugDisplay: React.FC<DebugDisplayProps> = ({ logs, photosRemaining }) => {
  // ALWAYS SHOW DEBUG - NEVER HIDE IT
  return (
    <div className="fixed top-4 left-4 right-4 bg-red-600 text-white p-4 rounded-lg text-sm max-h-60 overflow-y-auto z-[9999] border-4 border-yellow-400">
      <div className="font-bold mb-3 text-yellow-300 text-lg">
        🚨 DEBUG: Photos Remaining = {photosRemaining}
      </div>
      <div className="font-bold mb-2 text-white">
        📊 Total Debug Logs: {logs.length}
      </div>
      {logs.length === 0 ? (
        <div className="text-yellow-200">No debug logs yet...</div>
      ) : (
        logs.slice(-10).map((log, index) => (
          <div key={index} className="mb-1 text-white bg-black/30 p-1 rounded">
            {log}
          </div>
        ))
      )}
    </div>
  )
}

export default DebugDisplay
