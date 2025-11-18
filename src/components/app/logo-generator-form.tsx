'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useState } from 'react';
import { Grid2x2, Grid3x3, LayoutGrid, Loader2, Sparkles, Eye, Pencil, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import StyleSelectorModal from './style-selector-modal';
import { getStyleById, buildPromptWithStyle } from '@/lib/generation-styles';

export const LogoGenSchema = z.object({
  textConcept: z.string().min(1, {
    message: 'Please enter a concept.',
  }),
  gridSize: z.enum(['2x2', '3x3', '4x4'], {
    required_error: 'You need to select a grid size.',
  }),
  styleId: z.string().default('custom'),
});

interface LogoGeneratorFormProps {
  onGenerate: (data: z.infer<typeof LogoGenSchema>) => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export default function LogoGeneratorForm({ onGenerate, isLoading, isAuthenticated }: LogoGeneratorFormProps) {
  const [isStyleModalOpen, setIsStyleModalOpen] = useState(false);
  
  const form = useForm<z.infer<typeof LogoGenSchema>>({
    resolver: zodResolver(LogoGenSchema),
    defaultValues: {
      textConcept: '',
      gridSize: '3x3',
      styleId: 'custom',
    },
  });
  
  const selectedStyleId = form.watch('styleId');
  const selectedStyle = getStyleById(selectedStyleId);
  
  const handleSubmit = (data: z.infer<typeof LogoGenSchema>) => {
    // Pass original data to parent - let parent handle prompt enhancement
    onGenerate(data);
  };

  return (
    <>
      <StyleSelectorModal
        open={isStyleModalOpen}
        onOpenChange={setIsStyleModalOpen}
        selectedStyle={selectedStyleId}
        onSelectStyle={(styleId) => form.setValue('styleId', styleId)}
      />
      
      <Card className="shadow-sm border-none bg-transparent">
        <CardContent className="p-0">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="textConcept"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">Your Concept</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., A minimalist coffee shop logo..."
                        {...field}
                        className="text-base"
                        disabled={!isAuthenticated}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="styleId"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-base">Style</FormLabel>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsStyleModalOpen(true)}
                        disabled={!isAuthenticated}
                        className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        See All
                      </Button>
                    </div>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="grid grid-cols-3 gap-3"
                        disabled={!isAuthenticated}
                      >
                        <div>
                          <RadioGroupItem value="custom" id="style-custom" className="peer sr-only" />
                          <Label 
                            htmlFor="style-custom" 
                            className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-3 hover:border-gray-400 peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                          >
                            <Pencil className="mb-2 h-5 w-5" />
                            <span className="text-xs font-medium">Custom</span>
                          </Label>
                        </div>
                        <div>
                          <RadioGroupItem value="clean-minimal" id="style-minimal" className="peer sr-only" />
                          <Label 
                            htmlFor="style-minimal" 
                            className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-3 hover:border-gray-400 peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                          >
                            <Sparkles className="mb-2 h-5 w-5" />
                            <span className="text-xs font-medium">Minimal</span>
                          </Label>
                        </div>
                        <div>
                          <RadioGroupItem value="friendly-rounded" id="style-friendly" className="peer sr-only" />
                          <Label 
                            htmlFor="style-friendly" 
                            className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-3 hover:border-gray-400 peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                          >
                            <Palette className="mb-2 h-5 w-5" />
                            <span className="text-xs font-medium">Friendly</span>
                          </Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
              control={form.control}
              name="gridSize"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Grid Size</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex items-center gap-3"
                      disabled={!isAuthenticated}
                    >
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="2x2" id="r1" />
                        </FormControl>
                        <Label htmlFor="r1" className="flex items-center gap-2 font-normal cursor-pointer">
                          <Grid2x2 className="h-4 w-4" /> 2x2
                        </Label>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="3x3" id="r2" />
                        </FormControl>
                        <Label htmlFor="r2" className="flex items-center gap-2 font-normal cursor-pointer">
                          <Grid3x3 className="h-4 w-4" /> 3x3
                        </Label>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="4x4" id="r3" />
                        </FormControl>
                        <Label htmlFor="r3" className="flex items-center gap-2 font-normal cursor-pointer">
                          <LayoutGrid className="h-4 w-4" /> 4x4
                        </Label>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isLoading || !isAuthenticated} className="w-full" size="lg">
              {isLoading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              Generate
            </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </>
  );
}
