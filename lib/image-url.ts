type TransformationValue = string | number | null | undefined;

interface ImageTransformOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'auto' | 'webp' | 'jpg' | 'png' | 'avif';
  crop?: string;
}

function getConfiguredImageKitHost(): string | null {
  const endpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT;

  if (!endpoint) {
    return null;
  }

  try {
    return new URL(endpoint).hostname;
  } catch {
    return null;
  }
}

export function isImageKitUrl(url?: string | null): boolean {
  if (!url || !/^https?:\/\//i.test(url)) {
    return false;
  }

  try {
    const parsed = new URL(url);
    const configuredHost = getConfiguredImageKitHost();

    return Boolean(
      parsed.hostname === configuredHost ||
      parsed.hostname.endsWith('.imagekit.io') ||
      parsed.hostname === 'ik.imagekit.io'
    );
  } catch {
    return false;
  }
}

function appendTransformToken(tokens: string[], key: string, value: TransformationValue) {
  if (value === undefined || value === null || value === '') {
    return;
  }

  tokens.push(`${key}-${value}`);
}

export function getOptimizedImageUrl(
  url?: string | null,
  options: ImageTransformOptions = {}
): string {
  if (!url || !isImageKitUrl(url)) {
    return url || '';
  }

  try {
    const parsed = new URL(url);
    const tokens: string[] = [];

    appendTransformToken(tokens, 'w', options.width);
    appendTransformToken(tokens, 'h', options.height);
    appendTransformToken(tokens, 'q', options.quality);
    appendTransformToken(tokens, 'f', options.format);
    appendTransformToken(tokens, 'c', options.crop);

    if (tokens.length === 0) {
      return parsed.toString();
    }

    parsed.searchParams.set('tr', tokens.join(','));

    return parsed.toString();
  } catch {
    return url;
  }
}
