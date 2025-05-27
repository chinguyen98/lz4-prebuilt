"use strict";
const path = require('path');
const fs = require('fs');
function findBinary() {
    const possiblePaths = [
        path.join(__dirname, 'lz4.node'), // Development path
        path.join(__dirname, '..', '..', 'lib', 'binary', 'lz4.node'), // Source path
        path.join(__dirname, '..', 'binary', 'lz4.node'), // Production path
        path.join(process.cwd(), 'node_modules', 'lz4-prebuilt', 'lib', 'binary', 'lz4.node') // npm install path
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
                }
                else {
                    console.log('Binary exists but has unexpected format:', binary);
                }
            }
            catch (error) {
                console.log(`Error loading binary at ${binaryPath}:`, (error === null || error === void 0 ? void 0 : error.message) || 'Unknown error');
            }
        }
    }
    throw new Error(`Failed to find valid LZ4 binary module. Searched paths: ${possiblePaths.join(', ')}`);
}
try {
    const lz4Binary = findBinary();
    function safeCompress(input) {
        if (!Buffer.isBuffer(input)) {
            throw new TypeError('Input must be a Buffer');
        }
        // Get the maximum compressed size
        const maxSize = lz4Binary.compressBound(input.length);
        // Create output buffer
        const output = Buffer.alloc(maxSize);
        try {
            // Compress the data directly as raw LZ4 block
            const compressedSize = lz4Binary.compress(input, output);
            // Return only the used portion of the buffer
            return output.slice(0, compressedSize);
        }
        catch (error) {
            throw new Error(`Compression failed: ${(error === null || error === void 0 ? void 0 : error.message) || 'Unknown error'}`);
        }
    }
    function safeDecompress(input, providedSize) {
        if (!Buffer.isBuffer(input)) {
            throw new TypeError('Input must be a Buffer');
        }
        console.log(`[LZ4] Decompressing buffer of size ${input.length} bytes${providedSize ? `, expected size: ${providedSize} bytes` : ''}`);
        try {
            // First, try with provided size if available
            if (typeof providedSize === 'number' && providedSize > 0) {
                console.log(`[LZ4] Attempting decompression with provided size: ${providedSize} bytes`);
                try {
                    const output = Buffer.alloc(providedSize);
                    const decompressedSize = lz4Binary.uncompress(input, output);
                    if (decompressedSize === providedSize) {
                        console.log(`[LZ4] Successfully decompressed with provided size: ${decompressedSize} bytes`);
                        return output;
                    }
                    console.log(`[LZ4] Size mismatch with provided size: expected ${providedSize}, got ${decompressedSize}`);
                }
                catch (err) {
                    console.log(`[LZ4] Failed with provided size: ${(err === null || err === void 0 ? void 0 : err.message) || 'Unknown error'}`);
                }
            }
            // If no size provided or size doesn't match, try progressive sizing
            const maxAttempts = 10;
            let size = Math.max(input.length * 8, 64 * 1024); // Start with 8x compressed size or 64KB minimum
            for (let attempt = 0; attempt < maxAttempts; attempt++) {
                console.log(`[LZ4] Attempt ${attempt + 1}/${maxAttempts} with buffer size: ${size} bytes`);
                try {
                    const output = Buffer.alloc(size);
                    const decompressedSize = lz4Binary.uncompress(input, output);
                    if (decompressedSize > 0 && decompressedSize <= size) {
                        console.log(`[LZ4] Successfully decompressed ${decompressedSize} bytes on attempt ${attempt + 1}`);
                        return output.slice(0, decompressedSize);
                    }
                    console.log(`[LZ4] Attempt ${attempt + 1} returned invalid size: ${decompressedSize}`);
                }
                catch (err) {
                    console.log(`[LZ4] Attempt ${attempt + 1} failed: ${(err === null || err === void 0 ? void 0 : err.message) || 'Unknown error'}`);
                    // If we get a buffer bounds error, the buffer might be too small
                    if (attempt === maxAttempts - 1) {
                        throw new Error(`Decompression failed after ${maxAttempts} attempts with max buffer size ${size}: ${(err === null || err === void 0 ? void 0 : err.message) || 'Unknown error'}`);
                    }
                }
                // Use a more aggressive growth factor for large inputs
                const growthFactor = input.length > 1024 * 1024 ? 4 : 2;
                size = Math.min(size * growthFactor, 256 * 1024 * 1024); // Cap at 256MB
            }
            throw new Error(`Failed to decompress after ${maxAttempts} attempts with sizes up to ${size} bytes`);
        }
        catch (error) {
            throw new Error(`Decompression failed: ${(error === null || error === void 0 ? void 0 : error.message) || 'Unknown error'}`);
        }
    }
    module.exports = {
        encode: safeCompress,
        decode: safeDecompress,
        // Also export raw functions for compatibility
        compress: safeCompress,
        uncompress: safeDecompress
    };
}
catch (error) {
    console.error('Fatal error loading LZ4 binary:', (error === null || error === void 0 ? void 0 : error.message) || 'Unknown error');
    throw error;
}
//# sourceMappingURL=index.js.map