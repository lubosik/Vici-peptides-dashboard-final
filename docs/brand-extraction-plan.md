# Brand Extraction Plan

This document describes the exact methodology for programmatically extracting design tokens (colors, fonts, spacing, button styles, border radii, shadows, headings, nav typography) from https://vicipeptides.com/ and encoding them as Tailwind/shadcn tokens.

## Objective

Extract the live design system from vicipeptides.com to ensure the dashboard UI looks authentically like Vici Peptides without guessing. The extracted tokens will be used to create both light mode and dark mode variants, where dark mode may introduce tasteful purple accents inspired by the reference dashboard, but only if they harmonize with the extracted Vici palette.

---

## Extraction Methodology

### Technology Stack

**Recommended:** Playwright (headless browser automation)
- **Why:** Can execute JavaScript, capture computed styles, handle dynamic content, and extract CSS variables
- **Alternative:** Puppeteer (similar capabilities)

**Language:** TypeScript/JavaScript (Node.js)

**Output Formats:**
1. `/theme/brand-tokens.json` - Machine-readable JSON
2. `/theme/brand-tokens.ts` - TypeScript export for type safety

---

## Extraction Process

### Step 1: Initialize Playwright and Navigate

```typescript
import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.goto('https://vicipeptides.com/', { waitUntil: 'networkidle' });
```

### Step 2: Extract CSS Variables

Capture all CSS custom properties (CSS variables) used by the theme.

```typescript
const cssVariables = await page.evaluate(() => {
  const root = getComputedStyle(document.documentElement);
  const variables: Record<string, string> = {};
  
  // Get all CSS variables
  for (const rule of Array.from(document.styleSheets)) {
    try {
      for (const cssRule of Array.from(rule.cssRules || [])) {
        if (cssRule instanceof CSSStyleRule) {
          const style = cssRule.style;
          for (let i = 0; i < style.length; i++) {
            const prop = style[i];
            if (prop.startsWith('--')) {
              variables[prop] = root.getPropertyValue(prop).trim();
            }
          }
        }
      }
    } catch (e) {
      // Cross-origin stylesheets may throw
    }
  }
  
  return variables;
});
```

### Step 3: Extract Typography

Capture font families, sizes, weights, line heights for:
- Body text
- Headings (H1, H2, H3, H4, H5, H6)
- Navigation typography
- Button text
- Card headings

```typescript
const typography = await page.evaluate(() => {
  const getComputedStyles = (selector: string) => {
    const element = document.querySelector(selector);
    if (!element) return null;
    const styles = window.getComputedStyle(element);
    return {
      fontFamily: styles.fontFamily,
      fontSize: styles.fontSize,
      fontWeight: styles.fontWeight,
      lineHeight: styles.lineHeight,
      letterSpacing: styles.letterSpacing,
      textTransform: styles.textTransform,
      color: styles.color,
    };
  };

  return {
    body: getComputedStyles('body'),
    h1: getComputedStyles('h1'),
    h2: getComputedStyles('h2'),
    h3: getComputedStyles('h3'),
    h4: getComputedStyles('h4'),
    h5: getComputedStyles('h5'),
    h6: getComputedStyles('h6'),
    nav: getComputedStyles('nav, .nav, [role="navigation"]'),
    button: getComputedStyles('button, .btn, [role="button"]'),
    cardHeading: getComputedStyles('.card h2, .card h3, [class*="card"] h2'),
  };
});
```

### Step 4: Extract Color Palette

Capture the most frequent background, foreground, and accent colors.

