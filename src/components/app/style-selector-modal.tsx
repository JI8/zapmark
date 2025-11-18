'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { GENERATION_STYLES } from '@/lib/generation-styles';
import { Check, Sparkles, X } from 'lucide-react';
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
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Choose Your Style</DialogTitle>
          <DialogDescription>
            Select a style to guide the AI generation
          </DialogDescription>
        </DialogHeader>
        
        <div className="overflow-y-auto pr-2 -mr-2">
          <RadioGroup value={selectedStyle} onValueChange={handleSelectStyle}>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {GENERATION_STYLES.map((style) => (
                <div key={style.id}>
                  <RadioGroupItem 
                    value={style.id} 
                    id={`style-${style.id}`} 
                    className="peer sr-only" 
                  />
                  <Label 
                    htmlFor={`style-${style.id}`}
                    className={cn(
                      "relative flex flex-col items-center justify-center cursor-pointer rounded-lg border-2 p-4 transition-all aspect-square",
                      "hover:border-gray-400",
                      "peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5",
                      "[&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:bg-primary/5"
                    )}
                  >
                    {selectedStyle === style.id ? (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-3 h-3 text-primary-foreground" />
                      </div>
                    ) : (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center">
                        <X className="w-3 h-3 text-gray-600" />
                      </div>
                    )}
                    
                    <Sparkles className="w-8 h-8 mb-2 text-muted-foreground" />
                    <h3 className="font-semibold text-sm text-center">{style.name}</h3>
                    <p className="text-xs text-muted-foreground text-center mt-1">{style.vibe}</p>
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        </div>
      </DialogContent>
    </Dialog>
  );
}
