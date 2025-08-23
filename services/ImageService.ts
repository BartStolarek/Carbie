import { Platform } from 'react-native';

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface ResizeResult {
  blob: Blob;
  originalDimensions: ImageDimensions;
  newDimensions: ImageDimensions;
  wasResized: boolean;
}

export class ImageService {
  /**
   * Check if an image needs resizing based on the formula: (width * height) / 750 > 1600
   * @param dimensions - The image dimensions
   * @returns true if the image needs resizing
   */
  static needsResizing(dimensions: ImageDimensions): boolean {
    const ratio = (dimensions.width * dimensions.height) / 750;
    return ratio > 1600;
  }

  /**
   * Calculate new dimensions that maintain aspect ratio and satisfy the size constraint
   * @param originalDimensions - The original image dimensions
   * @returns New dimensions that satisfy (width * height) / 750 < 1600
   */
  static calculateNewDimensions(originalDimensions: ImageDimensions): ImageDimensions {
    const { width, height } = originalDimensions;
    const targetRatio = 1600 * 750; // Target: width * height = 1600 * 750
    
    // Calculate scaling factor to maintain aspect ratio
    const scale = Math.sqrt(targetRatio / (width * height));
    
    return {
      width: Math.round(width * scale),
      height: Math.round(height * scale)
    };
  }

  /**
   * Resize an image blob to meet the size requirements while maintaining aspect ratio
   * @param imageBlob - The original image blob
   * @param originalDimensions - The original image dimensions
   * @returns Promise with the resize result
   */
  static async resizeImage(imageBlob: Blob, originalDimensions: ImageDimensions): Promise<ResizeResult> {
    // Check if resizing is needed
    if (!this.needsResizing(originalDimensions)) {
      return {
        blob: imageBlob,
        originalDimensions,
        newDimensions: originalDimensions,
        wasResized: false
      };
    }

    try {
      // Calculate new dimensions
      const newDimensions = this.calculateNewDimensions(originalDimensions);
      
      if (Platform.OS === 'web') {
        // Web platform - use canvas for resizing
        return await this.resizeImageWeb(imageBlob, originalDimensions, newDimensions);
      } else {
        // React Native platform - return original image for now
        // TODO: Implement React Native image resizing using expo-image-manipulator
        console.warn('Image resizing not yet implemented for React Native. Using original image.');
        return {
          blob: imageBlob,
          originalDimensions,
          newDimensions: originalDimensions,
          wasResized: false
        };
      }
    } catch (error) {
      console.error('Failed to resize image:', error);
      // Return original image if resizing fails
      return {
        blob: imageBlob,
        originalDimensions,
        newDimensions: originalDimensions,
        wasResized: false
      };
    }
  }

  /**
   * Web-specific image resizing using canvas
   */
  private static async resizeImageWeb(
    imageBlob: Blob, 
    originalDimensions: ImageDimensions, 
    newDimensions: ImageDimensions
  ): Promise<ResizeResult> {
    // Create a canvas to resize the image
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    // Set canvas dimensions
    canvas.width = newDimensions.width;
    canvas.height = newDimensions.height;

    // Create an image element
    const img = new Image();
    
    // Create a promise to handle image loading
    const imageLoadPromise = new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Failed to load image'));
    });

    // Set image source from blob
    img.src = URL.createObjectURL(imageBlob);
    
    // Wait for image to load
    await imageLoadPromise;

    // Draw and resize the image on canvas
    ctx.drawImage(img, 0, 0, newDimensions.width, newDimensions.height);

    // Convert canvas to blob
    const resizedBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob from canvas'));
        }
      }, 'image/jpeg', 0.9); // Use JPEG format with 90% quality
    });

    // Clean up
    URL.revokeObjectURL(img.src);

    return {
      blob: resizedBlob,
      originalDimensions,
      newDimensions,
      wasResized: true
    };
  }

  /**
   * Get image dimensions from a blob
   * @param imageBlob - The image blob
   * @returns Promise with the image dimensions
   */
  static async getImageDimensions(imageBlob: Blob): Promise<ImageDimensions> {
    if (Platform.OS === 'web') {
      return this.getImageDimensionsWeb(imageBlob);
    } else {
      // For React Native, we'll need to get dimensions differently
      // For now, return a default size and log a warning
      console.warn('Image dimension detection not yet implemented for React Native. Using default dimensions.');
      return { width: 1920, height: 1080 }; // Default dimensions
    }
  }

  /**
   * Get image dimensions from an image URI (useful for React Native)
   * @param imageUri - The image URI
   * @returns Promise with the image dimensions
   */
  static async getImageDimensionsFromUri(imageUri: string): Promise<ImageDimensions> {
    if (Platform.OS === 'web') {
      // For web, fetch the image and get dimensions from blob
      try {
        const response = await fetch(imageUri);
        const blob = await response.blob();
        return await this.getImageDimensionsWeb(blob);
      } catch (error) {
        console.error('Failed to get image dimensions from URI:', error);
        return { width: 1920, height: 1080 }; // Default dimensions
      }
    } else {
      // For React Native, we'll need to use expo-image-manipulator or similar
      // For now, return default dimensions
      console.warn('Image dimension detection from URI not yet implemented for React Native. Using default dimensions.');
      return { width: 1920, height: 1080 }; // Default dimensions
    }
  }

  /**
   * Web-specific image dimension detection
   */
  private static async getImageDimensionsWeb(imageBlob: Blob): Promise<ImageDimensions> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({
          width: img.naturalWidth,
          height: img.naturalHeight
        });
      };
      img.onerror = () => reject(new Error('Failed to load image for dimension detection'));
      img.src = URL.createObjectURL(imageBlob);
    });
  }

  /**
   * Process an image blob - check dimensions and resize if necessary
   * @param imageBlob - The original image blob
   * @returns Promise with the processed image result
   */
  static async processImage(imageBlob: Blob): Promise<ResizeResult> {
    try {
      // Get original dimensions
      const originalDimensions = await this.getImageDimensions(imageBlob);
      
      // Resize if needed
      return await this.resizeImage(imageBlob, originalDimensions);
    } catch (error) {
      console.error('Failed to process image:', error);
      // Return original image if processing fails
      return {
        blob: imageBlob,
        originalDimensions: { width: 0, height: 0 },
        newDimensions: { width: 0, height: 0 },
        wasResized: false
      };
    }
  }

  /**
   * Process an image from URI - check dimensions and resize if necessary
   * @param imageUri - The image URI
   * @returns Promise with the processed image result
   */
  static async processImageFromUri(imageUri: string): Promise<ResizeResult> {
    try {
      // Fetch the image from URI
      const response = await fetch(imageUri);
      const imageBlob = await response.blob();
      
      // Get original dimensions
      const originalDimensions = await this.getImageDimensionsFromUri(imageUri);
      
      // Resize if needed
      return await this.resizeImage(imageBlob, originalDimensions);
    } catch (error) {
      console.error('Failed to process image from URI:', error);
      // Return a default result if processing fails
      return {
        blob: new Blob(),
        originalDimensions: { width: 0, height: 0 },
        newDimensions: { width: 0, height: 0 },
        wasResized: false
      };
    }
  }
}