```typescript
const colorPalette = await page.evaluate(() => {
  const extractColors = (selector: string) => {
    const elements = Array.from(document.querySelectorAll(selector));
    const colors: Record<string, number> = {};
    
    elements.forEach(el => {
      const styles = window.getComputedStyle(el);
      const bg = styles.backgroundColor;
      const fg = styles.color;
      const border = styles.borderColor;
      
      [bg, fg, border].forEach(color => {
        if (color && color !== 'rgba(0, 0, 0, 0)' && color !== 'transparent') {
          colors[color] = (colors[color] || 0) + 1;
        }
      });
    });
    
    return colors;
  };

  // Extract from common elements
  const bodyColors = extractColors('body');
  const headingColors = extractColors('h1, h2, h3, h4, h5, h6');
  const buttonColors = extractColors('button, .btn, [role="button"]');
  const linkColors = extractColors('a, [href]');
  const cardColors = extractColors('.card, [class*="card"]');
  const navColors = extractColors('nav, .nav, [role="navigation"]');
  
  // Get primary brand colors (most frequent)
  const allColors = { ...bodyColors, ...headingColors, ...buttonColors, ...linkColors, ...cardColors, ...navColors };
  const sortedColors = Object.entries(allColors)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20); // Top 20 most frequent colors

  return {
    primary: sortedColors[0]?.[0],
    secondary: sortedColors[1]?.[0],
    accent: sortedColors.find(([color]) => {
      // Look for colors that are not black/white/gray (likely accent)
      const rgb = color.match(/\d+/g);
      if (!rgb) return false;
      const [r, g, b] = rgb.map(Number);
      const isGray = Math.abs(r - g) < 10 && Math.abs(g - b) < 10;
      return !isGray && (r > 50 || g > 50 || b > 50);
    })?.[0],
    background: extractColors('body')[0]?.[0],
    foreground: extractColors('body p, body span')[0]?.[0],
    allFrequent: sortedColors.map(([color]) => color),
  };
});
```

### Step 5: Extract Spacing System

Capture padding, margin, and gap values to infer spacing scale.

```typescript
const spacing = await page.evaluate(() => {
  const elements = Array.from(document.querySelectorAll('*'));
  const spacingValues: Record<string, number> = {};
  
  elements.forEach(el => {
    const styles = window.getComputedStyle(el);
    ['padding', 'margin', 'gap'].forEach(prop => {
      const value = styles.getPropertyValue(prop);
      if (value) {
        const match = value.match(/(\d+(?:\.\d+)?)(px|rem|em)/);
        if (match) {
          const num = parseFloat(match[1]);
          const unit = match[2];
          const key = `${num}${unit}`;
          spacingValues[key] = (spacingValues[key] || 0) + 1;
        }
      }
    });
  });
  
  // Get most common spacing values
  const sorted = Object.entries(spacingValues)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 16) // Top 16 for Tailwind scale
    .map(([value]) => value);
  
  return sorted;
});
```

### Step 6: Extract Button Styles

Capture button appearance: border radius, padding, shadows, backgrounds.

```typescript
const buttonStyles = await page.evaluate(() => {
  const buttons = Array.from(document.querySelectorAll('button, .btn, [role="button"], a[class*="button"]'));
  if (buttons.length === 0) return null;
  
  const firstButton = buttons[0];
  const styles = window.getComputedStyle(firstButton);
  
  return {
    borderRadius: styles.borderRadius,
    padding: styles.padding,
    paddingTop: styles.paddingTop,
    paddingRight: styles.paddingRight,
    paddingBottom: styles.paddingBottom,
    paddingLeft: styles.paddingLeft,
    backgroundColor: styles.backgroundColor,
    color: styles.color,
    border: styles.border,
    borderWidth: styles.borderWidth,
    borderColor: styles.borderColor,
    borderStyle: styles.borderStyle,
    boxShadow: styles.boxShadow,
    fontWeight: styles.fontWeight,
    fontSize: styles.fontSize,
    textTransform: styles.textTransform,
    letterSpacing: styles.letterSpacing,
  };
});
```

### Step 7: Extract Card Styles

Capture card appearance: border radius, shadows, backgrounds, padding.

```typescript
const cardStyles = await page.evaluate(() => {
  const cards = Array.from(document.querySelectorAll('.card, [class*="card"], [class*="Card"]'));
  if (cards.length === 0) return null;
  
  const firstCard = cards[0];
  const styles = window.getComputedStyle(firstCard);
  
  return {
    borderRadius: styles.borderRadius,
    backgroundColor: styles.backgroundColor,
    border: styles.border,
    borderWidth: styles.borderWidth,
    borderColor: styles.borderColor,
    boxShadow: styles.boxShadow,
    padding: styles.padding,
  };
});
```

### Step 8: Extract Border Radius System

Capture common border radius values.

