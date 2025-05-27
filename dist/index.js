"use strict";
const lz4Module = require('./binary');
/**
 * @typedef {Object} LZ4Codec
 * @property {(input: Buffer) => Promise<Buffer>} compress - Compress data using LZ4
 * @property {(input: Buffer) => Promise<Buffer>} decompress - Decompress LZ4 data
 */
/** @type {LZ4Codec} */
const LZ4Codec = {
    async compress(input) {
        if (!Buffer.isBuffer(input)) {
            throw new TypeError('Input must be a Buffer');
        }
        return lz4Module.encode(input);
    },
    async decompress(input) {
        if (!Buffer.isBuffer(input)) {
            throw new TypeError('Input must be a Buffer');
        }
        return lz4Module.decode(input);
    }
};
module.exports = LZ4Codec;
module.exports.LZ4Codec = LZ4Codec;
module.exports.default = LZ4Codec;
//# sourceMappingURL=index.js.map