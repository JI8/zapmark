# **App Name**: Zapmark AI

## Core Features:

- Logo Grid Generation: Generates a grid (3x3 or 4x4) of logo variations based on a user-provided text concept using Gemini or Vertex AI.
- Variation Generation: Generates variations of a selected logo tile, maintaining visual style using user prompts and AI models.
- Upscale & Cleanup: Enhances and cleans up selected logos to production quality using AI models to upscale and refine the image.
- Feedback-Driven Edit: Allows users to edit logo variants using free-form text prompts, using a tool incorporating multimodal editing of the variants.
- User Authentication: Implements user authentication via Firebase Auth (Google, email, etc.) for account management.
- Token Management: Manages user tokens in Firestore, including monthly allotments for paid users and enforcement of token usage.
- Grid UI Display: Displays generated logo grids in a clean, responsive UI built with Next.js, allowing for easy selection and interaction.

## Style Guidelines:

- Primary color: Deep blue (#3F51B5) to convey trust and innovation.
- Background color: Light gray (#F0F2F5) provides a neutral backdrop.
- Accent color: Bright green (#4CAF50) for CTAs and interactive elements.
- Headline font: 'Space Grotesk' sans-serif for a modern tech look. Body font: 'Inter' sans-serif for readability.
- Use clean, minimalist icons to represent different functions (edit, upscale, save, etc.).
- Grid-based layout for displaying logo variations, ensuring consistent spacing and alignment.
- Subtle transitions and animations for user interactions, enhancing the exploration experience.