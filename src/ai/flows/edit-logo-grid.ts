'use server';

/**
 * @fileOverview Edits a logo and generates a 3x3 grid of variations with the edit applied.
 *
 * - editLogoGrid - A function that edits a logo and generates a 3x3 grid.
 * - EditLogoGridInput - The input type for the editLogoGrid function.
 * - EditLogoGridOutput - The return type for the editLogoGrid function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { errorService } from '@/lib/errors/error-service';
import { retryManager, NETWORK_RETRY_CONFIG } from '@/lib/retry/retry-manager';
import { monitoringService } from '@/lib/monitoring/monitoring-service';

const EditLogoGridInputSchema = z.object({
  baseLogo: z
    .string()
    .describe(
      "The base logo image to edit, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  editPrompt: z.string().describe('The edit instructions to apply to the logo.'),
});
export type EditLogoGridInput = z.infer<typeof EditLogoGridInputSchema>;

const EditLogoGridOutputSchema = z.object({
  editedGridImage: z
    .string()
    .describe('A single image containing a 3x3 grid of edited variations as a data URI.'),
});
export type EditLogoGridOutput = z.infer<typeof EditLogoGridOutputSchema>;

export async function editLogoGrid(
  input: EditLogoGridInput
): Promise<EditLogoGridOutput> {
  const startTime = Date.now();
  
  try {
    // Execute with retry logic for network failures
    const result = await retryManager.executeWithRetry(
      () => editLogoGridFlow(input),
      NETWORK_RETRY_CONFIG,
      (error) => {
        const errorResult = errorService.categorizeError(error, {
          operation: 'editLogoGrid',
        });
        return errorResult.shouldRetry;
      }
    );
    
    if (!result.success || !result.data) {
      const duration = Date.now() - startTime;
      monitoringService.logGenerationFailure(
        'editLogoGrid',
        result.error || new Error('Edit failed'),
        undefined,
        { duration }
      );
      
      throw result.error || new Error('Failed to edit logo grid');
    }
    
    const duration = Date.now() - startTime;
    monitoringService.logGenerationSuccess(
      'editLogoGrid',
      duration
    );
    
    return result.data;
  } catch (error) {
    const errorResult = errorService.categorizeError(error, {
      operation: 'editLogoGrid',
    });
    
    errorService.logError(error, {
      operation: 'editLogoGrid',
    });
    
    throw new Error(errorResult.userMessage);
  }
}

const editLogoGridFlow = ai.defineFlow(
  {
    name: 'editLogoGridFlow',
    inputSchema: EditLogoGridInputSchema,
    outputSchema: EditLogoGridOutputSchema,
  },
  async input => {
    const {media} = await ai.generate({
      prompt: [
        {media: {url: input.baseLogo}},
        {text: `Apply this edit to the logo: ${input.editPrompt}

Then generate a single image that is an evenly spaced 3x3 grid of 9 distinct variations of the edited logo. Each variation should maintain the edited concept but with different details, colors, compositions, or stylistic approaches. Make sure each of the 9 variations is clearly different from the others - no duplicates. The logos should be evenly spaced, clearly separated, and centered within their grid cells in a perfect 3x3 layout. Do not include any text or numbering. The background should be a neutral color.`},
      ],
      model: 'googleai/gemini-2.5-flash-image-preview',
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    if (!media?.url) {
      throw new Error('AI did not return an image.');
    }
    
    return {editedGridImage: media.url};
  }
);
