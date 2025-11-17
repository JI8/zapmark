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
  gridSize: z.enum(['3x3', '4x4']).default('3x3').describe('The size of the grid to generate.'),
  generationType: z.enum(['logo', 'custom', 'sticker']).default('logo').describe('The type of asset to generate.'),
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
        { gridSize: input.gridSize, generationType: input.generationType, duration }
      );
      
      throw result.error || new Error('Failed to generate logo grid');
    }
    
    // Log success
    const duration = Date.now() - startTime;
    monitoringService.logGenerationSuccess(
      'generateInitialLogoGrid',
      duration,
      undefined,
      { gridSize: input.gridSize, generationType: input.generationType }
    );
    
    return result.data;
  } catch (error) {
    // Categorize and log error
    const errorResult = errorService.categorizeError(error, {
      operation: 'generateInitialLogoGrid',
      metadata: { gridSize: input.gridSize, generationType: input.generationType },
    });
    
    errorService.logError(error, {
      operation: 'generateInitialLogoGrid',
      metadata: { gridSize: input.gridSize, generationType: input.generationType },
    });
    
    // Re-throw with user-friendly message
    throw new Error(errorResult.userMessage);
  }
}

// Define different prompt templates
const prompts = {
  logo: `Generate a single image that is a {{gridSize}} grid of distinct logo variations for the following concept: "{{textConcept}}". The logos should be clearly separated and centered within their grid cell. Do not include any text or numbering outside of the logos themselves. The background should be a neutral color.`,
  custom: `Generate a single image that is a {{gridSize}} grid of distinct variations for the following concept: "{{textConcept}}". The items should be clearly separated and centered within their grid cell. Do not include any text or numbering outside of the items themselves. The background should be a neutral color.`,
  sticker: `Generate a single image that is a {{gridSize}} grid of distinct sticker designs for the following concept: "{{textConcept}}". The stickers should have a die-cut look with a white border, be clearly separated, and centered within their grid cell. Do not include any text or numbering. The background should be a neutral gray.`,
};


const generateInitialLogoGridFlow = ai.defineFlow(
  {
    name: 'generateInitialLogoGridFlow',
    inputSchema: GenerateInitialLogoGridInputSchema,
    outputSchema: GenerateInitialLogoGridOutputSchema,
  },
  async input => {
    // Select the prompt based on the generation type
    const promptText = prompts[input.generationType];

    const prompt = ai.definePrompt({
      name: `generateInitialGridPrompt_${input.generationType}`, // Unique name per type
      prompt: promptText,
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
