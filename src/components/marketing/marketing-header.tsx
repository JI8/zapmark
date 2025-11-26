'use client'

import Link from 'next/link'
import { LogoIcon } from '@/components/icons/logo-icon'
import { Button } from '@/components/ui/button'
import { useUser } from '@/firebase'
import { HEADER_STYLES } from '@/components/layout/header-constants'
import { cn } from '@/lib/utils'

export function MarketingHeader() {
  const { user, isUserLoading } = useUser()

  return (
    <header className={HEADER_STYLES.wrapper}>
      <div className={cn("container mx-auto", HEADER_STYLES.containerPadding)}>
        <div className={cn("flex items-center justify-between", HEADER_STYLES.height)}>
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <LogoIcon className={HEADER_STYLES.logo} />
            <span className={HEADER_STYLES.brandText}>Zapmark</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              How it works
            </Link>
            <Link href="/pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </Link>
            <Link href="/#faq" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              FAQ
            </Link>
          </nav>

          {/* CTA */}
          <div className="flex items-center gap-3">
            {isUserLoading ? (
              <div className="h-9 w-20 bg-muted rounded-full animate-pulse" />
            ) : user ? (
              <>
                <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                  <Link href="/app">Dashboard</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/app">Go to App</Link>
                </Button>
              </>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                  <Link href="/app">Sign In</Link>
                </Button>
                <Button asChild size="sm" className="rounded-full">
                  <Link href="/app">Start for Free</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
