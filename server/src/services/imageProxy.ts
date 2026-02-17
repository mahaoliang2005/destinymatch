/**
 * Image proxy service - fetches images from external URLs
 * Provides both base64 and buffer formats for different use cases
 */

export interface FetchedImage {
  buffer: Buffer;
  contentType: string;
}

/**
 * Fetch image from URL and return as buffer with content type
 * @param imageUrl URL of the image to fetch
 * @returns Object containing buffer and content type
 */
export async function fetchImageAsBuffer(imageUrl: string): Promise<FetchedImage> {
  try {
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }

    const rawContentType = response.headers.get('content-type') || 'image/jpeg';
    // Normalize content-type: lowercase and remove extra parameters (e.g., charset)
    const contentType = rawContentType.toLowerCase().split(';')[0].trim();
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log(`[ImageProxy] Fetched image: ${imageUrl.substring(0, 50)}... (${buffer.length} bytes)`);

    return { buffer, contentType };
  } catch (error) {
    console.error('[ImageProxy] Failed to fetch image:', error);
    throw new Error(`Image fetch failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Fetch image from URL and convert to base64 data URI
 * @param imageUrl URL of the image to fetch
 * @returns Base64 encoded image with data URI prefix
 */
export async function fetchImageAsBase64(imageUrl: string): Promise<string> {
  const { buffer, contentType } = await fetchImageAsBuffer(imageUrl);
  const base64 = buffer.toString('base64');
  return `data:${contentType};base64,${base64}`;
}
