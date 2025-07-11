import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import MobileApp from './components/MobileApp'
import DesktopRedirect from './components/DesktopRedirect'
import PhotoGallery from './components/PhotoGallery'
import { isMobileDevice } from './utils/deviceDetection'

function App() {
  const [isMobile, setIsMobile] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if device is mobile
    const checkDevice = () => {
      setIsMobile(isMobileDevice())
      setIsLoading(false)
    }

    checkDevice()

    // Listen for window resize to handle device orientation changes
    window.addEventListener('resize', checkDevice)
    return () => window.removeEventListener('resize', checkDevice)
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-primary flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-2 border-surface-hover border-t-primary-500 mx-auto mb-6"></div>
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary-500 to-accent-orange-500 opacity-20 animate-pulse"></div>
          </div>
          <h2 className="text-text-primary font-semibold text-xl mb-2">About Last Night</h2>
          <p className="text-text-secondary font-medium">Loading your premium experience...</p>
        </div>
      </div>
    )
  }

  return (
    <Router>
      <div className="min-h-screen bg-surface-primary">
        <Routes>
          <Route path="/gallery" element={<PhotoGallery />} />
          <Route path="/" element={isMobile ? <MobileApp /> : <DesktopRedirect />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
