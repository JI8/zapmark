'use client';

import { useState, useEffect, useRef } from 'react';
import type { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import JSZip from 'jszip';
import {
  collection,
  doc,
  serverTimestamp,
  DocumentData,
  query,
  orderBy,
  getDocs,
  setDoc,
  writeBatch,
  runTransaction,
  getDoc,
} from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Download, Sparkles } from 'lucide-react';
import Header from '@/components/layout/header';
import LogoGeneratorForm, { type LogoGenSchema } from '@/components/app/logo-generator-form';
import LogoGrid from '@/components/app/logo-grid';
import EditSidebar from '@/components/app/edit-sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { useUser, useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking, setDocumentNonBlocking, useStorage } from '@/firebase';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { sliceGridImage } from '@/lib/image-slicer';
import { generateInitialLogoGrid } from '@/ai/flows/generate-initial-logo-grid';
import { generateVariationGrid } from '@/ai/flows/generate-variation-grid';
import { upscaleAndCleanupLogo } from '@/ai/flows/upscale-and-cleanup-logo';
import { tokenManager } from '@/lib/tokens/token-manager';
import { errorService } from '@/lib/errors/error-service';
import { monitoringService } from '@/lib/monitoring/monitoring-service';

export type Logo = {
  id: string;
  url: string;
  isUnsaved?: boolean;
  logoGridId?: string;
  tileIndex?: number;
};

export type LogoVariation = {
  id: string;
  logoGridId: string;
  imageUrl: string;
  tileIndex: number;
  editPrompt?: string;
};

export type LogoGridDoc = {
  id: string;
  concept: string;
  creationDate: any;
  gridSize: '3x3' | '4x4';
  userId: string;
} & DocumentData;

type GridWithLogos = {
  grid: LogoGridDoc;
  logos: Logo[];
};

