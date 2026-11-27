export interface ZipEntry {
  name: string;
  data: Blob;
}

const encoder = new TextEncoder();

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function write16(view: DataView, offset: number, value: number) {
  view.setUint16(offset, value, true);
}

function write32(view: DataView, offset: number, value: number) {
  view.setUint32(offset, value, true);
}

export async function createZip(entries: ZipEntry[]): Promise<Blob> {
  const localParts: BlobPart[] = [];
  const directoryParts: BlobPart[] = [];
  let offset = 0;

  for (const entry of entries) {
    const name = encoder.encode(entry.name);
    const data = new Uint8Array(await entry.data.arrayBuffer());
    const crc = crc32(data);
    const localHeader = new Uint8Array(30 + name.length);
    const localView = new DataView(localHeader.buffer);
    write32(localView, 0, 0x04034b50);
    write16(localView, 4, 20);
    write16(localView, 6, 0x0800);
    write16(localView, 8, 0);
    write32(localView, 14, crc);
    write32(localView, 18, data.length);
    write32(localView, 22, data.length);
    write16(localView, 26, name.length);
    localHeader.set(name, 30);
    localParts.push(localHeader, data);

    const directoryHeader = new Uint8Array(46 + name.length);
    const directoryView = new DataView(directoryHeader.buffer);
    write32(directoryView, 0, 0x02014b50);
    write16(directoryView, 4, 20);
    write16(directoryView, 6, 20);
    write16(directoryView, 8, 0x0800);
    write16(directoryView, 10, 0);
    write32(directoryView, 16, crc);
    write32(directoryView, 20, data.length);
    write32(directoryView, 24, data.length);
    write16(directoryView, 28, name.length);
    write32(directoryView, 42, offset);
    directoryHeader.set(name, 46);
    directoryParts.push(directoryHeader);
    offset += localHeader.length + data.length;
  }

  const directorySize = directoryParts.reduce((sum, part) => sum + (part as Uint8Array).length, 0);
  const end = new Uint8Array(22);
  const endView = new DataView(end.buffer);
  write32(endView, 0, 0x06054b50);
  write16(endView, 8, entries.length);
  write16(endView, 10, entries.length);
  write32(endView, 12, directorySize);
  write32(endView, 16, offset);

  return new Blob([...localParts, ...directoryParts, end], { type: "application/zip" });
}