```typescript
const borderRadius = await page.evaluate(() => {
  const elements = Array.from(document.querySelectorAll('*'));
  const radiusValues: Record<string, number> = {};
  
  elements.forEach(el => {
    const styles = window.getComputedStyle(el);
    const radius = styles.borderRadius;
    if (radius && radius !== '0px') {
      radiusValues[radius] = (radiusValues[radius] || 0) + 1;
    }
  });
  
  const sorted = Object.entries(radiusValues)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([value]) => value);
  
  return sorted;
});
```

### Step 9: Extract Shadow System

Capture box shadow values.

```typescript
const shadows = await page.evaluate(() => {
  const elements = Array.from(document.querySelectorAll('*'));
  const shadowValues: Record<string, number> = {};
  
  elements.forEach(el => {
    const styles = window.getComputedStyle(el);
    const shadow = styles.boxShadow;
    if (shadow && shadow !== 'none') {
      shadowValues[shadow] = (shadowValues[shadow] || 0) + 1;
    }
  });
  
  const sorted = Object.entries(shadowValues)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([value]) => value);
  
  return sorted;
});
```

### Step 10: Extract Navigation Styles

Capture navigation-specific styles.

```typescript
const navStyles = await page.evaluate(() => {
  const nav = document.querySelector('nav, .nav, [role="navigation"], header nav');
  if (!nav) return null;
  
  const styles = window.getComputedStyle(nav);
  const linkStyles = window.getComputedStyle(nav.querySelector('a') || nav);
  
  return {
    backgroundColor: styles.backgroundColor,
    color: styles.color,
    padding: styles.padding,
    borderBottom: styles.borderBottom,
    linkColor: linkStyles.color,
    linkFontSize: linkStyles.fontSize,
    linkFontWeight: linkStyles.fontWeight,
    linkTextTransform: linkStyles.textTransform,
    linkLetterSpacing: linkStyles.letterSpacing,
  };
});
```

---

## Data Processing and Normalization

### Color Conversion

Convert all colors to consistent format (hex or RGB).

