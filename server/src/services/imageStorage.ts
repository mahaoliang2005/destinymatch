import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Base directory for images (relative to server root)
const IMAGES_DIR = path.join(__dirname, '../../public/images');

/**
 * Extract image format from base64 data URI
 * @param base64Data - Base64 encoded image data
 * @returns Object with format extension and MIME type
 */
const extractImageFormat = (base64Data: string): { extension: string; mimeType: string } => {
  const match = base64Data.match(/^data:image\/([a-zA-Z0-9]+);base64,/);
  if (match) {
    const format = match[1].toLowerCase();
    // Map format to extension and normalize MIME type
    const formatMap: Record<string, { extension: string; mimeType: string }> = {
      jpeg: { extension: 'jpg', mimeType: 'image/jpeg' },
      jpg: { extension: 'jpg', mimeType: 'image/jpeg' },
      png: { extension: 'png', mimeType: 'image/png' },
      webp: { extension: 'webp', mimeType: 'image/webp' },
      gif: { extension: 'gif', mimeType: 'image/gif' },
      bmp: { extension: 'bmp', mimeType: 'image/bmp' },
      tiff: { extension: 'tiff', mimeType: 'image/tiff' },
      ico: { extension: 'ico', mimeType: 'image/x-icon' },
    };
    return formatMap[format] || { extension: 'png', mimeType: 'image/png' };
  }
  // Default to PNG if no data URI prefix found
  return { extension: 'png', mimeType: 'image/png' };
};

/**
 * Convert base64 data to buffer, removing the data URI prefix if present
 * @param base64Data - Base64 encoded image data
 * @returns Buffer containing raw image data
 */
const base64ToBuffer = (base64Data: string): Buffer => {
  const base64String = base64Data.replace(/^data:image\/\w+;base64,/, '');
  return Buffer.from(base64String, 'base64');
};

/**
 * Ensure the images directory exists
 */
const ensureImagesDir = (): void => {
  if (!fs.existsSync(IMAGES_DIR)) {
    fs.mkdirSync(IMAGES_DIR, { recursive: true });
    console.log(`[ImageStorage] Created images directory: ${IMAGES_DIR}`);
  }
};

/**
 * Save a base64 image to disk and return the URL path
 * Preserves the original image format
 * @param base64Data - Base64 encoded image data (can include data:image/...;base64, prefix)
 * @returns The URL path to the saved image (e.g., /images/2024-01-15/uuid.png)
 */
export const saveImage = async (base64Data: string): Promise<string> => {
  ensureImagesDir();

  // Get today's date for directory organization
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const dateDir = path.join(IMAGES_DIR, today);

  // Create date directory if it doesn't exist
  if (!fs.existsSync(dateDir)) {
    fs.mkdirSync(dateDir, { recursive: true });
  }

  // Extract image format from base64 data
  const { extension } = extractImageFormat(base64Data);

  // Generate unique filename with correct extension
  const filename = `${uuidv4()}.${extension}`;
  const filepath = path.join(dateDir, filename);

  // Convert base64 to buffer (preserves original format)
  const imageBuffer = base64ToBuffer(base64Data);

  // Write file to disk
  fs.writeFileSync(filepath, imageBuffer);

  // Return the URL path (not the filesystem path)
  const urlPath = `/images/${today}/${filename}`;
  console.log(`[ImageStorage] Saved image: ${urlPath} (${imageBuffer.length} bytes)`);

  return urlPath;
};

/**
 * Delete an image by its URL path
 * @param urlPath - The URL path of the image (e.g., /images/2024-01-15/uuid.jpg)
 * @returns true if deleted, false if not found
 */
export const deleteImage = (urlPath: string): boolean => {
  // Convert URL path to filesystem path
  const relativePath = urlPath.replace(/^\/images\//, '');
  const filepath = path.join(IMAGES_DIR, relativePath);

  if (fs.existsSync(filepath)) {
    fs.unlinkSync(filepath);
    console.log(`[ImageStorage] Deleted image: ${urlPath}`);
    return true;
  }

  return false;
};

/**
 * Clean up images older than the specified number of days
 * @param daysToKeep - Number of days to keep images (default: 30)
 */
export const cleanupOldImages = (daysToKeep: number = 30): void => {
  ensureImagesDir();

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
  const cutoffStr = cutoffDate.toISOString().split('T')[0];

  console.log(`[ImageStorage] Running cleanup (keeping images after ${cutoffStr})`);

  let deletedCount = 0;
  let dirCount = 0;

  // Get all date directories
  const entries = fs.readdirSync(IMAGES_DIR, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const dirName = entry.name;

      // Check if directory name is a valid date (YYYY-MM-DD format)
      if (/^\d{4}-\d{2}-\d{2}$/.test(dirName)) {
        // Compare directory date with cutoff date
        if (dirName < cutoffStr) {
          const dirPath = path.join(IMAGES_DIR, dirName);
          const files = fs.readdirSync(dirPath);
          deletedCount += files.length;

          // Remove entire directory
          fs.rmSync(dirPath, { recursive: true, force: true });
          dirCount++;
          console.log(`[ImageStorage] Removed old directory: ${dirName} (${files.length} files)`);
        }
      }
    }
  }

  if (dirCount > 0) {
    console.log(`[ImageStorage] Cleanup complete: removed ${dirCount} directories, ${deletedCount} total files`);
  } else {
    console.log(`[ImageStorage] Cleanup complete: no old directories found`);
  }
};

