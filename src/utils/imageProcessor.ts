
/**
 * Utility functions for image processing and conversion
 */

/**
 * Convert image to specified dimensions, maintaining aspect ratio with padding
 */
export async function convertImage(
  file: File,
  horizontalWidth: number = 2050,
  verticalHeight: number = 2994
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      // Determine orientation and target dimensions
      const isHorizontal = img.width > img.height;
      const targetWidth = isHorizontal ? horizontalWidth : Math.round((horizontalWidth * img.width) / img.height);
      const targetHeight = isHorizontal ? Math.round((verticalHeight * img.height) / img.width) : verticalHeight;
      
      // Create canvas with correct dimensions
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      canvas.width = isHorizontal ? horizontalWidth : targetWidth;
      canvas.height = isHorizontal ? targetHeight : verticalHeight;
      
      // Fill with white background to handle transparent images
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Calculate positioning to center the image
      const x = (canvas.width - targetWidth) / 2;
      const y = (canvas.height - targetHeight) / 2;
      
      // Draw image centered on canvas with specified dimensions
      ctx.drawImage(img, x, y, targetWidth, targetHeight);
      
      // Convert to blob
      canvas.toBlob(blob => {
        if (blob) {
          URL.revokeObjectURL(url);
          resolve(blob);
        } else {
          URL.revokeObjectURL(url);
          reject(new Error('Failed to convert image to blob'));
        }
      }, file.type || 'image/jpeg', 0.95);
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    
    img.src = url;
  });
}

/**
 * Get file details including dimensions, type, and size
 */
export function getFileDetails(
  file: File
): Promise<{ width: number; height: number; type: string; size: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({
        width: img.width,
        height: img.height,
        type: file.type,
        size: file.size,
      });
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image for details'));
    };
    
    img.src = url;
  });
}

/**
 * Format bytes to human-readable string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Generate a thumbnail URL for a file
 */
export function createThumbnailUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        resolve(e.target.result as string);
      } else {
        reject(new Error('Failed to create thumbnail'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Helper to download a Blob with a filename
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 100);
}
