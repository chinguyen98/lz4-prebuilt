"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LZ4Codec = void 0;
const binary_1 = require("./binary");
exports.LZ4Codec = {
    async compress(encoder) {
        return (0, binary_1.encode)(encoder);
    },
    async decompress(buffer) {
        return (0, binary_1.decode)(buffer);
    },
};
exports.default = exports.LZ4Codec;
// For CommonJS compatibility
module.exports = exports.LZ4Codec;
module.exports.default = exports.LZ4Codec;
module.exports.LZ4Codec = exports.LZ4Codec;
//# sourceMappingURL=index.js.map