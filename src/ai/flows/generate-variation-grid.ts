'use server';

/**
 * @fileOverview Generates a 3x3 grid of variations based on a selected logo.
 *
 * - generateVariationGrid - A function that generates a grid of logo variations.
 * - GenerateVariationGridInput - The input type for the generateVariationGrid function.
 * - GenerateVariationGridOutput - The return type for the generateVariationGrid function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { errorService } from '@/lib/errors/error-service';
import { retryManager, NETWORK_RETRY_CONFIG } from '@/lib/retry/retry-manager';
import { monitoringService } from '@/lib/monitoring/monitoring-service';

const GenerateVariationGridInputSchema = z.object({
  baseLogo: z
    .string()
    .describe(
      "The base logo image to use for generating variations, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type GenerateVariationGridInput = z.infer<typeof GenerateVariationGridInputSchema>;

const GenerateVariationGridOutputSchema = z.object({
  variationGridImage: z
    .string()
    .describe('A single image containing a 3x3 grid of variations as a data URI.'),
});
export type GenerateVariationGridOutput = z.infer<typeof GenerateVariationGridOutputSchema>;

export async function generateVariationGrid(
  input: GenerateVariationGridInput
): Promise<GenerateVariationGridOutput> {
  const startTime = Date.now();
  
  try {
    // Execute with retry logic for network failures
    const result = await retryManager.executeWithRetry(
      () => generateVariationGridFlow(input),
      NETWORK_RETRY_CONFIG,
      (error) => {
        const errorResult = errorService.categorizeError(error, {
          operation: 'generateVariationGrid',
        });
        return errorResult.shouldRetry;
      }
    );
    
    if (!result.success || !result.data) {
      const duration = Date.now() - startTime;
      monitoringService.logGenerationFailure(
        'generateVariationGrid',
        result.error || new Error('Generation failed'),
        undefined,
        { duration }
      );
      
      throw result.error || new Error('Failed to generate variations');
    }
    
    const duration = Date.now() - startTime;
    monitoringService.logGenerationSuccess(
      'generateVariationGrid',
      duration
    );
    
    return result.data;
  } catch (error) {
    const errorResult = errorService.categorizeError(error, {
      operation: 'generateVariationGrid',
    });
    
    errorService.logError(error, {
      operation: 'generateVariationGrid',
    });
    
    throw new Error(errorResult.userMessage);
  }
}

const generateVariationGridFlow = ai.defineFlow(
  {
    name: 'generateVariationGridFlow',
    inputSchema: GenerateVariationGridInputSchema,
    outputSchema: GenerateVariationGridOutputSchema,
  },
  async input => {
    const {media} = await ai.generate({
      prompt: [
        {media: {url: input.baseLogo}},
        {text: 'Generate a single image that is an evenly spaced 3x3 grid of 9 distinct and unique variations of this logo. Each variation should maintain the same general concept and subject but with different details, colors, compositions, or stylistic approaches. Feel free to explore different artistic styles while keeping the core subject recognizable. Make sure each of the 9 variations is clearly different from the others - no duplicates or near-duplicates. The logos should be evenly spaced, clearly separated, and centered within their grid cells in a perfect 3x3 layout. Do not include any text or numbering. The background should be a neutral color.'},
      ],
      model: 'googleai/gemini-2.5-flash-image-preview',
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    if (!media?.url) {
      throw new Error('AI did not return an image.');
    }
    
    return {variationGridImage: media.url};
  }
);
