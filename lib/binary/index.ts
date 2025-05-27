const lz4Binary = require('./lz4.node');

if (!lz4Binary || typeof lz4Binary.encode !== 'function' || typeof lz4Binary.decode !== 'function') {
  throw new Error('Failed to load LZ4 binary module');
}

module.exports = lz4Binary; 