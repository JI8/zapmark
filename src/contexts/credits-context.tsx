'use client'

/**
 * Credits Context
 * 
 * Provides credit balance and operations to all components.
 * Syncs with Firestore in real-time.
 */

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import { doc } from 'firebase/firestore'
import { useUser, useFirestore, useDoc } from '@/firebase'
import { creditManager } from '@/lib/credits/credit-manager'
import type { CreditOperation } from '@/lib/credits/types'
import { useToast } from '@/hooks/use-toast'

interface CreditsContextValue {
  credits: number
  isLoading: boolean
  error: Error | null
  deductCredits: (operation: CreditOperation, cost: number, metadata?: Record<string, any>) => Promise<boolean>
  refundCredits: (operation: string, amount: number, reason: string) => Promise<void>
  refreshCredits: () => Promise<void>
}

const CreditsContext = createContext<CreditsContextValue | undefined>(undefined)

export function CreditsProvider({ children }: { children: ReactNode }) {
  const { user } = useUser()
  const firestore = useFirestore()
  const { toast } = useToast()
  const [credits, setCredits] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Real-time sync with Firestore
  const userDocRef = user && firestore ? doc(firestore, 'users', user.uid) : null
  const { data: userData, isLoading: isLoadingDoc } = useDoc<any>(userDocRef)

  useEffect(() => {
    if (userData) {
      setCredits(userData.remainingTokens ?? 0)
      setIsLoading(false)
    } else if (!isLoadingDoc && user) {
      setCredits(0)
      setIsLoading(false)
    }
  }, [userData, isLoadingDoc, user])

  const deductCredits = useCallback(async (
    operation: CreditOperation,
    cost: number,
    metadata?: Record<string, any>
  ): Promise<boolean> => {
    if (!user || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Not Authenticated',
        description: 'Please log in to continue.',
      })
      return false
    }

    try {
      const result = await creditManager.checkAndDeduct(
        firestore,
        user.uid,
        operation,
        cost,
        metadata
      )

      if (!result.success) {
        if (result.errorCode === 'insufficient_credits') {
          toast({
            variant: 'destructive',
            title: 'Insufficient Credits',
            description: `You need ${cost} credits but only have ${credits}. Upgrade your plan or buy more credits.`,
          })
        } else {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: result.error || 'Failed to deduct credits',
          })
        }
        return false
      }

      // Update local state immediately (optimistic update)
      setCredits(result.newBalance)
      return true
    } catch (error) {
      console.error('Credit deduction error:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to process credit deduction',
      })
      return false
    }
  }, [user, firestore, credits, toast])

  const refundCredits = useCallback(async (
    operation: string,
    amount: number,
    reason: string
  ): Promise<void> => {
    if (!user || !firestore) return

    try {
      const result = await creditManager.refund(
        firestore,
        user.uid,
        operation,
        amount,
        reason
      )

      if (result.success) {
        setCredits(result.newBalance)
        toast({
          title: 'Credits Refunded',
          description: `${amount} credit${amount > 1 ? 's have' : ' has'} been refunded due to an error.`,
        })
      }
    } catch (error) {
      console.error('Credit refund error:', error)
    }
  }, [user, firestore, toast])

  const refreshCredits = useCallback(async (): Promise<void> => {
    if (!user || !firestore) return

    try {
      const balance = await creditManager.getBalance(firestore, user.uid)
      setCredits(balance)
    } catch (error) {
      console.error('Refresh credits error:', error)
    }
  }, [user, firestore])

  const value: CreditsContextValue = {
    credits,
    isLoading,
    error,
    deductCredits,
    refundCredits,
    refreshCredits,
  }

  return (
    <CreditsContext.Provider value={value}>
      {children}
    </CreditsContext.Provider>
  )
}

/**
 * Hook to access credits
 */
export function useCredits() {
  const context = useContext(CreditsContext)
  if (context === undefined) {
    throw new Error('useCredits must be used within a CreditsProvider')
  }
  return context
}
