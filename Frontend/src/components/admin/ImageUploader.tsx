import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, Image as ImageIcon, X, Loader2, CloudLightning } from 'lucide-react';
import { adminApi, type CloudinarySignatureData } from '../../api/admin';
import Button from '../Button';

interface ImageUploaderProps {
  value?: string | null;
  onChange: (url: string) => void;
  className?: string;
}

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export default function ImageUploader({ value, onChange, className = '' }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [signatureInfo, setSignatureInfo] = useState<CloudinarySignatureData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    adminApi.getMediaSignature().then(setSignatureInfo).catch(() => {});
  }, []);

  const handleFile = async (file: File) => {
    setUploadError(null);

    // Validate type
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (JPEG, PNG, WEBP).');
      return;
    }

    // Validate size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setUploadError('Image size exceeds 5MB limit. Please choose a smaller photo.');
      return;
    }

    try {
      setIsUploading(true);
      const uploadedUrl = await adminApi.uploadProductImage(file);
      onChange(uploadedUrl);
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between text-xs">
        <label className="font-medium text-tide flex items-center gap-1.5">
          <ImageIcon className="w-4 h-4 text-harbor" />
          Product Photo
        </label>
        <span className="text-[11px] font-semibold text-slate flex items-center gap-1">
          <CloudLightning className="w-3.5 h-3.5 text-harbor" />
          {signatureInfo?.configured ? 'Cloudinary CDN' : 'Cloudinary Pipeline (Test Mode)'}
        </span>
      </div>

      {value ? (
        // Preview State with Replace / Remove
        <div className="relative border border-fog rounded-xl p-3 bg-mist/40 flex items-center gap-4">
          <div className="w-20 h-20 rounded-lg overflow-hidden bg-white border border-fog/80 shrink-0">
            <img
              src={value}
              alt="Uploaded product preview"
              className="w-full h-full object-cover object-center"
            />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-tide truncate">Photo attached</p>
            <p className="text-[11px] text-slate truncate mt-0.5" title={value}>
              {value.startsWith('data:') ? 'Local preview data' : value}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="h-7 px-2.5 text-xs font-medium"
              >
                Replace
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => onChange('')}
                disabled={isUploading}
                className="h-7 px-2.5 text-xs text-buoy hover:bg-buoy/10"
              >
                <X className="w-3.5 h-3.5 mr-1" />
                Remove
              </Button>
            </div>
          </div>
        </div>
      ) : (
        // Dropzone State
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-150 ${
            isDragging
              ? 'border-harbor bg-wash/60 scale-[1.01]'
              : 'border-fog hover:border-edge bg-white hover:bg-mist/30'
          } ${isUploading ? 'opacity-70 pointer-events-none' : ''}`}
        >
          {isUploading ? (
            <div className="flex flex-col items-center justify-center py-2">
              <Loader2 className="w-8 h-8 text-harbor animate-spin mb-2" />
              <p className="text-xs font-medium text-tide">Uploading to Cloudinary CDN...</p>
              <p className="text-[11px] text-slate mt-0.5">Optimizing WebP transformations</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-1">
              <div className="w-10 h-10 rounded-full bg-sand/40 text-harbor flex items-center justify-center mb-2">
                <UploadCloud className="w-5 h-5" />
              </div>
              <p className="text-xs font-medium text-tide">
                <span className="text-harbor font-semibold underline underline-offset-2">
                  Click to upload
                </span>{' '}
                or drag and drop photo
              </p>
              <p className="text-[11px] text-slate mt-1">PNG, JPG or WEBP up to 5MB</p>
            </div>
          )}
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleInputChange}
        className="hidden"
      />

      {/* Error Message */}
      {uploadError && (
        <p className="text-xs text-buoy mt-1 flex items-center gap-1 font-medium">
          <X className="w-3.5 h-3.5 shrink-0" />
          {uploadError}
        </p>
      )}
    </div>
  );
}
