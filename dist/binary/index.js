"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decode = exports.encode = void 0;
const path = require('path');
const binary = require('./lz4.node');
exports.encode = binary.encode;
exports.decode = binary.decode;
// For CommonJS compatibility
module.exports = {
    encode: binary.encode,
    decode: binary.decode
};
//# sourceMappingURL=index.js.map