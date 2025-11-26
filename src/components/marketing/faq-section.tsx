import Link from 'next/link'

const faqs = [
  {
    question: 'How does Zapmark work?',
    answer: 'Zapmark uses advanced AI to generate grids of unique logo designs based on your description. You can then select favorites, generate variations, upscale to high resolution, and download production-ready files.',
  },
  {
    question: 'Do I need design experience?',
    answer: 'Not at all! Zapmark is designed for everyone - from complete beginners to experienced designers. Just describe what you want, and our AI does the creative work.',
  },
  {
    question: 'Can I use the logos commercially?',
    answer: 'Yes! All logos generated with a paid plan come with full commercial usage rights. You own what you create and can use it for any business purpose.',
  },
  {
    question: 'What formats can I download?',
    answer: 'You can download your logos in multiple formats including PNG with transparent backgrounds, perfect for web, print, and social media use.',
  },
  {
    question: 'How many logos can I generate?',
    answer: 'Each grid generation uses tokens. A 3x3 grid creates 9 unique logos, and a 4x4 grid creates 16. You can generate as many grids as your token balance allows.',
  },
]

export function FAQSection() {
  return (
    <section id="faq" className="py-20 sm:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl mb-12">
            Frequently asked questions
          </h2>
          
          <div className="space-y-8">
            {faqs.map((faq, index) => (
              <div key={index} className="border-b pb-8 last:border-b-0">
                <h3 className="text-xl font-semibold mb-3">{faq.question}</h3>
                <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-muted-foreground">
              Still have questions?{' '}
              <a href="mailto:support@zapmark.ai" className="text-primary hover:underline font-medium">
                Contact us
              </a>
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
