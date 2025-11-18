/**
 * Generation Styles Configuration
 * 
 * Defines all available generation styles with their prompts and metadata
 */

export interface GenerationStyle {
  id: string;
  name: string;
  vibe: string;
  description: string;
  basePrompt: string;
  negativePrompt: string;
  category: 'logo' | 'illustration';
  icon?: string;
}

export const GENERATION_STYLES: GenerationStyle[] = [
  {
    id: 'custom',
    name: 'Custom',
    vibe: 'Your Vision',
    description: 'Full creative freedom - describe exactly what you want',
    basePrompt: '{concept}',
    negativePrompt: '',
    category: 'logo',
  },
  {
    id: 'clean-minimal',
    name: 'Clean Minimal',
    vibe: 'Very flat, super simple',
    description: 'Works great as a product or app logo',
    basePrompt: '{concept}, flat minimalist logo, simple geometric shapes, 2 colors max, strong negative space, sharp clean edges, plain light background, no texture',
    negativePrompt: '3d, photo, complex background, extra objects, clutter',
    category: 'logo',
  },
  {
    id: 'friendly-rounded',
    name: 'Friendly Rounded',
    vibe: 'Soft, friendly, playful',
    description: 'More playful but still usable as a brand',
    basePrompt: '{concept}, friendly rounded logo, soft curves, thick smooth lines, slightly chunky shapes, warm and inviting color palette, plain light background, subtle shadow only under the logo',
    negativePrompt: 'detailed scene, characters in full body, realistic photo elements, neon colors',
    category: 'logo',
  },
  {
    id: 'elegant-serif',
    name: 'Elegant Serif',
    vibe: 'Premium, editorial',
    description: 'Good for beauty, fashion, boutique',
    basePrompt: '{concept}, elegant serif logo, refined lettering, thin delicate lines, subtle monogram or icon, muted color palette, plain neutral background, minimal soft shadow',
    negativePrompt: 'cartoon style, neon, heavy gradients, busy background, multiple objects',
    category: 'logo',
  },
  {
    id: 'monoline-badge',
    name: 'Monoline Badge',
    vibe: 'Linear, badge-like',
    description: 'Good for tech, tools, craft brands',
    basePrompt: '{concept}, monoline logo badge, single consistent line weight, outline style icon, optional simple frame, high contrast, plain solid background, no texture',
    negativePrompt: '3d, metallic reflections, photo elements, scenery, text paragraphs',
    category: 'logo',
  },
  {
    id: 'flat-sticker',
    name: 'Flat Sticker Pack',
    vibe: 'Crisp sticker style',
    description: 'Perfect for laptops, merch etc',
    basePrompt: '{concept}, flat sticker illustration, bold clean outline, slightly thicker border like a sticker cutline, bright but not neon colors, subtle inner shading, plain single color background',
    negativePrompt: 'realistic photo, complex scene, background objects, gradients that look metallic',
    category: 'illustration',
  },
  {
    id: 'soft-3d-clay',
    name: 'Soft 3D Clay Mascot',
    vibe: '3D clay, toy-like',
    description: 'Super eye-catching, works as a mascot',
    basePrompt: '{concept}, soft 3d clay mascot, smooth rounded shapes, pastel colors, studio lighting, gentle shadows on a plain background, highly polished render',
    negativePrompt: 'realistic human photo, harsh metal, busy scene, text paragraphs in the background',
    category: 'illustration',
  },
  {
    id: 'rough-ink',
    name: 'Rough Ink Emblem',
    vibe: 'Hand-made, slightly gritty',
    description: 'Good for coffee, craft, music etc',
    basePrompt: '{concept}, rough ink emblem, hand drawn look, visible brush or marker strokes, limited color palette, subtle paper feel but mostly plain background, simple framing shape',
    negativePrompt: 'glossy 3d, neon, photographic background, realistic scenery',
    category: 'logo',
  },
  {
    id: 'soft-gradient',
    name: 'Soft Gradient Abstract',
    vibe: 'Modern, smooth gradients',
    description: 'Not neon and still logo-friendly',
    basePrompt: '{concept}, abstract logo mark, smooth soft gradients, simple flowing shapes, modern but calm color palette, plain background, small soft shadow',
    negativePrompt: 'neon glow, glitch, complex landscape, realistic objects, text paragraphs',
    category: 'logo',
  },
];

export function getStyleById(id: string): GenerationStyle | undefined {
  return GENERATION_STYLES.find(style => style.id === id);
}

export function buildPromptWithStyle(concept: string, styleId: string): string {
  const style = getStyleById(styleId);
  if (!style || styleId === 'custom') {
    return concept;
  }
  
  let prompt = style.basePrompt.replace('{concept}', concept);
  
  if (style.negativePrompt) {
    prompt += `. DONT INCLUDE ${style.negativePrompt}`;
  }
  
  return prompt;
}
