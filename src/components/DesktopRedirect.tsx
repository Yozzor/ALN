import { useState, useEffect } from 'react'
import QRCode from 'qrcode'

const DesktopRedirect = () => {
  const [showQR, setShowQR] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const [mobileUrl, setMobileUrl] = useState<string>('')

  useEffect(() => {
    // Always use the latest production URL for the QR code
    const productionUrl = 'https://about-last-night-mnvjc648y-yozzors-projects.vercel.app'
    const currentUrl = window.location.href
    let mobileAccessUrl = currentUrl

    // If running on localhost, use production URL for QR code
    if (currentUrl.includes('localhost') || currentUrl.includes('127.0.0.1')) {
      // In development, suggest the production URL for mobile access
      mobileAccessUrl = productionUrl
    }

    setMobileUrl(mobileAccessUrl)

    const generateQRCode = async () => {
      try {
        const qrDataUrl = await QRCode.toDataURL(mobileAccessUrl, {
          width: 256,
          margin: 2,
          color: {
            dark: '#1f2937',
            light: '#ffffff'
          }
        })
        setQrCodeUrl(qrDataUrl)
      } catch (error) {
        console.error('Failed to generate QR code:', error)
      }
    }

    generateQRCode()
  }, [])

  return (
    <div className="min-h-screen bg-surface-primary flex items-center justify-center p-8 relative overflow-hidden">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-surface-primary via-surface-secondary to-surface-tertiary opacity-80"></div>

      {/* Ambient lighting effects */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-orange-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="max-w-2xl mx-auto text-center relative z-10 animate-fade-in">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="mb-10">
            <img
              src="/alnlogowhite.png"
              alt="About Last Night Logo"
              className="w-80 h-auto mx-auto drop-shadow-2xl"
            />
          </div>
          <h1 className="text-text-primary text-2xl font-light mb-4 tracking-wide">
            Wedding Photo Sharing App
          </h1>
          <p className="text-text-tertiary text-sm font-light tracking-wider uppercase">
            Premium Mobile Experience
          </p>
        </div>

        {/* Main Message */}
        <div className="card-elevated p-12 mb-10 animate-slide-up">
          <div className="w-16 h-16 bg-surface-hover rounded-2xl flex items-center justify-center mx-auto mb-8 border border-border-primary">
            <div className="w-8 h-8 bg-text-primary rounded opacity-20"></div>
          </div>
          <h2 className="text-3xl font-light text-text-primary mb-6 tracking-wide">
            Mobile Experience Required
          </h2>
          <p className="text-lg text-text-secondary mb-6 leading-relaxed font-light">
            This application is designed for <span className="text-text-primary font-medium">mobile devices</span> to access your camera and capture special wedding moments.
          </p>
          <p className="text-base text-text-tertiary mb-10 font-light">
            Please open this link on your phone or tablet to begin.
          </p>

          {/* Action Buttons */}
          <div className="space-y-8">
            <button
              onClick={() => setShowQR(!showQR)}
              className="btn-primary w-full max-w-sm mx-auto block text-base py-4 font-medium tracking-wide"
            >
              {showQR ? 'Hide QR Code' : 'Show QR Code'}
            </button>

            <div className="glass rounded-2xl p-8">
              <p className="text-text-secondary mb-6 font-light tracking-wide">Mobile Device Link</p>
              <div className="bg-surface-card rounded-xl p-5 font-mono text-sm break-all text-text-primary border border-border-primary">
                {mobileUrl}
              </div>
              {mobileUrl.includes('192.168') && (
                <p className="text-primary-400 text-sm mt-4 font-light text-center">
                  Network URL - Works when connected to the same WiFi
                </p>
              )}
            </div>
          </div>
        </div>

        {/* QR Code Section */}
        {showQR && (
          <div className="card-elevated p-12 animate-slide-up">
            <h3 className="text-xl font-light text-text-primary mb-8 text-center tracking-wide">
              Scan with your phone camera
            </h3>
            <div className="flex justify-center mb-8">
              <div className="bg-white p-8 rounded-2xl shadow-premium">
                {qrCodeUrl ? (
                  <img
                    src={qrCodeUrl}
                    alt="QR Code for About Last Night app"
                    className="w-64 h-64 rounded-xl"
                  />
                ) : (
                  <div className="w-64 h-64 bg-surface-card border border-border-primary rounded-xl flex items-center justify-center">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-surface-hover border-t-primary-500 mx-auto mb-3"></div>
                      <p className="text-text-secondary text-sm font-light">Generating QR Code...</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <p className="text-text-tertiary text-base font-light text-center">
              Point your phone's camera at this QR code
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-text-muted text-xs font-light tracking-wider">
            Made for an unforgettable wedding
          </p>
        </div>
      </div>
    </div>
  )
}

export default DesktopRedirect
