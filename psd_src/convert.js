const fs = require('fs').promises;
const path = require('path');
const { Canvas } = require('canvas');
require('ag-psd/initialize-canvas');
const { readPsd } = require('ag-psd');

const PSD_SRC_DIR = __dirname;
const OUTPUT_BASE_DIR = path.join(PSD_SRC_DIR, '..', 'scenes');

/**
 * Get all PSD files from subdirectories
 */
async function getPsdFiles() {
  const psdFiles = [];
  const entries = await fs.readdir(PSD_SRC_DIR, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory() && entry.name !== 'node_modules') { // && entry.name == 'BG') {
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
function buildLayerHierarchy(psd) {
  function processLayer(layer, parentPath = '') {
    const layerData = {
      name: layer.name,
      visible: layer.visible !== false,
    //   blendMode: layer.blendMode || 'normal',
    };

    if(layer.opacity !== undefined && layer.opacity !== 1) {
        layerData.opacity = layer.opacity;
    }

    if (parentPath) {
      layerData.path = `${parentPath}-${layer.name}`;
    } else {
      layerData.path = layer.name;
    }

    // // Add dimensions if available
    // if (layer.width !== undefined && layer.height !== undefined) {
    //   layerData.width = layer.width;
    //   layerData.height = layer.height;
    // }

    // Add position if available
    if (layer.left !== undefined && layer.top !== undefined) {
      layerData.left = layer.left;
      layerData.top = layer.top;
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
 * Export layers as WebP files
 */
async function exportLayers(psd, psdFileName, outputDir) {
  let layerCount = 0;

  async function exportLayer(layer, parentPath = '') {
    if (!layer) return;

    const layerPath = parentPath ? `${parentPath}/${layer.name}` : layer.name;

    // Export layer as WebP if it's a visible layer with content
    if (layer.type !== 'group' && layer.visible !== false) {
      try {
        // Get layer canvas
        if (layer.canvas) {
          // Use group path in filename to avoid duplicates
          const fileName = parentPath ? `${parentPath.replace(/\//g, '-')}-${layer.name}.png` : `${layer.name}.png`;
          const filePath = path.join(outputDir, fileName);
          const buffer = layer.canvas.toBuffer('image/png');
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
 * Export entire PSD as a single WebP image
 */
async function exportPsdAsImage(psd, psdFileName, outputDir) {
  try {
    if (!psd.canvas) {
      console.log(`  ⚠ Skipped: No canvas data available`);
      return false;
    }

    const psdNameWithoutExt = path.parse(psdFileName).name;
    const fileName = `${psdNameWithoutExt}.png`;
    const filePath = path.join(outputDir, fileName);
    const buffer = psd.canvas.toBuffer('image/png');
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
    const psd = readPsd(psdBuffer);

    // Create output directory structure
    const psdNameWithoutExt = path.parse(psdFile.name).name;
    const outputDir = path.join(OUTPUT_BASE_DIR, psdFile.category, psdNameWithoutExt);
    await fs.mkdir(outputDir, { recursive: true });

    // Handle CG files: render entire PSD as image
    if (psdFile.isLayerless) {
    //   const success = await exportPsdAsImage(psd, psdFile.name, outputDir);
    const success = true; // Temporarily disabled
      return { success, psdFile, outputDir, layerCount: success ? 1 : 0 };
    }

    // For other files: Generate layer hierarchy and export layers
    const hierarchy = buildLayerHierarchy(psd);

    // Save JSON file
    const jsonPath = path.join(outputDir, `${psdNameWithoutExt}.json`);
    await fs.writeFile(jsonPath, JSON.stringify(hierarchy, null));
    console.log(`✓ JSON saved: ${path.relative(PSD_SRC_DIR, jsonPath)}`);

    // Export layers as PNG
    // const layerCount = await exportLayers(psd, psdFile.name, outputDir);
    // console.log(`✓ Exported ${layerCount} layers`);
    const layerCount = 0; // Temporarily disabled

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
