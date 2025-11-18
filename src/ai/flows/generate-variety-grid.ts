'use server';

/**
 * @fileOverview Generates a 3x3 grid of variety based on a selected logo.
 * Keeps the same style but explores different subjects/compositions.
 *
 * - generateVarietyGrid - A function that generates a grid of logo variety.
 * - GenerateVarietyGridInput - The input type for the generateVarietyGrid function.
 * - GenerateVarietyGridOutput - The return type for the generateVarietyGrid function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { errorService } from '@/lib/errors/error-service';
import { retryManager, NETWORK_RETRY_CONFIG } from '@/lib/retry/retry-manager';
import { monitoringService } from '@/lib/monitoring/monitoring-service';

const GenerateVarietyGridInputSchema = z.object({
  baseLogo: z
    .string()
    .describe(
      "The base logo image to use for generating variety, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type GenerateVarietyGridInput = z.infer<typeof GenerateVarietyGridInputSchema>;

const GenerateVarietyGridOutputSchema = z.object({
  varietyGridImage: z
    .string()
    .describe('A single image containing a 3x3 grid of variety as a data URI.'),
});
export type GenerateVarietyGridOutput = z.infer<typeof GenerateVarietyGridOutputSchema>;

export async function generateVarietyGrid(
  input: GenerateVarietyGridInput
): Promise<GenerateVarietyGridOutput> {
  const startTime = Date.now();
  
  try {
    // Execute with retry logic for network failures
    const result = await retryManager.executeWithRetry(
      () => generateVarietyGridFlow(input),
      NETWORK_RETRY_CONFIG,
      (error) => {
        const errorResult = errorService.categorizeError(error, {
          operation: 'generateVarietyGrid',
        });
        return errorResult.shouldRetry;
      }
    );
    
    if (!result.success || !result.data) {
      const duration = Date.now() - startTime;
      monitoringService.logGenerationFailure(
        'generateVarietyGrid',
        result.error || new Error('Generation failed'),
        undefined,
        { duration }
      );
      
      throw result.error || new Error('Failed to generate variety');
    }
    
    const duration = Date.now() - startTime;
    monitoringService.logGenerationSuccess(
      'generateVarietyGrid',
      duration
    );
    
    return result.data;
  } catch (error) {
    const errorResult = errorService.categorizeError(error, {
      operation: 'generateVarietyGrid',
    });
    
    errorService.logError(error, {
      operation: 'generateVarietyGrid',
    });
    
    throw new Error(errorResult.userMessage);
  }
}

const generateVarietyGridFlow = ai.defineFlow(
  {
    name: 'generateVarietyGridFlow',
    inputSchema: GenerateVarietyGridInputSchema,
    outputSchema: GenerateVarietyGridOutputSchema,
  },
  async input => {
    const {media} = await ai.generate({
      prompt: [
        {media: {url: input.baseLogo}},
        {text: 'Generate a single image that is an evenly spaced 3x3 grid of 9 distinct variations of this logo. Each variation should maintain the EXACT SAME subject and the EXACT SAME visual style as the reference logo, but with different details, angles, compositions, or subtle stylistic variations. Keep the core concept and aesthetic identical - only vary the execution. Make sure each of the 9 variations is clearly different from one another - no duplicates or near-duplicates. The logos should be evenly spaced, clearly separated, and centered within their grid cells in a perfect 3x3 layout. Do not include any text or numbering. The background should be a neutral color.'},
      ],
      model: 'googleai/gemini-2.5-flash-image-preview',
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    if (!media?.url) {
      throw new Error('AI did not return an image.');
    }
    
    return {varietyGridImage: media.url};
  }
);
