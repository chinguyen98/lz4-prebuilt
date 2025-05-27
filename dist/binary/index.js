"use strict";
const path = require('path');
const lz4Binary = require('./lz4.node');
module.exports = {
    encode: lz4Binary.encode,
    decode: lz4Binary.decode
};
