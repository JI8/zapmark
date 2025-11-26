import { Grid3x3, Sparkles, Wand2, Download } from 'lucide-react'

const features = [
  {
    icon: Grid3x3,
    title: 'Grid Generation',
    description: 'Generate 3x3 or 4x4 grids of unique logo variations in seconds. Each design is completely different.',
  },
  {
    icon: Sparkles,
    title: 'AI Variations',
    description: 'Love a design? Generate more variations based on your favorite to explore different directions.',
  },
  {
    icon: Wand2,
    title: 'Upscale & Refine',
    description: 'Upscale your chosen logos to high resolution and use AI to clean up and perfect the details.',
  },
  {
    icon: Download,
    title: 'Production Ready',
    description: 'Download your logos in multiple formats ready for web, print, and social media use.',
  },
]

export function FeaturesSection() {
  return (
    <section className="py-20 sm:py-32 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">
            Powerful AI Features
          </h2>
          <p className="text-lg text-muted-foreground">
            Everything you need to create professional logos from concept to final design
          </p>
        </div>

        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div
                  key={index}
                  className="relative rounded-2xl border bg-card p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mb-2 text-xl font-semibold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
