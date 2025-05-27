import { join } from 'path';
import { fileURLToPath } from 'url';
const __dirname = fileURLToPath(new URL('.', import.meta.url));
const binary = require(join(__dirname, 'lz4.node'));
export const encode = binary.encode;
export const decode = binary.decode;
