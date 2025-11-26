'use client';

import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Settings2, Sparkles, Loader2, Send, Pencil, Palette, Coins, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Grid2x2Graphic, Grid3x3Graphic, Grid4x4Graphic } from '@/components/ui/grid-graphics';
import StyleSelectorModal from './style-selector-modal';
import { LogoGenSchema, InputImage } from './logo-generator-form';
import { getStyleById } from '@/lib/generation-styles';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { cn } from '@/lib/utils';

type Logo = {
    id: string;
    url: string;
    isUnsaved?: boolean;
    logoGridId?: string;
    tileIndex?: number;
};

interface MobileGeneratorProps {
    onGenerate: (data: z.infer<typeof LogoGenSchema>) => void;
    isLoading: boolean;
    selectedLogos?: Logo[];
    onClearSelection?: () => void;
}

export function MobileGenerator({ onGenerate, isLoading, selectedLogos = [], onClearSelection }: MobileGeneratorProps) {
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isStyleModalOpen, setIsStyleModalOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { user } = useUser();
    const firestore = useFirestore();

    // Fetch user document for tokens
    const userDocRef = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user]);

    const { data: userData } = useDoc<any>(userDocRef);
    const remainingTokens = userData?.remainingTokens || 0;

    const form = useForm<z.infer<typeof LogoGenSchema>>({
        resolver: zodResolver(LogoGenSchema),
        defaultValues: {
            textConcept: '',
            gridSize: '3x3',
            styleId: 'custom',
            inputImages: [],
        },
    });

    const handleSubmit = (data: z.infer<typeof LogoGenSchema>) => {
        onGenerate(data);
    };

    const selectedStyleId = form.watch('styleId');
    const selectedGridSize = form.watch('gridSize');
    const inputImages = form.watch('inputImages') || [];
    const selectedStyle = getStyleById(selectedStyleId);

    // Sync selected logos with input images (same as desktop)
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

    // Convert file to data URL (reused logic)
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

    const handleRemoveImage = (id: string) => {
        const currentImages = form.getValues('inputImages') || [];
        const imageToRemove = currentImages.find(img => img.id === id);

        // If removing a selected image, also clear the selection
        if (imageToRemove?.source === 'selected') {
            const remainingSelected = currentImages.filter(img => img.source === 'selected' && img.id !== id);
            if (remainingSelected.length === 0 && onClearSelection) {
                onClearSelection();
            }
        }

        form.setValue('inputImages', currentImages.filter(img => img.id !== id));
    };

    const handleClearAllImages = () => {
        if (onClearSelection) {
            onClearSelection();
        }
        form.setValue('inputImages', []);
    };

    return (
        <>
            <StyleSelectorModal
                open={isStyleModalOpen}
                onOpenChange={setIsStyleModalOpen}
                selectedStyle={selectedStyleId}
                onSelectStyle={(styleId) => form.setValue('styleId', styleId)}
            />

            <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-xl border-t md:hidden">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="p-3 space-y-2">
                        {/* Current Parameters Display */}
                        <div className="flex items-center gap-2 px-1">
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-muted/50 border">
                                    <span className="font-medium">{selectedGridSize}</span>
                                </div>
                                <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-muted/50 border">
                                    <span className="font-medium">{selectedStyle?.name || 'Custom'}</span>
                                </div>
                            </div>
                            <div className="flex-1" />
                            <Sheet open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                                <SheetTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 px-3 text-xs gap-1.5"
                                        type="button"
                                    >
                                        <Settings2 className="h-3.5 w-3.5" />
                                        Parameters
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="bottom" className="h-[80vh] rounded-t-[2rem]">
                                    <SheetHeader className="mb-6 text-left">
                                        <SheetTitle>Generation Parameters</SheetTitle>
                                        <SheetDescription>
                                            Customize how your assets are generated.
                                        </SheetDescription>
                                    </SheetHeader>

                                    <div className="space-y-8 pb-8">
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
                                                            onClick={() => {
                                                                setIsSettingsOpen(false);
                                                                setTimeout(() => setIsStyleModalOpen(true), 100);
                                                            }}
                                                            className="h-auto p-0 text-xs text-primary font-medium"
                                                        >
                                                            View All
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
                                                                    <RadioGroupItem value={style.id} id={`mobile-style-${style.id}`} className="peer sr-only" />
                                                                    <Label
                                                                        htmlFor={`mobile-style-${style.id}`}
                                                                        className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-muted bg-card p-3 hover:border-primary/30 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-all"
                                                                    >
                                                                        <style.icon className="h-5 w-5 text-muted-foreground peer-data-[state=checked]:text-primary" />
                                                                        <span className="text-xs font-medium">{style.label}</span>
                                                                    </Label>
                                                                </div>
                                                            ))}
                                                        </RadioGroup>
                                                    </FormControl>
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
                                                                    <RadioGroupItem value={size.id} id={`mobile-size-${size.id}`} className="peer sr-only" />
                                                                    <Label
                                                                        htmlFor={`mobile-size-${size.id}`}
                                                                        className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-muted bg-card p-3 hover:border-primary/30 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-all h-full"
                                                                    >
                                                                        <div className="w-10 h-10">
                                                                            <size.graphic />
                                                                        </div>
                                                                        <span className="text-xs font-bold text-muted-foreground peer-data-[state=checked]:text-primary">{size.label}</span>
                                                                    </Label>
                                                                </div>
                                                            ))}
                                                        </RadioGroup>
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />

                                        <Button
                                            className="w-full rounded-full h-12"
                                            onClick={() => setIsSettingsOpen(false)}
                                        >
                                            Done
                                        </Button>
                                    </div>
                                </SheetContent>
                            </Sheet>
                        </div>

                        {/* Input Row */}
                        <div className="flex gap-2 items-end">
                            {/* Hidden file input */}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/png,image/jpeg,image/webp"
                                multiple
                                className="hidden"
                                onChange={(e) => handleFileUpload(e.target.files)}
                            />

                            <FormField
                                control={form.control}
                                name="textConcept"
                                render={({ field }) => (
                                    <FormItem className="flex-1 space-y-0">
                                        <FormControl>
                                            {/* Flex Column Wrapper - Acts as the input box */}
                                            <div className="relative flex flex-col border-2 border-muted rounded-2xl bg-muted/20 shadow-sm transition-all focus-within:bg-background focus-within:border-primary/50">

                                                {/* Image List (Flex Item) - Only renders when images exist */}
                                                {inputImages.length > 0 && (
                                                    <div className="flex items-center gap-2 p-2 pb-0 overflow-x-auto scrollbar-hide">
                                                        {/* Overlapping Images */}
                                                        <div className="flex items-center -space-x-3 shrink-0 mr-2">
                                                            {inputImages.map((image, idx) => (
                                                                <div
                                                                    key={image.id}
                                                                    className="relative group/img shrink-0 transition-transform active:scale-110 active:z-10 cursor-pointer"
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
                                                                    {/* Remove button - subtle, always visible on mobile */}
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleRemoveImage(image.id);
                                                                        }}
                                                                        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-background border border-border flex items-center justify-center shadow-sm z-20 active:scale-95 transition-transform"
                                                                        title="Remove image"
                                                                    >
                                                                        <X className="w-3 h-3 text-muted-foreground" />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>

                                                        {/* Add button inside list if under limit */}
                                                        {inputImages.length < 9 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => fileInputRef.current?.click()}
                                                                className="w-10 h-10 shrink-0 rounded-lg border-2 border-dashed border-muted hover:border-primary hover:bg-primary/5 transition-all flex items-center justify-center bg-background/50 shadow-sm group/add z-0"
                                                                aria-label="Add image"
                                                            >
                                                                <Plus className="w-4 h-4 text-muted-foreground group-hover/add:text-primary transition-colors" />
                                                            </button>
                                                        )}

                                                        {/* Clear All Button */}
                                                        <button
                                                            type="button"
                                                            onClick={handleClearAllImages}
                                                            className="w-8 h-8 shrink-0 rounded-full hover:bg-muted transition-colors flex items-center justify-center z-0"
                                                            aria-label="Clear all images"
                                                        >
                                                            <X className="w-4 h-4 text-muted-foreground" />
                                                        </button>
                                                    </div>
                                                )}

                                                {/* Textarea (Flex Item) */}
                                                <Textarea
                                                    placeholder="Describe your logo..."
                                                    {...field}
                                                    className={cn(
                                                        "border-0 bg-transparent focus-visible:ring-0 shadow-none resize-none py-2.5 px-4 text-sm leading-tight",
                                                        inputImages.length > 0 ? "min-h-[3rem]" : "min-h-[2.75rem] h-11"
                                                    )}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' && !e.shiftKey) {
                                                            e.preventDefault();
                                                            form.handleSubmit(handleSubmit)();
                                                        }
                                                    }}
                                                />

                                                {/* Plus button (Absolute) - Only if NO images - at START of input */}
                                                {inputImages.length === 0 && (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="absolute left-2 top-1.5 h-8 w-8 text-muted-foreground hover:text-primary"
                                                        onClick={() => fileInputRef.current?.click()}
                                                    >
                                                        <Plus className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </FormControl>
                                    </FormItem>
                                )}
                            />

                            <Button
                                type="submit"
                                disabled={isLoading || !form.watch('textConcept')}
                                className="h-11 w-11 rounded-xl shadow-lg shadow-primary/25 flex-shrink-0 p-0"
                                size="icon"
                            >
                                {isLoading ? (
                                    <Loader2 className="animate-spin h-5 w-5" />
                                ) : (
                                    <Send className="h-4 w-4 ml-0.5" />
                                )}
                            </Button>
                        </div>
                    </form>
                </Form>
            </div>
        </>
    );
}
