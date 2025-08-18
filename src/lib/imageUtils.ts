import sharp from 'sharp';

export interface ProcessedImage {
  thumbnail: Buffer;
  original: Buffer;
}

export async function processImageForAD(inputBuffer: Buffer): Promise<ProcessedImage> {
  try {
    // Get image metadata
    const metadata = await sharp(inputBuffer).metadata();
    
    if (!metadata.width || !metadata.height) {
      throw new Error('Invalid image format');
    }

    // Process thumbnail for AD (96x96, max 100KB)
    const thumbnail = await sharp(inputBuffer)
      .resize(96, 96, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ 
        quality: 85,
        progressive: true 
      })
      .toBuffer();

    // Check if thumbnail is under 100KB
    if (thumbnail.length > 100 * 1024) {
      // Reduce quality if still too large
      const compressedThumbnail = await sharp(inputBuffer)
        .resize(96, 96, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ 
          quality: 60,
          progressive: true 
        })
        .toBuffer();

      if (compressedThumbnail.length > 100 * 1024) {
        throw new Error('Unable to compress image to required size for Active Directory');
      }

      return {
        thumbnail: compressedThumbnail,
        original: inputBuffer
      };
    }

    // Process original image (max 1MB for jpegPhoto)
    let processedOriginal = inputBuffer;
    
    if (inputBuffer.length > 1024 * 1024) {
      // Compress original if over 1MB
      processedOriginal = await sharp(inputBuffer)
        .jpeg({ 
          quality: 80,
          progressive: true 
        })
        .toBuffer();
    }

    return {
      thumbnail,
      original: processedOriginal
    };

  } catch (error) {
    console.error('Image processing error:', error);
    throw new Error('Failed to process image. Please ensure it\'s a valid JPEG or PNG file.');
  }
}