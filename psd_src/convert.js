const fs = require('fs').promises;
const path = require('path');
const { PNG } = require('pngjs');
const { initializeCanvas, readPsd } = require('ag-psd');

function createImageData(width, height) {
  return {
    width,
    height,
    data: new Uint8ClampedArray(width * height * 4),
  };
}

// ag-psd requires canvas initialization in Node.js. For this script we only
// need ImageData, so we provide a minimal shim and skip thumbnail decoding.
initializeCanvas(
  (width, height) => ({
    width,
    height,
    getContext() {
      return {
        createImageData,
      };
    },
  }),
  undefined,
  createImageData
);

function imageDataToPngBuffer(imageData) {
  if (!imageData || !imageData.data) {
    throw new Error('Invalid image data');
  }

  const png = new PNG({ width: imageData.width, height: imageData.height });
  const src = imageData.data;
  const dst = png.data;

  if (src instanceof Uint8ClampedArray || src instanceof Uint8Array) {
    dst.set(src);
  } else if (src instanceof Uint16Array) {
    for (let i = 0; i < src.length; i++) {
      dst[i] = src[i] >>> 8;
    }
  } else if (src instanceof Float32Array) {
    for (let i = 0; i < src.length; i++) {
      const value = Math.round(src[i] * 255);
      dst[i] = Math.max(0, Math.min(255, value));
    }
  } else {
    throw new Error(`Unsupported image data array type: ${src.constructor?.name || typeof src}`);
  }

  return PNG.sync.write(png);
}

const PSD_SRC_DIR = __dirname;
const OUTPUT_BASE_DIR = path.join(PSD_SRC_DIR, '..', 'assets', 'scenes');

/**
 * Sanitize layer name to make it safe for file paths
 */
