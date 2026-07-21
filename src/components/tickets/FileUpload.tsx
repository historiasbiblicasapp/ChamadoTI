import { useState, useRef } from 'react';
import { Upload, X, File, Image, FileText, FileSpreadsheet, Archive } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { showToast } from '../ui/Toaster';

interface FileUploadProps {
  ticketId: string;
  onUploadComplete: (file: { file_name: string; file_url: string; file_size: number; file_type: string }) => void;
}

const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf',
  'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/zip', 'application/x-zip-compressed',
  'text/plain',
];

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

function getFileIcon(type: string) {
  if (type.startsWith('image/')) return Image;
  if (type.includes('pdf')) return FileText;
  if (type.includes('word') || type.includes('document')) return FileText;
  if (type.includes('excel') || type.includes('spreadsheet')) return FileSpreadsheet;
  if (type.includes('zip')) return Archive;
  return File;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileUpload({ ticketId, onUploadComplete }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      showToast('error', 'Tipo nao permitido', `Tipo ${file.type} nao e suportado`);
      return;
    }

    if (file.size > MAX_SIZE) {
      showToast('error', 'Arquivo muito grande', 'Tamanho maximo: 10MB');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${ticketId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('ticket-files')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('ticket-files')
        .getPublicUrl(fileName);

      onUploadComplete({
        file_name: file.name,
        file_url: urlData.publicUrl,
        file_size: file.size,
        file_type: file.type,
      });

      showToast('success', 'Arquivo enviado', `${file.name} enviado com sucesso`);
    } catch (error: any) {
      showToast('error', 'Erro no upload', error.message || 'Falha ao enviar arquivo');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept={ALLOWED_TYPES.join(',')}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleUpload(file);
          e.target.value = '';
        }}
      />

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
          dragOver
            ? 'border-netvision-400 bg-netvision-500/10'
            : 'border-gray-700 hover:border-gray-600 hover:bg-gray-800/50'
        } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <Upload className="w-8 h-8 text-gray-500 mx-auto mb-2" />
        <p className="text-sm text-gray-400">
          {uploading ? 'Enviando...' : 'Arraste um arquivo ou clique para selecionar'}
        </p>
        <p className="text-xs text-gray-600 mt-1">
          PDF, Word, Excel, Imagem, ZIP (max 10MB)
        </p>
      </div>
    </div>
  );
}
