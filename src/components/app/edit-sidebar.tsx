'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Loader2, Download, Sparkles, Palette, Scaling, Wand2, AlertTriangle, Shuffle, Square, Grid3x3, Send } from 'lucide-react';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { collection, doc } from 'firebase/firestore';
import type { Logo } from '@/app/app/page';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '../ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { editLogoWithTextPrompt } from '@/ai/flows/edit-logo-with-text-prompt';
import { generateLogoVariation } from '@/ai/flows/generate-logo-variation';
import { upscaleAndCleanupLogo } from '@/ai/flows/upscale-and-cleanup-logo';
import { Label } from '../ui/label';
import { useUser, useFirestore, useStorage } from '@/firebase';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

interface EditSidebarProps {
  logo: Logo | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onUpdateLogo: (logo: Logo) => void;
  onAddLogo: (logo: Logo, currentTileCount: number) => void;
  onUpscale?: (logo: Logo) => void;
  onGenerateVariations?: (logo: Logo) => void;
  onGenerateVariety?: (logo: Logo) => void;
  onEdit?: (logo: Logo, prompt: string, mode: 'single' | 'grid') => void;
}

type LoadingStates = {
  edit: boolean;
  variation: boolean;
  upscale: boolean;
};

export default function EditSidebar({
  logo,
  isOpen,
  onOpenChange,
  onUpdateLogo,
  onAddLogo,
  onUpscale,
  onGenerateVariations,
  onGenerateVariety,
  onEdit,
}: EditSidebarProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const storage = useStorage();
  const [loading, setLoading] = useState<LoadingStates>({
    edit: false,
    variation: false,
    upscale: false,
  });
  const [editText, setEditText] = useState('');
  const [variationText, setVariationText] = useState('');
  const [editMode, setEditMode] = useState<'single' | 'grid'>('single');
  const { toast } = useToast();

  useEffect(() => {
    if (logo) {
      setEditText('');
      setVariationText('');
    }
  }, [logo]);

  if (!logo) return null;

  const isActionDisabled = logo.isUnsaved || !logo.logoGridId;

  const uploadAndGetUrl = async (dataUrl: string, logoId: string, gridId: string): Promise<string> => {
    if (!user || !storage) throw new Error('User not authenticated for image upload.');
    const storageRef = ref(storage, `users/${user.uid}/logos/${gridId}/${logoId}.png`);
    const uploadTask = await uploadString(storageRef, dataUrl, 'data_url');
    return await getDownloadURL(uploadTask.ref);
  };

  const handleDownload = () => {
    if (logo?.url) {
      const link = document.createElement('a');
      link.href = logo.url;
      // Use a more generic name for unsaved logos
      const filename = logo.isUnsaved ? 'zapmark-logo-unsaved.png' : `zapmark-logo-${logo.id}.png`;
      link.download = filename;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleEdit = () => {
    if (!editText || !logo || !onEdit) return;
    onEdit(logo, editText, editMode);
    setEditText('');
    onOpenChange(false);
  };

  const handleVariation = async () => {
    if (!variationText || !logo || !logo.logoGridId || !user || !firestore) return;
    setLoading(prev => ({ ...prev, variation: true }));
    try {
      toast({ title: 'Generating variation...', description: 'The AI is creating a new concept.' });
      const result = await generateLogoVariation({
        baseLogo: logo.url,
        prompt: variationText,
      });

      // Generate a new ID for the variation *before* uploading
      const newLogoId = doc(collection(firestore, `users/${user.uid}/logoGrids/${logo.logoGridId}/logoVariations`)).id;
      const newUrl = await uploadAndGetUrl(result.variedLogo, newLogoId, logo.logoGridId);

      // The parent component will handle adding this to the state and DB
      onAddLogo({ id: newLogoId, url: newUrl, logoGridId: logo.logoGridId }, 0);
      setVariationText('');
      toast({ title: 'Success', description: 'New variation added.' });
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      toast({
        variant: 'destructive',
        title: 'Variation Failed',
        description: `Could not generate variation. Reason: ${errorMessage}`,
      });
    } finally {
      setLoading(prev => ({ ...prev, variation: false }));
    }
  }

  const handleUpscale = () => {
    if (!logo || !onUpscale) return;
    onUpscale(logo);
    onOpenChange(false);
  };

  const handleVariations = () => {
    if (!logo || !onGenerateVariations) return;
    onGenerateVariations(logo);
    onOpenChange(false);
  };

  const handleVariety = () => {
    if (!logo || !onGenerateVariety) return;
    onGenerateVariety(logo);
    onOpenChange(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl p-0 flex flex-col h-full overflow-hidden">
        {/* Extra Large Image Preview */}
        <div className="flex-1 flex items-center justify-center p-8 min-h-0">
          <div className="relative w-full aspect-square max-h-full max-w-2xl">
            <Image
              src={logo.url}
              alt="Selected logo"
              fill
              className="object-contain drop-shadow-2xl"
              sizes="800px"
              unoptimized
            />
          </div>
        </div>

        {/* Actions Section */}
        <div className="flex-shrink-0 bg-background border-t p-6 space-y-6">
          {isActionDisabled && (
            <Alert variant="default" className="bg-amber-50 border-amber-200 text-amber-800">
              <AlertTriangle className="h-4 w-4 !text-amber-600" />
              <AlertDescription className="text-sm">
                Save the grid first to enable all features
              </AlertDescription>
            </Alert>
          )}

          {/* Quick Actions Toolbar */}
          <div className="grid grid-cols-4 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="flex flex-col items-center justify-center h-auto py-3 gap-1.5 hover:bg-primary/5 hover:text-primary hover:border-primary/20"
            >
              <Download className="h-4 w-4" />
              <span className="text-[10px] font-medium">Download</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleUpscale}
              disabled={isActionDisabled}
              className="flex flex-col items-center justify-center h-auto py-3 gap-1.5 hover:bg-primary/5 hover:text-primary hover:border-primary/20"
            >
              <Scaling className="h-4 w-4" />
              <span className="text-[10px] font-medium">Upscale</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleVariations}
              disabled={isActionDisabled}
              className="flex flex-col items-center justify-center h-auto py-3 gap-1.5 hover:bg-primary/5 hover:text-primary hover:border-primary/20"
            >
              <Sparkles className="h-4 w-4" />
              <span className="text-[10px] font-medium">Variations</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleVariety}
              disabled={isActionDisabled}
              className="flex flex-col items-center justify-center h-auto py-3 gap-1.5 hover:bg-primary/5 hover:text-primary hover:border-primary/20"
            >
              <Shuffle className="h-4 w-4" />
              <span className="text-[10px] font-medium">Variety</span>
            </Button>
          </div>

          {/* Edit Input Section - Dashboard Style */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Top row - Toggles */}
            <div className="flex items-center px-3 py-2 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-full p-1">
                <button
                  className={cn(
                    "p-2 rounded-full transition-all",
                    editMode === 'single'
                      ? "bg-white dark:bg-gray-700 shadow-sm"
                      : "hover:bg-gray-200 dark:hover:bg-gray-700"
                  )}
                  onClick={() => setEditMode('single')}
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
                  onClick={() => setEditMode('grid')}
                  title="Edit as grid"
                >
                  <Grid3x3 className="h-4 w-4" />
                </button>
              </div>
            </div>
            {/* Bottom row - Input and Send */}
            <div className="flex items-center gap-2 p-2">
              <input
                type="text"
                placeholder="Describe changes..."
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="flex-1 px-3 py-2 text-sm bg-transparent focus:outline-none min-w-[200px]"
                disabled={isActionDisabled}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && editText.trim() && !isActionDisabled) {
                    handleEdit();
                  }
                }}
                autoFocus
              />
              <Button
                size="icon"
                className="h-9 w-9 rounded-full flex-shrink-0"
                disabled={loading.edit || !editText.trim() || isActionDisabled}
                onClick={handleEdit}
              >
                {loading.edit ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
