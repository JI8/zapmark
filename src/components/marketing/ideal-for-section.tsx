import { CheckCircle2 } from 'lucide-react'

const benefits = [
  'Starting a new business and need a professional logo',
  'A designer looking for quick logo concepts and inspiration',
  'Rebranding and want to explore multiple design directions',
  'Need logo variations for different use cases',
]

export function IdealForSection() {
  return (
    <section className="py-20 sm:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-20 items-center">
          {/* Left Column - Visual */}
          <div className="relative order-2 lg:order-1">
            <div className="relative rounded-[2.5rem] border bg-card p-2 shadow-xl shadow-primary/5">
              <div className="rounded-[2rem] overflow-hidden border bg-muted/20">
                <img
                  src="/images/thunder example.png"
                  alt="Logo grid variations"
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>

            {/* Decorative Grid Pattern behind */}
            <div className="absolute -z-10 -top-12 -left-12 w-64 h-64 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] opacity-50 rounded-full" />
          </div>

          {/* Right Column - Content */}
          <div className="order-1 lg:order-2">
            <div className="inline-flex items-center gap-2 rounded-full border bg-muted/50 px-4 py-1.5 text-sm font-medium text-muted-foreground mb-6">
              <span className="flex h-2 w-2 rounded-full bg-primary" />
              Who is this for?
            </div>
            <h2 className="text-4xl font-bold tracking-tight sm:text-5xl mb-8 font-headline">
              Perfect if you&apos;re:
            </h2>

            <div className="space-y-6">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="mt-1 h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <p className="text-lg text-muted-foreground leading-relaxed">{benefit}</p>
                </div>
              ))}
            </div>

            <div className="mt-10 p-8 rounded-3xl bg-card border shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <span className="text-8xl leading-none font-serif">"</span>
              </div>
              <div className="relative z-10">
                <p className="text-lg font-medium text-foreground mb-6 leading-relaxed">
                  &quot;Generated 20+ logo concepts in minutes. Found the perfect direction for my brand and refined it to perfection!&quot;
                </p>
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-muted border flex items-center justify-center text-lg font-bold text-muted-foreground">
                    AC
                  </div>
                  <div>
                    <p className="font-bold text-foreground">Alex Chen</p>
                    <p className="text-sm text-muted-foreground">Startup Founder</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
