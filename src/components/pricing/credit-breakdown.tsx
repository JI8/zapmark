import { Grid3x3, Sparkles, ArrowUpCircle } from 'lucide-react'

const costs = [
  {
    icon: Grid3x3,
    action: 'Grid Generation',
    credits: '1 token',
    description: 'Generate 4, 9, or 16 unique logos in one grid',
    color: 'from-blue-500/20 to-blue-600/10',
  },
  {
    icon: Sparkles,
    action: 'Generate Variations',
    credits: '1 token',
    description: 'Create a new grid of variations from a favorite logo',
    color: 'from-emerald-500/20 to-emerald-600/10',
  },
  {
    icon: ArrowUpCircle,
    action: 'Upscale Logo',
    credits: '1 token',
    description: 'Enhance resolution and clean up details',
    color: 'from-amber-500/20 to-amber-600/10',
  },
]

export function CreditBreakdown() {
  return (
    <section className="py-20 sm:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
              How Tokens Work
            </h2>
            <p className="text-lg text-muted-foreground">
              Every action costs just 1 token. Simple and transparent.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {costs.map((cost, index) => {
              const Icon = cost.icon
              return (
                <div
                  key={index}
                  className={`rounded-2xl border bg-gradient-to-br ${cost.color} p-6`}
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-background/50 backdrop-blur-sm mb-4">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{cost.action}</h3>
                    <span className="font-bold text-primary text-2xl mb-3">
                      {cost.credits}
                    </span>
                    <p className="text-sm text-muted-foreground">
                      {cost.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-12 rounded-2xl border bg-muted/50 p-8 text-center">
            <h3 className="text-xl font-semibold mb-2">
              With 100 tokens you get 100 operations
            </h3>
            <p className="text-muted-foreground mb-6">
              Mix and match however you like - generate grids, create variations, or upscale logos
            </p>
            <div className="flex flex-wrap justify-center gap-8 text-sm">
              <div>
                <div className="text-3xl font-bold text-primary mb-1">100</div>
                <div className="text-muted-foreground">Grid generations</div>
              </div>
              <div className="text-2xl text-muted-foreground self-center">or</div>
              <div>
                <div className="text-3xl font-bold text-primary mb-1">100</div>
                <div className="text-muted-foreground">Variations</div>
              </div>
              <div className="text-2xl text-muted-foreground self-center">or</div>
              <div>
                <div className="text-3xl font-bold text-primary mb-1">100</div>
                <div className="text-muted-foreground">Upscales</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
