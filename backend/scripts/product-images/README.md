# Product Images Directory

This directory contains images for the sample laptop products. 

## How It Works

When you run the `addSampleProducts.js` script, it will:
1. Delete all existing products from MongoDB
2. Delete all existing product images from Cloudinary
3. Look for image files in this directory
4. Upload the images to Cloudinary
5. Create new products with the uploaded images

## Image Filenames Required

Place your laptop images here with these exact filenames:

### Business Laptops (7 products)
- `dell-xps-15.jpg` - Dell XPS 15 9520
- `macbook-pro-14.jpg` - MacBook Pro 14 M3
- `lenovo-thinkpad-x1.jpg` - Lenovo ThinkPad X1 Carbon Gen 11
- `msi-creator-z16.jpg` - MSI Creator Z16
- `dell-latitude-7430.jpg` - Dell Latitude 7430
- `macbook-air-m2.jpg` - MacBook Air M2
- `dell-xps-13-plus.jpg` - Dell XPS 13 Plus

### Gaming Laptops (8 products)
- `hp-pavilion-gaming.jpg` - HP Pavilion Gaming 15
- `asus-rog-strix.jpg` - ASUS ROG Strix G16
- `razer-blade-15.jpg` - Razer Blade 15
- `lenovo-legion-5.jpg` - Lenovo Legion 5 Pro
- `acer-predator-helios.jpg` - Acer Predator Helios 300
- `asus-tuf-gaming.jpg` - ASUS TUF Gaming F15
- `msi-katana-gf66.jpg` - MSI Katana GF66
- `gigabyte-aorus-15.jpg` - Gigabyte AORUS 15

### Chromebooks (4 products)
- `acer-chromebook-spin.jpg` - Acer Chromebook Spin 714
- `asus-chromebook-flip.jpg` - ASUS Chromebook Flip CX5
- `hp-chromebook-x360.jpg` - HP Chromebook x360 14
- `samsung-chromebook-2.jpg` - Samsung Galaxy Chromebook 2

### Convertible Laptops (5 products)
- `surface-laptop-5.jpg` - Microsoft Surface Laptop 5
- `hp-envy-x360.jpg` - HP Envy x360
- `lenovo-yoga-9i.jpg` - Lenovo Yoga 9i
- `asus-zenbook-flip.jpg` - ASUS ZenBook Flip 14
- `lenovo-thinkpad-yoga.jpg` - Lenovo ThinkPad X1 Yoga Gen 8

## Supported Image Formats
- `.jpg` or `.jpeg`
- `.png`
- `.webp`

## Recommended Image Specifications
- **Resolution**: At least 800x600 pixels
- **Aspect Ratio**: 4:3 or 16:9
- **File Size**: Under 2MB per image
- **Quality**: High quality product photos with white or neutral background

## Where to Find Images

### Option 1: Free Stock Photos
- **Unsplash**: https://unsplash.com/s/photos/laptop
- **Pexels**: https://www.pexels.com/search/laptop/
- Search for specific laptop models on these sites

### Option 2: Manufacturer Websites
- Dell: https://www.dell.com
- Apple: https://www.apple.com
- HP: https://www.hp.com
- Lenovo: https://www.lenovo.com
- ASUS: https://www.asus.com
- MSI: https://www.msi.com
- Acer: https://www.acer.com
- Razer: https://www.razer.com
- Microsoft: https://www.microsoft.com

### Option 3: Product Review Sites
- **The Verge**: https://www.theverge.com
- **CNET**: https://www.cnet.com
- **TechRadar**: https://www.techradar.com

## Quick Start

1. Download or copy 24 laptop images to this directory
2. Rename them to match the filenames listed above
3. Run the script: `cd backend && node scripts/addSampleProducts.js`
4. The script will automatically upload them to Cloudinary

## What Happens If Images Are Missing?

If an image file is not found, the script will:
- Display a warning: `⚠️  No image file found: [filename], using placeholder`
- Upload a default blue placeholder with "Laptop Image" text
- Continue processing the remaining products

This way, you can add images gradually without the script failing.

## Example Commands

```bash
# Download an image (example)
curl -o dell-xps-15.jpg "https://example.com/laptop-image.jpg"

# Or use wget
wget -O macbook-pro-14.jpg "https://example.com/laptop-image.jpg"

# Check what images you have
ls -lh

# Run the script after adding images
cd ../..
node scripts/addSampleProducts.js
```

## Tips

- Use consistent naming convention
- Keep original aspect ratios
- Use high-quality images for better user experience
- Consider using images with transparent backgrounds
- Test with a few images first before adding all 24
