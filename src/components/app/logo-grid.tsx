'use client';

import Image from 'next/image';
import { Download, Scaling, Wand2, Sparkles } from 'lucide-react';
import { type Logo } from '@/app/page';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { useState } from 'react';

interface LogoGridProps {
  logos: Logo[];
  onSelectLogo: (logo: Logo) => void;
  isLoading: boolean;
  gridSize: '3x3' | '4x4';
  isAuthenticated: boolean;
  onUpscale?: (logo: Logo) => void;
  onGenerateVariations?: (logo: Logo) => void;
  isSingleImage?: boolean;
}

export default function LogoGrid(props: LogoGridProps) {
  const {
    logos,
    onSelectLogo,
    isLoading,
    gridSize,
    isAuthenticated,
    isSingleImage = false,
  } = props;
  const { toast } = useToast();
  
  // For single images, use grid-cols-1 to make it full width
  const gridCols = isSingleImage 
    ? 'grid-cols-1' 
    : gridSize === '3x3' 
      ? 'grid-cols-2 sm:grid-cols-3' 
      : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4';
  const skeletonCount = gridSize === '3x3' ? 9 : 16;

  const handleDownload = async (logo: Logo, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!logo?.url) return;

    try {
      const filename = logo.isUnsaved ? 'zapmark-logo-unsaved.png' : `zapmark-logo-${logo.id}.png`;
      
      // For data URLs, download directly
      if (logo.url.startsWith('data:')) {
        const link = document.createElement('a');
        link.href = logo.url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // For Firebase Storage URLs, fetch and convert to blob
        const response = await fetch(logo.url);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up blob URL
        setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
      }
      
      toast({
        title: 'Download Started',
        description: 'Your logo is being downloaded.',
      });
    } catch (error) {
      console.error('Download failed:', error);
      toast({
        variant: 'destructive',
        title: 'Download Failed',
        description: 'Could not download the logo.',
      });
    }
  };

  const handleUpscale = (logo: Logo, e: React.MouseEvent) => {
    e.stopPropagation();
    // This will be handled by the parent component
    if (props.onUpscale) {
      props.onUpscale(logo);
    }
  };

  const handleVariations = (logo: Logo, e: React.MouseEvent) => {
    e.stopPropagation();
    // This will be handled by the parent component
    if (props.onGenerateVariations) {
      props.onGenerateVariations(logo);
    }
  };

  const handleEdit = (logo: Logo, e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectLogo(logo);
  };

  const renderSkeletons = () => (
     <div className={cn('grid gap-3 md:gap-4', gridCols)}>
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <AspectRatio key={i} ratio={1 / 1}>
            <Skeleton className="w-full h-full rounded-lg" />
          </AspectRatio>
        ))}
      </div>
  )

  if (isLoading) {
    return renderSkeletons();
  }
  
  if (!logos || logos.length === 0) {
    return null;
  }

  return (
    <div className={cn('grid gap-3 md:gap-4', gridCols)}>
      {logos.map((logo, index) => {
        const [imageLoaded, setImageLoaded] = useState(false);
        
        return (
          <motion.div
            key={logo.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ 
              duration: 0.3,
              delay: index * 0.05,
              ease: [0.4, 0, 0.2, 1]
            }}
          >
            <Card
              className="group relative overflow-hidden rounded-xl shadow-sm transition-all hover:shadow-lg hover:-translate-y-1 cursor-pointer"
              onClick={() => onSelectLogo(logo)}
            >
            <AspectRatio ratio={1 / 1} className="bg-card flex items-center justify-center">
              {!imageLoaded && (
                <Skeleton className="absolute inset-0 w-full h-full" />
              )}
              <Image
                src={logo.url}
                alt="Generated logo"
                fill
                className={cn(
                  "object-contain transition-all duration-300",
                  imageLoaded ? "opacity-100 group-hover:scale-105" : "opacity-0"
                )}
                data-ai-hint="logo design"
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                loading="lazy"
                onLoad={() => setImageLoaded(true)}
                unoptimized
              />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-1.5 px-3">
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-9 px-2.5 bg-white/95 hover:bg-white text-foreground shadow-lg text-xs"
                  onClick={(e) => handleDownload(logo, e)}
                  aria-label="Download logo"
                >
                  <Download className="h-3.5 w-3.5 mr-1" />
                  Download
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-9 w-9 bg-white/95 hover:bg-white text-foreground shadow-lg"
                  onClick={(e) => handleVariations(logo, e)}
                  aria-label="Generate variations"
                  title="Generate 3x3 variations"
                >
                  <Sparkles className="h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-9 w-9 bg-white/95 hover:bg-white text-foreground shadow-lg"
                  onClick={(e) => handleUpscale(logo, e)}
                  aria-label="Upscale logo"
                  title="Upscale to high resolution"
                >
                  <Scaling className="h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-9 w-9 bg-white/95 hover:bg-white text-foreground shadow-lg"
                  onClick={(e) => handleEdit(logo, e)}
                  aria-label="Edit logo"
                  title="Edit with AI"
                >
                  <Wand2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            </AspectRatio>
          </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
