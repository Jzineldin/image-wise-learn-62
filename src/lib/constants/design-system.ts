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
// Refined hierarchy with consistent font weights, line heights, and letter spacing
// Version 2.0 - January 2025
// ============================================================================

export const TYPOGRAPHY = {
  // Display text (hero sections)
  display: 'text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-heading font-bold leading-tight tracking-tight',

  // Headings - Consistent hierarchy with responsive sizing
  h1: 'text-4xl sm:text-5xl font-heading font-bold leading-tight tracking-tight',
  h2: 'text-3xl sm:text-4xl font-heading font-bold leading-tight tracking-tight',
  h3: 'text-2xl sm:text-3xl font-heading font-semibold leading-tight',
  h4: 'text-xl sm:text-2xl font-heading font-semibold leading-tight',
  h5: 'text-lg font-heading font-medium leading-tight',
  h6: 'text-base font-heading font-medium leading-tight',

  // Body text - Optimized for readability
  lead: 'text-lg sm:text-xl md:text-2xl text-text-secondary leading-relaxed',
  bodyLarge: 'text-lg leading-relaxed',
  body: 'text-base leading-normal',
  bodySmall: 'text-sm leading-normal',
  tiny: 'text-xs leading-normal',

  // UI Elements
  label: 'text-sm font-medium leading-none',
  button: 'text-sm font-medium leading-none',
  stat: 'text-3xl font-bold leading-none',
  caption: 'text-xs text-muted-foreground leading-normal',

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
// ANIMATION SYSTEM
// Comprehensive animation utilities - Phase 3 Task 6
// ============================================================================

export const ANIMATION = {
  // Durations
  duration: {
    fast: 'duration-150',
    normal: 'duration-300',
    slow: 'duration-500',
  },

  // Entrance animations
  entrance: {
    fadeIn: 'animate-fade-in',
    fadeInUp: 'animate-fade-in-up',
    slideUp: 'animate-slide-up',
    slideDown: 'animate-slide-down',
    slideLeft: 'animate-slide-left',
    slideRight: 'animate-slide-right',
    scaleIn: 'animate-scale-in',
  },

  // Exit animations
  exit: {
    fadeOut: 'animate-fade-out',
    scaleOut: 'animate-scale-out',
    slideOutDown: 'animate-slide-out-down',
  },

  // Utility animations
  utility: {
    float: 'animate-float',
    pulseGlow: 'animate-pulse-glow',
    spin: 'animate-spin',
    pulse: 'animate-pulse',
  },

  // Micro-interactions
  interaction: {
    btnPress: 'btn-press',
    iconBounce: 'icon-bounce',
    hoverLift: 'hover-lift',
    hoverScale: 'hover-scale',
    shakeError: 'shake-error',
  },

  // Stagger
  stagger: 'stagger-children',
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

