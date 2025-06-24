
[DOC_7] EVIDENS Visual System
Version: 3.1
Date: June 16, 2025
Purpose: This document defines the canonical and complete visual design system for the EVIDENS platform. This version (3.1) establishes a refined dark theme based on reference design, maintaining the clean, professional "editorial" aesthetic. It prioritizes typographic hierarchy, generous whitespace, and a sophisticated neutral color palette. This system governs both the Light Theme and the enhanced Dark Theme.

================================================================================
1.0. Core Philosophy (v3.1 - "Editorial Clarity with Refined Dark Theme")
================================================================================

*   PRINCIPLE 1 (Typography is Structure): The primary tool for creating hierarchy and communicating importance is a disciplined typographic scale, not color or ornamentation. A sophisticated serif font is used for display headings, while a clean sans-serif is used for all UI and body text.
*   PRINCIPLE 2 (Nuanced Neutrality): The color palette is built on a foundation of off-whites and layered grays. Color is used with extreme prejudice. The strongest visual accent is achieved through high-contrast black and white.
*   PRINCIPLE 3 (Space as a Tool): The layout is clean and uncluttered. Generous and consistent use of negative space is non-negotiable. It is used to guide the eye, group related items, and create a calm, focused reading environment.
*   PRINCIPLE 4 (Refined Dark Experience): The dark theme provides a sophisticated, deep dark experience with precisely calibrated gray surfaces that maintain hierarchy and readability using exact reference colors.

================================================================================
2.0. Color System (v3.1 - Light & Enhanced Dark Themes)
================================================================================

2.1. Color Tokens (CSS Variables)
RULE: The following CSS variables must be defined in the global stylesheet. The `.light` class defines the default theme. A `.dark` class will be added to the `<html>` or `<body>` tag to activate the enhanced dark theme.

/* /styles/globals.css */
.light {
  /* Light Theme Tokens (The "Manus" Reference) */
  --background: 220 20% 98%;   /* Very light, soft off-white */
  --foreground: 220 10% 15%;  /* Dark charcoal, not pure black */

  --surface: 220 20% 94%;      /* Subtle gray for cards, secondary backgrounds */
  --surface-muted: 220 20% 88%; /* Gray for input fields, disabled states */

  --border: 220 10% 85%;      /* Light gray border */
  --border-hover: 220 10% 75%; /* Slightly darker border on hover */

  /* Primary action color is high-contrast black */
  --primary: 220 10% 10%;
  --primary-foreground: 210 40% 98%;

  --text-primary: 220 10% 15%;
  --text-secondary: 220 10% 35%;
}

.dark {
  /* Enhanced Dark Theme Tokens (v3.1 - Refined Dark Palette) */
  --background: 0 0% 7%;          /* #121212 - Deepest background */
  --foreground: 210 40% 95%;      /* Soft off-white text */

  --surface: 0 0% 10%;            /* #1a1a1a - Primary surfaces (sidebar, cards) */
  --surface-muted: 0 0% 13%;      /* #212121 - Input fields, secondary surfaces */

  --border: 0 0% 16%;             /* #2a2a2a - Subtle borders */
  --border-hover: 0 0% 18%;       /* #2d2d2d - Slightly brighter border on hover */

  /* Primary action color is high-contrast white */
  --primary: 210 40% 98%;
  --primary-foreground: 0 0% 7%;

  --text-primary: 210 40% 95%;
  --text-secondary: 0 0% 28%;     /* #484848 - Secondary text */

  /* Legacy tokens for compatibility - updated to match new scheme */
  --card: 0 0% 10%;               /* #1a1a1a */
  --card-foreground: 210 40% 95%;
  --popover: 0 0% 10%;            /* #1a1a1a */
  --popover-foreground: 210 40% 95%;
  --secondary: 0 0% 13%;          /* #212121 */
  --secondary-foreground: 210 40% 95%;
  --muted: 0 0% 13%;              /* #212121 */
  --muted-foreground: 0 0% 28%;   /* #484848 */
  --accent: 0 0% 13%;             /* #212121 */
  --accent-foreground: 210 40% 95%;
  --destructive: 0 62.8% 30.6%;
  --destructive-foreground: 0 0% 98%;
  --input: 0 0% 13%;              /* #212121 */
  --ring: 240 4.9% 83.9%;
}

/* Universal Semantic & Utility Tokens */
:root {
  --font-sans: 'Inter', sans-serif;
  --font-serif: 'Source Serif 4', serif;
  --radius: 8px; /* Updated to 8px per v3.0 spec */
  --chart-1: 12 76% 61%;
  --chart-2: 173 58% 39%;
  --chart-3: 197 37% 24%;
  --chart-4: 43 74% 66%;
  --chart-5: 27 87% 67%;
}

