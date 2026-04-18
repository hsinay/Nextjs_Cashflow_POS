const IMAGEKIT_UPLOAD_URL = 'https://upload.imagekit.io/api/v1/files/upload';
const DEFAULT_IMAGEKIT_FOLDER = '/cashflow-pos';

export interface UploadImageOptions {
  file: File;
  folder?: string;
  fileName?: string;
  tags?: string[];
}

export interface UploadedImageResult {
  fileId: string;
  name: string;
  url: string;
  thumbnailUrl?: string;
  filePath?: string;
  height?: number;
  width?: number;
  size?: number;
}

function getRequiredEnv(name: string, fallbackName?: string): string {
  const value = process.env[name] || (fallbackName ? process.env[fallbackName] : undefined);

  if (!value) {
    throw new Error(`${name} is not configured`);
  }

  return value;
}

export function getImageKitUrlEndpoint(): string {
  return getRequiredEnv('IMAGEKIT_URL_ENDPOINT', 'NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT').replace(/\/$/, '');
}

function getImageKitPrivateKey(): string {
  return getRequiredEnv('IMAGEKIT_PRIVATE_KEY');
}

function getUploadFolder(folder?: string): string {
  const normalizedFolder = folder?.trim() || DEFAULT_IMAGEKIT_FOLDER;

  if (normalizedFolder.startsWith('/')) {
    return normalizedFolder;
  }

  return `/${normalizedFolder}`;
}

export function isDataImageUrl(value?: string | null): boolean {
  return typeof value === 'string' && value.startsWith('data:image/');
}

export function isHttpImageUrl(value?: string | null): boolean {
  return typeof value === 'string' && /^https?:\/\//i.test(value);
}

export async function uploadImageToImageKit({
  file,
  folder,
  fileName,
  tags = [],
}: UploadImageOptions): Promise<UploadedImageResult> {
  const authHeader = Buffer.from(`${getImageKitPrivateKey()}:`).toString('base64');
  const formData = new FormData();

  formData.append('file', file, file.name);
  formData.append('fileName', fileName || file.name);
  formData.append('folder', getUploadFolder(folder));
  formData.append('useUniqueFileName', 'true');

  if (tags.length > 0) {
    formData.append('tags', tags.join(','));
  }

  const response = await fetch(IMAGEKIT_UPLOAD_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${authHeader}`,
    },
    body: formData,
  });

  const payload = await response.json();

  if (!response.ok) {
    const message = typeof payload?.message === 'string' ? payload.message : 'Image upload failed';
    throw new Error(message);
  }

  return {
    fileId: payload.fileId,
    name: payload.name,
    url: payload.url,
    thumbnailUrl: payload.thumbnailUrl,
    filePath: payload.filePath,
    height: payload.height,
    width: payload.width,
    size: payload.size,
  };
}
