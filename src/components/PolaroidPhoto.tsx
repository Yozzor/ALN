import { useRef, useEffect } from 'react'

interface PolaroidPhotoProps {
  imageData: string
  userName: string
  onPolaroidReady: (polaroidBlob: Blob) => void
  className?: string
}

const PolaroidPhoto = ({ imageData, userName, onPolaroidReady, className = '' }: PolaroidPhotoProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const createPolaroidPhoto = async () => {
      if (!canvasRef.current || !imageData) return

      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // Create image from data
      const img = new Image()
      img.onload = () => {
        // Calculate photo dimensions while preserving aspect ratio
        const maxPhotoWidth = 720
        const maxPhotoHeight = 540 // Leave space for text at bottom
        const borderWidth = 40

        // Calculate actual photo dimensions maintaining aspect ratio
        const imgAspectRatio = img.width / img.height
        let photoWidth, photoHeight

        if (imgAspectRatio > maxPhotoWidth / maxPhotoHeight) {
          // Image is wider - fit to width
          photoWidth = maxPhotoWidth
          photoHeight = maxPhotoWidth / imgAspectRatio
        } else {
          // Image is taller - fit to height
          photoHeight = maxPhotoHeight
          photoWidth = maxPhotoHeight * imgAspectRatio
        }

        // Calculate Polaroid dimensions based on photo size
        const polaroidWidth = Math.max(800, photoWidth + (borderWidth * 2))
        const polaroidHeight = photoHeight + (borderWidth * 2) + 200 // Extra space for text

        // Set canvas size
        canvas.width = polaroidWidth
        canvas.height = polaroidHeight

        // Fill white background
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, polaroidWidth, polaroidHeight)

        // Add subtle shadow/border effect
        ctx.fillStyle = '#f0f0f0'
        ctx.fillRect(5, 5, polaroidWidth - 10, polaroidHeight - 10)
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, polaroidWidth - 5, polaroidHeight - 5)

        // Calculate photo positioning (centered with borders)
        const photoX = (polaroidWidth - photoWidth) / 2
        const photoY = borderWidth

        // Draw the photo with correct aspect ratio
        ctx.drawImage(img, photoX, photoY, photoWidth, photoHeight)

        // Add photo border
        ctx.strokeStyle = '#e0e0e0'
        ctx.lineWidth = 2
        ctx.strokeRect(photoX, photoY, photoWidth, photoHeight)

        // Add text at bottom (dynamically positioned)
        const textStartY = photoY + photoHeight + 60

        // User name
        ctx.fillStyle = '#333333'
        ctx.font = 'bold 36px "Comic Sans MS", cursive, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(userName, polaroidWidth / 2, textStartY)

        // Date
        ctx.font = '28px "Comic Sans MS", cursive, sans-serif'
        ctx.fillStyle = '#666666'
        const date = new Date().toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        })
        ctx.fillText(date, polaroidWidth / 2, textStartY + 50)

        // Add "About Last Night" branding
        ctx.font = '24px "Comic Sans MS", cursive, sans-serif'
        ctx.fillStyle = '#999999'
        ctx.fillText('About Last Night', polaroidWidth / 2, textStartY + 90)

        // Convert to blob and call callback with high quality
        canvas.toBlob((blob) => {
          if (blob) {
            onPolaroidReady(blob)
          }
        }, 'image/jpeg', 0.95)
      }

      img.src = imageData
    }

    createPolaroidPhoto()
  }, [imageData, userName, onPolaroidReady])

  return (
    <div className={`flex justify-center items-center p-5 ${className}`}>
      <canvas
        ref={canvasRef}
        className="max-w-full h-auto bg-white rounded-sm transition-transform duration-300 hover:rotate-0 hover:scale-105"
        style={{
          filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))',
          transform: 'rotate(-1deg)'
        }}
      />
    </div>
  )
}

export default PolaroidPhoto
