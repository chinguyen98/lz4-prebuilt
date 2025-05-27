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
    
    // Create output buffer with some extra padding for safety
    const output = Buffer.alloc(maxSize + 8);
    
    try {
      // Write the original size at the start of the buffer
      output.writeUInt32LE(input.length, 0);
      
      // Compress the data after the size header
      const compressedSize = lz4Binary.compress(input, output.slice(8));
      
      // Write the compressed size
      output.writeUInt32LE(compressedSize, 4);
      
      // Return only the used portion of the buffer
      return output.slice(0, compressedSize + 8);
    } catch (error: any) {
      throw new Error(`Compression failed: ${error?.message || 'Unknown error'}`);
    }
  }

  function safeDecompress(input: Buffer): Buffer {
    if (!Buffer.isBuffer(input)) {
      throw new TypeError('Input must be a Buffer');
    }

    if (input.length < 8) {
      throw new Error('Invalid compressed data: too short');
    }

    try {
      // Read the original and compressed sizes
      const originalSize = input.readUInt32LE(0);
      const compressedSize = input.readUInt32LE(4);

      if (compressedSize > input.length - 8) {
        throw new Error('Invalid compressed data: size mismatch');
      }

      // Create output buffer
      const output = Buffer.alloc(originalSize);
      
      // Decompress the data
      const decompressedSize = lz4Binary.uncompress(input.slice(8), output);
      
      if (decompressedSize !== originalSize) {
        throw new Error('Decompression failed: size mismatch');
      }

      return output;
    } catch (error: any) {
      throw new Error(`Decompression failed: ${error?.message || 'Unknown error'}`);
    }
  }

  module.exports = {
    encode: safeCompress,
    decode: safeDecompress
  };
} catch (error: any) {
  console.error('Fatal error loading LZ4 binary:', error?.message || 'Unknown error');
  throw error;
} 