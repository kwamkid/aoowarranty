// lib/image-utils.ts

/**
 * Resize image to maximum dimensions while maintaining aspect ratio
 * @param file - Original image file
 * @param maxWidth - Maximum width (default: 500px)
 * @param maxHeight - Maximum height (default: 500px)
 * @param quality - JPEG quality 0-1 (default: 0.8)
 * @returns Promise<Blob> - Resized image blob
 */
export async function resizeImage(
  file: File,
  maxWidth: number = 500,
  maxHeight: number = 500,
  quality: number = 0.8
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      const img = new Image()
      
      img.onload = () => {
        // Calculate new dimensions
        let width = img.width
        let height = img.height
        
        // Calculate aspect ratio
        const aspectRatio = width / height
        
        // Resize logic
        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            // Landscape
            if (width > maxWidth) {
              width = maxWidth
              height = Math.floor(width / aspectRatio)
            }
          } else {
            // Portrait or square
            if (height > maxHeight) {
              height = maxHeight
              width = Math.floor(height * aspectRatio)
            }
          }
        }
        
        // Create canvas
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Failed to get canvas context'))
          return
        }
        
        // Enable image smoothing for better quality
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        
        // Draw resized image
        ctx.drawImage(img, 0, 0, width, height)
        
        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error('Failed to create blob'))
            }
          },
          file.type === 'image/png' ? 'image/png' : 'image/jpeg',
          quality
        )
      }
      
      img.onerror = () => {
        reject(new Error('Failed to load image'))
      }
      
      img.src = e.target?.result as string
    }
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }
    
    reader.readAsDataURL(file)
  })
}

/**
 * Convert blob to file
 * @param blob - Image blob
 * @param fileName - Original file name
 * @returns File object
 */
export function blobToFile(blob: Blob, fileName: string): File {
  return new File([blob], fileName, { type: blob.type })
}

/**
 * Check if file is valid image
 * @param file - File to check
 * @returns boolean
 */
export function isValidImage(file: File): boolean {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  return validTypes.includes(file.type)
}

/**
 * Format file size for display
 * @param bytes - File size in bytes
 * @returns Formatted string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}