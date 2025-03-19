
import React, { useState, useEffect } from 'react';
import { X, Download, ArrowRight, Info } from 'lucide-react';
import { formatFileSize, getFileDetails, createThumbnailUrl } from '@/utils/imageProcessor';
import { cn } from '@/lib/utils';

interface ImagePreviewProps {
  file: File;
  convertedUrl: string | null;
  onRemove: () => void;
  index: number;
  status: 'idle' | 'processing' | 'completed' | 'error';
  onDownload: () => void;
}

const ImagePreview: React.FC<ImagePreviewProps> = ({
  file,
  convertedUrl,
  onRemove,
  index,
  status,
  onDownload
}) => {
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [details, setDetails] = useState<{
    width: number;
    height: number;
    size: number;
  } | null>(null);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadImage = async () => {
      try {
        const url = await createThumbnailUrl(file);
        const fileDetails = await getFileDetails(file);
        
        if (isMounted) {
          setThumbnail(url);
          setDetails({
            width: fileDetails.width,
            height: fileDetails.height,
            size: fileDetails.size
          });
        }
      } catch (error) {
        console.error('Failed to load image preview:', error);
      }
    };

    loadImage();

    return () => {
      isMounted = false;
    };
  }, [file]);

  const getStatusIndicator = () => {
    switch (status) {
      case 'processing':
        return (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
        );
      case 'error':
        return (
          <div className="absolute inset-0 flex items-center justify-center bg-destructive/30 backdrop-blur-sm">
            <span className="text-white font-medium">Erro</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div 
      className={cn(
        "relative overflow-hidden rounded-xl border transition-all duration-300",
        status === 'completed' ? 'border-primary/30 subtle-shadow' : 'border-border',
        "animate-scale-in"
      )}
      style={{ animationDelay: `${index * 0.05}s` }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <button 
        className={cn(
          "absolute top-2 right-2 z-10 rounded-full p-1 transition-all bg-black/30 hover:bg-black/50 text-white",
          isHovering || status === 'error' ? "opacity-100" : "opacity-0"
        )}
        onClick={onRemove}
      >
        <X className="w-4 h-4" />
      </button>
      
      <div className="flex flex-col h-full">
        <div className="relative aspect-square w-full overflow-hidden">
          {thumbnail ? (
            <img 
              src={thumbnail} 
              alt={file.name}
              className="object-cover w-full h-full transition-transform duration-300 hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-secondary animate-pulse flex items-center justify-center text-muted-foreground">
              <Info className="w-8 h-8" />
            </div>
          )}
          
          {getStatusIndicator()}
        </div>
        
        <div className="p-3 space-y-1.5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium truncate max-w-[160px]">
              {file.name}
            </h3>
            
            {status === 'completed' && (
              <button 
                onClick={onDownload}
                className="p-1 text-primary hover:text-primary/80 transition-colors"
              >
                <Download className="w-4 h-4" />
              </button>
            )}
          </div>
          
          {details && (
            <div className="flex items-center text-xs text-muted-foreground gap-1.5">
              <span>{details.width}×{details.height}</span>
              <span>•</span>
              <span>{formatFileSize(details.size)}</span>
              
              {status === 'completed' && convertedUrl && (
                <>
                  <ArrowRight className="w-3 h-3 mx-0.5" />
                  <span className="text-primary font-medium">2050×2994</span>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImagePreview;
