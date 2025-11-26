'use server'

/**
 * Credit Manager
 * 
 * Handles all credit operations with atomic Firestore transactions.
 * Ensures credits are never double-spent and all operations are logged.
 */

import { doc, runTransaction, Firestore, serverTimestamp, collection } from 'firebase/firestore'
import type { CreditOperation } from './types'

export interface CreditResult {
  success: boolean
  newBalance: number
  error?: string
  errorCode?: 'insufficient_credits' | 'user_not_found' | 'transaction_failed'
}

export interface CreditTransaction {
  id?: string
  userId: string
  amount: number
  type: 'deduct' | 'refund' | 'purchase' | 'subscription' | 'grant'
  operation: string
  balanceBefore: number
  balanceAfter: number
  metadata?: Record<string, any>
  timestamp: any
}

export class CreditManager {
  /**
   * Check if user has sufficient credits and deduct atomically
   */
  async checkAndDeduct(
    firestore: Firestore,
    userId: string,
    operation: CreditOperation,
    cost: number,
    metadata?: Record<string, any>
  ): Promise<CreditResult> {
    const userRef = doc(firestore, 'users', userId)

    try {
      const result = await runTransaction(firestore, async (transaction) => {
        const userDoc = await transaction.get(userRef)

        if (!userDoc.exists()) {
          throw new Error('USER_NOT_FOUND')
        }

        const userData = userDoc.data()
        const currentBalance = userData.remainingTokens ?? 0

        if (currentBalance < cost) {
          throw new Error('INSUFFICIENT_CREDITS')
        }

        const newBalance = currentBalance - cost

        // Update user credits
        transaction.update(userRef, {
          remainingTokens: newBalance,
        })

        // Log transaction
        const transactionRef = doc(collection(firestore, 'users', userId, 'creditTransactions'))
        const transactionData: CreditTransaction = {
          userId,
          amount: -cost,
          type: 'deduct',
          operation,
          balanceBefore: currentBalance,
          balanceAfter: newBalance,
          metadata,
          timestamp: serverTimestamp(),
        }
        transaction.set(transactionRef, transactionData)

        return {
          balanceBefore: currentBalance,
          balanceAfter: newBalance,
        }
      })

      console.log(`[CreditManager] Deducted ${cost} credits for ${operation}. New balance: ${result.balanceAfter}`)

      return {
        success: true,
        newBalance: result.balanceAfter,
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      console.error('[CreditManager] Deduction failed:', errorMessage)

      if (errorMessage === 'USER_NOT_FOUND') {
        return {
          success: false,
          newBalance: 0,
          error: 'User account not found',
          errorCode: 'user_not_found',
        }
      }

      if (errorMessage === 'INSUFFICIENT_CREDITS') {
        return {
          success: false,
          newBalance: 0,
          error: 'Insufficient credits',
          errorCode: 'insufficient_credits',
        }
      }

      return {
        success: false,
        newBalance: 0,
        error: 'Transaction failed',
        errorCode: 'transaction_failed',
      }
    }
  }

  /**
   * Refund credits (e.g., when operation fails)
   */
  async refund(
    firestore: Firestore,
    userId: string,
    operation: string,
    amount: number,
    reason: string,
    metadata?: Record<string, any>
  ): Promise<CreditResult> {
    const userRef = doc(firestore, 'users', userId)

    try {
      const result = await runTransaction(firestore, async (transaction) => {
        const userDoc = await transaction.get(userRef)

        if (!userDoc.exists()) {
          throw new Error('USER_NOT_FOUND')
        }

        const userData = userDoc.data()
        
        
        const currentBalance = userData.remainingTokens ?? 0
        const newBalance = currentBalance + amount

        // Update user credits (update both fields during transition)
        transaction.update(userRef, {
          remainingTokens: newBalance,
          
        })

        // Log transaction
        const transactionRef = doc(collection(firestore, 'users', userId, 'creditTransactions'))
        const transactionData: CreditTransaction = {
          userId,
          amount: amount,
          type: 'refund',
          operation,
          balanceBefore: currentBalance,
          balanceAfter: newBalance,
          metadata: {
            ...metadata,
            reason,
          },
          timestamp: serverTimestamp(),
        }
        transaction.set(transactionRef, transactionData)

        return {
          balanceBefore: currentBalance,
          balanceAfter: newBalance,
        }
      })

      console.log(`[CreditManager] Refunded ${amount} credits for ${operation}. Reason: ${reason}. New balance: ${result.balanceAfter}`)

      return {
        success: true,
        newBalance: result.balanceAfter,
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('[CreditManager] Refund failed:', errorMessage)

      return {
        success: false,
        newBalance: 0,
        error: 'Refund failed',
        errorCode: 'transaction_failed',
      }
    }
  }

  /**
   * Grant credits (e.g., subscription renewal, purchase)
   */
  async grant(
    firestore: Firestore,
    userId: string,
    amount: number,
    type: 'purchase' | 'subscription' | 'grant',
    reason: string,
    metadata?: Record<string, any>
  ): Promise<CreditResult> {
    const userRef = doc(firestore, 'users', userId)

    try {
      const result = await runTransaction(firestore, async (transaction) => {
        const userDoc = await transaction.get(userRef)

        if (!userDoc.exists()) {
          throw new Error('USER_NOT_FOUND')
        }

        const userData = userDoc.data()
        
        
        const currentBalance = userData.remainingTokens ?? 0
        const newBalance = currentBalance + amount

        // Update user credits (update both fields during transition)
        transaction.update(userRef, {
          remainingTokens: newBalance,
          
        })

        // Log transaction
        const transactionRef = doc(collection(firestore, 'users', userId, 'creditTransactions'))
        const transactionData: CreditTransaction = {
          userId,
          amount: amount,
          type,
          operation: reason,
          balanceBefore: currentBalance,
          balanceAfter: newBalance,
          metadata,
          timestamp: serverTimestamp(),
        }
        transaction.set(transactionRef, transactionData)

        return {
          balanceBefore: currentBalance,
          balanceAfter: newBalance,
        }
      })

      console.log(`[CreditManager] Granted ${amount} credits. Reason: ${reason}. New balance: ${result.balanceAfter}`)

      return {
        success: true,
        newBalance: result.balanceAfter,
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('[CreditManager] Grant failed:', errorMessage)

      return {
        success: false,
        newBalance: 0,
        error: 'Grant failed',
        errorCode: 'transaction_failed',
      }
    }
  }

  /**
   * Get current credit balance
   */
  async getBalance(firestore: Firestore, userId: string): Promise<number> {
    try {
      const userRef = doc(firestore, 'users', userId)
      const userDoc = await runTransaction(firestore, async (transaction) => {
        return await transaction.get(userRef)
      })

      if (!userDoc.exists()) {
        return 0
      }

      const userData = userDoc.data()
      return userData.remainingTokens ?? 0
    } catch (error) {
      console.error('[CreditManager] Get balance failed:', error)
      return 0
    }
  }

  /**
   * Set credit balance (admin only - use with caution)
   */
  async setBalance(
    firestore: Firestore,
    userId: string,
    newBalance: number,
    reason: string
  ): Promise<CreditResult> {
    const userRef = doc(firestore, 'users', userId)

    try {
      const result = await runTransaction(firestore, async (transaction) => {
        const userDoc = await transaction.get(userRef)

        if (!userDoc.exists()) {
          throw new Error('USER_NOT_FOUND')
        }

        const userData = userDoc.data()
        const currentBalance = userData.remainingTokens ?? 0
        const difference = newBalance - currentBalance

        // Update user credits
        transaction.update(userRef, {
          remainingTokens: newBalance,
        })

        // Log transaction
        const transactionRef = doc(collection(firestore, 'users', userId, 'creditTransactions'))
        const transactionData: CreditTransaction = {
          userId,
          amount: difference,
          type: 'grant',
          operation: 'admin_adjustment',
          balanceBefore: currentBalance,
          balanceAfter: newBalance,
          metadata: { reason },
          timestamp: serverTimestamp(),
        }
        transaction.set(transactionRef, transactionData)

        return {
          balanceBefore: currentBalance,
          balanceAfter: newBalance,
        }
      })

      console.log(`[CreditManager] Balance set to ${newBalance}. Reason: ${reason}`)

      return {
        success: true,
        newBalance: result.balanceAfter,
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('[CreditManager] Set balance failed:', errorMessage)

      return {
        success: false,
        newBalance: 0,
        error: 'Set balance failed',
        errorCode: 'transaction_failed',
      }
    }
  }
}

// Export singleton instance
export const creditManager = new CreditManager()
