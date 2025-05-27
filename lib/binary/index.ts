const path = require('path');
const fs = require('fs');

function findBinary() {
  const possiblePaths = [
    path.join(__dirname, 'lz4.node'),  // Development path
    path.join(__dirname, '..', '..', 'lib', 'binary', 'lz4.node'),  // Source path
    path.join(__dirname, '..', 'binary', 'lz4.node'),  // Production path
    path.join(process.cwd(), 'node_modules', 'lz4-prebuilt', 'lib', 'binary', 'lz4.node')  // npm install path
  ];

  console.log('Current directory:', __dirname);
  console.log('Searching for binary in paths:');
  
  for (const binaryPath of possiblePaths) {
    console.log(`- Checking ${binaryPath}`);
    if (fs.existsSync(binaryPath)) {
      console.log(`Found binary at: ${binaryPath}`);
      try {
        const binary = require(binaryPath);
        if (binary && typeof binary.compress === 'function' && typeof binary.uncompress === 'function') {
          console.log('Successfully loaded binary module');
          return binary;
        } else {
          console.log('Binary exists but has unexpected format:', binary);
        }
      } catch (error: any) {
        console.log(`Error loading binary at ${binaryPath}:`, error?.message || 'Unknown error');
      }
    }
  }
  
  throw new Error(`Failed to find valid LZ4 binary module. Searched paths: ${possiblePaths.join(', ')}`);
}

try {
  const lz4Binary = findBinary();

  function safeCompress(input: Buffer): Buffer {
    if (!Buffer.isBuffer(input)) {
      throw new TypeError('Input must be a Buffer');
    }

    // Get the maximum compressed size
    const maxSize = lz4Binary.compressBound(input.length);
    
    // Create output buffer
    const output = Buffer.alloc(maxSize);
    
    try {
      // Compress the data directly
      const compressedSize = lz4Binary.compress(input, output);
      
      // Return only the used portion of the buffer
      return output.slice(0, compressedSize);
    } catch (error: any) {
      throw new Error(`Compression failed: ${error?.message || 'Unknown error'}`);
    }
  }

  function safeDecompress(input: Buffer, originalSize: number): Buffer {
    if (!Buffer.isBuffer(input)) {
      throw new TypeError('Input must be a Buffer');
    }

    if (originalSize < 0) {
      throw new Error('Invalid original size');
    }

    try {
      // Create output buffer based on the provided original size
      const output = Buffer.alloc(originalSize);
      
      // Decompress the data
      const decompressedSize = lz4Binary.uncompress(input, output);
      
      if (decompressedSize !== originalSize) {
        throw new Error(`Decompression failed: size mismatch (expected ${originalSize}, got ${decompressedSize})`);
      }

      return output;
    } catch (error: any) {
      throw new Error(`Decompression failed: ${error?.message || 'Unknown error'}`);
    }
  }

  module.exports = {
    encode: safeCompress,
    decode: safeDecompress,
    // Also export raw functions for compatibility
    compress: safeCompress,
    uncompress: safeDecompress
  };
} catch (error: any) {
  console.error('Fatal error loading LZ4 binary:', error?.message || 'Unknown error');
  throw error;
} 