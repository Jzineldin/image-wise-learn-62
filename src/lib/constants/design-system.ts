/**
 * Tale Forge Design System Constants
 * Centralized design tokens for consistent UI/UX
 * 
 * @version 1.0.0
 * @date January 2025
 */

// ============================================================================
// SPACING SYSTEM
// Based on 4px (0.25rem) increments for consistency
// ============================================================================

export const SPACING = {
  // Page-level spacing
  page: {
    container: 'container mx-auto px-4 md:px-6 lg:px-8',
    section: 'py-12 md:py-16 lg:py-20',
    sectionSmall: 'py-8 md:py-10 lg:py-12',
    sectionTiny: 'py-6 md:py-8',
  },
  
  // Card spacing
  card: {
    padding: 'p-6',
    paddingCompact: 'p-4',
    paddingSpacious: 'p-8',
    gap: 'gap-6',
  },
  
  // Grid layouts
  grid: {
    cols1: 'grid grid-cols-1 gap-6',
    cols2: 'grid grid-cols-1 md:grid-cols-2 gap-6',
    cols3: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
    cols4: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6',
  },
  
  // Stack spacing (vertical)
  stack: {
    tight: 'space-y-2',
    normal: 'space-y-4',
    relaxed: 'space-y-6',
    loose: 'space-y-8',
  },
  
  // Inline spacing (horizontal)
  inline: {
    tight: 'space-x-2',
    normal: 'space-x-4',
    relaxed: 'space-x-6',
  },
} as const;

// ============================================================================
// TYPOGRAPHY SYSTEM
// Consistent text sizing with responsive scaling
// ============================================================================

export const TYPOGRAPHY = {
  // Display text (hero sections)
  display: 'text-5xl md:text-6xl font-heading font-bold leading-tight',
  
  // Headings
  h1: 'text-4xl md:text-5xl font-heading font-bold',
  h2: 'text-3xl md:text-4xl font-heading font-semibold',
  h3: 'text-2xl md:text-3xl font-heading font-semibold',
  h4: 'text-xl md:text-2xl font-heading font-medium',
  h5: 'text-lg md:text-xl font-heading font-medium',
  
  // Body text
  lead: 'text-xl md:text-2xl text-text-secondary',
  body: 'text-base leading-relaxed',
  bodyLarge: 'text-lg leading-relaxed',
  small: 'text-sm',
  tiny: 'text-xs',
  
  // Special text
  gradient: 'text-gradient',
  muted: 'text-muted-foreground',
} as const;

// ============================================================================
// BORDER RADIUS SYSTEM
// Simplified to 3 core values for consistency
// ============================================================================

export const RADIUS = {
  sm: 'rounded-md',      // 0.375rem - Small elements (badges, tags)
  default: 'rounded-lg', // 0.5rem - Standard (buttons, inputs, cards)
  large: 'rounded-xl',   // 0.75rem - Large containers (modals, hero cards)
  full: 'rounded-full',  // Pills, avatars, circular elements
} as const;

// ============================================================================
// GLASS CARD VARIANTS
// Simplified from 13 variants to 4 core variants
// ============================================================================

export const GLASS_CARD = {
  base: 'glass-card',
  elevated: 'glass-card-elevated',
  interactive: 'glass-card-interactive',
  subtle: 'glass-card-subtle',
} as const;

// ============================================================================
// BUTTON SIZES
// Consistent button sizing across the application
// ============================================================================

export const BUTTON_SIZE = {
  sm: 'h-9 px-3 text-sm',
  default: 'h-10 px-4 py-2',
  lg: 'h-11 px-8 text-lg',
  icon: 'h-10 w-10',
} as const;

// ============================================================================
// ANIMATION DURATIONS
// Consistent animation timing
// ============================================================================

export const ANIMATION = {
  fast: 'duration-150',
  normal: 'duration-300',
  slow: 'duration-500',
} as const;

// ============================================================================
// HELPER FUNCTIONS
// Utility functions for combining design system classes
// ============================================================================

/**
 * Combine design system classes with custom classes
 * Filters out falsy values for conditional styling
 * 
 * @example
 * designClass(SPACING.page.container, isActive && 'bg-primary')
 */
export function designClass(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Get responsive container class
 * 
 * @example
 * <div className={container()}>...</div>
 */
export function container(): string {
  return SPACING.page.container;
}

/**
 * Get responsive section spacing
 * 
 * @param size - Section size variant
 * @example
 * <section className={section('small')}>...</section>
 */
export function section(size: 'default' | 'small' | 'tiny' = 'default'): string {
  switch (size) {
    case 'small':
      return SPACING.page.sectionSmall;
    case 'tiny':
      return SPACING.page.sectionTiny;
    default:
      return SPACING.page.section;
  }
}

/**
 * Get grid layout class
 * 
 * @param cols - Number of columns
 * @example
 * <div className={grid(3)}>...</div>
 */
export function grid(cols: 1 | 2 | 3 | 4): string {
  switch (cols) {
    case 1:
      return SPACING.grid.cols1;
    case 2:
      return SPACING.grid.cols2;
    case 3:
      return SPACING.grid.cols3;
    case 4:
      return SPACING.grid.cols4;
    default:
      return SPACING.grid.cols3;
  }
}

/**
 * Get stack spacing class
 * 
 * @param spacing - Spacing variant
 * @example
 * <div className={stack('relaxed')}>...</div>
 */
export function stack(spacing: 'tight' | 'normal' | 'relaxed' | 'loose' = 'normal'): string {
  return SPACING.stack[spacing];
}

// ============================================================================
// TYPE EXPORTS
// TypeScript types for design system constants
// ============================================================================

export type SpacingKey = keyof typeof SPACING;
export type TypographyKey = keyof typeof TYPOGRAPHY;
export type RadiusKey = keyof typeof RADIUS;
export type GlassCardKey = keyof typeof GLASS_CARD;
export type ButtonSizeKey = keyof typeof BUTTON_SIZE;
export type AnimationKey = keyof typeof ANIMATION;

// ============================================================================
// USAGE EXAMPLES (for documentation)
// ============================================================================

/*
// Example 1: Page layout with consistent spacing
import { SPACING, TYPOGRAPHY } from '@/lib/constants/design-system';

<div className={SPACING.page.container}>
  <div className={SPACING.page.sectionSmall}>
    <h1 className={TYPOGRAPHY.h1}>Welcome</h1>
    <div className={SPACING.grid.cols3}>
      {items.map(item => <Card key={item.id} />)}
    </div>
  </div>
</div>

// Example 2: Using helper functions
import { container, section, grid, stack } from '@/lib/constants/design-system';

<div className={container()}>
  <section className={section('small')}>
    <div className={grid(3)}>
      <div className={stack('relaxed')}>
        {/* Content *\/}
      </div>
    </div>
  </section>
</div>

// Example 3: Conditional styling with designClass
import { designClass, SPACING } from '@/lib/constants/design-system';

<div className={designClass(
  SPACING.page.container,
  isActive && 'bg-primary',
  hasError && 'border-destructive'
)}>
  {/* Content *\/}
</div>
*/

