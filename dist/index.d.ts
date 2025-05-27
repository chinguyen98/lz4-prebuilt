declare const lz4Module: any;
declare const LZ4Codec: {
    compress(encoder: Buffer): Promise<Buffer>;
    decompress(buffer: Buffer): Promise<Buffer>;
};
