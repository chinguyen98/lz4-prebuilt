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
    // LZ4 Frame constants
    const MAGIC_NUMBER = 0x184D2204;
    const FRAME_HEADER_SIZE = 7;
    const SIZE_FIELD_OFFSET = 6;
    const CONTENT_SIZE_PRESENT = 0x01;
    function readFrameHeader(input) {
        if (input.length < FRAME_HEADER_SIZE) {
            throw new Error('Input too short to contain LZ4 frame header');
        }
        const magic = input.readUInt32LE(0);
        if (magic !== MAGIC_NUMBER) {
            throw new Error('Invalid LZ4 frame magic number');
        }
        const flg = input[4];
        const hasContentSize = (flg & CONTENT_SIZE_PRESENT) !== 0;
        let contentSize;
        if (hasContentSize) {
            if (input.length < 15) { // Header + 8 byte size
                throw new Error('Input too short to contain content size');
            }
            // Read 8-byte content size
            contentSize = Number(input.readBigUInt64LE(7));
        }
        return { hasContentSize, contentSize };
    }
    function safeCompress(input) {
        if (!Buffer.isBuffer(input)) {
            throw new TypeError('Input must be a Buffer');
        }
        // Get the maximum compressed size
        const maxSize = lz4Binary.compressBound(input.length);
        // Create output buffer with space for frame
        const output = Buffer.alloc(maxSize + 15); // Frame header + content size
        try {
            // Write LZ4 frame header
            output.writeUInt32LE(MAGIC_NUMBER, 0);
            output.writeUInt8(CONTENT_SIZE_PRESENT, 4); // FLG byte
            output.writeUInt8(0x00, 5); // BD byte
            output.writeUInt8(0x00, 6); // HC byte
            output.writeBigUInt64LE(BigInt(input.length), 7); // Content size
            // Compress the data after the frame header
            const compressedSize = lz4Binary.compress(input, output.slice(15));
            // Return only the used portion of the buffer
            return output.slice(0, compressedSize + 15);
        }
        catch (error) {
            throw new Error(`Compression failed: ${(error === null || error === void 0 ? void 0 : error.message) || 'Unknown error'}`);
        }
    }
    function safeDecompress(input, providedSize) {
        if (!Buffer.isBuffer(input)) {
            throw new TypeError('Input must be a Buffer');
        }
        try {
            let originalSize;
            if (typeof providedSize === 'number' && providedSize >= 0) {
                originalSize = providedSize;
            }
            else {
                // Try to read size from frame header
                const frameInfo = readFrameHeader(input);
                if (!frameInfo.hasContentSize || typeof frameInfo.contentSize !== 'number') {
                    throw new Error('Content size not available in frame header');
                }
                originalSize = frameInfo.contentSize;
            }
            // Create output buffer
            const output = Buffer.alloc(originalSize);
            // Skip frame header for decompression
            const compressedData = input.slice(15);
            // Decompress the data
            const decompressedSize = lz4Binary.uncompress(compressedData, output);
            if (decompressedSize !== originalSize) {
                throw new Error(`Decompression failed: size mismatch (expected ${originalSize}, got ${decompressedSize})`);
            }
            return output;
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