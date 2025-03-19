
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, RefreshCw, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConversionCardProps {
  totalImages: number;
  processedImages: number;
  onDownloadAll: () => void;
  onReset: () => void;
  isProcessing: boolean;
}

const ConversionCard: React.FC<ConversionCardProps> = ({
  totalImages,
  processedImages,
  onDownloadAll,
  onReset,
  isProcessing
}) => {
  const progress = totalImages > 0 ? (processedImages / totalImages) * 100 : 0;

  return (
    <Card className="w-full bg-card/80 backdrop-blur-sm border rounded-xl overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium flex items-center justify-between">
          <span>Conversor de Imagens</span>
          {isProcessing && (
            <RefreshCw className="w-4 h-4 animate-spin text-primary" />
          )}
        </CardTitle>
        <CardDescription>
          Redimensionar para 2050px horizontal ou 2994px vertical
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pb-2">
        {totalImages > 0 && (
          <>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progresso</span>
              <span className="font-medium">{processedImages} de {totalImages}</span>
            </div>
            
            <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
              <div 
                className={cn(
                  "h-full bg-primary transition-all duration-300",
                  isProcessing ? "animate-pulse-subtle" : ""
                )}
                style={{ width: `${progress}%` }}
              />
            </div>
          </>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between gap-2 pt-2">
        {totalImages > 0 ? (
          <>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onReset}
              className="w-1/2 group"
              disabled={isProcessing}
            >
              <Trash2 className="w-4 h-4 mr-2 group-hover:text-destructive" />
              Limpar
            </Button>
            
            <Button 
              size="sm" 
              onClick={onDownloadAll}
              className="w-1/2"
              disabled={processedImages === 0 || isProcessing}
            >
              <Download className="w-4 h-4 mr-2" />
              Baixar todos
            </Button>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Selecione ou arraste imagens para começar
          </p>
        )}
      </CardFooter>
    </Card>
  );
};

export default ConversionCard;
