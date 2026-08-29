/**
 * Turbopack-safe leaf module for `@sohappypdf/utils` / `@sohappypdf/utils/zip`.
 * Keep this file free of relative imports so Next can resolve it.
 */

export type ZipArchiveEntry = {
  name: string;
  data: Uint8Array;
};

const CRC_TABLE = new Uint32Array(256);

for (let index = 0; index < 256; index += 1) {
  let value = index;

  for (let bit = 0; bit < 8; bit += 1) {
    value = (value & 1) === 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }

  CRC_TABLE[index] = value >>> 0;
}

export function crc32(data: Uint8Array): number {
  let checksum = 0xffffffff;

  for (const byte of data) {
    const tableIndex = (checksum ^ byte) & 0xff;
    const tableValue = CRC_TABLE[tableIndex];

    if (tableValue === undefined) {
      return 0;
    }

    checksum = tableValue ^ (checksum >>> 8);
  }

  return (checksum ^ 0xffffffff) >>> 0;
}

function writeUint16(target: Uint8Array, offset: number, value: number): void {
  target[offset] = value & 0xff;
  target[offset + 1] = (value >> 8) & 0xff;
}

function writeUint32(target: Uint8Array, offset: number, value: number): void {
  target[offset] = value & 0xff;
  target[offset + 1] = (value >> 8) & 0xff;
  target[offset + 2] = (value >> 16) & 0xff;
  target[offset + 3] = (value >> 24) & 0xff;
}

function encodeName(name: string): Uint8Array {
  return new TextEncoder().encode(name.replaceAll("\\", "/"));
}

export function uniqueZipEntryNames(names: readonly string[]): string[] {
  const used = new Map<string, number>();

  return names.map((name) => {
    const count = used.get(name) ?? 0;
    used.set(name, count + 1);

    if (count === 0) {
      return name;
    }

    const separator = name.lastIndexOf(".");
    const stem = separator > 0 ? name.slice(0, separator) : name;
    const extension = separator > 0 ? name.slice(separator) : "";
    return `${stem}-${count + 1}${extension}`;
  });
}

export function buildZipArchive(files: readonly ZipArchiveEntry[]): Uint8Array {
  const localChunks: Uint8Array[] = [];
  const centralChunks: Uint8Array[] = [];
  let offset = 0;
  const names = uniqueZipEntryNames(files.map((file) => file.name));

  for (const [index, file] of files.entries()) {
    const nameBytes = encodeName(names[index] ?? file.name);
    const checksum = crc32(file.data);
    const local = new Uint8Array(30 + nameBytes.byteLength);

    writeUint32(local, 0, 0x04034b50);
    writeUint16(local, 4, 20);
    writeUint16(local, 8, 0);
    writeUint32(local, 14, checksum);
    writeUint32(local, 18, file.data.byteLength);
    writeUint32(local, 22, file.data.byteLength);
    writeUint16(local, 26, nameBytes.byteLength);
    local.set(nameBytes, 30);

    const central = new Uint8Array(46 + nameBytes.byteLength);
    writeUint32(central, 0, 0x02014b50);
    writeUint16(central, 4, 20);
    writeUint16(central, 6, 20);
    writeUint16(central, 10, 0);
    writeUint32(central, 16, checksum);
    writeUint32(central, 20, file.data.byteLength);
    writeUint32(central, 24, file.data.byteLength);
    writeUint16(central, 28, nameBytes.byteLength);
    writeUint32(central, 42, offset);
    central.set(nameBytes, 46);

    localChunks.push(local, file.data);
    centralChunks.push(central);
    offset += local.byteLength + file.data.byteLength;
  }

  const centralSize = centralChunks.reduce(
    (total, chunk) => total + chunk.byteLength,
    0,
  );
  const eocd = new Uint8Array(22);
  writeUint32(eocd, 0, 0x06054b50);
  writeUint16(eocd, 8, files.length);
  writeUint16(eocd, 10, files.length);
  writeUint32(eocd, 12, centralSize);
  writeUint32(eocd, 16, offset);

  const archive = new Uint8Array(offset + centralSize + eocd.byteLength);
  let cursor = 0;

  for (const chunk of [...localChunks, ...centralChunks, eocd]) {
    archive.set(chunk, cursor);
    cursor += chunk.byteLength;
  }

  return archive;
}
