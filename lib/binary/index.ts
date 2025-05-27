const path = require('path');
const fs = require('fs');

function findBinary() {
  const possiblePaths = [
    path.join(__dirname, 'lz4.node'),  // Development path
    path.join(__dirname, '..', '..', 'lib', 'binary', 'lz4.node'),  // Source path
    path.join(__dirname, '..', 'binary', 'lz4.node')  // Production path
  ];

  for (const binaryPath of possiblePaths) {
    if (fs.existsSync(binaryPath)) {
      return binaryPath;
    }
  }
  
  throw new Error(`Failed to find LZ4 binary module. Searched paths: ${possiblePaths.join(', ')}`);
}

const binaryPath = findBinary();
const lz4Binary = require(binaryPath);

if (!lz4Binary || typeof lz4Binary.encode !== 'function' || typeof lz4Binary.decode !== 'function') {
  throw new Error('Failed to load LZ4 binary module - invalid module format');
}

module.exports = lz4Binary; 