import jsQR from 'jsqr'

// Downscales + compresses a captured photo before it's stored as a data
// URL. Keeps proof-of-delivery photos from bloating the database while
// still being clearly legible.
export function fileToCompressedDataUrl(file: File, maxDimension = 900, quality = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)
    img.onload = () => {
      const scale = Math.min(1, maxDimension / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        URL.revokeObjectURL(objectUrl)
        reject(new Error('Canvas not supported'))
        return
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(objectUrl)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Could not read image'))
    }
    img.src = objectUrl
  })
}

// Decodes a QR code from a captured photo (a single still frame from the
// device's camera app via <input type="file" capture>, rather than a live
// video stream — simpler, and works the same with or without camera
// hardware, e.g. a driver picking an existing photo if a live scan fails).
export function decodeQrFromFile(file: File): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        URL.revokeObjectURL(objectUrl)
        reject(new Error('Canvas not supported'))
        return
      }
      ctx.drawImage(img, 0, 0)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(objectUrl)
      const result = jsQR(imageData.data, imageData.width, imageData.height)
      resolve(result?.data ?? null)
    }
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Could not read image'))
    }
    img.src = objectUrl
  })
}
