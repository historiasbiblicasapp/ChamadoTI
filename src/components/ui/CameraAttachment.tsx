import { useRef, useState } from 'react';
import { Camera, Paperclip, X, Image as ImageIcon } from 'lucide-react';
import { showToast } from './Toaster';

interface CameraAttachmentProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  disabled?: boolean;
}

export function CameraAttachment({ files, onFilesChange, disabled }: CameraAttachmentProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<string[]>([]);

  const handleFilesAdded = (newFilesList: FileList | null) => {
    if (!newFilesList || newFilesList.length === 0) return;

    const addedFiles = Array.from(newFilesList);
    const validFiles: File[] = [];
    const newPreviews: string[] = [...previews];

    addedFiles.forEach((file) => {
      // Limit 10MB per file
      if (file.size > 10 * 1024 * 1024) {
        showToast('error', 'Arquivo grande', `O arquivo ${file.name} excede o limite de 10MB`);
        return;
      }
      validFiles.push(file);
      if (file.type.startsWith('image/')) {
        newPreviews.push(URL.createObjectURL(file));
      } else {
        newPreviews.push('');
      }
    });

    onFilesChange([...files, ...validFiles]);
    setPreviews(newPreviews);
  };

  const removeFile = (index: number) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    const updatedPreviews = previews.filter((_, i) => i !== index);
    onFilesChange(updatedFiles);
    setPreviews(updatedPreviews);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {/* Hidden inputs for File and Camera */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleFilesAdded(e.target.files)}
          disabled={disabled}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => handleFilesAdded(e.target.files)}
          disabled={disabled}
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className="btn-secondary btn-sm flex items-center gap-1.5"
        >
          <Paperclip className="w-4 h-4 text-netvision-400" />
          Anexar Arquivo
        </button>

        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          disabled={disabled}
          className="btn-secondary btn-sm flex items-center gap-1.5"
        >
          <Camera className="w-4 h-4 text-netvision-400" />
          Tirar Foto
        </button>
      </div>

      {/* Attachments preview list */}
      {files.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 pt-2">
          {files.map((file, idx) => (
            <div key={idx} className="relative group bg-gray-800/80 border border-gray-700/80 rounded-xl p-2 flex flex-col justify-between overflow-hidden">
              {previews[idx] ? (
                <div className="w-full h-20 rounded-lg overflow-hidden mb-1 bg-black/40 flex items-center justify-center">
                  <img src={previews[idx]} alt={file.name} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-full h-20 rounded-lg bg-gray-900 flex items-center justify-center mb-1">
                  <ImageIcon className="w-6 h-6 text-gray-500" />
                </div>
              )}
              <span className="text-xs text-gray-300 truncate font-mono">{file.name}</span>
              <span className="text-[10px] text-gray-500">{(file.size / 1024).toFixed(0)} KB</span>
              
              <button
                type="button"
                onClick={() => removeFile(idx)}
                className="absolute top-1 right-1 p-1 bg-red-600/90 text-white rounded-full opacity-80 hover:opacity-100 transition-opacity"
                title="Remover"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
