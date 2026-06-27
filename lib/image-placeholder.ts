import sharp from "sharp";

/**
 * Encode a tiny blur placeholder for Next.js `<Image placeholder="blur" blurDataURL={...}>`.
 * Produces a ~150-byte data URL by downsampling to 16x16 and re-encoding as low-quality JPEG.
 * Returns null if sharp fails (HEIC without libheif, corrupt input, etc.) — caller should
 * treat null as "no placeholder, fall through to gradient" rather than failing the upload.
 */
export async function generateBlurDataURL(input: Buffer): Promise<string | null> {
  try {
    const out = await sharp(input, { failOn: "none" })
      .rotate()
      .resize(16, 16, { fit: "inside" })
      .jpeg({ quality: 40, progressive: false, chromaSubsampling: "4:2:0" })
      .toBuffer();
    return `data:image/jpeg;base64,${out.toString("base64")}`;
  } catch {
    return null;
  }
}
