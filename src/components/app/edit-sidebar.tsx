'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Loader2, Download, Sparkles, Palette, Scaling, Wand2, AlertTriangle } from 'lucide-react';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { collection, doc } from 'firebase/firestore';
import type { Logo } from '@/app/page';
import { Button } from '@/components/ui/button';
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

  const handleEdit = async () => {
    if (!editText || !logo || !logo.logoGridId || !user) return;
    setLoading((prev) => ({ ...prev, edit: true }));
    try {
      toast({ title: 'Applying AI edits...', description: 'Please wait a moment.' });
      const result = await editLogoWithTextPrompt({
        logoDataUri: logo.url, 
        textPrompt: editText,
      });
      const newUrl = await uploadAndGetUrl(result.editedLogoDataUri, logo.id, logo.logoGridId);
      onUpdateLogo({ ...logo, url: newUrl });
      toast({ title: 'Success', description: 'Logo updated with your edits.' });
      setEditText('');
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      toast({
        variant: 'destructive',
        title: 'Edit Failed',
        description: `Could not apply edits. Reason: ${errorMessage}`,
      });
    } finally {
      setLoading((prev) => ({ ...prev, edit: false }));
    }
  };
  
  const handleVariation = async () => {
    if (!variationText || !logo || !logo.logoGridId || !user || !firestore) return;
    setLoading(prev => ({...prev, variation: true}));
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
      setLoading(prev => ({...prev, variation: false}));
    }
  }

  const handleUpscale = async () => {
    if (!logo || !logo.logoGridId || !user || !firestore) return;
    setLoading(prev => ({...prev, upscale: true}));
    try {
       toast({ title: 'Upscaling logo...', description: 'This may take a moment.' });
       const result = await upscaleAndCleanupLogo({
        logoDataUri: logo.url,
      });
      
      const newUpscaledId = doc(collection(firestore, `users/${user.uid}/logoGrids/${logo.logoGridId}/logoVariations`)).id;
      const newUrl = await uploadAndGetUrl(result.upscaledLogoDataUri, newUpscaledId, logo.logoGridId);
      
      // The parent component will handle adding this to the state and DB
      onAddLogo({ id: newUpscaledId, url: newUrl, logoGridId: logo.logoGridId }, 0);

      toast({ title: 'Success', description: 'Upscaled version added as a new logo.' });
    } catch (error) {
       console.error(error);
       const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      toast({
        variant: 'destructive',
        title: 'Upscale Failed',
        description: `Could not upscale logo. Reason: ${errorMessage}`,
      });
    } finally {
      setLoading(prev => ({...prev, upscale: false}));
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="p-6 pb-0">
          <SheetTitle className="font-headline">Refine Your Logo</SheetTitle>
          <SheetDescription>
            Use AI to perfect your selected logo design.
          </SheetDescription>
        </SheetHeader>
        <div className="p-6">
          <div className="relative aspect-square w-full rounded-lg overflow-hidden border">
            <Image
              src={logo.url}
              alt="Selected logo"
              fill
              className="object-cover"
              sizes="50vw"
              unoptimized
            />
          </div>
        </div>

        <Tabs defaultValue="edit" className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-3 mx-auto max-w-sm">
            <TabsTrigger value="edit"><Wand2 className="h-4 w-4 mr-1"/> Edit</TabsTrigger>
            <TabsTrigger value="variations"><Palette className="h-4 w-4 mr-1"/> Vary</TabsTrigger>
            <TabsTrigger value="upscale"><Scaling className="h-4 w-4 mr-1"/> Upscale</TabsTrigger>
          </TabsList>
          
          <div className="flex-1 overflow-y-auto p-6">
            {isActionDisabled && (
              <Alert variant="default" className="mb-6 bg-amber-50 border-amber-200 text-amber-800">
                <AlertTriangle className="h-4 w-4 !text-amber-600" />
                <AlertTitle>Unsaved Logo</AlertTitle>
                <AlertDescription>
                  This is a temporary logo. Please save the grid to enable editing features.
                </AlertDescription>
              </Alert>
            )}

            <TabsContent value="edit" className="mt-0 space-y-4">
               <Label htmlFor="edit-prompt">Describe your changes</Label>
              <Textarea
                id="edit-prompt"
                placeholder="e.g., 'make the background color dark blue', 'change the font to be more modern'"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={4}
                disabled={isActionDisabled}
              />
              <Button onClick={handleEdit} disabled={loading.edit || !editText || isActionDisabled} className="w-full">
                {loading.edit ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                Apply Edit
              </Button>
            </TabsContent>
            
            <TabsContent value="variations" className="mt-0 space-y-4">
              <Label htmlFor="variation-prompt">Describe a new variation</Label>
              <Textarea
                id="variation-prompt"
                placeholder="e.g., 'a version with a shield', 'in a flat style'"
                value={variationText}
                onChange={(e) => setVariationText(e.target.value)}
                rows={4}
                disabled={isActionDisabled}
              />
              <Button onClick={handleVariation} disabled={loading.variation || !variationText || isActionDisabled} className="w-full">
                {loading.variation ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Palette className="mr-2 h-4 w-4" />
                )}
                Generate Variation
              </Button>
            </TabsContent>

            <TabsContent value="upscale" className="mt-0 text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                Enhance your logo to a high-resolution, production-quality image. This will add a new, upscaled variation to your grid.
              </p>
              <Button onClick={handleUpscale} disabled={loading.upscale || isActionDisabled} className="w-full" size="lg">
                {loading.upscale ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Scaling className="mr-2 h-4 w-4" />
                )}
                Upscale & Clean Up
              </Button>
            </TabsContent>
          </div>
        </Tabs>

        <SheetFooter className="p-6 bg-secondary/50 border-t">
          <Button onClick={handleDownload} variant="outline" className="w-full">
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
