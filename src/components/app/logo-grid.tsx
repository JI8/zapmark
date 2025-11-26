'use client';

import Image from 'next/image';
import { Download, Scaling, Sparkles, Shuffle, Lock, MessageSquare, Grid3x3, Square, X, Send, Check, Pencil } from 'lucide-react';
import { type Logo } from '@/app/app/page';
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
  gridSize: '2x2' | '3x3' | '4x4';
  isAuthenticated: boolean;
  onUpscale?: (logo: Logo) => void;
  onGenerateVariations?: (logo: Logo) => void;
  onGenerateVariety?: (logo: Logo) => void;
  onEdit?: (logo: Logo, prompt: string, mode: 'single' | 'grid') => void;
  isSingleImage?: boolean;
  isTrial?: boolean;
  onTrialAction?: () => void;
  selectedLogoIds?: Set<string>;
  onToggleSelection?: (logoId: string) => void;
}

export default function LogoGrid(props: LogoGridProps) {
  const {
    logos,
    onSelectLogo,
    isLoading,
    gridSize,
    isAuthenticated,
    isSingleImage = false,
    isTrial = false,
    onTrialAction,
    selectedLogoIds = new Set(),
    onToggleSelection,
  } = props;
  const { toast } = useToast();

  // For single images, use grid-cols-1 to make it full width
  const gridCols = isSingleImage
    ? 'grid-cols-1'
    : gridSize === '2x2'
      ? 'grid-cols-1 sm:grid-cols-2'
      : gridSize === '3x3'
        ? 'grid-cols-1 sm:grid-cols-3'
        : 'grid-cols-1 sm:grid-cols-4';
  const skeletonCount = isSingleImage ? 1 : gridSize === '2x2' ? 4 : gridSize === '3x3' ? 9 : 16;

  const handleDownload = async (logo: Logo, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isTrial) {
      onTrialAction?.();
      return;
    }
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
    if (isTrial) {
      onTrialAction?.();
      return;
    }
    // This will be handled by the parent component
    if (props.onUpscale) {
      props.onUpscale(logo);
    }
  };

  const handleVariations = (logo: Logo, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isTrial) {
      onTrialAction?.();
      return;
    }
    // This will be handled by the parent component
    if (props.onGenerateVariations) {
      props.onGenerateVariations(logo);
    }
  };

  const handleVariety = (logo: Logo, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isTrial) {
      onTrialAction?.();
      return;
    }
    // This will be handled by the parent component
    if (props.onGenerateVariety) {
      props.onGenerateVariety(logo);
    }
  };

  const handleEdit = (logo: Logo, prompt: string, mode: 'single' | 'grid', e: React.MouseEvent) => {
    e.stopPropagation();
    if (isTrial) {
      onTrialAction?.();
      return;
    }
    if (props.onEdit && prompt.trim()) {
      props.onEdit(logo, prompt, mode);
    }
  };

  const renderSkeletons = () => (
    <div className={cn('grid gap-3 md:gap-4', gridCols)}>
      {Array.from({ length: skeletonCount }).map((_, i) => (
        <AspectRatio key={i} ratio={1 / 1}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0.1, 1, 0.1],
            }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.1
            }}
            className="w-full h-full rounded-xl bg-muted/40 border-2 border-muted/20"
          />
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
        const [showEditor, setShowEditor] = useState(false);
        const [editMode, setEditMode] = useState<'single' | 'grid'>('single');
        const [editPrompt, setEditPrompt] = useState('');

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
            className={cn(
              "relative transition-all",
              showEditor ? "z-20" : "z-0 hover:z-10"
            )}
          >
            <Card
              className="group relative overflow-visible rounded-xl shadow-sm transition-all hover:shadow-lg hover:-translate-y-1 cursor-pointer"
              onClick={() => {
                if (onToggleSelection) {
                  onToggleSelection(logo.id);
                } else {
                  onSelectLogo(logo);
                }
              }}
            >
              <AspectRatio ratio={1 / 1} className="bg-card flex items-center justify-center overflow-hidden relative">
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
                {/* Subtle overlay on hover */}
                <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                {/* Selection Checkbox - Top Left */}
                {onToggleSelection && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleSelection(logo.id);
                    }}
                    className={cn(
                      "absolute top-2 left-2 z-10 w-6 h-6 rounded-md border-2 transition-all duration-200 flex items-center justify-center",
                      selectedLogoIds.has(logo.id)
                        ? "bg-primary border-primary text-white scale-100"
                        : "bg-white/80 backdrop-blur-sm border-gray-300 hover:border-primary hover:bg-white opacity-0 group-hover:opacity-100"
                    )}
                    aria-label={selectedLogoIds.has(logo.id) ? "Deselect image" : "Select image"}
                  >
                    {selectedLogoIds.has(logo.id) && (
                      <Check className="w-4 h-4" strokeWidth={3} />
                    )}
                  </button>
                )}

                {/* Pencil Icon - Top Right */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectLogo(logo);
                  }}
                  className="absolute top-2 right-2 z-10 w-6 h-6 rounded-md bg-white/80 backdrop-blur-sm border-2 border-gray-300 hover:border-primary hover:bg-white opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center"
                  aria-label="Open in sidebar"
                >
                  <Pencil className="w-3.5 h-3.5 text-gray-700" />
                </button>
              </AspectRatio>

              {/* Floating action bar - positioned outside AspectRatio to allow overflow */}
              <div className={cn(
                "absolute left-1/2 -translate-x-1/2 transition-all duration-300",
                showEditor
                  ? "top-[calc(100%-1.5rem)] z-20"
                  : "-bottom-6 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 translate-y-2 z-10 pointer-events-none"
              )}>
                {!showEditor ? (
                  <div className="flex items-center gap-2 bg-white dark:bg-gray-900 rounded-full shadow-2xl p-2 border border-gray-200 dark:border-gray-700 pointer-events-auto">
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "h-11 w-11 rounded-full hover:bg-primary hover:text-white transition-all",
                        isTrial && "opacity-60"
                      )}
                      onClick={(e) => handleDownload(logo, e)}
                      aria-label={isTrial ? "Sign up to download" : "Download"}
                      title={isTrial ? "Sign up to download" : "Download"}
                    >
                      {isTrial ? <Lock className="h-5 w-5" /> : <Download className="h-5 w-5" />}
                    </Button>
                    <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "h-11 w-11 rounded-full hover:bg-primary hover:text-white transition-all",
                        isTrial && "opacity-60"
                      )}
                      onClick={(e) => handleUpscale(logo, e)}
                      aria-label={isTrial ? "Sign up to upscale" : "Upscale"}
                      title={isTrial ? "Sign up to upscale" : "Upscale"}
                    >
                      {isTrial ? <Lock className="h-5 w-5" /> : <Scaling className="h-5 w-5" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "h-11 w-11 rounded-full hover:bg-primary hover:text-white transition-all",
                        isTrial && "opacity-60"
                      )}
                      onClick={(e) => handleVariations(logo, e)}
                      aria-label={isTrial ? "Sign up for variations" : "Variations"}
                      title={isTrial ? "Sign up for variations" : "Variations"}
                    >
                      {isTrial ? <Lock className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "h-11 w-11 rounded-full hover:bg-primary hover:text-white transition-all",
                        isTrial && "opacity-60"
                      )}
                      onClick={(e) => handleVariety(logo, e)}
                      aria-label={isTrial ? "Sign up for variety" : "Variety"}
                      title={isTrial ? "Sign up for variety" : "Variety"}
                    >
                      {isTrial ? <Lock className="h-5 w-5" /> : <Shuffle className="h-5 w-5" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-11 w-11 rounded-full hover:bg-primary hover:text-white transition-all"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowEditor(true);
                      }}
                      aria-label="Edit with instructions"
                      title="Edit with instructions"
                    >
                      <MessageSquare className="h-5 w-5" />
                    </Button>
                  </div>
                ) : (
                  <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden min-w-[280px] w-max pointer-events-auto">
                    {/* Top row - Toggle and Close */}
                    <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-gray-700 whitespace-nowrap">
                      <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-full p-1">
                        <button
                          className={cn(
                            "p-2 rounded-full transition-all",
                            editMode === 'single'
                              ? "bg-white dark:bg-gray-700 shadow-sm"
                              : "hover:bg-gray-200 dark:hover:bg-gray-700"
                          )}
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditMode('single');
                          }}
                          title="Edit single image"
                        >
                          <Square className="h-4 w-4" />
                        </button>
                        <button
                          className={cn(
                            "p-2 rounded-full transition-all",
                            editMode === 'grid'
                              ? "bg-white dark:bg-gray-700 shadow-sm"
                              : "hover:bg-gray-200 dark:hover:bg-gray-700"
                          )}
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditMode('grid');
                          }}
                          title="Edit as grid"
                        >
                          <Grid3x3 className="h-4 w-4" />
                        </button>
                      </div>
                      <button
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowEditor(false);
                          setEditPrompt('');
                        }}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    {/* Bottom row - Input and Send */}
                    <div className="flex items-center gap-2 p-2">
                      <input
                        type="text"
                        placeholder="Describe changes..."
                        value={editPrompt}
                        onChange={(e) => setEditPrompt(e.target.value)}
                        className="flex-1 px-3 py-2 text-sm bg-transparent focus:outline-none min-w-[200px]"
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && editPrompt.trim()) {
                            handleEdit(logo, editPrompt, editMode, e as any);
                            setShowEditor(false);
                            setEditPrompt('');
                          }
                        }}
                        autoFocus
                      />
                      <Button
                        size="icon"
                        className="h-9 w-9 rounded-full flex-shrink-0"
                        disabled={!editPrompt.trim()}
                        onClick={(e) => {
                          handleEdit(logo, editPrompt, editMode, e);
                          setShowEditor(false);
                          setEditPrompt('');
                        }}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
