import { Lightbulb, Grid3x3, Sparkles } from 'lucide-react'

const steps = [
  {
    icon: Lightbulb,
    title: 'Describe your vision',
    description: 'Tell us about your brand. A minimalist tech logo, a playful mascot, or anything you imagine.',
  },
  {
    icon: Grid3x3,
    title: 'Get a grid of options',
    description: 'Our AI generates a 3x3 or 4x4 grid of unique logo designs in seconds. Each one is completely different.',
  },
  {
    icon: Sparkles,
    title: 'Refine and download',
    description: 'Pick your favorites, generate variations, upscale to high resolution, and download production-ready files.',
  },
]

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 sm:py-32 bg-muted/20 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px]" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl font-headline">
            How it works
          </h2>
          <p className="mt-4 text-xl text-muted-foreground">
            From concept to brand assets in three simple steps.
          </p>
        </div>

        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 md:grid-cols-3">
            {steps.map((step, index) => {
              const Icon = step.icon
              return (
                <div
                  key={index}
                  className="relative rounded-[2rem] bg-card p-8 border shadow-sm hover:shadow-md transition-all duration-300 group"
                >
                  {/* Step number */}
                  <div className="mb-8 flex items-center justify-between">
                    <div className="h-14 w-14 rounded-2xl bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary/10 transition-colors">
                      <Icon className="h-7 w-7" />
                    </div>
                    <span className="text-6xl font-bold text-muted/20 font-headline select-none">
                      0{index + 1}
                    </span>
                  </div>

                  {/* Content */}
                  <h3 className="mb-4 text-2xl font-bold">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed text-lg">{step.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
