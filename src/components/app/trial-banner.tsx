'use client'

/**
 * Trial Banner Component
 * 
 * Banner shown above trial grid encouraging users to sign up.
 */

import { X, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

type TrialBannerProps = {
  onSignup: () => void
  onDismiss: () => void
}

export function TrialBanner({ onSignup, onDismiss }: TrialBannerProps) {
  return (
    <Card className="relative border-primary/50 bg-gradient-to-r from-primary/10 via-purple-500/10 to-pink-500/10 p-4 mb-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">
              This is your free trial grid
            </p>
            <p className="text-xs text-muted-foreground">
              You can explore and zoom. To download, upscale, or generate more, create a free account.
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            onClick={onSignup}
            size="sm"
            className="gap-2"
          >
            <Sparkles className="h-4 w-4" />
            Create Account
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDismiss}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  )
}
