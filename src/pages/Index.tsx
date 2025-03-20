import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { toast } from 'sonner';
import ImageDropzone from '@/components/ImageDropzone';
import ImagePreview from '@/components/ImagePreview';
import ConversionCard from '@/components/ConversionCard';
import { 
  convertImage, 
  downloadBlob, 
  createThumbnailUrl, 
  createMosaicPieces,
  downloadBlobsAsZip
} from '@/utils/imageProcessor';
import { ChevronLeft, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type ImageStatus = 'idle' | 'processing' | 'completed' | 'error';

interface ImageItem {
  file: File;
  status: ImageStatus;
  convertedBlob?: Blob;
  convertedUrl?: string | null;
  mosaicPieces?: Blob[];
}

const Index = () => {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);
  const [mosaicMode, setMosaicMode] = useState(false);
  
  useEffect(() => {
    const handleResize = () => {
      setViewportHeight(window.innerHeight);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const stats = useMemo(() => {
    const completed = images.filter(img => img.status === 'completed').length;
    const total = images.length;
    return { completed, total };
  }, [images]);

  const handleFilesAdded = useCallback((files: File[]) => {
    const newImages = files.map(file => ({
      file,
      status: 'idle' as ImageStatus,
    }));
    
    setImages(prev => [...prev, ...newImages]);
    processImages([...images, ...newImages]);
    
    toast.success(`${files.length} ${files.length === 1 ? 'imagem adicionada' : 'imagens adicionadas'}`);
  }, [images]);

  const processImages = useCallback(async (imagesToProcess: ImageItem[]) => {
    if (isProcessing) return;
    
    const pendingImages = imagesToProcess.filter(img => img.status === 'idle');
    if (pendingImages.length === 0) return;
    
    setIsProcessing(true);
    
    for (let i = 0; i < pendingImages.length; i++) {
      const index = imagesToProcess.findIndex(img => img === pendingImages[i]);
      
      if (index === -1) continue;
      
      setImages(current => 
        current.map((img, idx) => 
          idx === index ? { ...img, status: 'processing' } : img
        )
      );
      
      try {
        if (mosaicMode) {
          const mosaicPieces = await createMosaicPieces(pendingImages[i].file, 2050, 2994);
          
          const firstPieceUrl = URL.createObjectURL(mosaicPieces[0]);
          
          setImages(current => 
            current.map((img, idx) => 
              idx === index 
                ? { ...img, status: 'completed', mosaicPieces, convertedUrl: firstPieceUrl } 
                : img
            )
          );
        } else {
          const convertedBlob = await convertImage(pendingImages[i].file, 2050, 2994);
          const convertedUrl = URL.createObjectURL(convertedBlob);
          
          setImages(current => 
            current.map((img, idx) => 
              idx === index 
                ? { ...img, status: 'completed', convertedBlob, convertedUrl } 
                : img
            )
          );
        }
      } catch (error) {
        console.error('Error processing image:', error);
        
        setImages(current => 
          current.map((img, idx) => 
            idx === index ? { ...img, status: 'error' } : img
          )
        );
        
        toast.error(`Erro ao processar ${pendingImages[i].file.name}`);
      }
    }
    
    setIsProcessing(false);
  }, [isProcessing, mosaicMode]);

  const handleRemoveImage = useCallback((index: number) => {
    setImages(images => {
      const newImages = [...images];
      
      if (newImages[index].convertedUrl) {
        URL.revokeObjectURL(newImages[index].convertedUrl);
      }
      
      newImages.splice(index, 1);
      return newImages;
    });
  }, []);

  const handleDownloadImage = useCallback((index: number) => {
    const image = images[index];
    
    if (image.status !== 'completed') {
      toast.error('A imagem ainda não está pronta para download');
      return;
    }
    
    try {
      console.log('Downloading image:', image.file.name, 'Mosaic mode:', mosaicMode);
      
      if (mosaicMode && image.mosaicPieces && image.mosaicPieces.length > 0) {
        const baseFilename = image.file.name.replace(/\.[^/.]+$/, '');
        console.log('Downloading mosaic with pieces:', image.mosaicPieces.length);
        
        downloadBlobsAsZip(image.mosaicPieces, baseFilename)
          .then(() => {
            toast.success(`Mosaico de ${image.file.name} baixado com sucesso`);
          })
          .catch((error) => {
            console.error('Failed to download mosaic:', error);
            toast.error(`Falha ao baixar o mosaico: ${error.message}`);
          });
      } else if (!mosaicMode && image.convertedBlob) {
        const filename = image.file.name.replace(
          /\.[^/.]+$/, 
          `_resized.${image.file.name.split('.').pop()}`
        );
        
        downloadBlob(image.convertedBlob, filename);
        toast.success(`${filename} baixada com sucesso`);
      } else {
        console.error('Missing data for download:', { 
          hasConvertedBlob: !!image.convertedBlob,
          hasMosaicPieces: !!image.mosaicPieces,
          mosaicPiecesCount: image.mosaicPieces?.length
        });
        
        if (mosaicMode && image.convertedBlob) {
          const filename = image.file.name.replace(
            /\.[^/.]+$/, 
            `_resized.${image.file.name.split('.').pop()}`
          );
          downloadBlob(image.convertedBlob, filename);
          toast.success(`${filename} baixada com sucesso`);
        } else {
          toast.error('Imagem não disponível para download. Tente converter novamente.');
        }
      }
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Erro ao baixar a imagem');
    }
  }, [images, mosaicMode]);

  const handleDownloadAll = useCallback(() => {
    const completedImages = images.filter(img => img.status === 'completed');
    
    if (completedImages.length === 0) {
      toast.error('Nenhuma imagem pronta para download');
      return;
    }
    
    try {
      if (mosaicMode) {
        let downloadedCount = 0;
        completedImages.forEach((image, index) => {
          if (!image.mosaicPieces || image.mosaicPieces.length === 0) {
            console.warn('Skipping image with no mosaic pieces:', image.file.name);
            if (image.convertedBlob) {
              const filename = image.file.name.replace(
                /\.[^/.]+$/, 
                `_resized.${image.file.name.split('.').pop()}`
              );
              setTimeout(() => {
                downloadBlob(image.convertedBlob!, filename);
                downloadedCount++;
              }, index * 100);
            }
            return;
          }
          
          const baseFilename = image.file.name.replace(/\.[^/.]+$/, '');
          console.log(`Downloading mosaic for ${baseFilename} with ${image.mosaicPieces.length} pieces`);
          
          setTimeout(() => {
            downloadBlobsAsZip(image.mosaicPieces!, baseFilename)
              .then(() => {
                downloadedCount++;
                toast.success(`Mosaico de ${image.file.name} baixado`);
              })
              .catch(error => {
                console.error('Failed to download mosaic:', error);
                toast.error(`Falha ao baixar o mosaico ${baseFilename}`);
              });
          }, index * 1000);
        });
        
        toast.success(
          `${completedImages.length} ${
            completedImages.length === 1 ? 'mosaico será baixado' : 'mosaicos serão baixados'
          }`
        );
      } else {
        completedImages.forEach((image, index) => {
          if (!image.convertedBlob) {
            console.warn('Skipping image with no converted blob:', image.file.name);
            return;
          }
          
          const filename = image.file.name.replace(
            /\.[^/.]+$/, 
            `_resized.${image.file.name.split('.').pop()}`
          );
          
          setTimeout(() => {
            downloadBlob(image.convertedBlob!, filename);
          }, index * 100);
        });
        
        toast.success(
          `${completedImages.length} ${
            completedImages.length === 1 ? 'imagem baixada' : 'imagens baixadas'
          }`
        );
      }
    } catch (error) {
      console.error('Download all error:', error);
      toast.error('Erro ao baixar as imagens');
    }
  }, [images, mosaicMode]);

  const handleReset = useCallback(() => {
    images.forEach(image => {
      if (image.convertedUrl) {
        URL.revokeObjectURL(image.convertedUrl);
      }
    });
    
    setImages([]);
    toast.info('Todas as imagens foram removidas');
  }, [images]);

  const handleMosaicModeChange = useCallback((enabled: boolean) => {
    if (images.length > 0) {
      toast.error('Remova todas as imagens antes de mudar o modo');
      return;
    }
    
    setMosaicMode(enabled);
    
    if (enabled) {
      toast.info('Modo mosaico ativado. Cada imagem será dividida em 9 partes iguais.');
    } else {
      toast.info('Modo mosaico desativado. As imagens serão redimensionadas normalmente.');
    }
  }, [images.length]);

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-background to-secondary/20">
      <div className="container max-w-6xl mx-auto px-4 py-8 md:py-16" 
           style={{ minHeight: viewportHeight }}>
        <header className="mb-8 md:mb-12 text-center animate-fade-in opacity-0" style={{ animationDelay: '0.1s', animationFillMode: 'forwards' }}>
          <div className="flex justify-center items-center gap-6 mb-4">
            <img 
              src={import.meta.env.BASE_URL + "header-image-1.webp"} 
              alt="CGEMP Vale do Capibaribe" 
              className="h-16 md:h-20 w-auto object-contain" 
            />
            <img 
              src={import.meta.env.BASE_URL + "header-image-2.webp"} 
              alt="GRE Vale do Capibaribe - O Vale da Educação" 
              className="h-20 md:h-24 w-auto object-contain" 
            />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2 text-balance">
            Redimensione suas imagens com precisão
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-balance">
            Transforme suas imagens para 2050px horizontal ou 2994px vertical mantendo a qualidade.
            {mosaicMode && " No modo mosaico, cada imagem é dividida em 9 partes para impressão em folhas A4."}
          </p>
        </header>
        
        <div className="grid gap-8 md:grid-cols-4 animate-fade-in opacity-0" style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}>
          <div className="col-span-full md:col-span-1 flex flex-col gap-6">
            <ConversionCard 
              totalImages={stats.total}
              processedImages={stats.completed}
              onDownloadAll={handleDownloadAll}
              onReset={handleReset}
              isProcessing={isProcessing}
              mosaicMode={mosaicMode}
              onMosaicModeChange={handleMosaicModeChange}
            />
            
            {images.length > 0 && (
              <div className="hidden md:block text-sm text-muted-foreground">
                <p className="font-medium mb-1">Especificações:</p>
                <ul className="list-disc ml-4 space-y-1">
                  <li>Horizontal: 2050px</li>
                  <li>Vertical: 2994px</li>
                  <li>Formatos: JPG, PNG, WebP</li>
                  {mosaicMode && (
                    <li className="text-primary">Mosaico: 3×3 partes</li>
                  )}
                </ul>
              </div>
            )}
          </div>
          
          <div className="col-span-full md:col-span-3">
            {images.length === 0 ? (
              <div className="glass-panel rounded-xl overflow-hidden animate-slide-up opacity-0" style={{ animationFillMode: 'forwards' }}>
                <ImageDropzone onFilesAdded={handleFilesAdded} />
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-muted-foreground"
                      onClick={handleReset}
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Voltar
                    </Button>
                  </div>
                  
                  <div className="glass-panel rounded-full px-4 py-1 text-xs text-muted-foreground">
                    {stats.completed} de {stats.total} {stats.total === 1 ? 'imagem' : 'imagens'} convertidas
                  </div>
                </div>
                
                <div className={cn(
                  "grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4"
                )}>
                  {images.map((image, index) => (
                    <ImagePreview
                      key={`${image.file.name}-${index}`}
                      file={image.file}
                      convertedUrl={image.convertedUrl || null}
                      onRemove={() => handleRemoveImage(index)}
                      index={index}
                      status={image.status}
                      onDownload={() => handleDownloadImage(index)}
                      isMosaicMode={mosaicMode}
                      mosaicPieceCount={image.mosaicPieces?.length || 0}
                    />
                  ))}
                  
                  <div className="glass-panel rounded-xl overflow-hidden flex items-center justify-center p-6 aspect-square cursor-pointer hover:bg-secondary/30 transition-colors"
                       onClick={() => document.getElementById('add-more')?.click()}>
                    <input
                      id="add-more"
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.length) {
                          handleFilesAdded(Array.from(e.target.files));
                        }
                      }}
                    />
                    <span className="w-12 h-12 flex items-center justify-center rounded-full bg-background border-2 border-border">
                      <Image className="w-6 h-6 text-primary" />
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <footer className="mt-16 text-center text-sm text-muted-foreground animate-fade-in opacity-0" style={{ animationDelay: '0.3s', animationFillMode: 'forwards' }}>
          <p>
            {mosaicMode 
              ? "Crie mosaicos 3×3 para impressão em folhas A4 e monte painéis de grande formato" 
              : "Redimensione múltiplas imagens rapidamente sem comprometer a qualidade"}
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
