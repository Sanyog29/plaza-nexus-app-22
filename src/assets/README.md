# Assets Directory Structure

## Overview
This directory contains all static assets for the Plaza Nexus project.

## Structure

### `/src/assets/`
For assets that will be imported as ES6 modules and processed by Vite:

- **`/images/`** - Images imported in components (optimized by Vite)
  - `/reference/` - Reference images and screenshots
  - `/ui/` - UI-specific images (hero images, backgrounds, etc.)
  - `/icons/` - Custom icon images
- **`/icons/`** - Custom SVG icons and icon files

### `/public/assets/`
For assets that need direct URL access:

- **`/images/`** - Public images accessible via direct URLs
- **`/uploads/`** - User-uploaded content
- **`/icons/`** - Public icon files

## Usage Examples

### Importing images in components (src/assets):
```tsx
import heroImage from '@/assets/images/ui/hero.jpg';

function Hero() {
  return <img src={heroImage} alt="Hero" />;
}
```

### Using public assets (public/assets):
```tsx
function ProfileImage() {
  return <img src="/assets/images/default-avatar.png" alt="Avatar" />;
}
```

## Best Practices

1. **Use src/assets for:**
   - Images that need optimization/processing
   - Images imported in components
   - Assets that benefit from cache busting

2. **Use public/assets for:**
   - Images referenced by direct URL
   - User uploads
   - Assets that need consistent URLs
   - Large files that shouldn't be bundled

3. **Optimization:**
   - Compress images before adding
   - Use appropriate formats (WebP for web, PNG for transparency)
   - Consider lazy loading for large images

4. **Organization:**
   - Group by type and usage
   - Use descriptive filenames
   - Keep reference materials separate