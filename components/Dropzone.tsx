import React, { useCallback, useState } from 'react';
import { UploadCloud } from 'lucide-react';
import { Translation } from '../App';

interface DropzoneProps {
  onFilesSelected: (files: File[]) => void;
  isProcessing: boolean;
  t: Translation;
}

const Dropzone: React.FC<DropzoneProps> = ({ onFilesSelected, isProcessing, t }) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (isProcessing) return;

    const files = Array.from(e.dataTransfer.files).filter(
      (file: File) => file.name.toLowerCase().endsWith('.torrent')
    );
    
    if (files.length > 0) {
      onFilesSelected(files);
    } else {
        alert(t.invalidFile);
    }
  }, [onFilesSelected, isProcessing, t]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files).filter(
        (file: File) => file.name.toLowerCase().endsWith('.torrent')
      );
      if (files.length > 0) {
        onFilesSelected(files);
      } else {
        alert(t.invalidFile);
      }
    }
    // Reset value to allow selecting same file again
    e.target.value = '';
  }, [onFilesSelected, t]);

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        relative group cursor-pointer
        border-2 border-dashed rounded-lg p-12 text-center transition-all duration-200 ease-in-out
        ${isDragOver 
          ? 'border-gov-blue bg-blue-50' 
          : 'border-gray-300 bg-white hover:border-gov-blue hover:bg-gray-50'
        }
        ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <input
        type="file"
        multiple
        accept=".torrent"
        onChange={handleFileInput}
        disabled={isProcessing}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
      />
      
      <div className="flex flex-col items-center justify-center space-y-4 pointer-events-none">
        <div className={`
          p-4 rounded-full transition-colors duration-200
          ${isDragOver ? 'bg-blue-100 text-gov-blue' : 'bg-gray-100 text-gray-500 group-hover:bg-blue-100 group-hover:text-gov-blue'}
        `}>
          <UploadCloud className="w-10 h-10" />
        </div>
        
        <div className="space-y-1">
          <p className="text-lg font-medium text-gray-700 font-serif">
            {t.dropTitle}
          </p>
          <p className="text-sm text-gray-500">
            {t.dropSub} <span className="font-mono font-medium text-gov-blue">.torrent</span>
          </p>
        </div>

        {isDragOver && (
            <div className="absolute inset-0 flex items-center justify-center bg-blue-50/80 rounded-lg backdrop-blur-sm">
                <p className="text-gov-blue font-bold text-lg">{t.dropActive}</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default Dropzone;