import { encode, decode } from './binary/index.js';
export const LZ4Codec = {
    async compress(encoder) {
        return encode(encoder);
    },
    async decompress(buffer) {
        return decode(buffer);
    },
};
export default LZ4Codec;
