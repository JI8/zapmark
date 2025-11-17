'use server';
/**
 * @fileOverview Upscales and cleans up a selected logo to production quality using AI models.
 *
 * - upscaleAndCleanupLogo - A function that handles the upscaling and cleanup process.
 * - UpscaleAndCleanupLogoInput - The input type for the upscaleAndCleanupLogo function.
 * - UpscaleAndCleanupLogoOutput - The return type for the upscaleAndCleanupLogo function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { errorService } from '@/lib/errors/error-service';
import { retryManager, NETWORK_RETRY_CONFIG } from '@/lib/retry/retry-manager';
import { monitoringService } from '@/lib/monitoring/monitoring-service';

const UpscaleAndCleanupLogoInputSchema = z.object({
  logoDataUri: z
    .string()
    .describe(
      "A logo image as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type UpscaleAndCleanupLogoInput = z.infer<typeof UpscaleAndCleanupLogoInputSchema>;

const UpscaleAndCleanupLogoOutputSchema = z.object({
  upscaledLogoDataUri: z
    .string()
    .describe('The upscaled and cleaned up logo image as a data URI.'),
});
export type UpscaleAndCleanupLogoOutput = z.infer<typeof UpscaleAndCleanupLogoOutputSchema>;

export async function upscaleAndCleanupLogo(
  input: UpscaleAndCleanupLogoInput
): Promise<UpscaleAndCleanupLogoOutput> {
  const startTime = Date.now();
  
  try {
    // Execute with retry logic for network failures
    const result = await retryManager.executeWithRetry(
      () => upscaleAndCleanupLogoFlow(input),
      NETWORK_RETRY_CONFIG,
      (error) => {
        const errorResult = errorService.categorizeError(error, {
          operation: 'upscaleAndCleanupLogo',
        });
        return errorResult.shouldRetry;
      }
    );
    
    if (!result.success || !result.data) {
      const duration = Date.now() - startTime;
      monitoringService.logGenerationFailure(
        'upscaleAndCleanupLogo',
        result.error || new Error('Upscale failed'),
        undefined,
        { duration }
      );
      
      throw result.error || new Error('Failed to upscale logo');
    }
    
    const duration = Date.now() - startTime;
    monitoringService.logGenerationSuccess(
      'upscaleAndCleanupLogo',
      duration
    );
    
    return result.data;
  } catch (error) {
    const errorResult = errorService.categorizeError(error, {
      operation: 'upscaleAndCleanupLogo',
    });
    
    errorService.logError(error, {
      operation: 'upscaleAndCleanupLogo',
    });
    
    throw new Error(errorResult.userMessage);
  }
}

const upscaleAndCleanupLogoFlow = ai.defineFlow(
  {
    name: 'upscaleAndCleanupLogoFlow',
    inputSchema: UpscaleAndCleanupLogoInputSchema,
    outputSchema: UpscaleAndCleanupLogoOutputSchema,
  },
  async input => {
    const {media} = await ai.generate({
      prompt: [
        {media: {url: input.logoDataUri}},
        {text: 'Take this logo concept and create a fully realized, production-quality version. Keep the exact same visual idea and concept, but elevate it - refine the composition, center it beautifully, fill the frame effectively, and add rich detail and polish. Transform this into a professional, high-resolution design with refined details, improved layout, and beautiful framing. The result should be the same concept but as a complete, polished, production-ready masterpiece.'},
      ],
      model: 'googleai/gemini-2.5-flash-image-preview',
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });
    
    if (!media?.url) {
      throw new Error('Failed to upscale and cleanup logo');
    }
    return {upscaledLogoDataUri: media.url};
  }
);
