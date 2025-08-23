import { ImageService, ImageDimensions } from './ImageService';

describe('ImageService', () => {
  describe('needsResizing', () => {
    it('should return true when (width * height) / 750 > 1600', () => {
      // Test case: 2000x1500 = 3,000,000 / 750 = 4000 > 1600
      const dimensions: ImageDimensions = { width: 2000, height: 1500 };
      expect(ImageService.needsResizing(dimensions)).toBe(true);
    });

    it('should return false when (width * height) / 750 <= 1600', () => {
      // Test case: 1000x800 = 800,000 / 750 = 1066.67 <= 1600
      const dimensions: ImageDimensions = { width: 1000, height: 800 };
      expect(ImageService.needsResizing(dimensions)).toBe(false);
    });

    it('should return false when exactly at the threshold', () => {
      // Test case: (width * height) / 750 = 1600
      // So width * height = 1600 * 750 = 1,200,000
      // Let's use 1200x1000 = 1,200,000
      const dimensions: ImageDimensions = { width: 1200, height: 1000 };
      expect(ImageService.needsResizing(dimensions)).toBe(false);
    });
  });

  describe('calculateNewDimensions', () => {
    it('should maintain aspect ratio when resizing', () => {
      const original: ImageDimensions = { width: 2000, height: 1500 };
      const newDimensions = ImageService.calculateNewDimensions(original);
      
      // Check that aspect ratio is maintained
      const originalRatio = original.width / original.height;
      const newRatio = newDimensions.width / newDimensions.height;
      expect(newRatio).toBeCloseTo(originalRatio, 2);
    });

    it('should result in (width * height) / 750 <= 1600', () => {
      const original: ImageDimensions = { width: 2000, height: 1500 };
      const newDimensions = ImageService.calculateNewDimensions(original);
      
      const ratio = (newDimensions.width * newDimensions.height) / 750;
      expect(ratio).toBeLessThanOrEqual(1600);
    });

    it('should not resize when already under the threshold', () => {
      const original: ImageDimensions = { width: 1000, height: 800 };
      const newDimensions = ImageService.calculateNewDimensions(original);
      
      expect(newDimensions.width).toBe(original.width);
      expect(newDimensions.height).toBe(original.height);
    });

    it('should handle square images correctly', () => {
      const original: ImageDimensions = { width: 2000, height: 2000 };
      const newDimensions = ImageService.calculateNewDimensions(original);
      
      // Should still be square
      expect(newDimensions.width).toBe(newDimensions.height);
      
      // Should be under threshold
      const ratio = (newDimensions.width * newDimensions.height) / 750;
      expect(ratio).toBeLessThanOrEqual(1600);
    });

    it('should handle very wide images correctly', () => {
      const original: ImageDimensions = { width: 4000, height: 1000 };
      const newDimensions = ImageService.calculateNewDimensions(original);
      
      // Should maintain wide aspect ratio
      expect(newDimensions.width).toBeGreaterThan(newDimensions.height);
      
      // Should be under threshold
      const ratio = (newDimensions.width * newDimensions.height) / 750;
      expect(ratio).toBeLessThanOrEqual(1600);
    });

    it('should handle very tall images correctly', () => {
      const original: ImageDimensions = { width: 1000, height: 4000 };
      const newDimensions = ImageService.calculateNewDimensions(original);
      
      // Should maintain tall aspect ratio
      expect(newDimensions.height).toBeGreaterThan(newDimensions.width);
      
      // Should be under threshold
      const ratio = (newDimensions.width * newDimensions.height) / 750;
      expect(ratio).toBeLessThanOrEqual(1600);
    });
  });

  describe('edge cases', () => {
    it('should handle very large images', () => {
      const original: ImageDimensions = { width: 8000, height: 6000 };
      const newDimensions = ImageService.calculateNewDimensions(original);
      
      // Should be significantly smaller
      expect(newDimensions.width).toBeLessThan(original.width);
      expect(newDimensions.height).toBeLessThan(original.height);
      
      // Should be under threshold
      const ratio = (newDimensions.width * newDimensions.height) / 750;
      expect(ratio).toBeLessThanOrEqual(1600);
    });

    it('should handle very small images', () => {
      const original: ImageDimensions = { width: 100, height: 100 };
      const newDimensions = ImageService.calculateNewDimensions(original);
      
      // Should not be resized (already under threshold)
      expect(newDimensions.width).toBe(original.width);
      expect(newDimensions.height).toBe(original.height);
    });

    it('should handle zero dimensions gracefully', () => {
      const original: ImageDimensions = { width: 0, height: 0 };
      expect(() => ImageService.calculateNewDimensions(original)).not.toThrow();
    });
  });
});
