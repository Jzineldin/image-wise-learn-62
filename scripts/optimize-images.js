/**
 * Image Optimization Script
 *
 * This script optimizes images for production use:
 * - Compresses images to appropriate sizes
 * - Generates WebP versions
 * - Creates responsive variants
 *
 * Run with: node scripts/optimize-images.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check if sharp is available
let sharp;
try {
  sharp = (await import('sharp')).default;
  console.log('✅ Sharp is available - will optimize images');
} catch (e) {
  console.log('❌ Sharp not found. Install with: npm install --save-dev sharp');
  console.log('\n📋 Manual optimization instructions:');
  console.log('\n1. **Logo Optimization (tale-forge-logo.png)**');
  console.log('   Current: 1.5MB');
  console.log('   Target: ~50KB');
  console.log('   Steps:');
  console.log('   - Open in image editor (Photoshop, GIMP, or online tool like TinyPNG)');
  console.log('   - Resize to 512x512px (current is probably 2000x2000+)');
  console.log('   - Export as PNG-8 with transparency');
  console.log('   - Also export as WebP at quality 90');
  console.log('   - Replace src/assets/tale-forge-logo.png and tale-forge-logo.webp');
  console.log('\n2. **Background Image (main-astronaut.webp)**');
  console.log('   Current: 1.06MB');
  console.log('   Target: ~100-150KB');
  console.log('   Steps:');
  console.log('   - Open in image editor');
  console.log('   - Resize to 1920x1080px (Full HD is enough for background)');
  console.log('   - Export as WebP at quality 75-80');
  console.log('   - Replace src/assets/main-astronaut.webp');
  console.log('\n3. **Use online tools:**');
  console.log('   - https://tinypng.com/ (PNG compression)');
  console.log('   - https://squoosh.app/ (WebP conversion with quality control)');
  console.log('   - https://imageoptim.com/ (Mac app for optimization)');
  process.exit(1);
}

const assetsDir = path.join(__dirname, '..', 'src', 'assets');

async function optimizeImages() {
  console.log('🎨 Starting image optimization...\n');

  // Optimize logo
  console.log('📸 Optimizing logo...');
  const logoPath = path.join(assetsDir, 'tale-forge-logo.png');
  const logoWebpPath = path.join(assetsDir, 'tale-forge-logo.webp');
  
  try {
    // Create optimized PNG (512x512, high quality)
    await sharp(logoPath)
      .resize(512, 512, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png({ quality: 90, compressionLevel: 9 })
      .toFile(path.join(assetsDir, 'tale-forge-logo-optimized.png'));
    
    // Create optimized WebP (512x512, quality 90)
    await sharp(logoPath)
      .resize(512, 512, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .webp({ quality: 90 })
      .toFile(path.join(assetsDir, 'tale-forge-logo-optimized.webp'));
    
    console.log('✅ Logo optimized successfully');
    console.log('   - Created: tale-forge-logo-optimized.png');
    console.log('   - Created: tale-forge-logo-optimized.webp');
  } catch (error) {
    console.error('❌ Error optimizing logo:', error.message);
  }

  // Optimize background image
  console.log('\n📸 Optimizing background image...');
  const bgPath = path.join(assetsDir, 'main-astronaut.png');
  
  try {
    // Create optimized WebP (1920x1080, quality 80)
    await sharp(bgPath)
      .resize(1920, 1080, {
        fit: 'cover',
        position: 'center'
      })
      .webp({ quality: 80 })
      .toFile(path.join(assetsDir, 'main-astronaut-optimized.webp'));
    
    console.log('✅ Background image optimized successfully');
    console.log('   - Created: main-astronaut-optimized.webp');
  } catch (error) {
    console.error('❌ Error optimizing background:', error.message);
  }

  console.log('\n✨ Optimization complete!');
  console.log('\n📋 Next steps:');
  console.log('1. Review the optimized images in src/assets/');
  console.log('2. If satisfied, replace the original files:');
  console.log('   - mv src/assets/tale-forge-logo-optimized.png src/assets/tale-forge-logo.png');
  console.log('   - mv src/assets/tale-forge-logo-optimized.webp src/assets/tale-forge-logo.webp');
  console.log('   - mv src/assets/main-astronaut-optimized.webp src/assets/main-astronaut.webp');
  console.log('3. Rebuild and deploy');
}

optimizeImages().catch(console.error);

