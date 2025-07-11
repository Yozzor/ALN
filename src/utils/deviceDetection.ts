export const isMobileDevice = (): boolean => {
  // Check user agent for mobile devices
  const userAgent = navigator.userAgent.toLowerCase()
  const mobileKeywords = [
    'android', 'webos', 'iphone', 'ipad', 'ipod', 
    'blackberry', 'windows phone', 'mobile'
  ]
  
  const isMobileUserAgent = mobileKeywords.some(keyword => 
    userAgent.includes(keyword)
  )
  
  // Check screen size (mobile-first approach)
  const isMobileScreen = window.innerWidth <= 768
  
  // Check for touch capability
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0
  
  // Return true if any mobile indicator is present
  return isMobileUserAgent || (isMobileScreen && isTouchDevice)
}

export const getDeviceInfo = () => {
  return {
    userAgent: navigator.userAgent,
    screenWidth: window.innerWidth,
    screenHeight: window.innerHeight,
    isTouchDevice: 'ontouchstart' in window,
    maxTouchPoints: navigator.maxTouchPoints
  }
}
