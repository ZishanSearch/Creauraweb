
import React, { useRef, useCallback } from 'react';
import { UploadIcon } from './Icons';

interface ImageUploaderProps {
  label: string;
  onImageUpload: (file: File) => void;
  preview: string | null;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ label, onImageUpload, preview }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImageUpload(file);
    }
  };

  const handleClick = () => {
    inputRef.current?.click();
  };
  
  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  }, []);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
        onImageUpload(file);
    }
  }, [onImageUpload]);


  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-600 mb-2">{label}</label>
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className="group w-full aspect-square bg-white rounded-xl border-2 border-dashed border-gray-300 cursor-pointer flex items-center justify-center transition-all duration-300 hover:border-gray-500 hover:bg-gray-50 relative overflow-hidden shadow-sm"
      >
        <input
          type="file"
          ref={inputRef}
          onChange={handleFileChange}
          accept="image/png, image/jpeg, image/webp"
          className="hidden"
        />
        {preview ? (
          <img src={preview} alt={label} className="w-full h-full object-cover" />
        ) : (
          <div className="text-center text-gray-500">
            <UploadIcon className="mx-auto h-12 w-12 text-gray-400 group-hover:text-gray-600 transition-colors" />
            <p className="mt-2 text-sm">
              Click to upload or drag & drop
            </p>
            <p className="text-xs text-gray-400">PNG, JPG, WEBP</p>
          </div>
        )}
      </div>
    </div>
  );
};