/**
 * Extract image format from content type or file extension
 * @param contentType - HTTP Content-Type header or file extension
 * @returns Object with format extension and MIME type
 */
const extractFormatFromContentType = (contentType: string): { extension: string; mimeType: string } => {
  const normalized = contentType.toLowerCase().split(';')[0].trim();

  const formatMap: Record<string, { extension: string; mimeType: string }> = {
    'image/jpeg': { extension: 'jpg', mimeType: 'image/jpeg' },
    'image/jpg': { extension: 'jpg', mimeType: 'image/jpeg' },
    'image/png': { extension: 'png', mimeType: 'image/png' },
    'image/webp': { extension: 'webp', mimeType: 'image/webp' },
    'image/gif': { extension: 'gif', mimeType: 'image/gif' },
    'image/bmp': { extension: 'bmp', mimeType: 'image/bmp' },
    'image/tiff': { extension: 'tiff', mimeType: 'image/tiff' },
    'image/x-icon': { extension: 'ico', mimeType: 'image/x-icon' },
  };

  return formatMap[normalized] || { extension: 'png', mimeType: 'image/png' };
};

/**
 * Detect image format from magic number (file header)
 * @param buffer - Image buffer
 * @returns Object with format extension and MIME type
 */
const detectFormatFromBuffer = (buffer: Buffer): { extension: string; mimeType: string } => {
  if (buffer.length < 4) {
    return { extension: 'png', mimeType: 'image/png' };
  }

  // Check magic numbers
  if (buffer[0] === 0xFF && buffer[1] === 0xD8) {
    return { extension: 'jpg', mimeType: 'image/jpeg' };
  }
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
    return { extension: 'png', mimeType: 'image/png' };
  }
  if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) {
    return { extension: 'webp', mimeType: 'image/webp' }; // RIFF header for WEBP
  }
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
    return { extension: 'gif', mimeType: 'image/gif' };
  }
  if (buffer[0] === 0x42 && buffer[1] === 0x4D) {
    return { extension: 'bmp', mimeType: 'image/bmp' };
  }

  // Default to PNG if unknown
  return { extension: 'png', mimeType: 'image/png' };
};

/**
 * Save an image buffer to disk and return the URL path
 * Detects format from content type or magic number
 * @param buffer - Image data buffer
 * @param contentType - Optional HTTP Content-Type hint
 * @returns The URL path to the saved image (e.g., /images/2024-01-15/uuid.png)
 */
export const saveImageFromBuffer = async (buffer: Buffer, contentType?: string): Promise<string> => {
  ensureImagesDir();

  // Get today's date for directory organization
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const dateDir = path.join(IMAGES_DIR, today);

  // Create date directory if it doesn't exist
  if (!fs.existsSync(dateDir)) {
    fs.mkdirSync(dateDir, { recursive: true });
  }

  // Determine image format from content type or detect from buffer
  let formatInfo: { extension: string; mimeType: string };
  if (contentType) {
    formatInfo = extractFormatFromContentType(contentType);
  } else {
    formatInfo = detectFormatFromBuffer(buffer);
  }

  // Generate unique filename with correct extension
  const filename = `${uuidv4()}.${formatInfo.extension}`;
  const filepath = path.join(dateDir, filename);

  // Write file to disk
  fs.writeFileSync(filepath, buffer);

  // Return the URL path (not the filesystem path)
  const urlPath = `/images/${today}/${filename}`;
  console.log(`[ImageStorage] Saved image from buffer: ${urlPath} (${buffer.length} bytes)`);

  return urlPath;
};

/**
 * Get the full filesystem path for an image URL
 * @param urlPath - The URL path (e.g., /images/2024-01-15/uuid.jpg)
 * @returns The full filesystem path
 */
export const getImagePath = (urlPath: string): string => {
  const relativePath = urlPath.replace(/^\/images\//, '');
  return path.join(IMAGES_DIR, relativePath);
};

/**
 * Check if an image exists
 * @param urlPath - The URL path of the image
 * @returns true if exists, false otherwise
 */
export const imageExists = (urlPath: string): boolean => {
  const filepath = getImagePath(urlPath);
  return fs.existsSync(filepath);
};
