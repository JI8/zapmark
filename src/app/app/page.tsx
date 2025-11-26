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
  deleteDoc,
} from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Download, Sparkles, Copy, Trash2 } from 'lucide-react';
import Header from '@/components/layout/header';
import LogoGeneratorForm, { type LogoGenSchema } from '@/components/app/logo-generator-form';
import { MobileGenerator } from '@/components/app/mobile-generator';
import LogoGrid from '@/components/app/logo-grid';
import EditSidebar from '@/components/app/edit-sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useUser, useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking, setDocumentNonBlocking, useStorage } from '@/firebase';
import { sliceGridImage } from '@/lib/image-slicer';
import { generateInitialLogoGrid } from '@/ai/flows/generate-initial-logo-grid';
import { generateVariationGrid } from '@/ai/flows/generate-variation-grid';
import { generateVarietyGrid } from '@/ai/flows/generate-variety-grid';
import { upscaleAndCleanupLogo } from '@/ai/flows/upscale-and-cleanup-logo';
import { tokenManager } from '@/lib/tokens/token-manager';
import { errorService } from '@/lib/errors/error-service';
import { monitoringService } from '@/lib/monitoring/monitoring-service';
import { OnboardingWizard, type WizardData } from '@/components/app/onboarding-wizard';
import { TrialBanner } from '@/components/app/trial-banner';
import { SignupGateModal } from '@/components/app/signup-gate-modal';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { useTrialState } from '@/lib/trial';
import { checkRateLimit, recordTrialGeneration } from '@/lib/trial/rate-limit';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useAuth } from '@/firebase';

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
  gridSize: '2x2' | '3x3' | '4x4';
  userId: string;
  type?: 'concept' | 'variations' | 'variety' | 'upscale';
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
  const [showWizard, setShowWizard] = useState(false);
  const [wizardData, setWizardData] = useState<Partial<WizardData>>({});
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [isGenerationDone, setIsGenerationDone] = useState(false);
  const [lastGeneratedImage, setLastGeneratedImage] = useState<string | null>(null);
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [gridToDelete, setGridToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [pendingGridSize, setPendingGridSize] = useState<'2x2' | '3x3' | '4x4'>('3x3');
  const [pendingIsSingleImage, setPendingIsSingleImage] = useState(false);
  const [pendingPrompt, setPendingPrompt] = useState<string>('');
  const [selectedLogoIds, setSelectedLogoIds] = useState<Set<string>>(new Set());
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const storage = useStorage();
  const {
    hasSeenOnboarding,
    markOnboardingSeen,
    trialGrid,
    saveTrialGrid,
    isTrialActive,
    dismissedBanner,
    markBannerDismissed,
    hasCreatedAccount,
    markAccountCreated,
    clearTrialState
  } = useTrialState();

  // Show wizard for first-time non-logged-in users (who haven't created an account before)
  useEffect(() => {
    if (!isUserLoading && !user && !hasSeenOnboarding && !hasCreatedAccount) {
      setShowWizard(true);
    }
  }, [user, isUserLoading, hasSeenOnboarding, hasCreatedAccount]);

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

  const handleDeleteGrid = (gridId: string) => {
    setGridToDelete(gridId);
    setDeleteConfirmationOpen(true);
  };

  const confirmDeleteGrid = async () => {
    if (!user || !firestore || !gridToDelete) return;

    setIsDeleting(true);

    try {
      await deleteDoc(doc(firestore, 'users', user.uid, 'logoGrids', gridToDelete));

      // Optimistically remove from UI
      setAllGrids((prev) => prev.filter((g) => g.grid.id !== gridToDelete));

      toast({
        title: 'Grid Deleted',
        description: 'The grid has been removed.',
      });
    } catch (error) {
      console.error('Delete failed:', error);
      toast({
        variant: 'destructive',
        title: 'Delete Failed',
        description: 'Could not delete the grid.',
      });
    } finally {
      setIsDeleting(false);
      setDeleteConfirmationOpen(false);
      setGridToDelete(null);
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
        // Load trial grid from localStorage if it exists
        if (trialGrid) {
          const trialGridWithLogos: GridWithLogos = {
            grid: {
              id: 'trial-grid',
              concept: trialGrid.concept,
              creationDate: new Date(trialGrid.generatedAt),
              gridSize: trialGrid.gridSize,
              userId: 'trial',
              type: 'concept',
            },
            logos: trialGrid.tiles.map(tile => ({
              id: tile.id,
              url: tile.dataUrl,
              tileIndex: tile.tileIndex,
            })),
          };
          setAllGrids([trialGridWithLogos]);
        } else {
          setAllGrids([]);
        }
        setIsFetchingVariations(false);
        return;
      }

      // Don't show trial grid for authenticated users - wait for Firestore data

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
  }, [user, isUserLoading, logoGrids, isLoadingGrids, firestore, isLoading, isSaving, trialGrid]);

  const handleWizardComplete = (data: WizardData) => {
    setShowWizard(false);
    markOnboardingSeen();

    // Trigger generation with wizard data
    handleGenerate({
      textConcept: data.concept,
      gridSize: data.gridSize,
      styleId: 'custom', // Default style for trial
      inputImages: [],
    });
  };

  const handleWizardStepChange = (step: number, data: Partial<WizardData>) => {
    setWizardData(data);
  };

  const handleGenerate = async (data: z.infer<typeof LogoGenSchema>) => {
    const isTrial = !user;

    // Check if user has already created an account - require login
    if (isTrial && hasCreatedAccount) {
      toast({
        title: 'Please Log In',
        description: 'You\'ve already created an account. Please log in to continue.',
      });
      return;
    }

    // Check if trial user already has a grid - show signup modal
    if (isTrial && isTrialActive) {
      setShowSignupModal(true);
      return;
    }

    // For trial users, check IP-based rate limit
    if (isTrial) {
      const rateLimitCheck = await checkRateLimit();
      if (!rateLimitCheck.allowed) {
        toast({
          variant: 'destructive',
          title: 'Rate Limit Reached',
          description: rateLimitCheck.reason || 'Please sign up to continue.',
        });
        return;
      }
    }

    // For authenticated users, check and deduct token
    if (user) {
      const tokenResult = await deductToken(1, 'generateInitialLogoGrid');
      if (!tokenResult.success) {
        return; // Token deduction failed, error already shown
      }
    }

    setPendingGridSize(data.gridSize);
    setPendingIsSingleImage(false);
    setPendingPrompt(data.textConcept);
    setIsLoading(true);
    setIsGenerationDone(false);
    setLastGeneratedImage(null);

    let temporaryLogos: Logo[] = [];
    let tempGrid: GridWithLogos | null = null;
    let shouldRefund = false;

    try {
      // Removed toast - loading state shows progress

      // Build enhanced prompt for AI generation
      const { buildPromptWithStyle } = await import('@/lib/generation-styles');
      const enhancedPrompt = buildPromptWithStyle(data.textConcept, data.styleId);

      const result = await generateInitialLogoGrid({
        textConcept: enhancedPrompt,
        gridSize: data.gridSize,
      });

      shouldRefund = false; // Generation succeeded

      const rows = data.gridSize === '2x2' ? 2 : data.gridSize === '3x3' ? 3 : 4;
      const cols = data.gridSize === '2x2' ? 2 : data.gridSize === '3x3' ? 3 : 4;
      const slicedImages = await sliceGridImage(result.logoGridImage, rows, cols);

      temporaryLogos = slicedImages.map((dataUrl, index) => ({
        id: `temp-${Date.now()}-${index}`,
        url: dataUrl,
        isUnsaved: true,
        tileIndex: index,
      }));

      // Generate ID upfront for authenticated users to avoid re-render
      const newLogoGridId = user ? doc(collection(firestore, 'users', user.uid, 'logoGrids')).id : ('temp-' + Date.now());

      // Pre-generate variation IDs for logos to ensure stability
      const temporaryLogosWithIds = temporaryLogos.map(logo => {
        const variationId = user
          ? doc(collection(firestore, `users/${user.uid}/logoGrids/${newLogoGridId}/logoVariations`)).id
          : logo.id;
        return {
          ...logo,
          id: variationId,
          logoGridId: newLogoGridId,
        };
      });

      // Create temporary grid to show immediately
      tempGrid = {
        grid: {
          id: isTrial ? 'trial-grid' : newLogoGridId,
          concept: data.textConcept,
          creationDate: new Date(),
          gridSize: data.gridSize,
          type: 'concept',
          userId: user?.uid || 'trial',
        },
        logos: temporaryLogosWithIds,
      };

      // Add to top of grids list
      setAllGrids(prev => [tempGrid!, ...prev]);
      setIsLoading(false); // Stop main loading indicator
      setIsGenerationDone(true);
      if (temporaryLogosWithIds.length > 0) {
        setLastGeneratedImage(temporaryLogosWithIds[0].url);
      }

      // Scroll to top removed - user must click "Done" in header

      // For trial users, save to localStorage and stop here
      if (isTrial) {
        saveTrialGrid({
          concept: data.textConcept,
          assetType: 'logo', // Default for now
          gridSize: data.gridSize,
          tiles: temporaryLogosWithIds.map(logo => ({
            id: logo.id,
            dataUrl: logo.url,
            tileIndex: logo.tileIndex!,
          })),
          generatedAt: Date.now(),
        });

        // Record trial generation for rate limiting
        await recordTrialGeneration();

        toast({
          title: 'Trial Grid Generated!',
          description: 'Sign up to download, upscale, or generate more.',
        });
        return; // Don't save to Firestore
      }

      // For authenticated users, start auto-saving in the background
      setIsSaving(true);
      if (!firestore || !storage) throw new Error("Firestore or Storage service not available.");

      // ID already generated above
      const gridDocRef = doc(firestore, 'users', user.uid, 'logoGrids', newLogoGridId);

      const savedLogos: Logo[] = [];
      const batch = writeBatch(firestore);

      for (const [index, logo] of temporaryLogosWithIds.entries()) {
        const variationId = logo.id; // Use the pre-generated ID
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
        type: 'concept' as const,
        creationDate: serverTimestamp(),
      };
      batch.set(gridDocRef, logoGridData);

      await batch.commit();

      // Silently update metadata without changing display or ID
      if (tempGrid) {
        setAllGrids(prev => prev.map(g =>
          g.grid.id === newLogoGridId
            ? {
              ...g,
              // ID is already correct, no need to update grid.id
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
        userId: user?.uid || 'trial',
        metadata: { gridSize: data.gridSize },
      });

      // Refund token if generation failed (not if just saving failed) - only for authenticated users
      if (user && shouldRefund && errorResult.shouldRefundToken) {
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

    // Find parent grid to get the concept name
    const parentGrid = allGrids.find(g => g.grid.id === logo.logoGridId);
    const parentConcept = parentGrid?.grid.concept || 'Logo';

    setPendingGridSize('3x3');
    setPendingIsSingleImage(false);
    setPendingPrompt(parentConcept);
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

      // Generate ID upfront
      const newLogoGridId = doc(collection(firestore, 'users', user.uid, 'logoGrids')).id;

      // Pre-generate variation IDs
      const temporaryLogosWithIds = temporaryLogos.map(logo => {
        const variationId = doc(collection(firestore, `users/${user.uid}/logoGrids/${newLogoGridId}/logoVariations`)).id;
        return {
          ...logo,
          id: variationId,
          logoGridId: newLogoGridId,
        };
      });

      // Create temporary grid
      tempGrid = {
        grid: {
          id: newLogoGridId,
          concept: parentConcept,
          creationDate: new Date(),
          gridSize: '3x3',
          type: 'variations',
          userId: user.uid,
        },
        logos: temporaryLogosWithIds,
      };

      // Add to top of grids list
      setAllGrids(prev => [tempGrid!, ...prev]);
      setIsLoading(false);

      // Scroll to top to show new grid
      setTimeout(() => scrollToTop(), 100);

      // Removed toast - animation shows the result

      // Save in background
      setIsSaving(true);
      // ID already generated
      const gridDocRef = doc(firestore, 'users', user.uid, 'logoGrids', newLogoGridId);

      const savedLogos: Logo[] = [];
      const batch = writeBatch(firestore);

      for (const [index, tempLogo] of temporaryLogosWithIds.entries()) {
        const variationId = tempLogo.id; // Use pre-generated ID
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
        type: 'variations' as const,
        creationDate: serverTimestamp(),
      };
      batch.set(gridDocRef, logoGridData);

      await batch.commit();

      // Update the temporary grid with saved data
      setAllGrids(prev => prev.map(g =>
        g.grid.id === newLogoGridId
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

  const handleGenerateVariety = async (logo: Logo) => {
    if (!user || !firestore || !storage) {
      toast({
        variant: 'destructive',
        title: 'Please Log In',
        description: 'You must be logged in to generate variety.',
      });
      return;
    }

    // Check and deduct token first
    const tokenResult = await deductToken(1, 'generateVarietyGrid');
    if (!tokenResult.success) {
      return; // Token deduction failed, error already shown
    }

    // Find parent grid to get the concept name
    const parentGrid = allGrids.find(g => g.grid.id === logo.logoGridId);
    const parentConcept = parentGrid?.grid.concept || 'Logo';

    setPendingGridSize('3x3');
    setPendingIsSingleImage(false);
    setPendingPrompt(parentConcept);
    setIsLoading(true);
    let shouldRefund = true;
    let tempGrid: GridWithLogos | null = null;

    try {
      // Generate 3x3 variety grid
      const result = await generateVarietyGrid({
        baseLogo: logo.url,
      });

      shouldRefund = false; // Generation succeeded

      // Slice the grid into individual tiles
      const slicedImages = await sliceGridImage(result.varietyGridImage, 3, 3);

      const temporaryLogos = slicedImages.map((dataUrl, index) => ({
        id: `temp-${Date.now()}-${index}`,
        url: dataUrl,
        isUnsaved: true,
        tileIndex: index,
      }));

      // Generate ID upfront
      const newLogoGridId = doc(collection(firestore, 'users', user.uid, 'logoGrids')).id;

      // Pre-generate variation IDs
      const temporaryLogosWithIds = temporaryLogos.map(logo => {
        const variationId = doc(collection(firestore, `users/${user.uid}/logoGrids/${newLogoGridId}/logoVariations`)).id;
        return {
          ...logo,
          id: variationId,
          logoGridId: newLogoGridId,
        };
      });

      // Create temporary grid
      tempGrid = {
        grid: {
          id: newLogoGridId,
          concept: parentConcept,
          creationDate: new Date(),
          gridSize: '3x3',
          type: 'variety',
          userId: user.uid,
        },
        logos: temporaryLogosWithIds,
      };

      // Add to top of grids list
      setAllGrids(prev => [tempGrid!, ...prev]);
      setIsLoading(false);

      // Scroll to top to show new grid
      setTimeout(() => scrollToTop(), 100);

      // Save in background
      setIsSaving(true);
      // ID already generated
      const gridDocRef = doc(firestore, 'users', user.uid, 'logoGrids', newLogoGridId);

      const savedLogos: Logo[] = [];
      const batch = writeBatch(firestore);

      for (const [index, tempLogo] of temporaryLogosWithIds.entries()) {
        const variationId = tempLogo.id; // Use pre-generated ID
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
        type: 'variety' as const,
        creationDate: serverTimestamp(),
      };
      batch.set(gridDocRef, logoGridData);

      await batch.commit();

      // Update the temporary grid with saved data
      setAllGrids(prev => prev.map(g =>
        g.grid.id === newLogoGridId
          ? {
            grid: { ...logoGridData, creationDate: new Date() },
            logos: savedLogos.sort((a, b) => a.tileIndex! - b.tileIndex!),
          }
          : g
      ));
    } catch (error) {
      console.error('Variety generation failed:', error);

      // Categorize error and determine if refund is needed
      const errorResult = errorService.categorizeError(error, {
        operation: 'generateVarietyGrid',
        userId: user.uid,
      });

      // Refund token if generation failed
      if (shouldRefund && errorResult.shouldRefundToken) {
        await refundToken(1, 'generateVarietyGrid', errorResult.message);
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

    // Find parent grid to get the concept name
    const parentGrid = allGrids.find(g => g.grid.id === logo.logoGridId);
    const parentConcept = parentGrid?.grid.concept || 'Logo';

    setPendingGridSize('3x3');
    setPendingIsSingleImage(true);
    setPendingPrompt(parentConcept);
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

      // Generate ID upfront
      const newLogoGridId = doc(collection(firestore, 'users', user.uid, 'logoGrids')).id;
      const variationId = doc(collection(firestore, `users/${user.uid}/logoGrids/${newLogoGridId}/logoVariations`)).id;

      const upscaledLogoWithId: Logo = {
        ...upscaledLogo,
        id: variationId,
        logoGridId: newLogoGridId,
      };

      // Create a single-logo grid for the upscaled version
      tempGrid = {
        grid: {
          id: newLogoGridId,
          concept: parentConcept,
          creationDate: new Date(),
          gridSize: '3x3',
          type: 'upscale',
          userId: user.uid,
        },
        logos: [upscaledLogoWithId],
      };

      // Add to top of grids list
      setAllGrids(prev => [tempGrid!, ...prev]);
      setIsLoading(false);

      // Scroll to top to show new grid
      setTimeout(() => scrollToTop(), 100);

      // Removed toast - animation shows the result

      // Save in background
      setIsSaving(true);
      // ID already generated
      const gridDocRef = doc(firestore, 'users', user.uid, 'logoGrids', newLogoGridId);

      // ID already generated
      const storageRef = ref(storage, `users/${user.uid}/logos/${newLogoGridId}/${variationId}.png`);

      const uploadTask = await uploadString(storageRef, upscaledLogoWithId.url, 'data_url');
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
        type: 'upscale' as const,
        creationDate: serverTimestamp(),
      };
      batch.set(gridDocRef, logoGridData);

      await batch.commit();

      // Update the temporary grid with saved data
      const savedLogo: Logo = {
        ...upscaledLogoWithId,
        id: variationId,
        url: upscaledLogoWithId.url,
        isUnsaved: false,
        logoGridId: newLogoGridId,
      };

      setAllGrids(prev => prev.map(g =>
        g.grid.id === newLogoGridId
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

  const handleEdit = async (logo: Logo, prompt: string, mode: 'single' | 'grid') => {
    if (!user || !firestore || !storage) {
      toast({
        variant: 'destructive',
        title: 'Please Log In',
        description: 'You must be logged in to edit.',
      });
      return;
    }

    // Check and deduct token first
    const tokenResult = await deductToken(1, mode === 'single' ? 'editLogoWithTextPrompt' : 'editLogoGrid');
    if (!tokenResult.success) {
      return; // Token deduction failed, error already shown
    }

    // Find parent grid to get the concept name
    const parentGrid = allGrids.find(g => g.grid.id === logo.logoGridId);
    const parentConcept = parentGrid?.grid.concept || 'Logo';

    setPendingGridSize('3x3');
    setPendingIsSingleImage(mode === 'single');
    setPendingPrompt(parentConcept);
    setIsLoading(true);
    let shouldRefund = true;
    let tempGrid: GridWithLogos | null = null;

    try {
      if (mode === 'single') {
        // Single image edit with upscale
        const { editLogoWithTextPrompt } = await import('@/ai/flows/edit-logo-with-text-prompt');
        const result = await editLogoWithTextPrompt({
          logoDataUri: logo.url,
          textPrompt: prompt,
        });

        shouldRefund = false; // Edit succeeded

        const editedLogo: Logo = {
          id: `temp-${Date.now()}`,
          url: result.editedLogoDataUri,
          isUnsaved: true,
          tileIndex: 0,
        };

        // Generate ID upfront
        const newLogoGridId = doc(collection(firestore, 'users', user.uid, 'logoGrids')).id;
        const variationId = doc(collection(firestore, `users/${user.uid}/logoGrids/${newLogoGridId}/logoVariations`)).id;

        const editedLogoWithId: Logo = {
          ...editedLogo,
          id: variationId,
          logoGridId: newLogoGridId,
        };

        // Create a single-logo grid for the edited version
        tempGrid = {
          grid: {
            id: newLogoGridId,
            concept: parentConcept,
            creationDate: new Date(),
            gridSize: '3x3',
            type: 'upscale',
            userId: user.uid,
          },
          logos: [editedLogoWithId],
        };

        // Add to top of grids list
        setAllGrids(prev => [tempGrid!, ...prev]);
        setIsLoading(false);

        // Scroll to top to show new grid
        setTimeout(() => scrollToTop(), 100);

        // Save in background
        setIsSaving(true);
        // ID already generated
        const gridDocRef = doc(firestore, 'users', user.uid, 'logoGrids', newLogoGridId);

        // ID already generated
        const storageRef = ref(storage, `users/${user.uid}/logos/${newLogoGridId}/${variationId}.png`);

        const uploadTask = await uploadString(storageRef, editedLogoWithId.url, 'data_url');
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
          type: 'upscale' as const,
          creationDate: serverTimestamp(),
        };
        batch.set(gridDocRef, logoGridData);

        await batch.commit();

        // Update the temporary grid with saved data
        const savedLogo: Logo = {
          ...editedLogoWithId,
          id: variationId,
          url: editedLogoWithId.url,
          isUnsaved: false,
          logoGridId: newLogoGridId,
        };

        setAllGrids(prev => prev.map(g =>
          g.grid.id === newLogoGridId
            ? {
              grid: { ...logoGridData, creationDate: new Date() },
              logos: [savedLogo],
            }
            : g
        ));
      } else {
        // Grid mode - generate 3x3 grid with edit applied
        const { editLogoGrid } = await import('@/ai/flows/edit-logo-grid');
        const result = await editLogoGrid({
          baseLogo: logo.url,
          editPrompt: prompt,
        });

        shouldRefund = false; // Edit succeeded

        // Slice the grid into individual tiles
        const slicedImages = await sliceGridImage(result.editedGridImage, 3, 3);

        const temporaryLogos = slicedImages.map((dataUrl, index) => ({
          id: `temp-${Date.now()}-${index}`,
          url: dataUrl,
          isUnsaved: true,
          tileIndex: index,
        }));

        // Generate ID upfront
        const newLogoGridId = doc(collection(firestore, 'users', user.uid, 'logoGrids')).id;

        // Pre-generate variation IDs
        const temporaryLogosWithIds = temporaryLogos.map(logo => {
          const variationId = doc(collection(firestore, `users/${user.uid}/logoGrids/${newLogoGridId}/logoVariations`)).id;
          return {
            ...logo,
            id: variationId,
            logoGridId: newLogoGridId,
          };
        });

        // Create temporary grid
        tempGrid = {
          grid: {
            id: newLogoGridId,
            concept: parentConcept,
            creationDate: new Date(),
            gridSize: '3x3',
            type: 'variations',
            userId: user.uid,
          },
          logos: temporaryLogosWithIds,
        };

        // Add to top of grids list
        setAllGrids(prev => [tempGrid!, ...prev]);
        setIsLoading(false);

        // Scroll to top to show new grid
        setTimeout(() => scrollToTop(), 100);

        // Save in background
        setIsSaving(true);
        // ID already generated
        const gridDocRef = doc(firestore, 'users', user.uid, 'logoGrids', newLogoGridId);

        const savedLogos: Logo[] = [];
        const batch = writeBatch(firestore);

        for (const [index, tempLogo] of temporaryLogosWithIds.entries()) {
          const variationId = tempLogo.id; // Use pre-generated ID
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
          type: 'variations' as const,
          creationDate: serverTimestamp(),
        };
        batch.set(gridDocRef, logoGridData);

        await batch.commit();

        // Update the temporary grid with saved data
        setAllGrids(prev => prev.map(g =>
          g.grid.id === newLogoGridId
            ? {
              grid: { ...logoGridData, creationDate: new Date() },
              logos: savedLogos.sort((a, b) => a.tileIndex! - b.tileIndex!),
            }
            : g
        ));
      }
    } catch (error) {
      console.error('Edit failed:', error);

      // Categorize error and determine if refund is needed
      const errorResult = errorService.categorizeError(error, {
        operation: mode === 'single' ? 'editLogoWithTextPrompt' : 'editLogoGrid',
        userId: user.uid,
      });

      // Refund token if edit failed
      if (shouldRefund && errorResult.shouldRefundToken) {
        await refundToken(1, mode === 'single' ? 'editLogoWithTextPrompt' : 'editLogoGrid', errorResult.message);
      }

      toast({
        variant: 'destructive',
        title: 'Edit Failed',
        description: errorResult.userMessage,
      });

      // Remove temporary grid if edit failed
      if (shouldRefund && tempGrid) {
        setAllGrids(prev => prev.filter(g => g.grid.id !== tempGrid!.grid.id));
      }
    } finally {
      setIsLoading(false);
      setIsSaving(false);
    }
  };

  const handleViewResults = () => {
    scrollToTop();
    setIsGenerationDone(false);
    setLastGeneratedImage(null);
  };

  const handleToggleSelection = (logoId: string) => {
    setSelectedLogoIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(logoId)) {
        newSet.delete(logoId);
      } else {
        newSet.add(logoId);
      }
      return newSet;
    });
  };

  const handleClearSelection = () => {
    setSelectedLogoIds(new Set());
  };

  // Get selected logos data for header preview
  const selectedLogos = allGrids.flatMap(g => g.logos).filter(logo => selectedLogoIds.has(logo.id));

  return (
    <>
      <Header
        isGenerating={isLoading}
        isDone={isGenerationDone}
        previewImage={lastGeneratedImage}
        onViewResults={handleViewResults}
        selectedLogos={selectedLogos}
        onClearSelection={handleClearSelection}
      />
      <main className="flex flex-col md:flex-row h-[calc(100vh-4rem)]">
        {/* Fixed Left Sidebar - Desktop Only */}
        <aside className="hidden md:flex md:w-[440px] border-r bg-muted/5 flex-col">
          <div className="flex-1 overflow-y-auto flex items-center justify-center p-4 md:p-6">
            <div className="w-full max-w-md space-y-8">
              <section className="text-left space-y-2">
                <h1 className="text-3xl font-bold font-headline tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  Create New Asset
                </h1>
                <p className="text-muted-foreground">
                  {user
                    ? `Welcome back, ${user.displayName?.split(' ')[0] || 'creator'}.`
                    : 'Turn your ideas into professional assets in seconds.'}
                </p>
              </section>
              <LogoGeneratorForm
                onGenerate={handleGenerate}
                isLoading={isLoading || isSaving}
                isAuthenticated={!!user}
                selectedLogos={selectedLogos}
                onClearSelection={handleClearSelection}
              />
            </div>
          </div>
        </aside>

        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto scroll-smooth pb-24 md:pb-0">
          <div className="container max-w-5xl mx-auto p-4 md:p-6 lg:p-8 min-h-full flex flex-col">
            {/* Trial Banner */}
            {!user && isTrialActive && !dismissedBanner && (
              <TrialBanner
                onSignup={() => setShowSignupModal(true)}
                onDismiss={markBannerDismissed}
              />
            )}
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
              <div className="relative flex-1 flex flex-col items-center justify-center p-8 overflow-hidden">
                {/* Background Pattern - Large 3x3 Grid */}
                <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none p-6">
                  <div className="grid grid-cols-3 gap-4 md:gap-6 w-full aspect-square">
                    {Array.from({ length: 9 }).map((_, i) => (
                      <div key={i} className="w-full h-full rounded-3xl border-4 border-foreground border-dashed" />
                    ))}
                  </div>
                </div>

                {/* Central Content */}
                <div className="relative z-10 max-w-lg w-full bg-background/60 backdrop-blur-md border shadow-2xl rounded-[2.5rem] p-10 text-center">
                  {/* 3x3 Grid Graphic - Even Grid */}
                  <div className="w-32 h-32 mx-auto mb-8 bg-background rounded-2xl shadow-xl border p-3 rotate-6 transition-transform hover:rotate-3 duration-500">
                    <div className="grid grid-cols-3 gap-2 h-full">
                      <div className="bg-primary/10 rounded-lg" />
                      <div className="bg-primary/30 rounded-lg" />
                      <div className="bg-primary/10 rounded-lg" />
                      <div className="bg-primary/20 rounded-lg" />
                      <div className="bg-primary/60 rounded-lg shadow-sm" />
                      <div className="bg-primary/20 rounded-lg" />
                      <div className="bg-primary/10 rounded-lg" />
                      <div className="bg-primary/40 rounded-lg" />
                      <div className="bg-primary/10 rounded-lg" />
                    </div>
                  </div>

                  <h3 className="text-2xl md:text-3xl font-bold mb-4 font-headline tracking-tight">Your Gallery Awaits</h3>
                  <p className="text-muted-foreground mb-8 leading-relaxed text-lg">
                    {user
                      ? "This space is reserved for your masterpieces. Use the tools on the left to generate your first collection."
                      : "Fill this grid with unique, AI-generated assets. Sign in to start building your personal library."}
                  </p>

                  {!user && (
                    <div className="flex items-center justify-center gap-2 text-sm font-medium text-primary bg-primary/5 py-2.5 px-5 rounded-full w-fit mx-auto">
                      <span>👈 Use the sidebar to start</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-12">
                {isLoading && (
                  <div className="space-y-4 mb-8">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h2 className="text-xl font-semibold truncate text-muted-foreground/80">
                            {pendingPrompt}
                          </h2>
                          <span className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium rounded-full bg-primary/10 text-primary animate-pulse">
                            <Sparkles className="w-3 h-3" />
                            Generating...
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Creating your assets...
                        </p>
                      </div>
                    </div>
                    <LogoGrid
                      logos={[]}
                      onSelectLogo={() => { }}
                      isLoading={true}
                      gridSize={pendingGridSize}
                      isAuthenticated={!!user}
                      isSingleImage={pendingIsSingleImage}
                      selectedLogoIds={selectedLogoIds}
                      onToggleSelection={handleToggleSelection}
                    />
                  </div>
                )}
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
                      <div
                        className="sticky top-0 bg-background/95 backdrop-blur-sm pb-3 -mt-3 pt-3 border-b border-transparent"
                        style={{ zIndex: 30 + index }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0 mr-4">
                            <div className="flex items-center gap-2">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <h2 className="text-xl font-semibold truncate cursor-help">
                                      {gridWithLogos.grid.concept}
                                    </h2>
                                  </TooltipTrigger>
                                  <TooltipContent side="bottom" className="max-w-md">
                                    <p className="text-sm">{gridWithLogos.grid.concept}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>

                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(gridWithLogos.grid.concept);
                                  toast({
                                    title: 'Copied!',
                                    description: 'Prompt copied to clipboard',
                                  });
                                }}
                                className="flex-shrink-0 p-1 hover:bg-accent rounded transition-colors"
                                title="Copy prompt"
                              >
                                <Copy className="w-4 h-4 text-muted-foreground" />
                              </button>

                              {gridWithLogos.grid.type && (
                                <span className={`
                              flex-shrink-0 px-2 py-0.5 text-xs font-medium rounded-full
                              ${gridWithLogos.grid.type === 'concept' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : ''}
                              ${gridWithLogos.grid.type === 'variations' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' : ''}
                              ${gridWithLogos.grid.type === 'variety' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300' : ''}
                              ${gridWithLogos.grid.type === 'upscale' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : ''}
                            `}>
                                  {gridWithLogos.grid.type === 'concept' && 'Concept'}
                                  {gridWithLogos.grid.type === 'variations' && 'Variations'}
                                  {gridWithLogos.grid.type === 'variety' && 'Variety'}
                                  {gridWithLogos.grid.type === 'upscale' && 'Upscaled'}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {gridWithLogos.grid.creationDate instanceof Date
                                ? gridWithLogos.grid.creationDate.toLocaleDateString()
                                : new Date(gridWithLogos.grid.creationDate?.seconds * 1000 || Date.now()).toLocaleDateString()}
                              {' • '}
                              {gridWithLogos.logos.length} {gridWithLogos.logos.length === 1 ? 'result' : 'results'}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteGrid(gridWithLogos.grid.id)}
                            className="gap-2 hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:hover:bg-red-900/20 dark:hover:text-red-400 dark:hover:border-red-800 mr-2"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadAll(gridWithLogos)}
                            className="gap-2 hover:bg-gray-100 dark:hover:bg-gray-800"
                          >
                            <Download className="h-4 w-4" />
                            Download All
                          </Button>
                        </div>
                      </div>
                      <LogoGrid
                        logos={gridWithLogos.logos}
                        onSelectLogo={setSelectedLogo}
                        isLoading={false}
                        gridSize={gridWithLogos.grid.gridSize as '2x2' | '3x3' | '4x4'}
                        isAuthenticated={!!user}
                        onUpscale={handleUpscale}
                        onGenerateVariations={handleGenerateVariations}
                        onGenerateVariety={handleGenerateVariety}
                        onEdit={handleEdit}
                        isSingleImage={gridWithLogos.logos.length === 1}
                        isTrial={!user && gridWithLogos.grid.id === 'trial-grid'}
                        onTrialAction={() => setShowSignupModal(true)}
                        selectedLogoIds={selectedLogoIds}
                        onToggleSelection={handleToggleSelection}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </main>
      <ConfirmationDialog
        open={deleteConfirmationOpen}
        onOpenChange={setDeleteConfirmationOpen}
        title="Delete Grid"
        description="Are you sure you want to delete this grid? This action cannot be undone and all generated assets in this grid will be lost."
        confirmText="Delete"
        variant="destructive"
        onConfirm={confirmDeleteGrid}
        isLoading={isDeleting}
      />
      <EditSidebar
        logo={selectedLogo}
        isOpen={!!selectedLogo}
        onOpenChange={(isOpen) => !isOpen && setSelectedLogo(null)}
        onUpdateLogo={(updatedLogo) => {
          setAllGrids(prev => prev.map(g => ({
            ...g,
            logos: g.logos.map(l => l.id === updatedLogo.id ? updatedLogo : l)
          })));
        }}
        onAddLogo={(newLogo) => {
          // Add the new logo to the current grid
          setAllGrids(prev => prev.map(g =>
            g.grid.id === selectedLogo?.logoGridId
              ? { ...g, logos: [...g.logos, newLogo] }
              : g
          ));
        }}
      />
      <OnboardingWizard
        open={showWizard}
        onOpenChange={setShowWizard}
        onComplete={handleWizardComplete}
        onStepChange={handleWizardStepChange}
      />
      <SignupGateModal
        open={showSignupModal}
        onOpenChange={setShowSignupModal}
        onGoogleSignup={handleGoogleSignup}
        onEmailSignup={handleEmailSignup}
      />

      <MobileGenerator
        onGenerate={handleGenerate}
        isLoading={isLoading || isSaving}
        selectedLogos={selectedLogos}
        onClearSelection={handleClearSelection}
      />
    </>
  );

  // Signup handlers
  async function handleGoogleSignup() {
    if (!auth || !firestore || !storage) return

    const provider = new GoogleAuthProvider()
    provider.setCustomParameters({
      prompt: 'select_account',
    })

    try {
      const result = await signInWithPopup(auth, provider)
      const gUser = result.user

      // Create user document
      const userDocRef = doc(firestore, 'users', gUser.uid)
      const userDoc = await getDoc(userDocRef)

      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
          id: gUser.uid,
          email: gUser.email,
          name: gUser.displayName,
          creationDate: serverTimestamp(),
          monthlyTokenAllotment: 100,
          remainingTokens: 100,
        })
      }

      // Mark that account was created (prevents trial after logout)
      markAccountCreated()

      // Close modal and show welcome message immediately
      setShowSignupModal(false)

      toast({
        title: 'Welcome to Zapmark!',
        description: trialGrid
          ? 'Your trial grid is being saved. You now have 100 credits!'
          : 'Your account and initial credits have been set up.',
      })

      // Migrate trial grid in background if it exists
      if (trialGrid) {
        // Migrate and clear trial state
        const { migrateTrialGridToAccount } = await import('@/lib/trial')
        migrateTrialGridToAccount(
          trialGrid,
          gUser.uid,
          firestore,
          storage
        ).then((migrationResult) => {
          if (migrationResult.success) {
            // Clear trial state after successful migration
            clearTrialState()
            console.log('Trial grid successfully migrated and cleared from localStorage')
          } else {
            console.error('Migration failed:', migrationResult.error)
            // Don't clear trial state if migration failed
            toast({
              variant: 'destructive',
              title: 'Migration Issue',
              description: 'There was an issue saving your grid. Please contact support.',
            })
          }
        }).catch((error) => {
          console.error('Migration error:', error)
        })
      }
    } catch (error) {
      console.error('Signup failed:', error)
      toast({
        variant: 'destructive',
        title: 'Sign-up Failed',
        description: error instanceof Error ? error.message : 'An unknown error occurred.',
      })
    }
  }

  function handleEmailSignup() {
    // TODO: Implement email/password signup (Task 11.3)
    toast({
      title: 'Coming Soon',
      description: 'Email signup will be available soon. Please use Google for now.',
    })
  }
}
