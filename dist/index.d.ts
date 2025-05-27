export interface ILZ4Codec {
    compress(encoder: Buffer): Promise<Buffer>;
    decompress(buffer: Buffer): Promise<Buffer>;
}
export declare const LZ4Codec: ILZ4Codec;
export default LZ4Codec;
//# sourceMappingURL=index.d.ts.map