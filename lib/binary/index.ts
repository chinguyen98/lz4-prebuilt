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

  // Wrap the binary functions to ensure proper argument handling
  module.exports = {
    encode: function(input: Buffer): Buffer {
      if (!Buffer.isBuffer(input)) {
        throw new TypeError('Input must be a Buffer');
      }
      // Get the maximum compressed size
      const maxSize = lz4Binary.compressBound(input.length);
      // Create output buffer
      const output = Buffer.alloc(maxSize);
      // Compress the data
      const compressedSize = lz4Binary.compress(input, output);
      // Return only the compressed portion
      return output.slice(0, compressedSize);
    },
    decode: function(input: Buffer): Buffer {
      if (!Buffer.isBuffer(input)) {
        throw new TypeError('Input must be a Buffer');
      }
      // For decompression, we need to know the original size
      // Try to decompress with increasing buffer sizes
      let size = input.length * 2;  // Start with 2x the compressed size
      let maxAttempts = 5;  // Prevent infinite loops
      
      while (maxAttempts > 0) {
        try {
          const output = Buffer.alloc(size);
          const decompressedSize = lz4Binary.uncompress(input, output);
          return output.slice(0, decompressedSize);
        } catch (error: any) {
          if (error.message === 'Wrong arguments' && maxAttempts > 1) {
            size *= 2;  // Double the size and try again
            maxAttempts--;
            continue;
          }
          throw error;
        }
      }
      throw new Error('Failed to decompress data: output buffer too small');
    }
  };
} catch (error: any) {
  console.error('Fatal error loading LZ4 binary:', error?.message || 'Unknown error');
  throw error;
} 