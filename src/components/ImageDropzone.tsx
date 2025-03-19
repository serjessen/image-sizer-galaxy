
import React, { useCallback, useState } from 'react';
import { Upload, ImagePlus, X, FileImage } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ImageDropzoneProps {
  onFilesAdded: (files: File[]) => void;
  maxFiles?: number;
}

const ImageDropzone: React.FC<ImageDropzoneProps> = ({ 
  onFilesAdded, 
  maxFiles = 100
}) => {
  const [isDragging, setIsDragging] = useState(false);
  
  const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  }, []);
  
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const dt = e.dataTransfer;
    
    if (!dt.files || dt.files.length === 0) {
      return;
    }
    
    // Filter for image files only
    const imageFiles = Array.from(dt.files).filter(file => 
      file.type.startsWith('image/')
    );
    
    if (imageFiles.length === 0) {
      toast.error('Por favor, selecione apenas arquivos de imagem.');
      return;
    }
    
    if (imageFiles.length > maxFiles) {
      toast.error(`Você pode selecionar no máximo ${maxFiles} imagens por vez.`);
      return;
    }
    
    onFilesAdded(imageFiles);
  }, [maxFiles, onFilesAdded]);
  
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }
    
    const imageFiles = Array.from(e.target.files).filter(file => 
      file.type.startsWith('image/')
    );
    
    if (imageFiles.length === 0) {
      toast.error('Por favor, selecione apenas arquivos de imagem.');
      return;
    }
    
    if (imageFiles.length > maxFiles) {
      toast.error(`Você pode selecionar no máximo ${maxFiles} imagens por vez.`);
      return;
    }
    
    onFilesAdded(imageFiles);
    // Clear input to allow selecting the same files again
    e.target.value = '';
  }, [maxFiles, onFilesAdded]);

  return (
    <div
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      className={cn(
        'dropzone w-full p-8 transition-all flex flex-col items-center justify-center gap-4 cursor-pointer group',
        isDragging ? 'dropzone-active scale-[1.02] subtle-shadow' : 'border-border'
      )}
    >
      <div className={cn(
        'rounded-full p-6 bg-primary/5 text-primary transition-all duration-300',
        isDragging ? 'scale-110' : 'group-hover:scale-105'
      )}>
        {isDragging ? (
          <FileImage className="w-10 h-10 animate-pulse-subtle" />
        ) : (
          <Upload className="w-10 h-10" />
        )}
      </div>
      
      <div className="text-center space-y-2">
        <h3 className="text-lg font-medium">
          {isDragging ? 'Solte suas imagens aqui' : 'Arraste e solte suas imagens'}
        </h3>
        <p className="text-muted-foreground text-sm max-w-xs mx-auto">
          ou selecione os arquivos do seu computador
        </p>
      </div>
      
      <label className="mt-2">
        <input
          type="file"
          className="hidden"
          accept="image/*"
          multiple
          onChange={handleFileInputChange}
        />
        <span className="px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium inline-flex items-center gap-2 transition-all hover:bg-primary/90 active:scale-95">
          <ImagePlus className="w-4 h-4" />
          Selecionar imagens
        </span>
      </label>
    </div>
  );
};

export default ImageDropzone;
