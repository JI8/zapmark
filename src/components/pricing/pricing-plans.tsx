'use client'

import { Button } from '@/components/ui/button'
import { Check, Sparkles, Zap, Crown } from 'lucide-react'
import Link from 'next/link'
import { useUser } from '@/firebase'

const plans = [
  {
    name: 'Free Trial',
    price: '€0',
    period: '',
    description: 'Try before you commit',
    features: [
      '1 free grid generation',
      'No account required',
      '3x3 or 4x4 grid options',
      'Download individual logos',
      'Perfect for testing',
    ],
    cta: 'Start Free Trial',
    href: '/app',
    icon: Sparkles,
    popular: false,
  },
  {
    name: 'Creator',
    price: '€5',
    period: '/month',
    description: 'Perfect for individuals and small projects',
    features: [
      '100 tokens per month',
      '100 operations total',
      'Generate grids (2x2, 3x3, 4x4)',
      'Create variations',
      'Upscale logos',
      'Commercial usage rights',
    ],
    cta: 'Get Started',
    href: '/app',
    icon: Zap,
    popular: true,
  },
  {
    name: 'Studio',
    price: 'Coming Soon',
    period: '',
    description: 'For agencies and power users',
    features: [
      'Unlimited tokens',
      'Team collaboration',
      'Brand guidelines',
      'API access',
      'Priority generation',
      'Dedicated support',
    ],
    cta: 'Join Waitlist',
    href: '#',
    icon: Crown,
    popular: false,
    comingSoon: true,
  },
]

export function PricingPlans() {
  const { user } = useUser()

  return (
    <section className="py-20 sm:py-32 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-3">
            {plans.map((plan) => {
              const Icon = plan.icon
              return (
                <div
                  key={plan.name}
                  className={`relative rounded-3xl border bg-card p-8 ${
                    plan.popular
                      ? 'ring-2 ring-primary shadow-xl scale-105'
                      : ''
                  } ${plan.comingSoon ? 'opacity-75' : ''}`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary px-4 py-1 text-sm font-medium text-primary-foreground">
                        <Sparkles className="h-3 w-3" />
                        Most Popular
                      </span>
                    </div>
                  )}

                  <div className="mb-6">
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                    <p className="text-muted-foreground">{plan.description}</p>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold">{plan.price}</span>
                      {plan.period && (
                        <span className="text-muted-foreground">{plan.period}</span>
                      )}
                    </div>
                  </div>

                  <ul className="mb-8 space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    asChild={!plan.comingSoon}
                    disabled={plan.comingSoon}
                    className="w-full rounded-full"
                    size="lg"
                    variant={plan.popular ? 'default' : 'outline'}
                  >
                    {plan.comingSoon ? (
                      <span>{plan.cta}</span>
                    ) : (
                      <Link href={plan.href}>{plan.cta}</Link>
                    )}
                  </Button>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
