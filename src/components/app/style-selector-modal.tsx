'use client';

import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { GENERATION_STYLES } from '@/lib/generation-styles';
import {
  Check,
  Pencil,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface StyleSelectorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedStyle: string;
  onSelectStyle: (styleId: string) => void;
}

export default function StyleSelectorModal({
  open,
  onOpenChange,
  selectedStyle,
  onSelectStyle,
}: StyleSelectorModalProps) {
  const handleSelectStyle = (styleId: string) => {
    onSelectStyle(styleId);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden flex flex-col p-0 gap-0 border-0 shadow-2xl bg-background/95 backdrop-blur-xl">
        {/* Header */}
        <div className="p-8 pb-6 border-b bg-muted/30">
          <DialogHeader>
            <DialogTitle className="text-3xl font-bold font-headline tracking-tight">Choose Your Aesthetic</DialogTitle>
            <DialogDescription className="text-lg">
              Select a style to guide the AI generation. This helps shape the look and feel of your assets.
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 bg-muted/10">
          <RadioGroup value={selectedStyle} onValueChange={handleSelectStyle}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {GENERATION_STYLES.map((style) => {
                const isSelected = selectedStyle === style.id;

                return (
                  <div key={style.id}>
                    <RadioGroupItem
                      value={style.id}
                      id={`style-${style.id}`}
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor={`style-${style.id}`}
                      className={cn(
                        "relative flex flex-col h-full cursor-pointer rounded-3xl border-2 transition-all duration-300 overflow-hidden group bg-card",
                        "hover:border-primary/30 hover:shadow-lg hover:-translate-y-1",
                        isSelected
                          ? "border-primary ring-2 ring-primary/20 shadow-xl scale-[1.02]"
                          : "border-muted shadow-sm"
                      )}
                    >
                      {/* Visual Header */}
                      <div className={cn(
                        "h-40 w-full bg-muted flex items-center justify-center relative overflow-hidden",
                        !style.imagePath && "bg-gradient-to-br from-gray-500/10 to-gray-500/5"
                      )}>
                        {style.imagePath ? (
                          <Image
                            src={style.imagePath}
                            alt={style.name}
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                          />
                        ) : (
                          <>
                            <div className="absolute inset-0 bg-grid-black/[0.02] dark:bg-grid-white/[0.02]" />
                            <Pencil className={cn(
                              "w-16 h-16 transition-transform duration-500",
                              isSelected ? "scale-110 text-primary" : "text-muted-foreground/50 group-hover:text-foreground/70 group-hover:scale-105"
                            )} strokeWidth={1.5} />
                          </>
                        )}

                        {/* Selection Checkmark */}
                        <div className={cn(
                          "absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm z-10",
                          isSelected
                            ? "bg-primary text-primary-foreground scale-100 opacity-100"
                            : "bg-background/50 text-muted-foreground scale-90 opacity-0"
                        )}>
                          <Check className="w-5 h-5" strokeWidth={3} />
                        </div>
                      </div>

                      {/* Content Body */}
                      <div className="p-6 flex flex-col flex-1 gap-3">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-bold text-xl tracking-tight">{style.name}</h3>
                        </div>

                        <div className="inline-flex self-start rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          {style.vibe}
                        </div>

                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {style.description}
                        </p>
                      </div>
                    </Label>
                  </div>
                );
              })}
            </div>
          </RadioGroup>
        </div>
      </DialogContent>
    </Dialog>
  );
}
