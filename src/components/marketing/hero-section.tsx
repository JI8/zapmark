import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Sparkles, ArrowRight, Users, Zap } from 'lucide-react'

export function HeroSection() {
  return (
    <section className="relative overflow-hidden min-h-[calc(100vh-4rem)] flex items-center bg-background">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px]">
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-0">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-20 items-center">
          {/* Left Column - Content */}
          <div className="max-w-2xl relative z-10">
            {/* Badge */}
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border bg-muted/50 px-4 py-1.5 text-sm font-medium text-muted-foreground">
              <span className="flex h-2 w-2 rounded-full bg-primary" />
              AI-Powered Brand Generation
            </div>

            {/* Headline */}
            <h1 className="mb-6 text-5xl font-bold font-headline tracking-tight sm:text-6xl lg:text-7xl text-foreground">
              Design your brand <br />
              <span className="text-primary">in seconds.</span>
            </h1>

            {/* Subheadline */}
            <p className="mb-10 text-xl text-muted-foreground leading-relaxed max-w-lg">
              The all-in-one platform for creators to generate, edit, and export professional logos and assets using advanced AI.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg" className="h-14 px-8 rounded-full text-lg font-semibold shadow-sm hover:shadow-md transition-all">
                <Link href="/app">
                  Start Creating Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="ghost" size="lg" className="h-14 px-8 rounded-full text-lg text-muted-foreground hover:text-foreground">
                <Link href="#how-it-works">
                  How it works
                </Link>
              </Button>
            </div>

            {/* Social Proof */}
            <div className="mt-10 flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-10 w-10 rounded-full border-2 border-background bg-muted flex items-center justify-center overflow-hidden"
                  >
                    <div className={`w-full h-full bg-primary/${10 + i * 10}`} />
                  </div>
                ))}
              </div>
              <p>
                Trusted by <span className="font-semibold text-foreground">1,000+ creators</span>
              </p>
            </div>
          </div>

          {/* Right Column - Clean Grid Visual */}
          <div className="relative flex items-center justify-center w-full">
            <div className="w-full max-w-xl aspect-square bg-card border rounded-[2.5rem] shadow-sm p-8 md:p-10">
              <div className="grid grid-cols-3 gap-4 md:gap-6 h-full w-full">
                {/* Row 1 */}
                <div className="bg-primary/5 rounded-3xl w-full h-full" />
                <div className="bg-primary/10 rounded-3xl w-full h-full" />
                <div className="bg-primary/5 rounded-3xl w-full h-full" />

                {/* Row 2 */}
                <div className="bg-primary/10 rounded-3xl w-full h-full" />
                <div className="bg-primary/20 rounded-3xl w-full h-full" />
                <div className="bg-primary/10 rounded-3xl w-full h-full" />

                {/* Row 3 */}
                <div className="bg-primary/5 rounded-3xl w-full h-full" />
                <div className="bg-primary/10 rounded-3xl w-full h-full" />
                <div className="bg-primary/5 rounded-3xl w-full h-full" />
              </div>
            </div>

            {/* Floating Element */}
            <div className="absolute bottom-8 -left-4 md:-left-8 bg-background border shadow-xl rounded-2xl p-5 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-1000">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Generation Time</p>
                <p className="text-lg font-bold font-headline">0.8s</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
