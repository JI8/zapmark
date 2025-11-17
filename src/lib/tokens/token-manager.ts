/**
 * Token Manager
 * 
 * Manages token operations including deductions, refunds, and balance tracking.
 * Uses Firestore transactions for atomic operations and maintains audit trail.
 */

import { doc, runTransaction, Firestore, serverTimestamp, collection, addDoc } from 'firebase/firestore';

export interface TokenOperation {
  userId: string;
  amount: number;
  operation: 'deduct' | 'refund' | 'purchase' | 'subscription';
  reason: string;
  metadata?: Record<string, any>;
}

export interface TokenResult {
  success: boolean;
  newBalance: number;
  error?: string;
}

export interface TokenTransaction {
  id?: string;
  userId: string;
  amount: number;
  type: 'deduct' | 'refund' | 'purchase' | 'subscription';
  reason: string;
  balanceBefore: number;
  balanceAfter: number;
  metadata?: Record<string, any>;
  timestamp: any;
}

class TokenManager {
  /**
   * Deducts tokens from user's balance atomically
   * 
   * @param firestore - Firestore instance
   * @param operation - Token operation details
   * @returns TokenResult with success status and new balance
   */
  async deductTokens(
    firestore: Firestore,
    operation: TokenOperation
  ): Promise<TokenResult> {
    const userDocRef = doc(firestore, 'users', operation.userId);
    
    try {
      const result = await runTransaction(firestore, async (transaction) => {
        const userDoc = await transaction.get(userDocRef);
        
        if (!userDoc.exists()) {
          throw new Error('User document not found');
        }
        
        const userData = userDoc.data();
        const currentBalance = userData.remainingTokens || 0;
        
        if (currentBalance < operation.amount) {
          throw new Error('Insufficient tokens');
        }
        
        const newBalance = currentBalance - operation.amount;
        
        // Update user balance
        transaction.update(userDocRef, {
          remainingTokens: newBalance,
        });
        
        return {
          balanceBefore: currentBalance,
          balanceAfter: newBalance,
        };
      });
      
      // Log transaction (non-blocking)
      this.logTransaction(firestore, {
        userId: operation.userId,
        amount: operation.amount,
        type: 'deduct',
        reason: operation.reason,
        balanceBefore: result.balanceBefore,
        balanceAfter: result.balanceAfter,
        metadata: operation.metadata,
        timestamp: serverTimestamp(),
      }).catch(error => {
        console.error('[TokenManager] Failed to log transaction:', error);
      });
      
      return {
        success: true,
        newBalance: result.balanceAfter,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[TokenManager] Deduct failed:', errorMessage);
      
      return {
        success: false,
        newBalance: 0,
        error: errorMessage,
      };
    }
  }

  /**
   * Refunds tokens to user's balance atomically
   * 
   * @param firestore - Firestore instance
   * @param operation - Token operation details
   * @returns TokenResult with success status and new balance
   */
  async refundTokens(
    firestore: Firestore,
    operation: TokenOperation
  ): Promise<TokenResult> {
    const userDocRef = doc(firestore, 'users', operation.userId);
    
    try {
      const result = await runTransaction(firestore, async (transaction) => {
        const userDoc = await transaction.get(userDocRef);
        
        if (!userDoc.exists()) {
          throw new Error('User document not found');
        }
        
        const userData = userDoc.data();
        const currentBalance = userData.remainingTokens || 0;
        const newBalance = currentBalance + operation.amount;
        
        // Update user balance
        transaction.update(userDocRef, {
          remainingTokens: newBalance,
        });
        
        return {
          balanceBefore: currentBalance,
          balanceAfter: newBalance,
        };
      });
      
      console.log(`[TokenManager] Refunded ${operation.amount} tokens. New balance: ${result.balanceAfter}`);
      
      // Log transaction (non-blocking)
      this.logTransaction(firestore, {
        userId: operation.userId,
        amount: operation.amount,
        type: 'refund',
        reason: operation.reason,
        balanceBefore: result.balanceBefore,
        balanceAfter: result.balanceAfter,
        metadata: operation.metadata,
        timestamp: serverTimestamp(),
      }).catch(error => {
        console.error('[TokenManager] Failed to log transaction:', error);
      });
      
      return {
        success: true,
        newBalance: result.balanceAfter,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[TokenManager] Refund failed:', errorMessage);
      
      return {
        success: false,
        newBalance: 0,
        error: errorMessage,
      };
    }
  }

  /**
   * Gets current token balance for a user
   * 
   * @param firestore - Firestore instance
   * @param userId - User ID
   * @returns Current token balance
   */
  async getBalance(firestore: Firestore, userId: string): Promise<number> {
    try {
      const userDocRef = doc(firestore, 'users', userId);
      const userDoc = await runTransaction(firestore, async (transaction) => {
        return await transaction.get(userDocRef);
      });
      
      if (!userDoc.exists()) {
        return 0;
      }
      
      const userData = userDoc.data();
      return userData.remainingTokens || 0;
    } catch (error) {
      console.error('[TokenManager] Get balance failed:', error);
      return 0;
    }
  }

  /**
   * Logs token transaction to Firestore for audit trail
   * 
   * @param firestore - Firestore instance
   * @param transaction - Transaction details
   */
  private async logTransaction(
    firestore: Firestore,
    transaction: TokenTransaction
  ): Promise<void> {
    try {
      const transactionsRef = collection(
        firestore,
        'users',
        transaction.userId,
        'tokenTransactions'
      );
      
      await addDoc(transactionsRef, transaction);
    } catch (error) {
      // Don't throw - logging failure shouldn't break the operation
      console.error('[TokenManager] Transaction logging failed:', error);
    }
  }
}

// Export singleton instance
export const tokenManager = new TokenManager();
