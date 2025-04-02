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
 * Split image into a 3x3 mosaic, each piece with specified dimensions
 */
export async function createMosaicPieces(
  file: File,
  pieceWidth: number = 2050,
  pieceHeight: number = 2994
): Promise<Blob[]> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      try {
        // For mosaic, we need to create a large image first that can be divided into 9 equal pieces
        // Each piece will be pieceWidth x pieceHeight
        const totalWidth = pieceWidth * 3;
        const totalHeight = pieceHeight * 3;
        
        // Calculate scale to fit original image into the 3x3 grid
        const scaleWidth = totalWidth / img.width;
        const scaleHeight = totalHeight / img.height;
        const scale = Math.max(scaleWidth, scaleHeight);
        
        // Calculate the scaled dimensions
        const scaledWidth = img.width * scale;
        const scaledHeight = img.height * scale;
        
        // Center positioning
        const x = (totalWidth - scaledWidth) / 2;
        const y = (totalHeight - scaledHeight) / 2;
        
        // Create a temporary canvas for the full-size image
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = totalWidth;
        tempCanvas.height = totalHeight;
        const tempCtx = tempCanvas.getContext('2d');
        
        if (!tempCtx) {
          URL.revokeObjectURL(url);
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        // Fill with white background
        tempCtx.fillStyle = '#FFFFFF';
        tempCtx.fillRect(0, 0, totalWidth, totalHeight);
        
        // Draw the scaled image centered
        tempCtx.drawImage(img, x, y, scaledWidth, scaledHeight);
        
        // Now create 9 separate canvases for each piece
        const pieces: Blob[] = [];
        let piecesCompleted = 0;
        
        const processPiece = (row: number, col: number) => {
          const pieceCanvas = document.createElement('canvas');
          pieceCanvas.width = pieceWidth;
          pieceCanvas.height = pieceHeight;
          const pieceCtx = pieceCanvas.getContext('2d');
          
          if (!pieceCtx) {
            console.error('Could not get piece canvas context');
            piecesCompleted++;
            checkCompletion();
            return;
          }
          
          // Fill the piece background with white
          pieceCtx.fillStyle = '#FFFFFF';
          pieceCtx.fillRect(0, 0, pieceWidth, pieceHeight);
          
          // Calculate source coordinates
          const srcX = col * pieceWidth;
          const srcY = row * pieceHeight;
          
          // Draw this piece from the temp canvas
          pieceCtx.drawImage(
            tempCanvas,
            srcX, srcY, pieceWidth, pieceHeight,
            0, 0, pieceWidth, pieceHeight
          );
          
          // Convert to blob
          pieceCanvas.toBlob(blob => {
            if (blob) {
              pieces.push(blob);
            } else {
              console.error('Failed to convert piece to blob for piece', row * 3 + col + 1);
            }
            piecesCompleted++;
            checkCompletion();
          }, file.type || 'image/jpeg', 0.95);
        };
        
        const checkCompletion = () => {
          if (piecesCompleted === 9) {
            URL.revokeObjectURL(url);
            if (pieces.length === 0) {
              reject(new Error('Failed to create any mosaic pieces'));
            } else {
              console.log(`Created ${pieces.length} mosaic pieces successfully`);
              resolve(pieces);
            }
          }
        };
        
        // Process all 9 pieces
        for (let row = 0; row < 3; row++) {
          for (let col = 0; col < 3; col++) {
            processPiece(row, col);
          }
        }
      } catch (error) {
        console.error('Error creating mosaic pieces:', error);
        URL.revokeObjectURL(url);
        reject(error);
      }
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
  
  // For improved compatibility across browsers
  link.style.display = 'none';
  document.body.appendChild(link);
  
  // Trigger download
  link.click();
  
  // Clean up
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
}

/**
 * Download multiple blobs as a zip file
 */
export async function downloadBlobsAsZip(blobs: Blob[], baseFilename: string): Promise<void> {
  if (!blobs || blobs.length === 0) {
    throw new Error('No blobs to download');
  }
  
  try {
    console.log(`Creating zip with ${blobs.length} pieces for ${baseFilename}`);
    
    // Dynamic import of JSZip
    const JSZipModule = await import('jszip');
    const JSZip = JSZipModule.default;
    const zip = new JSZip();
    
    // Add each blob to the zip file with an appropriate name
    blobs.forEach((blob, i) => {
      const extension = blob.type.split('/')[1] || 'jpg';
      const filename = `${baseFilename}_parte_${i + 1}.${extension}`;
      console.log(`Adding to zip: ${filename}`);
      zip.file(filename, blob);
    });
    
    // Generate the zip file
    console.log('Generating zip file...');
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    console.log(`Zip generated, size: ${zipBlob.size} bytes`);
    
    if (zipBlob.size === 0) {
      throw new Error('Generated zip file is empty');
    }
    
    // Download the zip file
    const zipFilename = `${baseFilename}_mosaico.zip`;
    console.log(`Downloading zip as: ${zipFilename}`);
    
    // Use the downloadBlob function for consistency
    downloadBlob(zipBlob, zipFilename);
    
    return;
  } catch (error) {
    console.error('Failed to create zip file:', error);
    throw new Error('Falha ao criar arquivo zip: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
  }
}