```typescript
function normalizeColor(color: string): string {
  // Convert rgb/rgba to hex
  if (color.startsWith('rgb')) {
    const match = color.match(/\d+/g);
    if (match) {
      const [r, g, b] = match.map(Number);
      return `#${[r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')}`;
    }
  }
  // Already hex or named color
  return color;
}
```

### Font Family Normalization

Extract primary font family (remove fallbacks).

```typescript
function extractPrimaryFont(fontFamily: string): string {
  // "Inter, sans-serif" → "Inter"
  return fontFamily.split(',')[0].trim().replace(/['"]/g, '');
}
```

### Spacing Normalization

Convert all spacing to rem (for Tailwind compatibility).

```typescript
function normalizeSpacing(value: string): number {
  // "16px" → 1 (assuming 16px base)
  // "1rem" → 1
  const match = value.match(/(\d+(?:\.\d+)?)(px|rem|em)/);
  if (!match) return 0;
  const num = parseFloat(match[1]);
  const unit = match[2];
  if (unit === 'px') return num / 16; // Convert to rem
  return num;
}
```

---

## Output Structure

### brand-tokens.json

```json
{
  "colors": {
    "primary": "#1a1a1a",
    "secondary": "#4a4a4a",
    "accent": "#8b5cf6",
    "background": "#ffffff",
    "foreground": "#1a1a1a",
    "muted": "#f5f5f5",
    "mutedForeground": "#737373",
    "border": "#e5e5e5",
    "input": "#ffffff",
    "ring": "#8b5cf6",
    "allFrequent": ["#ffffff", "#1a1a1a", "#8b5cf6", ...]
  },
  "typography": {
    "fontFamily": {
      "sans": ["Inter", "sans-serif"],
      "serif": ["Playfair Display", "serif"],
      "mono": ["Fira Code", "monospace"]
    },
    "fontSize": {
      "xs": "0.75rem",
      "sm": "0.875rem",
      "base": "1rem",
      "lg": "1.125rem",
      "xl": "1.25rem",
      "2xl": "1.5rem",
      "3xl": "1.875rem",
      "4xl": "2.25rem"
    },
    "fontWeight": {
      "normal": "400",
      "medium": "500",
      "semibold": "600",
      "bold": "700"
    },
    "lineHeight": {
      "tight": "1.25",
      "normal": "1.5",
      "relaxed": "1.75"
    },
    "headings": {
      "h1": {
        "fontFamily": "Playfair Display",
        "fontSize": "2.25rem",
        "fontWeight": "700",
        "lineHeight": "1.25"
      },
      "h2": {
        "fontFamily": "Playfair Display",
        "fontSize": "1.875rem",
        "fontWeight": "600",
        "lineHeight": "1.3"
      }
    },
    "body": {
      "fontFamily": "Inter",
      "fontSize": "1rem",
      "fontWeight": "400",
      "lineHeight": "1.5"
    },
    "nav": {
      "fontFamily": "Inter",
      "fontSize": "0.875rem",
      "fontWeight": "500",
      "textTransform": "uppercase",
      "letterSpacing": "0.05em"
    },
    "button": {
      "fontFamily": "Inter",
      "fontSize": "0.875rem",
      "fontWeight": "600",
      "textTransform": "none"
    }
  },
  "spacing": {
    "scale": [0, 0.25, 0.5, 0.75, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10, 12, 16]
  },
  "borderRadius": {
    "none": "0",
    "sm": "0.125rem",
    "base": "0.25rem",
    "md": "0.375rem",
    "lg": "0.5rem",
    "xl": "0.75rem",
    "2xl": "1rem",
    "full": "9999px"
  },
  "shadows": {
    "sm": "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    "base": "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
    "md": "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
    "lg": "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
    "xl": "0 20px 25px -5px rgba(0, 0, 0, 0.1)"
  },
  "buttons": {
    "borderRadius": "0.375rem",
    "padding": {
      "x": "1rem",
      "y": "0.5rem"
    },
    "fontWeight": "600",
    "primary": {
      "backgroundColor": "#1a1a1a",
      "color": "#ffffff"
    },
    "secondary": {
      "backgroundColor": "transparent",
      "color": "#1a1a1a",
      "border": "1px solid #e5e5e5"
    }
  },
  "cards": {
    "borderRadius": "0.5rem",
    "backgroundColor": "#ffffff",
    "border": "1px solid #e5e5e5",
    "boxShadow": "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
    "padding": "1.5rem"
  },
  "navigation": {
    "backgroundColor": "#ffffff",
    "borderBottom": "1px solid #e5e5e5",
    "linkColor": "#1a1a1a",
    "linkFontSize": "0.875rem",
    "linkFontWeight": "500",
    "linkTextTransform": "uppercase",
    "linkLetterSpacing": "0.05em"
  },
  "cssVariables": {
    "--color-primary": "#1a1a1a",
    "--color-secondary": "#4a4a4a",
    ...
  }
}
```

### brand-tokens.ts

```typescript
export const brandTokens = {
  colors: {
    primary: "#1a1a1a",
    secondary: "#4a4a4a",
    accent: "#8b5cf6",
    // ... rest of colors
  },
  typography: {
    fontFamily: {
      sans: ["Inter", "sans-serif"],
      // ... rest of fonts
    },
    // ... rest of typography
  },
  // ... rest of tokens
} as const;

export type BrandTokens = typeof brandTokens;
```

---

## Dark Mode Strategy

### Extraction from Live Site

1. **Check for dark mode toggle:** Look for theme switcher or dark mode class
2. **Extract dark mode styles:** If dark mode exists, capture its color palette
3. **If no dark mode exists:** Create dark mode variant based on light mode with tasteful purple accents

### Dark Mode Generation Rules

1. **Background:** Invert light background (white → dark gray/black)
2. **Foreground:** Invert light foreground (dark → light)
3. **Accent Colors:** If Vici site has accent colors, preserve them. If not, introduce purple accents (#8b5cf6, #7c3aed) inspired by reference dashboard, but only if they harmonize with extracted palette
4. **Borders:** Lighten borders for visibility on dark backgrounds
5. **Shadows:** Adjust shadows for dark mode (lighter, more subtle)

### Dark Mode Token Structure

```json
{
  "colors": {
    "dark": {
      "primary": "#f5f5f5",
      "secondary": "#a3a3a3",
      "accent": "#8b5cf6",
      "background": "#0a0a0a",
      "foreground": "#f5f5f5",
      "muted": "#1a1a1a",
      "mutedForeground": "#737373",
      "border": "#262626",
      "input": "#1a1a1a",
      "ring": "#8b5cf6"
    }
  }
}
```

---

## Integration with Tailwind/shadcn

### Tailwind Config Integration

```typescript
// tailwind.config.ts
import { brandTokens } from './theme/brand-tokens';

export default {
  theme: {
    extend: {
      colors: brandTokens.colors,
      fontFamily: brandTokens.typography.fontFamily,
      fontSize: brandTokens.typography.fontSize,
      fontWeight: brandTokens.typography.fontWeight,
      lineHeight: brandTokens.typography.lineHeight,
      spacing: brandTokens.spacing.scale,
      borderRadius: brandTokens.borderRadius,
      boxShadow: brandTokens.shadows,
    },
  },
};
```

### shadcn/ui Integration

```typescript
// components.json or globals.css
:root {
  --background: ${brandTokens.colors.background};
  --foreground: ${brandTokens.colors.foreground};
  --primary: ${brandTokens.colors.primary};
  --primary-foreground: ${brandTokens.colors.foreground};
  --secondary: ${brandTokens.colors.secondary};
  --accent: ${brandTokens.colors.accent};
  --border: ${brandTokens.colors.border};
  --radius: ${brandTokens.borderRadius.md};
}
```

---

## Execution Script

### extract-brand-tokens.ts

```typescript
import { chromium } from 'playwright';
import { writeFile } from 'fs/promises';
import { join } from 'path';

async function extractBrandTokens() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    await page.goto('https://vicipeptides.com/', { waitUntil: 'networkidle' });
    
    // Execute all extraction steps
    const tokens = {
      colors: await extractColors(page),
      typography: await extractTypography(page),
      spacing: await extractSpacing(page),
      borderRadius: await extractBorderRadius(page),
      shadows: await extractShadows(page),
      buttons: await extractButtonStyles(page),
      cards: await extractCardStyles(page),
      navigation: await extractNavStyles(page),
      cssVariables: await extractCSSVariables(page),
    };
    
    // Normalize and process tokens
    const normalized = normalizeTokens(tokens);
    
    // Write JSON
    await writeFile(
      join(process.cwd(), 'theme', 'brand-tokens.json'),
      JSON.stringify(normalized, null, 2)
    );
    
    // Write TypeScript
    await writeFile(
      join(process.cwd(), 'theme', 'brand-tokens.ts'),
      generateTypeScript(normalized)
    );
    
    console.log('✅ Brand tokens extracted successfully');
  } finally {
    await browser.close();
  }
}

