import multer from "multer";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { fileTypeFromBuffer } from "file-type";
import { AppError } from "../errors/AppError.js";

const uploadDirectory = path.resolve(process.cwd(), "uploads", "profiles");

const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

const allowedExtensions = new Set([".jpg", ".jpeg", ".png", ".webp"]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024,
    files: 1,
  },
});

export const profilePhotoUpload = upload.single("profilePhoto");

export async function validateAndSaveProfilePhoto(
  file: Express.Multer.File,
): Promise<string> {
  const extension = path.extname(file.originalname).toLowerCase();

  if (!allowedExtensions.has(extension)) {
    throw new AppError(
      "Only JPEG, PNG, and WebP profile photos are allowed",
      400,
    );
  }

  const detectedType = await fileTypeFromBuffer(file.buffer);

  if (!detectedType || !allowedMimeTypes.has(detectedType.mime)) {
    throw new AppError("Uploaded file is not a supported image", 400);
  }

  if (detectedType.mime !== file.mimetype) {
    throw new AppError(
      "File content does not match its declared MIME type",
      400,
    );
  }

  const detectedExtension =
    detectedType.ext === "jpeg" ? ".jpg" : `.${detectedType.ext}`;

  if (
    extension !== detectedExtension &&
    !(extension === ".jpeg" && detectedExtension === ".jpg")
  ) {
    throw new AppError("File extension does not match its actual content", 400);
  }

  await mkdir(uploadDirectory, { recursive: true });

  const filename = `${randomUUID()}${detectedExtension}`;
  const filePath = path.join(uploadDirectory, filename);

  await writeFile(filePath, file.buffer, { flag: "wx" });

  return filename;
}
