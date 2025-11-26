import { MarketingHeader } from '@/components/marketing/marketing-header'
import { PricingPlans } from '@/components/pricing/pricing-plans'
import { CreditBreakdown } from '@/components/pricing/credit-breakdown'
import { PricingFAQ } from '@/components/pricing/pricing-faq'
import { MarketingFooter } from '@/components/marketing/footer'

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <MarketingHeader />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 sm:py-32">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl mb-6">
                Simple, Transparent Pricing
              </h1>
              <p className="text-lg text-muted-foreground sm:text-xl">
                Start free, upgrade when you need more. No hidden fees, cancel anytime.
              </p>
            </div>
          </div>
        </section>

        <PricingPlans />
        <CreditBreakdown />
        <PricingFAQ />
      </main>

      <MarketingFooter />
    </div>
  )
}
