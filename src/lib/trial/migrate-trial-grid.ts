/**
 * Trial Grid Migration
 * 
 * Utilities for migrating trial grid from localStorage to Firestore after signup.
 */

import { Firestore, doc, writeBatch, collection, serverTimestamp } from 'firebase/firestore'
import { FirebaseStorage, ref, uploadString, getDownloadURL } from 'firebase/storage'
import { TrialGrid } from './types'

export type MigrationResult = {
  success: boolean
  gridId?: string
  error?: string
}

/**
 * Migrate trial grid to user's Firestore account
 */
export async function migrateTrialGridToAccount(
  trialGrid: TrialGrid,
  userId: string,
  firestore: Firestore,
  storage: FirebaseStorage
): Promise<MigrationResult> {
  try {
    // Create new grid ID
    const newLogoGridId = doc(collection(firestore, 'users', userId, 'logoGrids')).id
    const gridDocRef = doc(firestore, 'users', userId, 'logoGrids', newLogoGridId)

    const batch = writeBatch(firestore)

    // Upload each tile to Firebase Storage
    for (const tile of trialGrid.tiles) {
      const variationId = doc(collection(firestore, `users/${userId}/logoGrids/${newLogoGridId}/logoVariations`)).id
      const storageRef = ref(storage, `users/${userId}/logos/${newLogoGridId}/${variationId}.png`)
      
      // Upload the base64 data URL
      const uploadTask = await uploadString(storageRef, tile.dataUrl, 'data_url')
      const downloadUrl = await getDownloadURL(uploadTask.ref)

      // Create variation document
      const variationData = {
        id: variationId,
        logoGridId: newLogoGridId,
        imageUrl: downloadUrl,
        tileIndex: tile.tileIndex,
      }

      const variationDocRef = doc(firestore, 'users', userId, 'logoGrids', newLogoGridId, 'logoVariations', variationId)
      batch.set(variationDocRef, variationData)
    }

    // Create grid document
    const logoGridData = {
      id: newLogoGridId,
      userId,
      concept: trialGrid.concept,
      gridSize: trialGrid.gridSize,
      type: 'concept' as const,
      creationDate: serverTimestamp(),
    }
    batch.set(gridDocRef, logoGridData)

    // Commit all changes
    await batch.commit()

    return {
      success: true,
      gridId: newLogoGridId,
    }
  } catch (error) {
    console.error('Failed to migrate trial grid:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
