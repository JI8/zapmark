import {genkit, type GenkitErrorCode} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

class ApiKeyError extends Error {
  constructor(message: string, public code: GenkitErrorCode) {
    super(message);
    this.name = 'ApiKeyError';
  }
}

function getApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new ApiKeyError(
      'GEMINI_API_KEY environment variable not set. Please provide an API key in your .env file.',
      'permission-denied'
    );
  }
  return apiKey;
}

export const ai = genkit({
  plugins: [googleAI({
    apiKey: getApiKey(),
  })],
  model: 'googleai/gemini-2.5-flash',
});
