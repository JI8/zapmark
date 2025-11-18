'use server';
/**
 * @fileOverview Generates an initial grid of logo variations based on a user-provided text concept.
 *
 * - generateInitialLogoGrid - A function that generates a single image containing a grid of logo variations.
 * - GenerateInitialLogoGridInput - The input type for the generateInitialLogoGrid function.
 * - GenerateInitialLogoGridOutput - The return type for the generateInitialLogoGrid function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { errorService } from '@/lib/errors/error-service';
import { retryManager, NETWORK_RETRY_CONFIG } from '@/lib/retry/retry-manager';
import { monitoringService } from '@/lib/monitoring/monitoring-service';

const GenerateInitialLogoGridInputSchema = z.object({
  textConcept: z.string().describe('A text concept for the generation.'),
  gridSize: z.enum(['2x2', '3x3', '4x4']).default('3x3').describe('The size of the grid to generate.'),
});

export type GenerateInitialLogoGridInput = z.infer<typeof GenerateInitialLogoGridInputSchema>;

const GenerateInitialLogoGridOutputSchema = z.object({
  logoGridImage: z
    .string()
    .describe('A single image containing a grid of variations as a data URI.'),
});

export type GenerateInitialLogoGridOutput = z.infer<typeof GenerateInitialLogoGridOutputSchema>;

export async function generateInitialLogoGrid(
  input: GenerateInitialLogoGridInput
): Promise<GenerateInitialLogoGridOutput> {
  const startTime = Date.now();
  
  try {
    // Execute with retry logic for network failures
    const result = await retryManager.executeWithRetry(
      () => generateInitialLogoGridFlow(input),
      NETWORK_RETRY_CONFIG,
      (error) => {
        // Determine if error is retryable
        const errorResult = errorService.categorizeError(error, {
          operation: 'generateInitialLogoGrid',
        });
        return errorResult.shouldRetry;
      }
    );
    
    if (!result.success || !result.data) {
      // Log failure
      const duration = Date.now() - startTime;
      monitoringService.logGenerationFailure(
        'generateInitialLogoGrid',
        result.error || new Error('Generation failed'),
        undefined,
        { gridSize: input.gridSize, duration }
      );
      
      throw result.error || new Error('Failed to generate logo grid');
    }
    
    // Log success
    const duration = Date.now() - startTime;
    monitoringService.logGenerationSuccess(
      'generateInitialLogoGrid',
      duration,
      undefined,
      { gridSize: input.gridSize }
    );
    
    return result.data;
  } catch (error) {
    // Categorize and log error
    const errorResult = errorService.categorizeError(error, {
      operation: 'generateInitialLogoGrid',
      metadata: { gridSize: input.gridSize },
    });
    
    errorService.logError(error, {
      operation: 'generateInitialLogoGrid',
      metadata: { gridSize: input.gridSize },
    });
    
    // Re-throw with user-friendly message
    throw new Error(errorResult.userMessage);
  }
}

// Simplified prompt - style is now handled by the form
const promptTemplate = `Generate a single image that is an evenly spaced {{gridSize}} grid of distinct variations for the following: "{{textConcept}}". Each variation should be clearly different from one another - no duplicates or near-duplicates. Each item should be evenly spaced, clearly separated, and centered within their grid cell in a perfect {{gridSize}} layout. Do not include any text or numbering outside of the items themselves. The background should be a neutral color.`;

const generateInitialLogoGridFlow = ai.defineFlow(
  {
    name: 'generateInitialLogoGridFlow',
    inputSchema: GenerateInitialLogoGridInputSchema,
    outputSchema: GenerateInitialLogoGridOutputSchema,
  },
  async input => {
    const prompt = ai.definePrompt({
      name: 'generateInitialGridPrompt',
      prompt: promptTemplate,
      model: 'googleai/gemini-2.5-flash-image-preview',
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
      input: { schema: GenerateInitialLogoGridInputSchema },
    });

    const {media} = await prompt(input);

    if (!media?.url) {
      throw new Error('AI did not return an image.');
    }
    return {logoGridImage: media.url};
  }
);