export default function Home() {
  const [allGrids, setAllGrids] = useState<GridWithLogos[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isFetchingVariations, setIsFetchingVariations] = useState(false);
  const [selectedLogo, setSelectedLogo] = useState<Logo | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const storage = useStorage();

  const scrollToTop = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    }
  };

  const deductToken = async (cost: number = 1, operation: string) => {
    if (!user || !firestore) return { success: false };
    
    const result = await tokenManager.deductTokens(firestore, {
      userId: user.uid,
      amount: cost,
      operation: 'deduct',
      reason: operation,
    });
    
    if (!result.success) {
      const errorResult = errorService.categorizeError(
        new Error(result.error || 'Token deduction failed'),
        { operation, userId: user.uid }
      );
      
      toast({
        variant: 'destructive',
        title: errorResult.type === 'insufficient_tokens' ? 'Insufficient Tokens' : 'Error',
        description: errorResult.userMessage,
      });
    } else {
      monitoringService.logTokenOperation('deduct', cost, user.uid, { operation });
    }
    
    return result;
  };

  const refundToken = async (cost: number = 1, operation: string, reason: string) => {
    if (!user || !firestore) return;
    
    const result = await tokenManager.refundTokens(firestore, {
      userId: user.uid,
      amount: cost,
      operation: 'refund',
      reason: `${operation}: ${reason}`,
    });
    
    if (result.success) {
      monitoringService.logTokenOperation('refund', cost, user.uid, { operation, reason });
      
      toast({
        title: 'Token Refunded',
        description: `Your ${cost} token${cost > 1 ? 's have' : ' has'} been refunded due to an error.`,
      });
    }
  };

  const handleDownloadAll = async (gridWithLogos: GridWithLogos) => {
    try {
      // Removed toast - download starts immediately

      const zip = new JSZip();
      const folder = zip.folder(gridWithLogos.grid.concept.replace(/[^a-z0-9]/gi, '_'));

      // Fetch and add each logo to the zip
      for (const [index, logo] of gridWithLogos.logos.entries()) {
        try {
          let blob: Blob;
          
          if (logo.url.startsWith('data:')) {
            // Convert data URL to blob
            const response = await fetch(logo.url);
            blob = await response.blob();
          } else {
            // Fetch from Firebase Storage
            const response = await fetch(logo.url);
            blob = await response.blob();
          }
          
          const filename = `logo_${index + 1}_${logo.id.substring(0, 8)}.png`;
          folder?.file(filename, blob);
        } catch (error) {
          console.error(`Failed to add logo ${index + 1}:`, error);
        }
      }

      // Generate and download the zip
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${gridWithLogos.grid.concept.replace(/[^a-z0-9]/gi, '_')}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Removed toast - browser shows download
    } catch (error) {
      console.error('Download all failed:', error);
      toast({
        variant: 'destructive',
        title: 'Download Failed',
        description: 'Could not create zip file',
      });
    }
  };

  const logoGridsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(
      collection(firestore, 'users', user.uid, 'logoGrids'),
      orderBy('creationDate', 'desc')
    );
  }, [firestore, user]);

  const { data: logoGrids, isLoading: isLoadingGrids } =
    useCollection<LogoGridDoc>(logoGridsQuery);

  useEffect(() => {
    // This effect should not run when a generation/save is in progress.
    if (isLoading || isSaving) {
      return;
    }
    
    const fetchAllGrids = async () => {
      if (isUserLoading || isLoadingGrids) {
        return;
      }

      if (!user) {
        // Show placeholder for non-authenticated users
        const placeholderGrid: GridWithLogos = {
          grid: {
            id: 'placeholder',
            concept: 'Sample Logos',
            creationDate: new Date(),
            gridSize: '3x3',
            userId: 'placeholder',
          },
          logos: PlaceHolderImages.map((img) => ({
            id: img.id,
            url: img.imageUrl,
          })).slice(0, 9),
        };
        setAllGrids([placeholderGrid]);
        setIsFetchingVariations(false);
        return;
      }

      if (logoGrids && logoGrids.length > 0 && firestore) {
        setIsFetchingVariations(true);
        
        // Load all grids with their logos IN PARALLEL for better performance
        const gridPromises = logoGrids.map(async (grid) => {
          const variationsCollectionRef = collection(
            firestore,
            'users',
            user.uid,
            'logoGrids',
            grid.id,
            'logoVariations'
          );
          const variationsSnapshot = await getDocs(variationsCollectionRef);
          const variations = variationsSnapshot.docs.map(
            (doc) => doc.data() as LogoVariation
          );

          if (variations.length > 0) {
            const gridLogos: Logo[] = variations
              .sort((a, b) => a.tileIndex - b.tileIndex)
              .map((variation: LogoVariation) => ({
                id: variation.id,
                url: variation.imageUrl,
                logoGridId: grid.id,
                tileIndex: variation.tileIndex,
              }));

            return {
              grid,
              logos: gridLogos,
            } as GridWithLogos;
          }
          return null;
        });

        // Wait for all grids to load in parallel
        const results = await Promise.all(gridPromises);
        const gridsWithLogos = results.filter((g): g is GridWithLogos => g !== null);
        
        setAllGrids(gridsWithLogos);
        setIsFetchingVariations(false);
      } else if (logoGrids && logoGrids.length === 0) {
        // Grids loaded but empty
        setAllGrids([]);
        setIsFetchingVariations(false);
      }
    };

    fetchAllGrids();
  }, [user, isUserLoading, logoGrids, isLoadingGrids, firestore, isLoading, isSaving]);
  
  const handleGenerate = async (data: z.infer<typeof LogoGenSchema>) => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Please Log In',
        description: 'You must be logged in to generate assets.',
      });
      return;
    }

    // Check and deduct token first
    const tokenResult = await deductToken(1, 'generateInitialLogoGrid');
    if (!tokenResult.success) {
      return; // Token deduction failed, error already shown
    }
    
    setIsLoading(true); 
    
    let temporaryLogos: Logo[] = [];
    let tempGrid: GridWithLogos | null = null;
    let shouldRefund = false;

    try {
      // Removed toast - loading state shows progress

      const result = await generateInitialLogoGrid({
        textConcept: data.textConcept,
        gridSize: data.gridSize,
        generationType: data.generationType,
      });
      
      shouldRefund = false; // Generation succeeded

      const rows = data.gridSize === '3x3' ? 3 : 4;
      const cols = data.gridSize === '3x3' ? 3 : 4;
      const slicedImages = await sliceGridImage(result.logoGridImage, rows, cols);

      temporaryLogos = slicedImages.map((dataUrl, index) => ({
        id: `temp-${Date.now()}-${index}`,
        url: dataUrl,
        isUnsaved: true, 
        tileIndex: index,
      }));

      // Create temporary grid to show immediately
      tempGrid = {
        grid: {
          id: 'temp-' + Date.now(),
          concept: data.textConcept,
          creationDate: new Date(),
          gridSize: data.gridSize,
          userId: user.uid,
        },
        logos: temporaryLogos,
      };

      // Add to top of grids list
      setAllGrids(prev => [tempGrid!, ...prev]);
      setIsLoading(false); // Stop main loading indicator
      
      // Scroll to top to show new grid
      setTimeout(() => scrollToTop(), 100);
      
      // Removed toast - animation shows the result
      
      // Start auto-saving in the background
      setIsSaving(true);
      if (!firestore || !storage) throw new Error("Firestore or Storage service not available.");

      const newLogoGridId = doc(collection(firestore, 'users', user.uid, 'logoGrids')).id;
      const gridDocRef = doc(firestore, 'users', user.uid, 'logoGrids', newLogoGridId);

      const savedLogos: Logo[] = [];
      const batch = writeBatch(firestore);

      for (const [index, logo] of temporaryLogos.entries()) {
        const variationId = doc(collection(firestore, `users/${user.uid}/logoGrids/${newLogoGridId}/logoVariations`)).id;
        const storageRef = ref(storage, `users/${user.uid}/logos/${newLogoGridId}/${variationId}.png`);
        
        const uploadTask = await uploadString(storageRef, logo.url, 'data_url');
        const downloadUrl = await getDownloadURL(uploadTask.ref);
  
        const variationData: LogoVariation = {
          id: variationId,
          logoGridId: newLogoGridId,
          imageUrl: downloadUrl,
          tileIndex: logo.tileIndex!,
        };
  
        const variationDocRef = doc(firestore, 'users', user.uid, 'logoGrids', newLogoGridId, 'logoVariations', variationId);
        batch.set(variationDocRef, variationData);

        // Keep the data URL for display, but update metadata
        savedLogos.push({
          ...logo,
          id: variationId,
          url: logo.url, // Keep data URL to avoid flicker
          isUnsaved: false,
          logoGridId: newLogoGridId,
        });
      }

      const logoGridData = {
        id: newLogoGridId,
        userId: user.uid, 
        concept: data.textConcept,
        gridSize: data.gridSize,
        creationDate: serverTimestamp(),
      };
      batch.set(gridDocRef, logoGridData);

      await batch.commit();

      // Silently update metadata without changing display
      if (tempGrid) {
        setAllGrids(prev => prev.map(g => 
          g.grid.id === tempGrid!.grid.id 
            ? {
                ...g,
                grid: { ...g.grid, id: newLogoGridId },
                logos: g.logos.map((logo, idx) => ({
                  ...logo,
                  id: savedLogos[idx].id,
                  isUnsaved: false,
                  logoGridId: newLogoGridId,
                })),
              }
            : g
        ));
      }

    } catch (error) {
      console.error('An error occurred during generation or saving:', error);
      
      // Categorize error and determine if refund is needed
      const errorResult = errorService.categorizeError(error, {
        operation: 'generateInitialLogoGrid',
        userId: user.uid,
        metadata: { gridSize: data.gridSize, generationType: data.generationType },
      });
      
      // Refund token if generation failed (not if just saving failed)
      if (shouldRefund && errorResult.shouldRefundToken) {
        await refundToken(1, 'generateInitialLogoGrid', errorResult.message);
      }
      
      toast({
        variant: 'destructive',
        title: 'Generation Failed',
        description: errorResult.userMessage,
      });
      
      // Remove temporary grid if generation failed
      if (shouldRefund && tempGrid) {
        setAllGrids(prev => prev.filter(g => g.grid.id !== tempGrid!.grid.id));
      }
    } finally {
      setIsLoading(false);
      setIsSaving(false);
    }
  };


  const handleUpdateLogo = async (updatedLogo: Logo) => {
    if (!user || !updatedLogo.logoGridId || !firestore || updatedLogo.isUnsaved) return;

    // Update logo in the specific grid
    setAllGrids(prev => prev.map(gridWithLogos => 
      gridWithLogos.grid.id === updatedLogo.logoGridId
        ? {
            ...gridWithLogos,
            logos: gridWithLogos.logos.map(logo => 
              logo.id === updatedLogo.id ? updatedLogo : logo
            ),
          }
        : gridWithLogos
    ));
    setSelectedLogo(updatedLogo);

    const variationDocRef = doc(
      firestore,
      'users',
      user.uid,
      'logoGrids',
      updatedLogo.logoGridId,
      'logoVariations',
      updatedLogo.id
    );

    updateDocumentNonBlocking(variationDocRef, { imageUrl: updatedLogo.url });

    // Removed toast - silent update
  };

  const handleAddLogo = async (newLogo: Logo, currentTileCount: number) => {
    if (!user || !selectedLogo?.logoGridId || !firestore || selectedLogo.isUnsaved) return;

    const newVariationId = newLogo.id;
    const variationDocRef = doc(
      firestore,
      'users',
      user.uid,
      'logoGrids',
      selectedLogo.logoGridId,
      'logoVariations',
      newVariationId
    );

    const newVariation: LogoVariation = {
      id: newVariationId,
      logoGridId: selectedLogo.logoGridId,
      imageUrl: newLogo.url,
      tileIndex: currentTileCount,
    };

    setDocumentNonBlocking(variationDocRef, newVariation, { merge: false });
    
    // Add logo to the specific grid
    setAllGrids(prev => prev.map(gridWithLogos => 
      gridWithLogos.grid.id === selectedLogo.logoGridId
        ? {
            ...gridWithLogos,
            logos: [...gridWithLogos.logos, { ...newLogo, tileIndex: currentTileCount }],
          }
        : gridWithLogos
    ));

    // Removed toast - visual feedback is enough
  };

  const handleGenerateVariations = async (logo: Logo) => {
    if (!user || !firestore || !storage) {
      toast({
        variant: 'destructive',
        title: 'Please Log In',
        description: 'You must be logged in to generate variations.',
      });
      return;
    }

    // Check and deduct token first
    const tokenResult = await deductToken(1, 'generateVariationGrid');
    if (!tokenResult.success) {
      return; // Token deduction failed, error already shown
    }

    setIsLoading(true);
    let shouldRefund = true;
    let tempGrid: GridWithLogos | null = null;
    
    try {
      // Removed toast - loading state shows progress

      // Generate 3x3 variation grid
      const result = await generateVariationGrid({
        baseLogo: logo.url,
      });
      
      shouldRefund = false; // Generation succeeded

      // Slice the grid into individual tiles
      const slicedImages = await sliceGridImage(result.variationGridImage, 3, 3);

      const temporaryLogos = slicedImages.map((dataUrl, index) => ({
        id: `temp-${Date.now()}-${index}`,
        url: dataUrl,
        isUnsaved: true,
        tileIndex: index,
      }));

      // Create temporary grid
      tempGrid = {
        grid: {
          id: 'temp-' + Date.now(),
          concept: `Variations of ${logo.id.substring(0, 8)}`,
          creationDate: new Date(),
          gridSize: '3x3',
          userId: user.uid,
        },
        logos: temporaryLogos,
      };

      // Add to top of grids list
      setAllGrids(prev => [tempGrid!, ...prev]);
      setIsLoading(false);
      
      // Scroll to top to show new grid
      setTimeout(() => scrollToTop(), 100);

      // Removed toast - animation shows the result

      // Save in background
      setIsSaving(true);
      const newLogoGridId = doc(collection(firestore, 'users', user.uid, 'logoGrids')).id;
      const gridDocRef = doc(firestore, 'users', user.uid, 'logoGrids', newLogoGridId);

      const savedLogos: Logo[] = [];
      const batch = writeBatch(firestore);

      for (const [index, tempLogo] of temporaryLogos.entries()) {
        const variationId = doc(collection(firestore, `users/${user.uid}/logoGrids/${newLogoGridId}/logoVariations`)).id;
        const storageRef = ref(storage, `users/${user.uid}/logos/${newLogoGridId}/${variationId}.png`);
        
        const uploadTask = await uploadString(storageRef, tempLogo.url, 'data_url');
        const downloadUrl = await getDownloadURL(uploadTask.ref);
  
        const variationData: LogoVariation = {
          id: variationId,
          logoGridId: newLogoGridId,
          imageUrl: downloadUrl,
          tileIndex: tempLogo.tileIndex!,
        };
  
        const variationDocRef = doc(firestore, 'users', user.uid, 'logoGrids', newLogoGridId, 'logoVariations', variationId);
        batch.set(variationDocRef, variationData);

        savedLogos.push({
          ...tempLogo,
          id: variationId,
          url: tempLogo.url,
          isUnsaved: false,
          logoGridId: newLogoGridId,
        });
      }

      const logoGridData = {
        id: newLogoGridId,
        userId: user.uid,
        concept: tempGrid.grid.concept,
        gridSize: '3x3' as const,
        creationDate: serverTimestamp(),
      };
      batch.set(gridDocRef, logoGridData);

      await batch.commit();

      // Update the temporary grid with saved data
      setAllGrids(prev => prev.map(g => 
        g.grid.id === tempGrid?.grid.id 
          ? {
              grid: { ...logoGridData, creationDate: new Date() },
              logos: savedLogos.sort((a, b) => a.tileIndex! - b.tileIndex!),
            }
          : g
      ));

      // Removed toast - silent save
    } catch (error) {
      console.error('Variation generation failed:', error);
      
      // Categorize error and determine if refund is needed
      const errorResult = errorService.categorizeError(error, {
        operation: 'generateVariationGrid',
        userId: user.uid,
      });
      
      // Refund token if generation failed
      if (shouldRefund && errorResult.shouldRefundToken) {
        await refundToken(1, 'generateVariationGrid', errorResult.message);
      }
      
      toast({
        variant: 'destructive',
        title: 'Generation Failed',
        description: errorResult.userMessage,
      });
      
      // Remove temporary grid if generation failed
      if (shouldRefund && tempGrid) {
        setAllGrids(prev => prev.filter(g => g.grid.id !== tempGrid!.grid.id));
      }
    } finally {
      setIsLoading(false);
      setIsSaving(false);
    }
  };

  const handleUpscale = async (logo: Logo) => {
    if (!user || !firestore || !storage) {
      toast({
        variant: 'destructive',
        title: 'Please Log In',
        description: 'You must be logged in to upscale.',
      });
      return;
    }

    // Check and deduct token first
    const tokenResult = await deductToken(1, 'upscaleAndCleanupLogo');
    if (!tokenResult.success) {
      return; // Token deduction failed, error already shown
    }

    setIsLoading(true);
    let shouldRefund = true;
    let tempGrid: GridWithLogos | null = null;

    try {
      // Removed toast - loading state shows progress

      // Upscale the logo
      const result = await upscaleAndCleanupLogo({
        logoDataUri: logo.url,
      });
      
      shouldRefund = false; // Upscale succeeded

      const upscaledLogo: Logo = {
        id: `temp-${Date.now()}`,
        url: result.upscaledLogoDataUri,
        isUnsaved: true,
        tileIndex: 0,
      };

      // Create a single-logo grid for the upscaled version
      tempGrid = {
        grid: {
          id: 'temp-' + Date.now(),
          concept: `Upscaled ${logo.id.substring(0, 8)}`,
          creationDate: new Date(),
          gridSize: '3x3',
          userId: user.uid,
        },
        logos: [upscaledLogo],
      };

      // Add to top of grids list
      setAllGrids(prev => [tempGrid!, ...prev]);
      setIsLoading(false);
      
      // Scroll to top to show new grid
      setTimeout(() => scrollToTop(), 100);

      // Removed toast - animation shows the result

      // Save in background
      setIsSaving(true);
      const newLogoGridId = doc(collection(firestore, 'users', user.uid, 'logoGrids')).id;
      const gridDocRef = doc(firestore, 'users', user.uid, 'logoGrids', newLogoGridId);

      const variationId = doc(collection(firestore, `users/${user.uid}/logoGrids/${newLogoGridId}/logoVariations`)).id;
      const storageRef = ref(storage, `users/${user.uid}/logos/${newLogoGridId}/${variationId}.png`);
      
      const uploadTask = await uploadString(storageRef, upscaledLogo.url, 'data_url');
      const downloadUrl = await getDownloadURL(uploadTask.ref);

      const variationData: LogoVariation = {
        id: variationId,
        logoGridId: newLogoGridId,
        imageUrl: downloadUrl,
        tileIndex: 0,
      };

      const batch = writeBatch(firestore);
      const variationDocRef = doc(firestore, 'users', user.uid, 'logoGrids', newLogoGridId, 'logoVariations', variationId);
      batch.set(variationDocRef, variationData);

      const logoGridData = {
        id: newLogoGridId,
        userId: user.uid,
        concept: tempGrid.grid.concept,
        gridSize: '3x3' as const,
        creationDate: serverTimestamp(),
      };
      batch.set(gridDocRef, logoGridData);

      await batch.commit();

      // Update the temporary grid with saved data
      const savedLogo: Logo = {
        ...upscaledLogo,
        id: variationId,
        url: upscaledLogo.url,
        isUnsaved: false,
        logoGridId: newLogoGridId,
      };

      setAllGrids(prev => prev.map(g => 
        g.grid.id === tempGrid?.grid.id 
          ? {
              grid: { ...logoGridData, creationDate: new Date() },
              logos: [savedLogo],
            }
          : g
      ));

      // Removed toast - silent save
    } catch (error) {
      console.error('Upscale failed:', error);
      
      // Categorize error and determine if refund is needed
      const errorResult = errorService.categorizeError(error, {
        operation: 'upscaleAndCleanupLogo',
        userId: user.uid,
      });
      
      // Refund token if upscale failed
      if (shouldRefund && errorResult.shouldRefundToken) {
        await refundToken(1, 'upscaleAndCleanupLogo', errorResult.message);
      }
      
      toast({
        variant: 'destructive',
        title: 'Upscale Failed',
        description: errorResult.userMessage,
      });
      
      // Remove temporary grid if upscale failed
      if (shouldRefund && tempGrid) {
        setAllGrids(prev => prev.filter(g => g.grid.id !== tempGrid!.grid.id));
      }
    } finally {
      setIsLoading(false);
      setIsSaving(false);
    }
  };

  return (
    <>
      <Header />
      <main className="flex flex-col md:flex-row h-[calc(100vh-4rem)]">
        {/* Fixed Left Sidebar */}
        <aside className="w-full md:w-[440px] border-b md:border-b-0 md:border-r bg-background flex flex-col">
          <div className="flex-1 overflow-y-auto">
            <div className="flex flex-col gap-6 md:gap-8 p-4 md:p-6">
              <section>
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold font-headline tracking-tight">
                  Generate Your Next Asset with AI
                </h1>
                <p className="mt-2 text-sm md:text-md text-muted-foreground">
                  {user
                    ? `What's on your mind, ${user.displayName?.split(' ')[0] || 'creator'}?`
                    : 'Describe your vision and our AI will create unique assets.'}
                </p>
              </section>
              <LogoGeneratorForm
                onGenerate={handleGenerate}
                isLoading={isLoading || isSaving}
                isAuthenticated={!!user}
              />
            </div>
          </div>
        </aside>

        {/* Scrollable Grid Area */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto scroll-smooth">
          <div className="container max-w-5xl mx-auto p-4 md:p-6 lg:p-8">
            {(isUserLoading || isLoadingGrids || isFetchingVariations) && allGrids.length === 0 ? (
              // Loading from database
              <div className="space-y-12 animate-in fade-in duration-300">
                {[1, 2, 3].map((gridIndex) => (
                  <motion.div 
                    key={gridIndex}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: gridIndex * 0.1 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <Skeleton className="h-7 w-48" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                      <Skeleton className="h-9 w-32" />
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4">
                      {Array.from({ length: 9 }).map((_, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: gridIndex * 0.1 + i * 0.03 }}
                        >
                          <AspectRatio ratio={1 / 1}>
                            <Skeleton className="w-full h-full rounded-xl" />
                          </AspectRatio>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : isLoading && allGrids.length === 0 ? (
              // Generating new logos
              <div className="flex flex-col items-center justify-center py-20 px-4">
                <div className="w-16 h-16 mb-6 relative">
                  <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                </div>
                <h3 className="text-xl font-semibold mb-2">Creating Your Logos</h3>
                <p className="text-muted-foreground text-center max-w-md">
                  Our AI is crafting unique designs just for you. This usually takes 10-20 seconds.
                </p>
              </div>
            ) : allGrids.length === 0 ? (
              // Empty state - no logos exist
              <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                <div className="w-20 h-20 mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-2xl font-semibold mb-2">Ready to Create?</h3>
                <p className="text-muted-foreground max-w-md mb-6">
                  {user 
                    ? "Describe your vision in the form and let AI bring it to life. Your creations will appear here."
                    : "Sign in to start generating unique AI-powered logos and assets."}
                </p>
                {!user && (
                  <p className="text-sm text-muted-foreground">
                    👈 Use the form on the left to get started
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-12">
                <AnimatePresence mode="popLayout">
                  {allGrids.map((gridWithLogos, index) => (
                    <motion.div
                      key={gridWithLogos.grid.id}
                      initial={{ opacity: 0, y: index === 0 ? -20 : 0, scale: index === 0 ? 0.95 : 1 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ 
                        duration: 0.5,
                        ease: [0.4, 0, 0.2, 1],
                        delay: index === 0 ? 0 : 0
                      }}
                      className="space-y-4"
                    >
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-semibold">{gridWithLogos.grid.concept}</h2>
                        <p className="text-sm text-muted-foreground">
                          {gridWithLogos.grid.creationDate instanceof Date 
                            ? gridWithLogos.grid.creationDate.toLocaleDateString()
                            : new Date(gridWithLogos.grid.creationDate?.seconds * 1000 || Date.now()).toLocaleDateString()}
                          {' • '}
                          {gridWithLogos.logos.length} {gridWithLogos.logos.length === 1 ? 'logo' : 'logos'}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadAll(gridWithLogos)}
                        className="gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Download All
                      </Button>
                    </div>
                    <LogoGrid
                      logos={gridWithLogos.logos}
                      onSelectLogo={setSelectedLogo}
                      isLoading={false}
                      gridSize={gridWithLogos.grid.gridSize}
                      isAuthenticated={!!user}
                      onUpscale={handleUpscale}
                      onGenerateVariations={handleGenerateVariations}
                      isSingleImage={gridWithLogos.logos.length === 1}
                    />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </main>
      <EditSidebar
        logo={selectedLogo}
        isOpen={!!selectedLogo}
        onOpenChange={(isOpen) => !isOpen && setSelectedLogo(null)}
        onUpdateLogo={handleUpdateLogo}
        onAddLogo={(newLogo) => {
          const currentGrid = allGrids.find(g => g.grid.id === selectedLogo?.logoGridId);
          handleAddLogo(newLogo, currentGrid?.logos.length || 0);
        }}
      />
    </>
  );
}