2.2. Reference Color Mapping (v3.1 - UPDATED)
RULE: The dark theme uses exact reference colors for consistency:

*   **#121212** → `--background` (0 0% 7%) - Deepest application background
*   **#1a1a1a** → `--surface` (0 0% 10%) - Sidebar, cards, primary surfaces  
*   **#212121** → `--surface-muted` (0 0% 13%) - Input fields, secondary surfaces
*   **#2a2a2a** → `--border` (0 0% 16%) - Subtle borders and separators
*   **#2d2d2d** → `--border-hover` (0 0% 18%) - Hover state borders
*   **#484848** → `--text-secondary` (0 0% 28%) - Secondary text and muted content

2.3. Tailwind CSS Integration (v3.1)
RULE: The `tailwind.config.ts` file must be updated to reflect this enhanced token system with refined dark theme support.

// tailwind.config.ts
// ...
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        'border-hover': 'hsl(var(--border-hover))', // New token
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--text-primary))', // Updated mapping
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: { // Secondary is now for text, not backgrounds
          DEFAULT: 'hsl(var(--text-secondary))',
        },
        surface: { // Enhanced surface colors for dark theme
          DEFAULT: 'hsl(var(--surface))',
          muted: 'hsl(var(--surface-muted))',
        },
        destructive: 'hsl(var(--destructive))',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['var(--font-sans)'],
        serif: ['var(--font-serif)'],
      },
      // ...
    },
// ...

================================================================================
3.0. Component Styling Rules (v3.1)
================================================================================

RULE: To achieve the desired refined aesthetic with enhanced dark theme support, the AI developer must apply the new tokens as follows:

*   **Page Background:** Use `bg-background` (#121212 in dark theme, off-white in light).
*   **Sidebar/Navigation Surfaces:** Use `bg-surface` (#1a1a1a in dark theme, light gray in light).
*   **Cards & Content Areas:** Use `bg-background` with `border border-border` and soft `shadow-md`.
*   **Input Fields:** Use `bg-surface-muted` (#212121 in dark theme).
*   **Primary Buttons:** MUST use `bg-primary text-primary-foreground` (white on dark in dark theme, black on light in light theme).
*   **Secondary/Navigation Items:** Use `text-foreground` for primary text, `text-secondary` (#484848) for muted text.

3.1. Dark Theme Specific Guidelines
*   **Main Background:** Should use `bg-background` (#121212) for the deepest dark background
*   **Sidebar:** Should use `bg-surface` (#1a1a1a) to create distinction from main background
*   **Input Fields:** Should use `bg-surface-muted` (#212121) for proper contrast and interaction
*   **Borders:** Use `border-border` (#2a2a2a) for subtle separation without harsh lines
*   **Hover States:** Use `border-hover` (#2d2d2d) for interactive feedback
*   **Text Hierarchy:** `text-foreground` for primary text, `text-secondary` (#484848) for secondary information

================================================================================
4.0. Logo & Brand Identity (PRESERVED)
================================================================================

4.1. Current Logo Specification
RULE: The current "Reviews." logo MUST be preserved exactly as implemented. The following specifications document the existing implementation:

*   **Logo Text:** "Reviews." (with period)
*   **Typography:** Current font weight and family as implemented in the application
*   **Color:** Inherits from current text color tokens (adapts to theme)
*   **Placement:** Header/navigation as currently positioned
*   **Interactive States:** Current hover/focus states preserved

CRITICAL: This logo specification MUST NOT be altered during visual system updates. Any changes to the overall visual system must preserve the existing logo implementation exactly.

4.2. Authentication Pages Exception
RULE: Login and signup pages are explicitly excluded from v3.1 visual system updates. These pages must maintain their current styling and visual treatment to preserve existing user experience and branding consistency.

================================================================================
5.0. Implementation Notes (v3.1)
================================================================================

5.1. Reference Design Compliance
The v3.1 dark theme uses exact reference colors (#121212, #1a1a1a, #212121, #2a2a2a, #2d2d2d, #484848) to create a sophisticated dark aesthetic, featuring:
*   Ultra-dark main background (#121212) for deep immersion
*   Refined dark gray surfaces (#1a1a1a) for content areas and sidebar
*   Proper input field contrast (#212121) for usability
*   Subtle borders (#2a2a2a) that provide structure without harshness
*   Enhanced hover states (#2d2d2d) for better interactivity
*   Sophisticated secondary text (#484848) for information hierarchy
*   High-contrast white text on dark backgrounds for readability
*   Maintained typography hierarchy in both themes

5.2. Backward Compatibility
All existing components will continue to work with the enhanced token system. The light theme remains unchanged to preserve the established aesthetic for users who prefer it.
