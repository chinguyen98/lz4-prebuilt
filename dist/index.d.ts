export declare const LZ4Codec: {
    compress(encoder: Buffer): Promise<Buffer>;
    decompress(buffer: Buffer): Promise<Buffer>;
};
export default LZ4Codec;