extractBrandTokens();
```

---

## Validation and Manual Review

After extraction:

1. **Visual Comparison:** Compare extracted colors with live site screenshots
2. **Font Verification:** Check if extracted fonts match live site (use browser DevTools)
3. **Spacing Verification:** Measure spacing on live site and compare with extracted values
4. **Dark Mode Preview:** Generate dark mode preview and verify harmony with Vici palette
5. **Document Assumptions:** If any values are missing or ambiguous, document assumptions in tokens file

---

## Assumptions and Fallbacks

1. **If no serif font found:** Use system serif fallback (Georgia, serif)
2. **If no accent color found:** Use extracted primary color with slight variation
3. **If spacing values inconsistent:** Use Tailwind default scale (0, 0.25, 0.5, 0.75, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10, 12, 16)
4. **If border radius inconsistent:** Use Tailwind default (0, 0.125, 0.25, 0.375, 0.5, 0.75, 1, 9999)
5. **If dark mode not found:** Generate dark mode from light mode using inversion rules

---

## Phase 4 Implementation Notes

This extraction will be executed in Phase 4 when scaffolding the Next.js UI. The extracted tokens will be:
1. Stored in `/theme/brand-tokens.json` and `/theme/brand-tokens.ts`
2. Integrated into Tailwind config
3. Applied to shadcn/ui components
4. Used to create both light and dark mode variants
5. Documented with source URLs and extraction timestamps
