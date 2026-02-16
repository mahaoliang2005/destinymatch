import { toPng, toCanvas } from 'html-to-image';
import QRCode from 'qrcode';
import { AnalysisResult, PartnerVibe } from '../types';

// Wait for all images in element to load
const waitForImages = (element: HTMLElement): Promise<void> => {
  const images = element.querySelectorAll('img');
  const promises = Array.from(images).map((img) => {
    if (img.complete) return Promise.resolve();
    return new Promise<void>((resolve) => {
      img.onload = () => resolve();
      // Don't reject on error - just continue with placeholder
      img.onerror = () => {
        console.warn(`[Share] Image failed to load: ${img.src.substring(0, 50)}...`);
        resolve();
      };
      // Timeout after 3 seconds - don't block generation
      setTimeout(() => {
        console.warn('[Share] Image load timeout, continuing...');
        resolve();
      }, 3000);
    });
  });
  return Promise.all(promises).then(() => {});
};

// Generate share card image from DOM element
export const generateShareCard = async (
  cardElement: HTMLElement
): Promise<string> => {
  try {
    console.log('[Share] Starting card generation...');

    // Wait for images to load
    await waitForImages(cardElement);
    console.log('[Share] Images loaded');

    // Add small delay to ensure fonts are ready
    await new Promise(resolve => setTimeout(resolve, 200));

    // Temporarily move element to viewport for rendering
    const originalStyle = cardElement.style.cssText;
    cardElement.style.left = '0';
    cardElement.style.top = '0';
    cardElement.style.zIndex = '-1';

    console.log('[Share] Rendering to canvas...');

    // Use toCanvas first, then convert to data URL
    const canvas = await toCanvas(cardElement, {
      pixelRatio: 2,
      backgroundColor: '#1a0d10',
      skipFonts: true,
      cacheBust: true,
      imagePlaceholder: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiMyRDFBMjAiLz48L3N2Zz4=',
    });

    // Restore original style
    cardElement.style.cssText = originalStyle;

    console.log('[Share] Canvas generated:', canvas.width, 'x', canvas.height);

    // Convert canvas to data URL
    const dataUrl = canvas.toDataURL('image/png', 0.95);
    console.log('[Share] Data URL generated, length:', dataUrl.length);

    return dataUrl;
  } catch (error) {
    console.error('[Share] Failed to generate share card:', error);
    throw new Error('Failed to generate share card: ' + (error instanceof Error ? error.message : String(error)));
  }
};

// Download image to device
export const downloadImage = (dataUrl: string, filename: string) => {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Generate QR code for sharing
export const generateQRCode = async (text: string): Promise<string> => {
  try {
    return await QRCode.toDataURL(text, {
      width: 120,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });
  } catch (error) {
    console.error('Failed to generate QR code:', error);
    throw new Error('Failed to generate QR code');
  }
};

// Copy text to clipboard
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Copy failed:', error);
    // Fallback for older browsers or insecure contexts
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    } catch (err) {
      document.body.removeChild(textArea);
      return false;
    }
  }
};

// Detect WeChat environment
export const isWeChat = (): boolean => {
  return /MicroMessenger/i.test(navigator.userAgent);
};

// Detect mobile device
export const isMobile = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// Vibe name mapping
const vibeNames: Record<PartnerVibe, string> = {
  gentle: '温柔型',
  sunny: '阳光型',
  intellectual: '知性型',
  mysterious: '神秘型',
};

// Score label mapping
const getScoreLabel = (score: number): string => {
  if (score >= 91) return '命中注定';
  if (score >= 81) return '天作之合';
  if (score >= 71) return '情投意合';
  return '有缘相识';
};

// Generate share text
export const generateShareText = (
  score: number,
  partnerType: string,
  vibe: PartnerVibe
): string => {
  return `我在「Destiny Match」找到了我的理想伴侣！\n\n` +
    `👫 般配度：${score}%\n` +
    `✨ ${getScoreLabel(score)}\n` +
    `💕 类型：${vibeNames[vibe]} · ${partnerType}\n\n` +
    `快来测测你的缘分吧！`;
};

// Generate share URL
export const getShareUrl = (): string => {
  if (typeof window !== 'undefined') {
    return window.location.origin + window.location.pathname;
  }
  return 'https://destiny-match.app';
};

// Convert image URL to base64
export const convertImageToBase64 = async (imageUrl: string): Promise<string | null> => {
  try {
    // If already base64, return as-is
    if (imageUrl.startsWith('data:')) {
      return imageUrl;
    }

    // Try to fetch the image
    const response = await fetch(imageUrl, {
      method: 'GET',
      mode: 'cors',
      cache: 'no-cache',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const blob = await response.blob();
    return await blobToBase64(blob);
  } catch (error) {
    console.warn('[Share] Failed to convert image to base64:', error);
    return null;
  }
};

// Helper to convert blob to base64
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// Convert image URL to base64 using canvas (bypasses fetch CORS for images with crossOrigin support)
export const convertImageViaCanvas = async (imageUrl: string): Promise<string | null> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || 300;
        canvas.height = img.naturalHeight || 300;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const dataUrl = canvas.toDataURL('image/png');
          resolve(dataUrl);
        } else {
          resolve(null);
        }
      } catch (e) {
        console.warn('[Share] Canvas conversion failed:', e);
        resolve(null);
      }
    };

    img.onerror = () => {
      resolve(null);
    };

    img.src = imageUrl;
  });
};

// Preload image and convert to base64 for share card
export const preloadImageForSharing = async (src: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      // Create canvas to convert to base64
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || 300;
      canvas.height = img.naturalHeight || 300;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        try {
          const dataUrl = canvas.toDataURL('image/png');
          resolve(dataUrl);
        } catch (e) {
          console.warn('[Share] Canvas conversion failed:', e);
          resolve(src);
        }
      } else {
        resolve(src);
      }
    };

    img.onerror = () => {
      console.warn('[Share] Image preload failed:', src.substring(0, 50));
      resolve(src);
    };

    img.src = src;
  });
};
