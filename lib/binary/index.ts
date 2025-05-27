import { join } from 'path';

const binary = require(join(__dirname, 'lz4.node'));

export const encode = binary.encode;
export const decode = binary.decode; 