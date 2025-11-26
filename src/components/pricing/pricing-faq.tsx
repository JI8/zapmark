const faqs = [
  {
    question: 'How do tokens work?',
    answer: 'Every action (grid generation, variations, or upscale) costs exactly 1 token. With 100 tokens, you can perform 100 operations in any combination you choose.',
  },
  {
    question: 'What happens to unused tokens?',
    answer: 'Tokens reset at the start of each billing cycle. They do not roll over to the next month.',
  },
  {
    question: 'Can I cancel anytime?',
    answer: 'Yes! You can cancel your subscription at any time. You will retain access until the end of your current billing period.',
  },
  {
    question: 'Do I own the logos I create?',
    answer: 'Absolutely! All logos generated with a paid plan come with full commercial usage rights. You own what you create.',
  },
  {
    question: 'What if I run out of tokens?',
    answer: 'You can purchase additional token packs or upgrade to a higher plan when available. Your subscription will renew with fresh tokens at the start of each billing cycle.',
  },
  {
    question: 'Is there a free trial?',
    answer: 'Yes! You can generate one free grid without creating an account. No credit card required.',
  },
  {
    question: 'Can I use the logos for commercial projects?',
    answer: 'Yes! All logos created with a paid Creator plan include full commercial usage rights. You can use them for any business purpose.',
  },
  {
    question: 'Do you offer refunds?',
    answer: 'Due to the nature of AI-generated content, we do not offer refunds. However, you can try our service for free before subscribing.',
  },
]

export function PricingFAQ() {
  return (
    <section className="py-20 sm:py-32 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-muted-foreground">
              Everything you need to know about pricing and credits
            </p>
          </div>

          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="rounded-2xl border bg-card p-6"
              >
                <h3 className="text-lg font-semibold mb-3">{faq.question}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-muted-foreground">
              Still have questions?{' '}
              <a
                href="mailto:support@zapmark.ai"
                className="text-primary hover:underline font-medium"
              >
                Contact our support team
              </a>
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
