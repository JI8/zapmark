'use client'

/**
 * Onboarding Wizard Component
 * 
 * 3-step modal that guides trial users through their first generation.
 */

import { useState } from 'react'
import { Sparkles, Sticker, Wand2, Grid3x3, LayoutGrid, ArrowRight, Check } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { cn } from '@/lib/utils'
import { Textarea } from '../ui/textarea'

export type AssetType = 'logo' | 'sticker' | 'custom'
export type GridSize = '2x2' | '3x3' | '4x4'

export type WizardData = {
  assetType: AssetType
  concept: string
  gridSize: GridSize
}

type OnboardingWizardProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onComplete: (data: WizardData) => void
  onStepChange?: (step: number, data: Partial<WizardData>) => void
}

const SUGGESTION_CHIPS = [
  'Minimalist geometric fox logo, orange gradient, vector style',
  'Cyberpunk neon ramen bowl sticker, glowing blue and pink',
  'Abstract corporate identity for a cloud AI startup, blue palette',
  'Vintage 80s sunset palm tree badge, distressed texture',
  'Cute isometric 3D robot mascot, soft lighting, clay render',
]

import { Grid2x2Graphic, Grid3x3Graphic, Grid4x4Graphic } from '@/components/ui/grid-graphics'

export function OnboardingWizard({
  open,
  onOpenChange,
  onComplete,
  onStepChange,
}: OnboardingWizardProps) {
  const [step, setStep] = useState(1)
  const [assetType, setAssetType] = useState<AssetType>('logo')
  const [concept, setConcept] = useState('')
  const [gridSize, setGridSize] = useState<GridSize>('3x3')

  const handleNext = () => {
    if (step < 3) {
      const newStep = step + 1
      setStep(newStep)
      onStepChange?.(newStep, { assetType, concept, gridSize })
    }
  }

  const handleBack = () => {
    if (step > 1) {
      const newStep = step - 1
      setStep(newStep)
      onStepChange?.(newStep, { assetType, concept, gridSize })
    }
  }

  const handleComplete = () => {
    onComplete({ assetType, concept, gridSize })
  }

  const handleAssetTypeChange = (value: AssetType) => {
    setAssetType(value)
    onStepChange?.(step, { assetType: value, concept, gridSize })
  }

  const handleConceptChange = (value: string) => {
    setConcept(value)
    onStepChange?.(step, { assetType, concept: value, gridSize })
  }

  const handleGridSizeChange = (value: GridSize) => {
    setGridSize(value)
    onStepChange?.(step, { assetType, concept, gridSize: value })
  }

  const handleSuggestionClick = (suggestion: string) => {
    setConcept(suggestion)
    onStepChange?.(step, { assetType, concept: suggestion, gridSize })
  }

  const canProceed = () => {
    if (step === 1) return true // Asset type has default
    if (step === 2) return concept.trim().length > 0
    if (step === 3) return true // Grid size has default
    return false
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl p-0 gap-0 overflow-hidden border-0 shadow-2xl">
        <div className="flex flex-col h-[600px]">
          {/* Header with Gradient */}
          <div className="relative bg-gradient-to-r from-primary/10 via-primary/5 to-background p-8 pb-6 border-b">
            <DialogHeader className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <DialogTitle className="text-3xl font-bold font-headline tracking-tight">
                    {step === 1 && 'What are you creating?'}
                    {step === 2 && 'Describe your vision'}
                    {step === 3 && 'Choose your canvas'}
                  </DialogTitle>
                  <p className="text-muted-foreground text-lg">
                    {step === 1 && 'Choose the type of asset you want to generate.'}
                    {step === 2 && 'Tell our AI what you want to see.'}
                    {step === 3 && 'Select the grid size for your variations.'}
                  </p>
                </div>
                {/* Step Indicator */}
                <div className="flex items-center gap-2 bg-background/50 backdrop-blur-sm p-2 rounded-full border">
                  {[1, 2, 3].map((s) => (
                    <div
                      key={s}
                      className={cn(
                        "w-2.5 h-2.5 rounded-full transition-all duration-300",
                        s === step ? "bg-primary scale-125" : s < step ? "bg-primary/40" : "bg-muted"
                      )}
                    />
                  ))}
                </div>
              </div>
            </DialogHeader>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 p-8 overflow-y-auto bg-background/50">
            {/* Step 1: Asset Type */}
            {step === 1 && (
              <div className="h-full flex flex-col justify-center">
                <RadioGroup
                  value={assetType}
                  onValueChange={handleAssetTypeChange}
                  className="grid grid-cols-3 gap-6"
                >
                  {[
                    { id: 'logo', icon: Sparkles, label: 'Logo', desc: 'Brand marks, icons, and symbols' },
                    { id: 'sticker', icon: Sticker, label: 'Sticker', desc: 'Fun characters and die-cut designs' },
                    { id: 'custom', icon: Wand2, label: 'Custom', desc: 'Anything else you can imagine' },
                  ].map((item) => (
                    <div key={item.id}>
                      <RadioGroupItem value={item.id} id={`asset-${item.id}`} className="peer sr-only" />
                      <Label
                        htmlFor={`asset-${item.id}`}
                        className="flex flex-col items-center justify-center h-full p-8 rounded-2xl border-2 border-muted bg-card hover:border-primary/30 hover:bg-accent/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-all duration-200 group"
                      >
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-200">
                          <item.icon className="h-8 w-8 text-primary" />
                        </div>
                        <span className="text-xl font-bold mb-2">{item.label}</span>
                        <span className="text-sm text-muted-foreground text-center leading-relaxed">
                          {item.desc}
                        </span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}

            {/* Step 2: Concept */}
            {step === 2 && (
              <div className="max-w-2xl mx-auto space-y-8">
                <div className="space-y-4">
                  <Label htmlFor="concept" className="text-lg font-medium">
                    Your Prompt
                  </Label>
                  <div className="relative">
                    <Textarea
                      id="concept"
                      placeholder="E.g. A minimalist geometric fox logo, orange and white, vector style..."
                      value={concept}
                      onChange={(e) => handleConceptChange(e.target.value)}
                      className="text-lg p-6 min-h-[160px] resize-none shadow-sm border-muted-foreground/20 focus:border-primary rounded-3xl"
                      autoFocus
                    />
                    <div className="absolute bottom-4 right-4 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded-md">
                      {concept.length}/200
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Try these ideas
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {SUGGESTION_CHIPS.map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="text-sm px-4 py-2 rounded-full bg-secondary/50 hover:bg-secondary hover:text-secondary-foreground transition-colors text-left"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Grid Size */}
            {step === 3 && (
              <div className="h-full flex flex-col justify-center max-w-4xl mx-auto">
                <RadioGroup
                  value={gridSize}
                  onValueChange={handleGridSizeChange}
                  className="grid grid-cols-3 gap-6"
                >
                  {[
                    {
                      id: '2x2',
                      graphic: Grid2x2Graphic,
                      label: '2x2 Grid',
                      badge: 'Max Detail',
                      badgeColor: 'bg-purple-500/10 text-purple-600',
                      desc: '4 high-res variations. Best for finalized concepts.'
                    },
                    {
                      id: '3x3',
                      graphic: Grid3x3Graphic,
                      label: '3x3 Grid',
                      badge: 'Balanced',
                      badgeColor: 'bg-primary/10 text-primary',
                      desc: '9 variations. Perfect balance of detail and variety.'
                    },
                    {
                      id: '4x4',
                      graphic: Grid4x4Graphic,
                      label: '4x4 Grid',
                      badge: 'Exploration',
                      badgeColor: 'bg-amber-500/10 text-amber-600',
                      desc: '16 variations. Ideal for brainstorming many rough ideas.'
                    },
                  ].map((item) => (
                    <div key={item.id}>
                      <RadioGroupItem value={item.id} id={`grid-${item.id}`} className="peer sr-only" />
                      <Label
                        htmlFor={`grid-${item.id}`}
                        className="relative flex flex-col items-center text-center h-full p-6 rounded-2xl border-2 border-muted bg-card hover:border-primary/30 hover:bg-accent/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-all duration-200 group"
                      >
                        {/* Badge */}
                        <div className={cn("absolute top-4 left-4 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide", item.badgeColor)}>
                          {item.badge}
                        </div>

                        {/* Graphic */}
                        <div className="w-28 h-28 mb-6 bg-background rounded-2xl shadow-sm border p-3 group-hover:scale-105 transition-transform duration-300">
                          <item.graphic />
                        </div>

                        <span className="text-xl font-bold mb-2">{item.label}</span>
                        <span className="text-sm text-muted-foreground leading-relaxed">
                          {item.desc}
                        </span>

                        {/* Selection Checkmark */}
                        <div className="absolute top-4 right-4 opacity-0 scale-50 peer-data-[state=checked]:opacity-100 peer-data-[state=checked]:scale-100 transition-all duration-200">
                          <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                            <Check className="w-4 h-4" />
                          </div>
                        </div>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t bg-background flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={step === 1}
              className="text-muted-foreground hover:text-foreground"
            >
              Back
            </Button>

            {step < 3 ? (
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                size="lg"
                className="px-8 rounded-full"
              >
                Next Step <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                disabled={!canProceed()}
                size="lg"
                className="px-8 rounded-full bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Grid
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
