const path = require('path');

const binary = require('./lz4.node');

export const encode = binary.encode;
export const decode = binary.decode; 