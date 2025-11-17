'use server';
/**
 * @fileOverview Edits a logo variant using a text prompt.
 *
 * - editLogoWithTextPrompt - A function that edits a logo variant based on a text prompt.
 * - EditLogoWithTextPromptInput - The input type for the editLogoWithTextPrompt function.
 * - EditLogoWithTextPromptOutput - The return type for the editLogoWithTextPrompt function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EditLogoWithTextPromptInputSchema = z.object({
  logoDataUri: z
    .string()
    .describe(
      'The logo to edit, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.'
    ),
  textPrompt: z.string().describe('The text prompt to use to edit the logo.'),
});
export type EditLogoWithTextPromptInput = z.infer<typeof EditLogoWithTextPromptInputSchema>;

const EditLogoWithTextPromptOutputSchema = z.object({
  editedLogoDataUri: z
    .string()
    .describe(
      'The edited logo, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.'
    ),
});
export type EditLogoWithTextPromptOutput = z.infer<typeof EditLogoWithTextPromptOutputSchema>;

export async function editLogoWithTextPrompt(
  input: EditLogoWithTextPromptInput
): Promise<EditLogoWithTextPromptOutput> {
  return editLogoWithTextPromptFlow(input);
}

const prompt = ai.definePrompt({
  name: 'editLogoWithTextPromptPrompt',
  input: {schema: EditLogoWithTextPromptInputSchema},
  output: {schema: EditLogoWithTextPromptOutputSchema},
  prompt: [
    {
      media: {url: '{{logoDataUri}}'},
    },
    {
      text: '{{textPrompt}}',
    },
  ],
  model: 'googleai/gemini-2.5-flash-image-preview',
  config: {
    responseModalities: ['TEXT', 'IMAGE'],
  },
});

const editLogoWithTextPromptFlow = ai.defineFlow(
  {
    name: 'editLogoWithTextPromptFlow',
    inputSchema: EditLogoWithTextPromptInputSchema,
    outputSchema: EditLogoWithTextPromptOutputSchema,
  },
  async input => {
    const {media} = await prompt(input);
    return {editedLogoDataUri: media!.url!};
  }
);
