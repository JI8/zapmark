'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useState, useEffect, useRef } from 'react';
import { Grid2x2, Grid3x3, LayoutGrid, Loader2, Sparkles, Eye, Pencil, Palette, Wand2, Plus, Upload, X } from 'lucide-react';
import { Grid2x2Graphic, Grid3x3Graphic, Grid4x4Graphic } from '@/components/ui/grid-graphics';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import StyleSelectorModal from './style-selector-modal';
import { getStyleById } from '@/lib/generation-styles';
import { cn } from '@/lib/utils';

export type InputImage = {
  id: string;
  url: string;
  source: 'selected' | 'uploaded' | 'pasted';
};

export const LogoGenSchema = z.object({
  textConcept: z.string().min(1, {
    message: 'Please enter a concept.',
  }),
  gridSize: z.enum(['2x2', '3x3', '4x4'], {
    required_error: 'You need to select a grid size.',
  }),
  styleId: z.string().default('custom'),
  inputImages: z.array(z.object({
    id: z.string(),
    url: z.string(),
    source: z.enum(['selected', 'uploaded', 'pasted']),
  })).optional().default([]),
});

type Logo = {
  id: string;
  url: string;
  isUnsaved?: boolean;
  logoGridId?: string;
  tileIndex?: number;
};

interface LogoGeneratorFormProps {
  onGenerate: (data: z.infer<typeof LogoGenSchema>) => void;
  isLoading: boolean;
  isAuthenticated: boolean;
  selectedLogos?: Logo[];
  onClearSelection?: () => void;
}

