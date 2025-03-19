
import React, { useState, useEffect } from 'react';
import { X, Download, ArrowRight, Info, Grid3X3 } from 'lucide-react';
import { formatFileSize, getFileDetails, createThumbnailUrl } from '@/utils/imageProcessor';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface ImagePreviewProps {
  file: File;
  convertedUrl: string | null;
  onRemove: () => void;
  index: number;
  status: 'idle' | 'processing' | 'completed' | 'error';
  onDownload: () => void;
  isMosaicMode?: boolean;
  mosaicPieceCount?: number;
}

const ImagePreview: React.FC<ImagePreviewProps> = ({
  file,
  convertedUrl,
  onRemove,
  index,
  status,
  onDownload,
  isMosaicMode = false,
  mosaicPieceCount = 0
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
            <div className="relative w-full h-full">
              <img 
                src={thumbnail} 
                alt={file.name}
                className="object-cover w-full h-full transition-transform duration-300 hover:scale-105"
              />
              {isMosaicMode && status === 'completed' && (
                <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-60 pointer-events-none">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className="border border-white/50 flex items-center justify-center">
                      <span className="bg-black/50 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                        {i + 1}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
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
              
              {status === 'completed' && (
                <>
                  <ArrowRight className="w-3 h-3 mx-0.5" />
                  {isMosaicMode ? (
                    <Badge variant="outline" className="text-[10px] font-medium flex items-center gap-0.5 py-0 h-4">
                      <Grid3X3 className="w-3 h-3" />
                      <span>3×3</span>
                    </Badge>
                  ) : (
                    <span className="text-primary font-medium">2050×2994</span>
                  )}
                </>
              )}
            </div>
          )}
          
          {isMosaicMode && status === 'completed' && (
            <div className="text-xs text-muted-foreground">
              <span className="font-medium text-primary">9</span> partes de 2050×2994
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImagePreview;
