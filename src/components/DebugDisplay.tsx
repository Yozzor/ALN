import React from 'react'

interface DebugDisplayProps {
  logs: string[]
  photosRemaining: number
}

const DebugDisplay: React.FC<DebugDisplayProps> = ({ logs, photosRemaining }) => {
  if (logs.length === 0) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-black/90 text-white p-3 rounded-lg text-xs max-h-40 overflow-y-auto z-50">
      <div className="font-bold mb-2 text-green-400">
        🔍 DEBUG: Photos Remaining = {photosRemaining}
      </div>
      {logs.slice(-8).map((log, index) => (
        <div key={index} className="mb-1 text-gray-300">
          {log}
        </div>
      ))}
    </div>
  )
}

export default DebugDisplay
