'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Grid2x2, Grid3x3, Loader2, Sparkles, Pencil, Component, PartyPopper } from 'lucide-react';
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

export const LogoGenSchema = z.object({
  textConcept: z.string().min(10, {
    message: 'Prompt must be at least 10 characters.',
  }),
  gridSize: z.enum(['3x3', '4x4'], {
    required_error: 'You need to select a grid size.',
  }),
  generationType: z.enum(['logo', 'custom', 'sticker'], {
    required_error: 'You need to select a generation type.',
  }),
});

interface LogoGeneratorFormProps {
  onGenerate: (data: z.infer<typeof LogoGenSchema>) => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export default function LogoGeneratorForm({ onGenerate, isLoading, isAuthenticated }: LogoGeneratorFormProps) {
  const form = useForm<z.infer<typeof LogoGenSchema>>({
    resolver: zodResolver(LogoGenSchema),
    defaultValues: {
      textConcept: '',
      gridSize: '3x3',
      generationType: 'logo',
    },
  });

  return (
    <Card className="shadow-sm border-none bg-transparent">
      <CardContent className="p-0">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onGenerate)} className="space-y-6">
            <FormField
              control={form.control}
              name="textConcept"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">Your Concept</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., A minimalist icon for a coffee shop..."
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
              name="generationType"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Generation Type</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="grid grid-cols-3 gap-4"
                      disabled={!isAuthenticated}
                    >
                      <FormItem>
                        <RadioGroupItem value="logo" id="type-logo" className="peer sr-only" />
                        <Label htmlFor="type-logo" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary peer-disabled:opacity-50 peer-disabled:cursor-not-allowed">
                          <Component className="mb-3 h-6 w-6" />
                          Logo
                        </Label>
                      </FormItem>
                      <FormItem>
                        <RadioGroupItem value="custom" id="type-custom" className="peer sr-only" />
                        <Label htmlFor="type-custom" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary peer-disabled:opacity-50 peer-disabled:cursor-not-allowed">
                          <Pencil className="mb-3 h-6 w-6" />
                          Custom
                        </Label>
                      </FormItem>
                       <FormItem>
                        <RadioGroupItem value="sticker" id="type-sticker" className="peer sr-only" />
                        <Label htmlFor="type-sticker" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary peer-disabled:opacity-50 peer-disabled:cursor-not-allowed">
                          <PartyPopper className="mb-3 h-6 w-6" />
                          Sticker
                        </Label>
                      </FormItem>
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
                      className="flex items-center gap-4"
                      disabled={!isAuthenticated}
                    >
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="3x3" id="r1" />
                        </FormControl>
                        <Label htmlFor="r1" className="flex items-center gap-2 font-normal">
                          <Grid3x3 className="h-4 w-4" /> 3x3 Grid
                        </Label>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="4x4" id="r2" />
                        </FormControl>
                        <Label htmlFor="r2" className="flex items-center gap-2 font-normal">
                          <Grid2x2 className="h-4 w-4" /> 4x4 Grid
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
  );
}
