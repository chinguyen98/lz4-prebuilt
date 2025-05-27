"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decode = exports.encode = void 0;
const path_1 = require("path");
const binary = require((0, path_1.join)(__dirname, 'lz4.node'));
exports.encode = binary.encode;
exports.decode = binary.decode;
