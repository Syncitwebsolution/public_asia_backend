import ImageKit from "imagekit";
import sharp from "sharp";
import fs from "fs";
import path from "path";

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY || "",
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY || "",
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || "",
});

/**
 * Compresses an image file using Sharp (max width 1200px, WebP quality 80)
 * and uploads it to ImageKit.io.
 * Automatically cleans up local temporary file.
 */
const uploadOnImageKit = async (localFilePath, folder = "/uploads") => {
  try {
    if (!localFilePath) return null;

    // Read and compress image using sharp
    let fileBuffer;
    let fileName = path.basename(localFilePath, path.extname(localFilePath)) + ".webp";

    try {
      fileBuffer = await sharp(localFilePath)
        .resize({ width: 1200, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();
    } catch (compressError) {
      console.warn("Sharp compression skipped/failed, uploading raw buffer:", compressError.message);
      fileBuffer = fs.readFileSync(localFilePath);
      fileName = path.basename(localFilePath);
    }

    // Upload to ImageKit
    const response = await imagekit.upload({
      file: fileBuffer,
      fileName: fileName,
      folder: folder,
      useUniqueFileName: true,
    });

    // Cleanup local temporary file
    try {
      fs.unlinkSync(localFilePath);
    } catch (e) {
      console.error("Failed to delete temp file:", e);
    }

    return response;
  } catch (error) {
    console.error("ImageKit Upload Error:", error);
    try {
      fs.unlinkSync(localFilePath);
    } catch (e) {
      console.error("Failed to delete temp file on error:", e);
    }
    return null;
  }
};

export { uploadOnImageKit, imagekit };
