import { encode, decode } from './binary';

export interface ILZ4Codec {
  compress(encoder: Buffer): Promise<Buffer>;
  decompress(buffer: Buffer): Promise<Buffer>;
}

export const LZ4Codec: ILZ4Codec = {
  async compress(encoder: Buffer): Promise<Buffer> {
    return encode(encoder);
  },

  async decompress(buffer: Buffer): Promise<Buffer> {
    return decode(buffer);
  },
};

export default LZ4Codec;

// For CommonJS compatibility
module.exports = LZ4Codec;
module.exports.default = LZ4Codec;
module.exports.LZ4Codec = LZ4Codec; 