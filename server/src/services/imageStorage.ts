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
 * @param base64Data - Base64 encoded image data (can include data:image/...;base64, prefix)
 * @returns The URL path to the saved image (e.g., /images/2024-01-15/uuid.jpg)
 */
export const saveImage = (base64Data: string): string => {
  ensureImagesDir();

  // Get today's date for directory organization
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const dateDir = path.join(IMAGES_DIR, today);

  // Create date directory if it doesn't exist
  if (!fs.existsSync(dateDir)) {
    fs.mkdirSync(dateDir, { recursive: true });
  }

  // Generate unique filename
  const filename = `${uuidv4()}.jpg`;
  const filepath = path.join(dateDir, filename);

  // Remove base64 prefix if present and convert to buffer
  const base64Content = base64Data.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(base64Content, 'base64');

  // Write file to disk
  fs.writeFileSync(filepath, buffer);

  // Return the URL path (not the filesystem path)
  const urlPath = `/images/${today}/${filename}`;
  console.log(`[ImageStorage] Saved image: ${urlPath} (${buffer.length} bytes)`);

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
