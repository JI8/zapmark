import Link from 'next/link'
import { LogoIcon } from '@/components/icons/logo-icon'

export function MarketingFooter() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <LogoIcon className="h-8 w-8" />
              <span className="font-bold text-xl">Zapmark</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              AI-powered logo generation for creators and businesses.
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider">Product</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/pricing" className="text-muted-foreground hover:text-primary transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/examples" className="text-muted-foreground hover:text-primary transition-colors">
                  Examples
                </Link>
              </li>
              <li>
                <Link href="/app" className="text-muted-foreground hover:text-primary transition-colors">
                  Try Free
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider">Company</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/terms" className="text-muted-foreground hover:text-primary transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-muted-foreground hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider">Support</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <a href="mailto:support@zapmark.ai" className="text-muted-foreground hover:text-primary transition-colors">
                  Contact
                </a>
              </li>
              <li>
                <Link href="/#faq" className="text-muted-foreground hover:text-primary transition-colors">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t">
          <p className="text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Zapmark. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
