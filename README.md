# lz4-prebuilt

Pre-built LZ4 compression library for Node.js with TypeScript support.

## Installation

You can install this package directly from GitHub:

```json
{
  "dependencies": {
    "lz4-prebuilt": "git+https://github.com/duyan/lz4-prebuilt.git#v1.0.0"
  }
}
```

Or using npm:

```bash
npm install git+https://github.com/duyan/lz4-prebuilt.git#v1.0.0
```

## Usage

```typescript
import LZ4Codec from 'lz4-prebuilt';

// Compress data
const data = Buffer.from('Hello, World!');
const compressed = await LZ4Codec.compress(data);

// Decompress data
const decompressed = await LZ4Codec.decompress(compressed);
console.log(decompressed.toString()); // 'Hello, World!'
```

## Features

- Pre-built binaries included (no build step required)
- TypeScript support
- Async API
- Works on Node.js 12+

## License

ISC

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. 