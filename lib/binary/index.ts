const path = require('path');

declare const lz4Binary: {
  encode: (input: Buffer) => Buffer;
  decode: (input: Buffer) => Buffer;
};

const binary = require('./lz4.node') as typeof lz4Binary;

export const encode = binary.encode;
export const decode = binary.decode;

// For CommonJS compatibility
module.exports = {
  encode: binary.encode,
  decode: binary.decode
}; 