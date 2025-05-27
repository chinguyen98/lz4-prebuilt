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

  // Kafka LZ4 Message Format constants
  const KAFKA_LZ4_MAGIC = 0x184D2204;
  const KAFKA_LZ4_HEADER_SIZE = 8; // 4 bytes magic + 4 bytes size

  function dumpBuffer(buffer: Buffer, offset: number, length: number) {
    const bytes = [];
    for (let i = offset; i < offset + length && i < buffer.length; i++) {
      bytes.push(buffer[i].toString(16).padStart(2, '0'));
    }
    return bytes.join(' ');
  }

  function safeCompress(input: Buffer): Buffer {
    if (!Buffer.isBuffer(input)) {
      throw new TypeError('Input must be a Buffer');
    }

    // Get the maximum compressed size
    const maxSize = lz4Binary.compressBound(input.length);
    
    // Create output buffer with space for Kafka LZ4 header
    const output = Buffer.alloc(maxSize + KAFKA_LZ4_HEADER_SIZE);
    
    try {
      // Write Kafka LZ4 header (little-endian)
      output.writeUInt32LE(KAFKA_LZ4_MAGIC, 0); // Magic number
      output.writeUInt32LE(input.length, 4);    // Original size
      
      // Compress the data after the header
      const compressedSize = lz4Binary.compress(input, output.slice(KAFKA_LZ4_HEADER_SIZE));
      
      // Return only the used portion of the buffer
      return output.slice(0, compressedSize + KAFKA_LZ4_HEADER_SIZE);
    } catch (error: any) {
      throw new Error(`Compression failed: ${error?.message || 'Unknown error'}`);
    }
  }

  function safeDecompress(input: Buffer): Buffer {
    if (!Buffer.isBuffer(input)) {
      throw new TypeError('Input must be a Buffer');
    }

    console.log(`[LZ4] Decompressing buffer of size ${input.length} bytes`);
    console.log(`[LZ4] First 16 bytes: ${dumpBuffer(input, 0, 16)}`);

    try {
      if (input.length < KAFKA_LZ4_HEADER_SIZE) {
        throw new Error('Input too short to contain Kafka LZ4 header');
      }

      // Read and verify Kafka LZ4 header (little-endian)
      const magic = input.readUInt32LE(0);
      console.log(`[LZ4] Magic number: 0x${magic.toString(16)}`);
      
      if (magic !== KAFKA_LZ4_MAGIC) {
        console.log(`[LZ4] Warning: Invalid magic number, trying raw LZ4`);
        return decompressRawLZ4(input);
      }

      // Try different ways to read the size
      const size1 = input.readUInt32LE(4);
      const size2 = input.readInt32LE(4);
      const size3 = input[4] | (input[5] << 8) | (input[6] << 16) | (input[7] << 24);
      
      console.log(`[LZ4] Possible sizes: uint32=${size1}, int32=${size2}, manual=${size3}`);
      
      // Use a reasonable size limit (64MB)
      const maxReasonableSize = 64 * 1024 * 1024;
      let originalSize = size1;
      
      if (size1 > maxReasonableSize && size2 > 0 && size2 < maxReasonableSize) {
        originalSize = size2;
      } else if (size1 > maxReasonableSize && size3 > 0 && size3 < maxReasonableSize) {
        originalSize = size3;
      }

      console.log(`[LZ4] Using size: ${originalSize} bytes`);

      // Create output buffer
      const output = Buffer.alloc(originalSize);
      
      // Skip header and decompress
      const compressedData = input.slice(KAFKA_LZ4_HEADER_SIZE);
      console.log(`[LZ4] Compressed data starts with: ${dumpBuffer(compressedData, 0, 8)}`);
      
      const decompressedSize = lz4Binary.uncompress(compressedData, output);
      
      if (decompressedSize !== originalSize) {
        throw new Error(`Size mismatch: expected ${originalSize}, got ${decompressedSize}`);
      }

      return output;
    } catch (error: any) {
      throw new Error(`Decompression failed: ${error?.message || 'Unknown error'}`);
    }
  }

  function decompressRawLZ4(input: Buffer): Buffer {
    // Try progressive buffer sizes for raw LZ4 data
    const maxAttempts = 10;
    let size = Math.max(input.length * 4, 64 * 1024);
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      console.log(`[LZ4] Raw decompression attempt ${attempt + 1}/${maxAttempts} with buffer size: ${size} bytes`);
      
      try {
        const output = Buffer.alloc(size);
        const decompressedSize = lz4Binary.uncompress(input, output);
        
        if (decompressedSize > 0 && decompressedSize <= size) {
          console.log(`[LZ4] Successfully decompressed ${decompressedSize} bytes`);
          return output.slice(0, decompressedSize);
        }
        console.log(`[LZ4] Invalid decompressed size: ${decompressedSize}`);
      } catch (err: any) {
        console.log(`[LZ4] Attempt failed: ${err?.message || 'Unknown error'}`);
        if (attempt === maxAttempts - 1) throw err;
      }
      
      size = Math.min(size * 2, 256 * 1024 * 1024);
    }
    
    throw new Error('Failed to decompress raw LZ4 data');
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