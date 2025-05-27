const lz4Module = require('./binary');

const LZ4Codec = {
  async compress(encoder: Buffer): Promise<Buffer> {
    return lz4Module.encode(encoder);
  },

  async decompress(buffer: Buffer): Promise<Buffer> {
    return lz4Module.decode(buffer);
  },
};

module.exports = LZ4Codec;
module.exports.default = LZ4Codec;
module.exports.LZ4Codec = LZ4Codec; 