export default function LogoGeneratorForm({ onGenerate, isLoading, isAuthenticated, selectedLogos = [], onClearSelection }: LogoGeneratorFormProps) {
  const [isStyleModalOpen, setIsStyleModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof LogoGenSchema>>({
    resolver: zodResolver(LogoGenSchema),
    defaultValues: {
      textConcept: '',
      gridSize: '3x3',
      styleId: 'custom',
      inputImages: [],
    },
  });

  const selectedStyleId = form.watch('styleId');
  const inputImages = form.watch('inputImages') || [];

  // Sync selected logos with input images
  useEffect(() => {
    if (selectedLogos.length > 0) {
      const selectedImages: InputImage[] = selectedLogos.map(logo => ({
        id: logo.id,
        url: logo.url,
        source: 'selected' as const,
      }));

      // Merge with existing uploaded/pasted images
      const existingNonSelected = inputImages.filter(img => img.source !== 'selected');
      form.setValue('inputImages', [...selectedImages, ...existingNonSelected]);
    } else {
      // Remove selected images but keep uploaded/pasted
      const nonSelected = inputImages.filter(img => img.source !== 'selected');
      form.setValue('inputImages', nonSelected);
    }
  }, [selectedLogos]);

  // Convert file to data URL
  const convertFileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Handle file upload
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const maxSize = 10 * 1024 * 1024; // 10MB
    const maxImages = 9;

    const currentImages = form.getValues('inputImages') || [];
    if (currentImages.length >= maxImages) {
      alert(`Maximum ${maxImages} images allowed`);
      return;
    }

    const newImages: InputImage[] = [];

    for (let i = 0; i < files.length && currentImages.length + newImages.length < maxImages; i++) {
      const file = files[i];

      if (!file.type.startsWith('image/')) {
        alert(`${file.name} is not an image file`);
        continue;
      }

      if (file.size > maxSize) {
        alert(`${file.name} is too large (max 10MB)`);
        continue;
      }

      try {
        const dataUrl = await convertFileToDataUrl(file);
        newImages.push({
          id: `uploaded-${Date.now()}-${i}`,
          url: dataUrl,
          source: 'uploaded',
        });
      } catch (error) {
        console.error('Error reading file:', error);
      }
    }

    if (newImages.length > 0) {
      form.setValue('inputImages', [...currentImages, ...newImages]);
    }
  };

  // Handle paste
  const handlePaste = async (e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          const files = new DataTransfer();
          files.items.add(file);
          await handleFileUpload(files.files);
        }
        break;
      }
    }
  };

  // Handle remove image
  const handleRemoveImage = (id: string) => {
    const currentImages = form.getValues('inputImages') || [];
    const imageToRemove = currentImages.find(img => img.id === id);

    // If removing a selected image, also clear it from selection
    if (imageToRemove?.source === 'selected' && onClearSelection) {
      // Note: This will remove ALL selections. For individual removal,
      // we'd need a more granular callback from parent
      const remainingSelected = currentImages.filter(
        img => img.source === 'selected' && img.id !== id
      );
      if (remainingSelected.length === 0) {
        onClearSelection();
      }
    }

    form.setValue('inputImages', currentImages.filter(img => img.id !== id));
  };

  // Handle clear all images
  const handleClearAllImages = () => {
    if (onClearSelection) {
      onClearSelection();
    }
    form.setValue('inputImages', []);
  };

  // Add paste listener
  useEffect(() => {
    const handlePasteEvent = (e: ClipboardEvent) => handlePaste(e);
    document.addEventListener('paste', handlePasteEvent);
    return () => document.removeEventListener('paste', handlePasteEvent);
  }, [inputImages]);

  const handleSubmit = (data: z.infer<typeof LogoGenSchema>) => {
    onGenerate(data);
  };

  return (
    <>
      <StyleSelectorModal
        open={isStyleModalOpen}
        onOpenChange={setIsStyleModalOpen}
        selectedStyle={selectedStyleId}
        onSelectStyle={(styleId) => form.setValue('styleId', styleId)}
      />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
          {/* Concept Input */}
          <FormField
            control={form.control}
            name="textConcept"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between mb-2">
                  <FormLabel className="text-lg font-semibold">Your Vision</FormLabel>
                  <span className="text-xs text-muted-foreground">{field.value.length}/200</span>
                </div>
                <FormControl>
                  <div className="relative group">
                    {/* Hidden file input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      multiple
                      className="hidden"
                      onChange={(e) => handleFileUpload(e.target.files)}
                    />

                    {/* Image chips at top of textarea - always show + button */}
                    <div className="absolute top-3 left-3 right-3 z-10 flex items-center overflow-x-auto pb-2 scrollbar-hide mask-linear-fade pl-1 pt-1">
                      {/* Horizontal list of images with overlap */}
                      {inputImages.length > 0 && (
                        <div className="flex items-center -space-x-3 shrink-0 mr-3">
                          {inputImages.map((image, idx) => (
                            <div
                              key={image.id}
                              className="relative group/img shrink-0 transition-transform hover:z-10 hover:scale-110 cursor-pointer"
                              style={{ zIndex: idx }}
                              onClick={() => handleRemoveImage(image.id)}
                            >
                              <div className="w-10 h-10 rounded-lg border-2 border-background overflow-hidden bg-muted/20 shadow-sm">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={image.url}
                                  alt="Reference"
                                  className="w-full h-full object-cover"
                                />
                              </div>

                              {/* Remove button - top right corner on hover */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveImage(image.id);
                                }}
                                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-background border border-border flex items-center justify-center shadow-sm opacity-0 group-hover/img:opacity-100 transition-all scale-90 group-hover/img:scale-100 cursor-pointer z-20"
                                title="Remove image"
                              >
                                <X className="w-3 h-3 text-muted-foreground" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add button - always visible if under limit */}
                      {inputImages.length < 9 && (
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="w-10 h-10 shrink-0 rounded-lg border-2 border-dashed border-muted hover:border-primary hover:bg-primary/5 transition-all flex items-center justify-center bg-background/50 shadow-sm group/add z-0"
                          aria-label="Add image"
                          title="Upload reference images"
                        >
                          <Plus className="w-4 h-4 text-muted-foreground group-hover/add:text-primary transition-colors" />
                        </button>
                      )}

                      {/* Minimalist Clear All Button */}
                      {inputImages.length > 0 && (
                        <button
                          type="button"
                          onClick={handleClearAllImages}
                          className="w-8 h-8 shrink-0 rounded-full hover:bg-muted transition-colors flex items-center justify-center ml-1 z-0"
                          aria-label="Clear all images"
                          title="Clear all images"
                        >
                          <X className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />
                        </button>
                      )}
                    </div>

                    <Textarea
                      placeholder="Describe your dream logo... e.g. A minimalist geometric fox, orange gradient"
                      {...field}
                      className={cn(
                        "min-h-[160px] resize-none rounded-3xl border-2 border-muted bg-muted/20 p-6 text-base shadow-sm transition-all focus:bg-background focus:border-primary/50 focus:ring-4 focus:ring-primary/10",
                        "pt-16" // Always add top padding for the image chips area
                      )}
                    />

                    {/* Helper text when no images */}
                    {inputImages.length === 0 && (
                      <div className="absolute top-3 left-12 flex items-center gap-1.5 h-8 text-xs text-muted-foreground/60 pointer-events-none">
                        <span>Upload, paste or select images</span>
                      </div>
                    )}

                    <div className="absolute bottom-4 right-4 p-2 bg-background/80 backdrop-blur-sm rounded-full shadow-sm border opacity-0 group-hover:opacity-100 transition-opacity">
                      <Wand2 className="w-4 h-4 text-primary" />
                    </div>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Style Selector */}
          <FormField
            control={form.control}
            name="styleId"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between mb-2">
                  <FormLabel className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Style</FormLabel>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsStyleModalOpen(true)}
                    className="h-auto p-0 text-xs text-primary hover:text-primary/80 font-medium"
                  >
                    View All Styles
                  </Button>
                </div>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    value={field.value}
                    className="grid grid-cols-3 gap-3"
                  >
                    {[
                      { id: 'custom', icon: Pencil, label: 'Custom' },
                      { id: 'minimalist', icon: Sparkles, label: 'Minimal' },
                      { id: 'mascot', icon: Palette, label: 'Mascot' },
                    ].map((style) => (
                      <div key={style.id}>
                        <RadioGroupItem value={style.id} id={`style-${style.id}`} className="peer sr-only" />
                        <Label
                          htmlFor={`style-${style.id}`}
                          className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-muted bg-card p-4 hover:border-primary/30 hover:bg-accent/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-all duration-200"
                        >
                          <style.icon className="h-5 w-5 text-muted-foreground peer-data-[state=checked]:text-primary" />
                          <span className="text-xs font-medium">{style.label}</span>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />



          {/* Grid Size Selector */}
          <FormField
            control={form.control}
            name="gridSize"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Grid Size</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="grid grid-cols-3 gap-3"
                  >
                    {[
                      { id: '2x2', graphic: Grid2x2Graphic, label: '2x2' },
                      { id: '3x3', graphic: Grid3x3Graphic, label: '3x3' },
                      { id: '4x4', graphic: Grid4x4Graphic, label: '4x4' },
                    ].map((size) => (
                      <div key={size.id}>
                        <RadioGroupItem value={size.id} id={`size-${size.id}`} className="peer sr-only" />
                        <Label
                          htmlFor={`size-${size.id}`}
                          className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-muted bg-card p-4 hover:border-primary/30 hover:bg-accent/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-all duration-200 h-full"
                        >
                          <div className="w-12 h-12">
                            <size.graphic />
                          </div>
                          <span className="text-xs font-bold text-muted-foreground peer-data-[state=checked]:text-primary">{size.label}</span>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-14 rounded-full text-lg font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
            size="lg"
          >
            {isLoading ? (
              <Loader2 className="animate-spin mr-2" />
            ) : (
              <Sparkles className="mr-2 h-5 w-5" />
            )}
            Generate Assets
          </Button>
        </form>
      </Form>
    </>
  );
}
