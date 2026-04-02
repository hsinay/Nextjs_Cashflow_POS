'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, X } from 'lucide-react';
import Image from 'next/image';
import { useRef, useState } from 'react';

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  onImageUpload?: (file: File) => Promise<string>; // Optional: handle file upload on server
  placeholder?: string;
  description?: string;
}

export function ImageUpload({
  value,
  onChange,
  onImageUpload,
  placeholder = 'https://example.com/image.jpg',
  description = 'JPG or PNG (max. 5MB)',
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>(value || '');
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setError('Only JPG and PNG files are allowed');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setError(null);

    // Create local preview
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setPreviewUrl(result);
      onChange(result);
    };
    reader.readAsDataURL(file);

    // If server upload handler provided, use it
    if (onImageUpload) {
      setIsUploading(true);
      try {
        const uploadedUrl = await onImageUpload(file);
        setPreviewUrl(uploadedUrl);
        onChange(uploadedUrl);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed');
        // Keep the local preview on error
      } finally {
        setIsUploading(false);
      }
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemove = () => {
    setPreviewUrl('');
    onChange('');
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUrlChange = (url: string) => {
    setPreviewUrl(url);
    onChange(url);
    setError(null);
  };

  return (
    <div className="space-y-4">
      {/* URL Input */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Image URL</label>
        <Input
          type="text"
          placeholder={placeholder}
          value={previewUrl}
          onChange={(e) => handleUrlChange(e.target.value)}
          className="text-sm"
        />
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-slate-200"></div>
        <span className="text-xs text-slate-500 font-medium">OR</span>
        <div className="flex-1 h-px bg-slate-200"></div>
      </div>

      {/* File Upload Area */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="relative border-2 border-dashed border-slate-300 rounded-lg p-6 hover:border-slate-400 hover:bg-slate-50 cursor-pointer transition"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png"
          onChange={handleFileSelect}
          disabled={isUploading}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center gap-2">
          <div className="p-2 bg-slate-100 rounded-lg">
            <Upload className="w-5 h-5 text-slate-600" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-slate-900">
              {isUploading ? 'Uploading...' : 'Click to upload or drag and drop'}
            </p>
            <p className="text-xs text-slate-500 mt-1">{description}</p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Preview */}
      {previewUrl && (
        <div className="space-y-2">
          <div className="relative w-full h-48 bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
            <Image
              src={previewUrl}
              alt="Preview"
              fill
              className="object-cover"
              onError={() => setPreviewUrl('')}
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRemove}
            className="w-full"
          >
            <X className="w-4 h-4 mr-2" />
            Remove Image
          </Button>
        </div>
      )}
    </div>
  );
}
