import React, { useCallback } from 'react';
import { Upload, FileCode } from 'lucide-react';

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  disabled: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFilesSelected, disabled }) => {
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (disabled) return;
      const files = Array.from(e.dataTransfer.files).filter((file: File) =>
        file.type === 'text/html' || 
        file.name.toLowerCase().endsWith('.html') || 
        file.name.toLowerCase().endsWith('.htm') ||
        file.name.toLowerCase().endsWith('.mhtml')
      );
      if (files.length > 0) {
        onFilesSelected(files);
      }
    },
    [onFilesSelected, disabled]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled || !e.target.files) return;
      const files = Array.from(e.target.files);
      onFilesSelected(files);
    },
    [onFilesSelected, disabled]
  );

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
        disabled
          ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
          : 'border-primary/40 bg-blue-50/50 hover:border-primary hover:bg-blue-50 cursor-pointer'
      }`}
    >
      <input
        type="file"
        multiple
        accept=".html,.htm,.mhtml"
        onChange={handleChange}
        disabled={disabled}
        className="hidden"
        id="file-upload"
      />
      <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
        <div className={`p-4 rounded-full mb-4 ${disabled ? 'bg-gray-100 text-gray-400' : 'bg-white text-primary shadow-sm'}`}>
          <Upload size={32} />
        </div>
        <h3 className="text-lg font-semibold text-slate-800 mb-2">
          Upload HTML Files
        </h3>
        <p className="text-sm text-slate-500 max-w-sm mx-auto">
          Drag & drop your HTML or MHTML reports, or click to browse. 
          Support for multiple files at once.
        </p>
        <div className="mt-4 flex items-center gap-2 text-xs text-slate-400 font-medium bg-white px-3 py-1 rounded-full border border-slate-100">
           <FileCode size={14} />
           <span>Supports .html, .htm, .mhtml</span>
        </div>
      </label>
    </div>
  );
};