import { useState, useEffect } from 'react'

interface CameraControlsProps {
  capabilities: {
    zoom?: { min: number; max: number; step: number }
    focusDistance?: { min: number; max: number; step: number }
    focusMode?: string[]
    torch?: boolean
  }
  currentZoom: number
  currentFocusMode: 'manual' | 'continuous'
  torchEnabled: boolean
  availableCameras: MediaDeviceInfo[]
  currentCameraIndex: number
  cameraType: 'wide' | 'ultra-wide' | 'telephoto'
  onZoomChange: (zoom: number) => void
  onFocusChange: (mode: 'manual' | 'continuous', distance?: number) => void
  onTorchToggle: () => void
  onCameraSwitch: (type: 'wide' | 'ultra-wide' | 'telephoto') => void
  isVisible: boolean
  onToggleVisibility: () => void
}

const CameraControls = ({
  capabilities,
  currentZoom,
  currentFocusMode,
  torchEnabled,
  availableCameras,
  currentCameraIndex,
  cameraType,
  onZoomChange,
  onFocusChange,
  onTorchToggle,
  onCameraSwitch,
  isVisible,
  onToggleVisibility
}: CameraControlsProps) => {
  const [focusDistance, setFocusDistance] = useState(0)
  const [filter, setFilter] = useState('none')

  useEffect(() => {
    if (capabilities.focusDistance) {
      setFocusDistance(capabilities.focusDistance.min)
    }
  }, [capabilities.focusDistance])

  const handleZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const zoom = parseFloat(e.target.value)
    onZoomChange(zoom)
  }

  const handleFocusDistanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const distance = parseFloat(e.target.value)
    setFocusDistance(distance)
    onFocusChange('manual', distance)
  }

  const handleFocusModeChange = (mode: 'manual' | 'continuous') => {
    onFocusChange(mode, mode === 'manual' ? focusDistance : undefined)
  }

  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter)
    // Apply CSS filter to video element
    const video = document.querySelector('video')
    if (video) {
      video.style.filter = newFilter === 'none' ? '' : newFilter
    }
  }

  const filters = [
    { name: 'None', value: 'none' },
    { name: 'B&W', value: 'grayscale(100%)' },
    { name: 'Sepia', value: 'sepia(100%)' },
    { name: 'Vintage', value: 'sepia(50%) contrast(1.2) brightness(1.1)' },
    { name: 'Cool', value: 'hue-rotate(180deg) saturate(1.2)' },
    { name: 'Warm', value: 'hue-rotate(30deg) saturate(1.3) brightness(1.1)' },
    { name: 'High Contrast', value: 'contrast(1.5) brightness(1.1)' },
    { name: 'Soft', value: 'blur(0.5px) brightness(1.1)' }
  ]

  if (!isVisible) {
    return (
      <button
        onClick={onToggleVisibility}
        className="fixed bottom-20 left-4 bg-black/70 text-white p-3 rounded-full shadow-lg z-50"
        title="Show Camera Controls"
      >
        ⚙️
      </button>
    )
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-sm text-white p-4 z-50 max-h-80 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">📸 Camera Controls</h3>
        <button
          onClick={onToggleVisibility}
          className="text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>

      <div className="space-y-4">
        {/* Camera Selection */}
        {availableCameras.length > 1 && (
          <div>
            <label className="block text-sm font-medium mb-2">
              📷 Camera ({availableCameras.length} available)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['wide', 'ultra-wide', 'telephoto'].map((type) => {
                const hasCamera = availableCameras.some(camera => {
                  const label = camera.label.toLowerCase()
                  if (type === 'ultra-wide') return label.includes('ultra') || label.includes('wide')
                  if (type === 'telephoto') return label.includes('telephoto') || label.includes('tele')
                  return label.includes('back') || label.includes('rear') || (!label.includes('ultra') && !label.includes('tele'))
                })

                return (
                  <button
                    key={type}
                    onClick={() => onCameraSwitch(type as 'wide' | 'ultra-wide' | 'telephoto')}
                    disabled={!hasCamera}
                    className={`py-2 px-3 rounded text-sm ${
                      cameraType === type
                        ? 'bg-primary-600 text-white'
                        : hasCamera
                          ? 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                          : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {type === 'ultra-wide' ? '0.5x UW' : type === 'telephoto' ? '3x TEL' : '1x Wide'}
                  </button>
                )
              })}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Current: {availableCameras[currentCameraIndex]?.label || 'Unknown'}
            </p>
          </div>
        )}

        {/* Zoom Control */}
        {capabilities.zoom && (
          <div>
            <label className="block text-sm font-medium mb-2">
              🔍 Zoom: {currentZoom.toFixed(1)}x
            </label>
            <input
              type="range"
              min={capabilities.zoom.min}
              max={capabilities.zoom.max}
              step={capabilities.zoom.step || 0.1}
              value={currentZoom}
              onChange={handleZoomChange}
              className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>{capabilities.zoom.min}x</span>
              <span>{capabilities.zoom.max}x</span>
            </div>
          </div>
        )}

        {/* Focus Controls */}
        {capabilities.focusMode && (
          <div>
            <label className="block text-sm font-medium mb-2">🎯 Focus Mode</label>
            <div className="flex space-x-2 mb-2">
              <button
                onClick={() => handleFocusModeChange('continuous')}
                className={`px-3 py-1 rounded text-sm ${
                  currentFocusMode === 'continuous'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-600 text-gray-300'
                }`}
              >
                Auto
              </button>
              <button
                onClick={() => handleFocusModeChange('manual')}
                className={`px-3 py-1 rounded text-sm ${
                  currentFocusMode === 'manual'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-600 text-gray-300'
                }`}
              >
                Manual
              </button>
            </div>

            {/* Focus Distance (only in manual mode) */}
            {currentFocusMode === 'manual' && capabilities.focusDistance && (
              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  Focus Distance: {focusDistance.toFixed(2)}m
                </label>
                <input
                  type="range"
                  min={capabilities.focusDistance.min}
                  max={capabilities.focusDistance.max}
                  step={capabilities.focusDistance.step || 0.01}
                  value={focusDistance}
                  onChange={handleFocusDistanceChange}
                  className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>Near</span>
                  <span>Far</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Torch/Flash Control */}
        {capabilities.torch && (
          <div>
            <button
              onClick={onTorchToggle}
              className={`w-full py-2 px-4 rounded-lg font-medium ${
                torchEnabled
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-600 text-gray-300'
              }`}
            >
              {torchEnabled ? '🔦 Flash ON' : '🔦 Flash OFF'}
            </button>
          </div>
        )}

        {/* Filter Controls */}
        <div>
          <label className="block text-sm font-medium mb-2">🎨 Filters</label>
          <div className="grid grid-cols-2 gap-2">
            {filters.map((filterOption) => (
              <button
                key={filterOption.name}
                onClick={() => handleFilterChange(filterOption.value)}
                className={`py-2 px-3 rounded text-sm ${
                  filter === filterOption.value
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-600 text-gray-300'
                }`}
              >
                {filterOption.name}
              </button>
            ))}
          </div>
        </div>

        {/* Capabilities Info */}
        <div className="text-xs text-gray-400 pt-2 border-t border-gray-600">
          <p>Available features:</p>
          <div className="flex flex-wrap gap-2 mt-1">
            {availableCameras.length > 1 && <span className="bg-gray-700 px-2 py-1 rounded">Multi-Camera</span>}
            {capabilities.zoom && <span className="bg-gray-700 px-2 py-1 rounded">Zoom</span>}
            {capabilities.focusMode && <span className="bg-gray-700 px-2 py-1 rounded">Focus</span>}
            {capabilities.torch && <span className="bg-gray-700 px-2 py-1 rounded">Flash</span>}
            <span className="bg-gray-700 px-2 py-1 rounded">Filters</span>
          </div>
          {availableCameras.length > 1 && (
            <p className="mt-2">
              📱 {availableCameras.length} cameras detected - tap camera buttons for optical zoom
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default CameraControls
