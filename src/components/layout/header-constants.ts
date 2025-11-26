/**
 * Shared Header Constants
 * 
 * Common styles and dimensions used across all header components
 * to ensure visual consistency throughout the platform.
 */

export const HEADER_STYLES = {
    // Container styles
    wrapper: "sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
    height: "h-16",

    // Logo styles
    logo: "h-7 md:h-8 w-7 md:w-8",
    brandText: "font-bold text-lg md:text-xl font-headline tracking-tight",

    // Layout dimensions
    appSidebarWidth: "w-full md:w-[440px]", // Matches app page sidebar

    // Padding (matches page content for vertical alignment)
    containerPadding: "px-4 sm:px-6 lg:px-8", // Marketing pages
    sidebarPadding: "px-4 md:px-6", // App sidebar section
    contentPadding: "px-4 md:px-6 lg:px-8", // App main content section
} as const;
