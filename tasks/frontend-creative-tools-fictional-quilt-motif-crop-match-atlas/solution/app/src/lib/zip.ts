export class ZipMaker {
  private files: { name: string, data: Uint8Array, time: Date }[] = [];

  addFile(name: string, content: string | Uint8Array) {
    let data: Uint8Array;
    if (typeof content === 'string') {
      data = new TextEncoder().encode(content);
    } else {
      data = content;
    }
    this.files.push({ name, data, time: new Date() });
  }

  generate(): Blob {
    const encoder = new TextEncoder();
    const records: Uint8Array[] = [];
    const cdEntries: Uint8Array[] = [];

    let offset = 0;

    for (const file of this.files) {
      const nameBytes = encoder.encode(file.name);
      const nameLen = nameBytes.length;
      const dataLen = file.data.length;

      const lfh = new Uint8Array(30 + nameLen);
      const lfhView = new DataView(lfh.buffer);
      lfhView.setUint32(0, 0x04034b50, true);
      lfhView.setUint16(4, 20, true);
      lfhView.setUint16(6, 0, true);
      lfhView.setUint16(8, 0, true);
      lfhView.setUint16(10, 0, true);
      lfhView.setUint16(12, 0, true);
      lfhView.setUint32(14, 0, true);
      lfhView.setUint32(18, dataLen, true);
      lfhView.setUint32(22, dataLen, true);
      lfhView.setUint16(26, nameLen, true);
      lfhView.setUint16(28, 0, true);
      lfh.set(nameBytes, 30);

      records.push(lfh);
      records.push(file.data);

      const cd = new Uint8Array(46 + nameLen);
      const cdView = new DataView(cd.buffer);
      cdView.setUint32(0, 0x02014b50, true);
      cdView.setUint16(4, 20, true);
      cdView.setUint16(6, 20, true);
      cdView.setUint16(8, 0, true);
      cdView.setUint16(10, 0, true);
      cdView.setUint16(12, 0, true);
      cdView.setUint16(14, 0, true);
      cdView.setUint32(16, 0, true);
      cdView.setUint32(20, dataLen, true);
      cdView.setUint32(24, dataLen, true);
      cdView.setUint16(28, nameLen, true);
      cdView.setUint16(30, 0, true);
      cdView.setUint16(32, 0, true);
      cdView.setUint16(34, 0, true);
      cdView.setUint16(36, 0, true);
      cdView.setUint32(38, 0, true);
      cdView.setUint32(42, offset, true);
      cd.set(nameBytes, 46);

      cdEntries.push(cd);

      offset += lfh.length + dataLen;
    }

    const cdSize = cdEntries.reduce((acc, c) => acc + c.length, 0);

    const eocd = new Uint8Array(22);
    const eocdView = new DataView(eocd.buffer);
    eocdView.setUint32(0, 0x06054b50, true);
    eocdView.setUint16(4, 0, true);
    eocdView.setUint16(6, 0, true);
    eocdView.setUint16(8, this.files.length, true);
    eocdView.setUint16(10, this.files.length, true);
    eocdView.setUint32(12, cdSize, true);
    eocdView.setUint32(16, offset, true);
    eocdView.setUint16(20, 0, true);

    const allChunks = [...records, ...cdEntries, eocd];
    return new Blob(allChunks, { type: 'application/zip' });
  }
}
