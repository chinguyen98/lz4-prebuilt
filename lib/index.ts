import { encode, decode } from './binary/index.js';

export const LZ4Codec = {
  async compress(encoder: Buffer): Promise<Buffer> {
    return encode(encoder);
  },

  async decompress(buffer: Buffer): Promise<Buffer> {
    return decode(buffer);
  },
};

export default LZ4Codec; 