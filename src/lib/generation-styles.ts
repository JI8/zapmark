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
  imagePath?: string;
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
    id: 'wordmark',
    name: 'Wordmark',
    vibe: 'Typography focused',
    description: 'A logo made entirely of text, with carefully chosen letters and spacing.',
    basePrompt: '{concept}, wordmark logo, typography only, custom lettering, clean font, professional, high legibility, no icons, plain background',
    negativePrompt: 'icons, symbols, illustrations, messy, clutter',
    category: 'logo',
    imagePath: '/logomarks/wordmark.png',
  },
  {
    id: 'lettermark',
    name: 'Lettermark',
    vibe: 'Monogram',
    description: 'A compact arrangement of initials forming one cohesive symbol.',
    basePrompt: '{concept}, lettermark logo, monogram, stylized initials, overlapping letters, geometric letterforms, bold, cohesive symbol, plain background',
    negativePrompt: 'full words, long text, detailed illustration, messy',
    category: 'logo',
    imagePath: '/logomarks/lettermark.png',
  },
  {
    id: 'pictorial-mark',
    name: 'Pictorial Mark',
    vibe: 'Iconic symbol',
    description: 'A simple, recognizable image like an animal, fruit or object.',
    basePrompt: '{concept}, pictorial mark logo, simple icon, recognizable symbol, flat design, minimal shapes, clear silhouette, plain background',
    negativePrompt: 'text, words, complex details, realistic photo, noise',
    category: 'logo',
    imagePath: '/logomarks/pictorial_mark.png',
  },
  {
    id: 'abstract-mark',
    name: 'Abstract Mark',
    vibe: 'Symbolic & Modern',
    description: 'Geometric or freeform shapes arranged in a symbolic composition.',
    basePrompt: '{concept}, abstract mark logo, geometric shapes, symbolic composition, modern art, unique forms, curves and angles, non-representational, plain background',
    negativePrompt: 'realistic objects, text, animals, faces, clutter',
    category: 'logo',
    imagePath: '/logomarks/abstract_mark.png',
  },
  {
    id: 'combination-mark',
    name: 'Combination Mark',
    vibe: 'Icon + Text',
    description: 'A symbol placed next to, above or integrated into a text element.',
    basePrompt: '{concept}, combination mark logo, icon and text, unified layout, balanced composition, professional branding, clear typography, plain background',
    negativePrompt: 'clutter, messy, separated elements, low quality',
    category: 'logo',
    imagePath: '/logomarks/combination_mark.png',
  },
  {
    id: 'emblem',
    name: 'Emblem',
    vibe: 'Traditional & Badge',
    description: 'Text contained within a fixed shape such as a circle, shield, or crest.',
    basePrompt: '{concept}, emblem logo, badge style, text inside shape, shield or crest, decorative borders, contained design, traditional feel, plain background',
    negativePrompt: 'floating text, loose elements, modern minimal, open layout',
    category: 'logo',
    imagePath: '/logomarks/emblem.png',
  },
  {
    id: 'mascot',
    name: 'Mascot',
    vibe: 'Character & Friendly',
    description: 'A character illustration, often friendly or expressive.',
    basePrompt: '{concept}, mascot logo, character illustration, friendly face, expressive, bold outlines, dynamic pose, vector style, plain background',
    negativePrompt: 'photorealistic, scary, creepy, noise, blurry',
    category: 'logo',
    imagePath: '/logomarks/mascot.png',
  },
  {
    id: 'minimalist',
    name: 'Minimalist',
    vibe: 'Clean & Simple',
    description: 'A clean, stripped down mark made of a few simple lines or shapes.',
    basePrompt: '{concept}, minimalist logo, simple lines, negative space, less is more, clean strokes, uncluttered, geometric, plain background',
    negativePrompt: 'complex, detailed, ornate, busy, texture, realistic',
    category: 'logo',
    imagePath: '/logomarks/minimalist.png',
  },
  {
    id: 'flat',
    name: 'Flat',
    vibe: 'Solid & Sharp',
    description: 'A design with solid colors, sharp edges and no shadows.',
    basePrompt: '{concept}, flat logo design, solid colors, no gradients, no shadows, sharp edges, vector art, simple geometry, plain background',
    negativePrompt: '3d, shadows, gradients, texture, depth, realistic',
    category: 'logo',
    imagePath: '/logomarks/flat.png',
  },
  {
    id: 'vintage-retro',
    name: 'Vintage / Retro',
    vibe: 'Nostalgic',
    description: 'Old fashioned typography, textured details, or ornamental borders.',
    basePrompt: '{concept}, vintage logo, retro style, old school, textured, ornamental, classic badge, muted colors, nostalgia, plain background',
    negativePrompt: 'modern, futuristic, neon, glossy, 3d, clean vector',
    category: 'logo',
    imagePath: '/logomarks/retro.png',
  },
  {
    id: 'geometric',
    name: 'Geometric',
    vibe: 'Precise & Structured',
    description: 'A composition built from circles, triangles, squares or polygons.',
    basePrompt: '{concept}, geometric logo, mathematical shapes, grid based, circles triangles squares, precise lines, structured, balanced, plain background',
    negativePrompt: 'organic, hand drawn, messy, loose, chaotic',
    category: 'logo',
    imagePath: '/logomarks/geometric.png',
  },
  {
    id: 'handwritten',
    name: 'Handwritten',
    vibe: 'Script & Flowing',
    description: 'Flowing, cursive lettering that looks handwritten.',
    basePrompt: '{concept}, handwritten logo, script font, calligraphy, flowing lines, personal touch, organic curves, pen or brush style, plain background',
    negativePrompt: 'geometric, blocky, rigid, mechanical, serif',
    category: 'logo',
    imagePath: '/logomarks/handwritten.png',
  },
  {
    id: 'negative-space',
    name: 'Negative Space',
    vibe: 'Clever & Hidden',
    description: 'Hidden shapes appear in the empty space between elements.',
    basePrompt: '{concept}, negative space logo, hidden image, clever use of space, dual meaning, silhouette, smart design, plain background',
    negativePrompt: 'cluttered, busy, filled, detailed, outline only',
    category: 'logo',
    imagePath: '/logomarks/negative_space.png',
  },
  {
    id: 'dynamic',
    name: 'Dynamic',
    vibe: 'Flexible & Adaptive',
    description: 'Core shape stays the same but internal colors or patterns change.',
    basePrompt: '{concept}, dynamic logo, adaptive branding, changing patterns, flexible identity, modern variation, fluid style, plain background',
    negativePrompt: 'static, rigid, single version, boring',
    category: 'logo',
    imagePath: '/logomarks/dynamic.png',
  },
  {
    id: '3d-gradient',
    name: '3D Gradient',
    vibe: 'Depth & Glossy',
    description: 'A mark with depth created through smooth gradients and highlights.',
    basePrompt: '{concept}, 3d logo, gradient colors, depth, glossy finish, volumetric, soft shadows, modern tech style, plain background',
    negativePrompt: 'flat, 2d, solid color, outline, sketch',
    category: 'logo',
    imagePath: '/logomarks/gradient.png',
  },
  {
    id: 'signature',
    name: 'Signature',
    vibe: 'Personal & Elegant',
    description: 'A stylized handwritten name or initial, resembling a signature.',
    basePrompt: '{concept}, signature logo, personal branding, autograph style, elegant script, fluid strokes, handwritten name, plain background',
    negativePrompt: 'bold block letters, geometric, corporate, heavy',
    category: 'logo',
    imagePath: '/logomarks/signature.png',
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
