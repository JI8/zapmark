'use server';

/**
 * @fileOverview A flow for generating logo variations based on a selected logo tile and user prompts.
 *
 * - generateLogoVariation - A function that handles the logo variation generation process.
 * - GenerateLogoVariationInput - The input type for the generateLogoVariation function.
 * - GenerateLogoVariationOutput - The return type for the generateLogoVariation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateLogoVariationInputSchema = z.object({
  baseLogo: z
    .string()
    .describe(
      "The base logo image to use for generating variations, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  prompt: z.string().describe('The text prompt to guide the logo variation.'),
});
export type GenerateLogoVariationInput = z.infer<typeof GenerateLogoVariationInputSchema>;

const GenerateLogoVariationOutputSchema = z.object({
  variedLogo: z
    .string()
    .describe(
      "The generated logo variation, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type GenerateLogoVariationOutput = z.infer<typeof GenerateLogoVariationOutputSchema>;

export async function generateLogoVariation(input: GenerateLogoVariationInput): Promise<GenerateLogoVariationOutput> {
  return generateLogoVariationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateLogoVariationPrompt',
  input: {schema: GenerateLogoVariationInputSchema},
  output: {schema: GenerateLogoVariationOutputSchema},
  prompt: `Generate a variation of the given logo, guided by the following prompt. Maintain the visual style of the original logo.

Prompt: {{{prompt}}}

Base Logo: {{media url=baseLogo}}`,
});

const generateLogoVariationFlow = ai.defineFlow(
  {
    name: 'generateLogoVariationFlow',
    inputSchema: GenerateLogoVariationInputSchema,
    outputSchema: GenerateLogoVariationOutputSchema,
  },
  async input => {
    const {media} = await ai.generate({
      prompt: [
        {media: {url: input.baseLogo}},
        {text: input.prompt},
      ],
      model: 'googleai/gemini-2.5-flash-image-preview',
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });
    return {variedLogo: media!.url};
  }
);
