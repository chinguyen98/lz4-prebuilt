/// <reference types="node" />

export interface LZ4Codec {
  compress(input: Buffer): Promise<Buffer>;
  decompress(input: Buffer): Promise<Buffer>;
}

declare const codec: LZ4Codec;
export default codec;
export { codec as LZ4Codec }; 