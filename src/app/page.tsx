import { MarketingHeader } from '@/components/marketing/marketing-header'
import { HeroSection } from '@/components/marketing/hero-section'
import { IdealForSection } from '@/components/marketing/ideal-for-section'
import { HowItWorksSection } from '@/components/marketing/how-it-works-section'
import { FAQSection } from '@/components/marketing/faq-section'
import { MarketingFooter } from '@/components/marketing/footer'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Sparkles } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <MarketingHeader />
      <HeroSection />
      <IdealForSection />
      <HowItWorksSection />
      
      {/* Pricing Teaser */}
      <section className="py-20 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <div className="rounded-3xl border bg-gradient-to-br from-primary/5 via-purple-500/5 to-pink-500/5 p-12 text-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary mb-6">
                <Sparkles className="h-4 w-4" />
                Simple Pricing
              </div>
              <h2 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">
                Simple, Transparent Pricing
              </h2>
              <p className="text-xl text-muted-foreground mb-2">
                Creator plan: 100 tokens for €5/month
              </p>
              <p className="text-muted-foreground mb-8">
                Generate 30+ grids with upscales and variations. Cancel anytime.
              </p>
              <Button asChild size="lg" className="rounded-full px-8">
                <Link href="/pricing">
                  View Full Pricing
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <FAQSection />
      <MarketingFooter />
    </div>
  )
}
