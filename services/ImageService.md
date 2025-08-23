# ImageService

The `ImageService` provides automatic image optimization for the Carbie app. It automatically resizes images that exceed the size threshold while maintaining aspect ratio.

## How It Works

### Size Threshold Formula
The service uses the formula: `(width × height) / 750 > 1600`

- **If true**: Image needs resizing
- **If false**: Image is already optimized

### Resizing Logic
When an image exceeds the threshold:
1. Calculate the target area: `1600 × 750 = 1,200,000 pixels`
2. Determine the scaling factor to maintain aspect ratio
3. Resize the image to fit within the target area
4. Maintain the original aspect ratio

### Example Calculations

| Original Size | Formula | Result | Action |
|---------------|---------|---------|---------|
| 2000 × 1500 | (3,000,000) / 750 = 4000 | 4000 > 1600 | **Resize** |
| 1000 × 800 | (800,000) / 750 = 1066.67 | 1066.67 ≤ 1600 | **Keep Original** |
| 1200 × 1000 | (1,200,000) / 750 = 1600 | 1600 = 1600 | **Keep Original** |

## Usage

### Basic Image Processing
```typescript
import { ImageService } from '../services/ImageService';

// Process an image blob
const result = await ImageService.processImage(imageBlob);

if (result.wasResized) {
  console.log(`Image resized from ${result.originalDimensions.width}x${result.originalDimensions.height} to ${result.newDimensions.width}x${result.newDimensions.height}`);
  // Use result.blob for the resized image
} else {
  console.log('Image did not require resizing');
  // Use result.blob (same as original)
}
```

### Processing from URI
```typescript
// Process an image directly from URI
const result = await ImageService.processImageFromUri(imageUri);
```

## Platform Support

### Web Platform
- ✅ Full image resizing using HTML5 Canvas
- ✅ Automatic dimension detection
- ✅ JPEG output with 90% quality

### React Native Platform
- ⚠️ Dimension detection returns default values (1920x1080)
- ⚠️ Resizing not yet implemented (returns original image)
- 🔄 Future: Will use `expo-image-manipulator` for full support

## Error Handling

The service is designed to be robust:
- If resizing fails, returns the original image
- If dimension detection fails, uses default dimensions
- All errors are logged for debugging
- Graceful fallback to original image

## Future Enhancements

1. **React Native Support**: Implement full resizing using `expo-image-manipulator`
2. **Format Options**: Support for different output formats (PNG, WebP)
3. **Quality Settings**: Configurable compression quality
4. **Batch Processing**: Process multiple images simultaneously
5. **Progressive Resizing**: Multiple size options for different use cases

## Testing

Run the test suite to verify the resizing logic:
```bash
npm test ImageService.test.ts
```

The tests verify:
- Correct threshold detection
- Aspect ratio preservation
- Size constraint satisfaction
- Edge case handling
