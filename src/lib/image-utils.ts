// ABOUTME: Utility functions for image handling including GIF detection and optimization.

export const isGifUrl = (url: string): boolean => {
  return (
    url.toLowerCase().includes('.gif') ||
    url.toLowerCase().includes('gif') ||
    url.includes('image/gif')
  );
};

export const getImageType = (url: string): 'gif' | 'static' => {
  return isGifUrl(url) ? 'gif' : 'static';
};

export const validateImageFile = (file: File): { valid: boolean; error?: string } => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Tipo de arquivo não suportado' };
  }

  if (file.size > maxSize) {
    return { valid: false, error: 'Arquivo muito grande (máximo 10MB)' };
  }

  return { valid: true };
};

export const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image'));
    };

    img.src = objectUrl;
  });
};

export const isImageLandscape = (width: number, height: number): boolean => {
  return width > height;
};

export const shouldShowImageBadge = (imageType: 'gif' | 'static'): boolean => {
  return imageType === 'gif';
};
