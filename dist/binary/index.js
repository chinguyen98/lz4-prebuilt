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
    // Export the functions with our desired names
    module.exports = {
        encode: lz4Binary.compress,
        decode: lz4Binary.uncompress
    };
}
catch (error) {
    console.error('Fatal error loading LZ4 binary:', (error === null || error === void 0 ? void 0 : error.message) || 'Unknown error');
    throw error;
}
//# sourceMappingURL=index.js.map