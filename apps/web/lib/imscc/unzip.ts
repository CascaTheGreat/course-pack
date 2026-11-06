/**
 * Zero-dependency in-browser and Node.js ZIP extractor using Web Streams.
 * Uses native DecompressionStream('deflate-raw') available in all modern browsers.
 */

export interface UnzipProgress {
  current: number
  total: number
  currentFile: string
}

export async function unzipArchive(
  input: File | Blob | ArrayBuffer | Uint8Array,
  onProgress?: (progress: UnzipProgress) => void
): Promise<Map<string, Uint8Array>> {
  let bytes: Uint8Array

  if (input instanceof Uint8Array) {
    bytes = input
  } else if (input instanceof ArrayBuffer) {
    bytes = new Uint8Array(input)
  } else if (typeof Blob !== "undefined" && input instanceof Blob) {
    const arrayBuffer = await input.arrayBuffer()
    bytes = new Uint8Array(arrayBuffer)
  } else {
    throw new Error("Unsupported input format for unzipArchive")
  }

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)

  // 1. Locate End of Central Directory (EOCD) record
  let eocdOffset = -1
  const minEocdSearch = Math.max(0, bytes.length - 65557) // max comment length is 65535 + 22 byte header
  for (let i = bytes.length - 22; i >= minEocdSearch; i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocdOffset = i
      break
    }
  }

  if (eocdOffset === -1) {
    throw new Error("Invalid archive: End of Central Directory record not found. Please ensure this is a valid .imscc or .zip file.")
  }

  const totalEntries = view.getUint16(eocdOffset + 10, true)
  const cdOffset = view.getUint32(eocdOffset + 16, true)

  const entries = new Map<string, Uint8Array>()
  let offset = cdOffset

  for (let i = 0; i < totalEntries; i++) {
    const sig = view.getUint32(offset, true)
    if (sig !== 0x02014b50) break

    const compression = view.getUint16(offset + 10, true)
    const compressedSize = view.getUint32(offset + 20, true)
    const uncompressedSize = view.getUint32(offset + 24, true)
    const fileNameLen = view.getUint16(offset + 28, true)
    const extraLen = view.getUint16(offset + 30, true)
    const commentLen = view.getUint16(offset + 32, true)
    const localHeaderOffset = view.getUint32(offset + 42, true)

    const fileNameBytes = bytes.subarray(offset + 46, offset + 46 + fileNameLen)
    const fileName = new TextDecoder("utf-8").decode(fileNameBytes)

    if (onProgress) {
      onProgress({ current: i + 1, total: totalEntries, currentFile: fileName })
    }

    // Skip directories
    if (!fileName.endsWith("/")) {
      const localSig = view.getUint32(localHeaderOffset, true)
      if (localSig !== 0x04034b50) {
        throw new Error(`Corrupted zip: invalid local header signature for ${fileName}`)
      }

      const localNameLen = view.getUint16(localHeaderOffset + 26, true)
      const localExtraLen = view.getUint16(localHeaderOffset + 28, true)
      const dataStart = localHeaderOffset + 30 + localNameLen + localExtraLen
      const compData = bytes.subarray(dataStart, dataStart + compressedSize)

      let fileData: Uint8Array

      if (compression === 0) {
        // Stored (no compression)
        fileData = compData
      } else if (compression === 8) {
        // Deflated
        const ds = new DecompressionStream("deflate-raw")
        const writer = ds.writable.getWriter()
        writer.write(compData as unknown as BufferSource)
        writer.close()

        const reader = ds.readable.getReader()
        const chunks: Uint8Array[] = []
        let total = 0

        while (true) {
          const { value, done } = await reader.read()
          if (done) break
          chunks.push(value)
          total += value.length
        }

        fileData = new Uint8Array(total)
        let cur = 0
        for (const chunk of chunks) {
          fileData.set(chunk, cur)
          cur += chunk.length
        }
      } else {
        console.warn(`Unsupported compression method ${compression} for file ${fileName}`)
        fileData = new Uint8Array(0)
      }

      entries.set(fileName, fileData)
    }

    offset += 46 + fileNameLen + extraLen + commentLen
  }

  return entries
}