function sanitizeLayerName(name) {
  if (!name) return 'unnamed';
  
  return name
    .replace(/[\\\/]/g, '-')        // Replace \ and / with -
    .replace(/\.\./g, '--')           // Replace .. with --
    .replace(/[<>:"|?*]/g, '_')       // Replace other illegal Windows chars with _
    .replace(/^\s+|\s+$/g, '')        // Trim whitespace
    .replace(/^\.|\.$/, '_')          // Replace leading/trailing dots
    .replace(/\s+/g, '_')             // Replace spaces with _
    || 'unnamed';                      // Fallback if empty after sanitization
}

/**
 * Get all PSD files from subdirectories
 */
async function getPsdFiles() {
  const psdFiles = [];
  const entries = await fs.readdir(PSD_SRC_DIR, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory() && entry.name !== 'node_modules' && (entry.name !== "Cutscenes")) {
      const folderPath = path.join(PSD_SRC_DIR, entry.name);
      const files = await fs.readdir(folderPath);

      for (const file of files) {
        if (file.toLowerCase().endsWith('.psd')) {
          psdFiles.push({
            name: file,
            path: path.join(folderPath, file),
            category: entry.name,
            isLayerless: entry.name === 'CG', // Mark CG folder for special handling
          });
        }
      }
    }
  }

  return psdFiles;
}

/**
 * Build layer hierarchy from PSD
 */
function buildLayerHierarchy(psd, category) {
  function processLayer(layer, parentPath = '') {
    const sanitizedName = sanitizeLayerName(layer.name);
    const layerData = {
      name: layer.name,
      visible: layer.visible !== false,
    //   blendMode: layer.blendMode || 'normal',
    };

    if(layer.opacity !== undefined && layer.opacity !== 1) {
        layerData.opacity = layer.opacity;
    }

    if (parentPath) {
      layerData.path = `${parentPath}-${sanitizedName}`;
    } else {
      layerData.path = sanitizedName;
    }

    const isPortrait = category === 'Portraits';

    // Add position if available
    if (layer.left !== undefined && layer.top !== undefined) {
      if (isPortrait) {
        layerData.left = 0;
        layerData.top = 0;
      } else {
        layerData.left = layer.left;
        layerData.top = layer.top;
      }
    }
    if (layer.imageData !== undefined) {
      if (isPortrait) {
        layerData.width = 640;
        layerData.height = 480;
      } else {
        layerData.width = layer.imageData.width;
        layerData.height = layer.imageData.height;
      }
    }

    // Process children (groups/folders)
    if (layer.children && layer.children.length > 0) {
      layerData.children = layer.children
        .map(child => processLayer(child, layerData.path))
        .filter(child => child !== null);
    }

    return layerData;
  }

  const hierarchy = {
    name: psd.name,
    children: psd.children
      ? psd.children.map(layer => processLayer(layer)).filter(l => l !== null)
      : [],
  };

  return hierarchy;
}

/**
 * Export layers as PNG files
 */
async function exportLayers(psd, outputDir, category) {
  let layerCount = 0;

  async function exportLayer(layer, parentPath = '') {
    if (!layer) return;

    const sanitizedName = sanitizeLayerName(layer.name);
    const layerPath = parentPath ? `${parentPath}/${sanitizedName}` : sanitizedName;

    // Export layer as PNG if it's a visible layer with content
    if (layer.type !== 'group' && layer.visible !== false) {
      try {
        // Get layer image content
        if (layer.imageData || layer.canvas) {
          // Use group path in filename to avoid duplicates
          const fileName = parentPath ? `${parentPath.replace(/\//g, '-')}-${sanitizedName}.png` : `${sanitizedName}.png`;
          const filePath = path.join(outputDir, fileName);
          
          let buffer;
          const isPortrait = category === 'Portraits';
          if (isPortrait && layer.imageData) {
            const paddedImageData = createImageData(640, 480);
            const src = layer.imageData.data;
            const dst = paddedImageData.data;
            
            const srcWidth = layer.imageData.width;
            const srcHeight = layer.imageData.height;
            const left = layer.left || 0;
            const top = layer.top || 0;
            
            for (let y = 0; y < srcHeight; y++) {
              for (let x = 0; x < srcWidth; x++) {
                const dstX = left + x;
                const dstY = top + y;
                
                if (dstX >= 0 && dstX < 640 && dstY >= 0 && dstY < 480) {
                  const srcIdx = (y * srcWidth + x) * 4;
                  const dstIdx = (dstY * 640 + dstX) * 4;
                  
                  dst[dstIdx] = src[srcIdx];
                  dst[dstIdx + 1] = src[srcIdx + 1];
                  dst[dstIdx + 2] = src[srcIdx + 2];
                  dst[dstIdx + 3] = src[srcIdx + 3];
                }
              }
            }
            buffer = imageDataToPngBuffer(paddedImageData);
          } else {
            buffer = layer.imageData
              ? imageDataToPngBuffer(layer.imageData)
              : layer.canvas.toBuffer('image/png');
          }
          await fs.writeFile(filePath, buffer);

          layerCount++;
          console.log(`  ✓ Exported: ${layerPath}`);
        } else {
          console.log(`  ⚠ Skipped: ${layerPath} (no canvas data)`);
        }
      } catch (error) {
        console.log(`  ⚠ Skipped: ${layerPath} (${error.message})`);
      }
    }

    // Recursively process children
    if (layer.children && layer.children.length > 0) {
      for (const child of layer.children) {
        await exportLayer(child, layerPath);
      }
    }
  }

  // Export all layers
  if (psd.children) {
    for (const layer of psd.children) {
      await exportLayer(layer);
    }
  }

  return layerCount;
}

/**
 * Export entire PSD as a single PNG image
 */
async function exportPsdAsImage(psd, psdFileName, outputDir) {
  try {
    if (!psd.imageData && !psd.canvas) {
      console.log(`  ⚠ Skipped: No image data available`);
      return false;
    }

    const psdNameWithoutExt = path.parse(psdFileName).name;
    const fileName = `${psdNameWithoutExt}.png`;
    const filePath = path.join(outputDir, fileName);
    const buffer = psd.imageData
      ? imageDataToPngBuffer(psd.imageData)
      : psd.canvas.toBuffer('image/png');
    await fs.writeFile(filePath, buffer);

    console.log(`✓ Rendered: ${fileName}`);
    return true;
  } catch (error) {
    console.log(`  ⚠ Skipped: ${error.message}`);
    return false;
  }
}

/**
 * Process a single PSD file
 */
async function processPsd(psdFile) {
  console.log(`\n📄 Processing: ${psdFile.name}`);
  console.log(`   Category: ${psdFile.category}`);

  try {
    // Read PSD file
    const psdBuffer = await fs.readFile(psdFile.path);
    const psd = readPsd(psdBuffer, {
      useImageData: true,
      skipThumbnail: true,
    });

    // Create output directory structure
    const psdNameWithoutExt = path.parse(psdFile.name).name;
    const outputDir = path.join(OUTPUT_BASE_DIR, psdFile.category, psdNameWithoutExt);
    await fs.mkdir(outputDir, { recursive: true });

    // Handle CG files: render entire PSD as image
    if (psdFile.isLayerless) {
      const success = await exportPsdAsImage(psd, psdFile.name, outputDir);
    // const success = true; // Temporarily disabled
      return { success, psdFile, outputDir, layerCount: success ? 1 : 0 };
    }

    // For other files: Generate layer hierarchy and export layers
    const hierarchy = buildLayerHierarchy(psd, psdFile.category);

    // Save JSON file
    const jsonPath = path.join(outputDir, `${psdNameWithoutExt}.json`);
    await fs.writeFile(jsonPath, JSON.stringify(hierarchy, null));
    console.log(`✓ JSON saved: ${path.relative(PSD_SRC_DIR, jsonPath)}`);

    // Export layers as PNG
    const layerCount = await exportLayers(psd, outputDir, psdFile.category);
    console.log(`✓ Exported ${layerCount} layers`);
    // const layerCount = 0; // Temporarily disabled

    return { success: true, psdFile, outputDir, layerCount };
  } catch (error) {
    console.error(`✗ Error processing ${psdFile.name}:`, error.message);
    return { success: false, psdFile, error: error.message };
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 PSD Converter Starting...');
  console.log(`📁 Source: ${PSD_SRC_DIR}`);
  console.log(`📁 Output: ${OUTPUT_BASE_DIR}`);

  try {
    // Create output base directory
    await fs.mkdir(OUTPUT_BASE_DIR, { recursive: true });

    // Get all PSD files
    const psdFiles = await getPsdFiles();
    console.log(`\n🔍 Found ${psdFiles.length} PSD files\n`);

    if (psdFiles.length === 0) {
      console.warn('⚠️  No PSD files found');
      return;
    }

    // Process each PSD file
    const results = [];
    for (const psdFile of psdFiles) {
      const result = await processPsd(psdFile);
      results.push(result);
    }

    // Summary
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log('\n' + '='.repeat(50));
    console.log(`✅ Summary: ${successful} succeeded, ${failed} failed`);
    console.log(`📦 Total layers exported: ${results.reduce((sum, r) => sum + (r.layerCount || 0), 0)}`);
    console.log('='.repeat(50));
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = { processPsd, getPsdFiles, buildLayerHierarchy, exportLayers };
