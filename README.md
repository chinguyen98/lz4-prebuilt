# lz4-prebuilt

A Node.js package providing LZ4 compression with prebuilt binaries for easy installation and use.

## Installation

```bash
npm install lz4-prebuilt
# or
yarn add lz4-prebuilt
```

## Usage

```typescript
import { compress, decompress } from 'lz4-prebuilt';

// Compress data
const data = Buffer.from('Hello, World!');
const compressed = compress(data);

// Decompress data
const decompressed = decompress(compressed);
console.log(decompressed.toString()); // 'Hello, World!'
```

## Features

- Pre-built binaries for multiple platforms
- TypeScript support
- Simple API for compression and decompression
- High performance LZ4 compression

## API

### compress(input: Buffer): Buffer

Compresses the input buffer using LZ4 compression.

### decompress(input: Buffer): Buffer

Decompresses the LZ4-compressed input buffer.

## Requirements

- Node.js >= 12.0.0

## License

ISC

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. 