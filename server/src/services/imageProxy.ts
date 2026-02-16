/**
 * Image proxy service - fetches images from external URLs and converts to base64
 * This solves the CORS issue when trying to display volces.com images in the browser
 */

export async function fetchImageAsBase64(imageUrl: string): Promise<string> {
  try {
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');

    return `data:${contentType};base64,${base64}`;
  } catch (error) {
    console.error('[ImageProxy] Failed to fetch image:', error);
    throw new Error(`Image fetch failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}
