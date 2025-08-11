#!/usr/bin/env ts-node

/**
 * One-shot script to compress existing greffes-index.json into efficient format
 * Usage: npm run compress-greffes
 */

import * as fs from 'fs';
import * as path from 'path';
import { compressGreffeData, validateCompression } from '../src/services/greffe-compressor';

const ASSETS_DIR = path.join(__dirname, '..', 'assets');
const INPUT_FILE = path.join(ASSETS_DIR, 'greffes-index.json');
const OUTPUT_FILE = path.join(ASSETS_DIR, 'greffes-index-compressed.json');

async function main() {
  console.log('🗜️  Compressing greffes-index.json...\n');

  // 1. Read original file
  console.log('📖 Reading original data...');
  if (!fs.existsSync(INPUT_FILE)) {
    console.error(`❌ Input file not found: ${INPUT_FILE}`);
    process.exit(1);
  }

  const originalData = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf-8'));
  const postalCodeMap = originalData.byCodePostal || originalData;
  
  console.log(`   Original entries: ${Object.keys(postalCodeMap).length}`);
  console.log(`   Original file size: ${(fs.statSync(INPUT_FILE).size / 1024).toFixed(1)} KB`);

  // 2. Compress data
  console.log('\n🔄 Compressing data...');
  const compressed = compressGreffeData(postalCodeMap);
  
  console.log(`   Ranges: ${compressed.ranges.length}`);
  console.log(`   Singles: ${Object.keys(compressed.singles).length}`);
  console.log(`   Compression ratio: ${compressed.metadata.compressionRatio}%`);

  // 3. Validate compression
  console.log('\n✅ Validating compression...');
  const validation = validateCompression(postalCodeMap, compressed);
  
  if (!validation.valid) {
    console.error(`❌ Validation failed:`);
    validation.errors.forEach(error => console.error(`   • ${error}`));
    process.exit(1);
  }
  
  console.log('   ✓ All lookups match original data');

  // 4. Write compressed file
  console.log('\n💾 Writing compressed file...');
  const compressedJson = JSON.stringify(compressed, null, 2);
  fs.writeFileSync(OUTPUT_FILE, compressedJson);
  
  const newSize = fs.statSync(OUTPUT_FILE).size;
  const originalSize = fs.statSync(INPUT_FILE).size;
  const realCompressionRatio = ((originalSize - newSize) / originalSize) * 100;
  
  console.log(`   Output file: ${OUTPUT_FILE}`);
  console.log(`   New file size: ${(newSize / 1024).toFixed(1)} KB`);
  console.log(`   Real compression: ${realCompressionRatio.toFixed(1)}% reduction`);

  // 5. Test sample lookups
  console.log('\n🧪 Testing sample lookups...');
  const testCodes = ['75001', '13001', '69001', '10001', '00000'];
  
  testCodes.forEach(code => {
    const originalResult = postalCodeMap[code] || null;
    const compressedResult = findGreffeInCompressedData(code, compressed);
    const status = originalResult === compressedResult ? '✓' : '❌';
    console.log(`   ${status} ${code}: ${originalResult || 'null'}`);
  });

  console.log('\n🎉 Compression completed successfully!');
  console.log(`\n📊 Summary:`);
  console.log(`   Data reduction: ${compressed.metadata.originalSize} → ${compressed.metadata.compressedSize} entries`);
  console.log(`   File size: ${(originalSize/1024).toFixed(1)} → ${(newSize/1024).toFixed(1)} KB`);
  console.log(`   Space saved: ${((originalSize - newSize)/1024).toFixed(1)} KB`);
}

// Import the lookup function for testing
function findGreffeInCompressedData(postalCode: string, data: any): string | null {
  // This duplicates the logic from greffe-compressor for standalone script
  if (!postalCode) return null;

  // Check singles first
  const singleResult = data.singles[postalCode];
  if (singleResult) return singleResult;

  // Binary search through ranges
  const ranges = data.ranges;
  let left = 0;
  let right = ranges.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const range = ranges[mid];

    if (postalCode >= range.start && postalCode <= range.end) {
      return range.greffe;
    }

    if (postalCode < range.start) {
      right = mid - 1;
    } else {
      left = mid + 1;
    }
  }

  return null;
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Compression failed:', error);
    process.exit(1);
  });
}