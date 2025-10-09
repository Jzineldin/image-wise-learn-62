# Tale Forge Design System Guide

**Version:** 2.0  
**Last Updated:** January 2025  
**Status:** Production Ready

---

## 📚 TABLE OF CONTENTS

1. [Introduction](#introduction)
2. [Glass Card System](#glass-card-system)
3. [Typography System](#typography-system)
4. [Animation System](#animation-system)
5. [Spacing System](#spacing-system)
6. [Color System](#color-system)
7. [Accessibility Guidelines](#accessibility-guidelines)
8. [Best Practices](#best-practices)

---

## 🎯 INTRODUCTION

The Tale Forge Design System provides a comprehensive set of reusable components, utilities, and guidelines to ensure consistency, accessibility, and maintainability across the application.

### Key Principles:
- **Consistency**: Unified visual language
- **Accessibility**: WCAG 2.1 AA compliant
- **Performance**: 60fps animations, optimized rendering
- **Maintainability**: Type-safe constants, centralized definitions

---

## 🪟 GLASS CARD SYSTEM

### Overview
4 core glass card variants for different use cases.

### Variants

#### 1. Base Glass Card (Default)
```tsx
<div className="glass-card">
  {/* Content */}
</div>
```
**Use for:** Standard cards, content containers  
**Properties:** Default backdrop blur, primary/20 border

#### 2. Elevated Glass Card
```tsx
<div className="glass-card-elevated">
  {/* Content */}
</div>
```
**Use for:** Modals, dialogs, important content  
**Properties:** Stronger backdrop blur, primary/30 border, shadow-2xl

#### 3. Interactive Glass Card
```tsx
<div className="glass-card-interactive">
  {/* Content */}
</div>
```
**Use for:** Clickable cards, links, buttons  
**Properties:** Hover effects, cursor pointer, hover-scale

#### 4. Subtle Glass Card
```tsx
<div className="glass-card-subtle">
  {/* Content */}
</div>
```
**Use for:** Background elements, less prominent content  
**Properties:** Light background, white/10 border

### Semantic Border Colors
```tsx
<div className="glass-card border-primary/30">   {/* Primary accent */}
<div className="glass-card border-info/30">      {/* Information */}
<div className="glass-card border-success/30">   {/* Success states */}
<div className="glass-card border-secondary/30"> {/* Secondary accent */}
```

---

## 📝 TYPOGRAPHY SYSTEM

### Importing
```tsx
import { TYPOGRAPHY } from '@/lib/constants/design-system';
```

### Headings

#### Display (Hero Sections)
```tsx
<h1 className={TYPOGRAPHY.display}>
  TALE FORGE
</h1>
```
**Size:** text-5xl → text-6xl → text-7xl → text-8xl  
**Weight:** font-bold (700)  
**Line Height:** leading-tight (1.25)  
**Letter Spacing:** tracking-tight (-0.025em)

#### H1 (Page Titles)
```tsx
<h1 className={TYPOGRAPHY.h1}>
  Welcome Back, Storyteller!
</h1>
```
**Size:** text-4xl → text-5xl  
**Weight:** font-bold (700)

#### H2 (Section Headings)
```tsx
<h2 className={TYPOGRAPHY.h2}>
  Magical Features
</h2>
```
**Size:** text-3xl → text-4xl  
**Weight:** font-bold (700)

#### H3 (Subsection Headings)
```tsx
<h3 className={TYPOGRAPHY.h3}>
  My Characters
</h3>
```
**Size:** text-2xl → text-3xl  
**Weight:** font-semibold (600)

#### H4 (Card Titles)
```tsx
<h4 className={TYPOGRAPHY.h4}>
  Story Title
</h4>
```
**Size:** text-xl → text-2xl  
**Weight:** font-semibold (600)

#### H5 & H6 (Small Headings)
```tsx
<h5 className={TYPOGRAPHY.h5}>Label</h5>
<h6 className={TYPOGRAPHY.h6}>Caption</h6>
```
**Weight:** font-medium (500)

### Body Text

#### Lead (Intro Text)
```tsx
<p className={TYPOGRAPHY.lead}>
  Where every story becomes an adventure
</p>
```
**Size:** text-lg → text-xl → text-2xl  
**Line Height:** leading-relaxed (1.625)

#### Body Large
```tsx
<p className={TYPOGRAPHY.bodyLarge}>
  Large body text for emphasis
</p>
```
**Size:** text-lg  
**Line Height:** leading-relaxed (1.625)

#### Body Regular
```tsx
<p className={TYPOGRAPHY.body}>
  Standard body text
</p>
```
**Size:** text-base  
**Line Height:** leading-normal (1.5)

#### Body Small
```tsx
<p className={TYPOGRAPHY.bodySmall}>
  Small text for captions
</p>
```
**Size:** text-sm  
**Line Height:** leading-normal (1.5)

### UI Elements

#### Labels
```tsx
<label className={TYPOGRAPHY.label}>
  Email Address
</label>
```
**Size:** text-sm  
**Weight:** font-medium (500)  
**Line Height:** leading-none (1)

#### Buttons
```tsx
<button className={TYPOGRAPHY.button}>
  Create Story
</button>
```
**Size:** text-sm  
**Weight:** font-medium (500)

#### Stats/Numbers
```tsx
<span className={TYPOGRAPHY.stat}>
  42
</span>
```
**Size:** text-3xl  
**Weight:** font-bold (700)  
**Line Height:** leading-none (1)

---

## 🎬 ANIMATION SYSTEM

### Importing
```tsx
import { ANIMATION } from '@/lib/constants/design-system';
```

### Entrance Animations

#### Fade In Up (Recommended)
```tsx
<div className={ANIMATION.entrance.fadeInUp}>
  {/* Content fades in and slides up */}
</div>
```
**Duration:** 0.5s  
**Use for:** Cards, sections, content reveals

#### Slide Variants
```tsx
<div className={ANIMATION.entrance.slideUp}>    {/* From bottom */}
<div className={ANIMATION.entrance.slideDown}>  {/* From top */}
<div className={ANIMATION.entrance.slideLeft}>  {/* From right */}
<div className={ANIMATION.entrance.slideRight}> {/* From left */}
```
**Duration:** 0.4s  
**Use for:** Directional reveals, navigation

#### Scale In
```tsx
<div className={ANIMATION.entrance.scaleIn}>
  {/* Content scales up with fade */}
</div>
```
**Duration:** 0.3s  
**Use for:** Modals, dialogs, popups

### Exit Animations

```tsx
<div className={ANIMATION.exit.fadeOut}>      {/* Fade out */}
<div className={ANIMATION.exit.scaleOut}>     {/* Scale down + fade */}
<div className={ANIMATION.exit.slideOutDown}> {/* Slide down + fade */}
```
**Duration:** 0.3s  
**Use for:** Dismissing modals, toasts, notifications

### Stagger Animations

```tsx
<div className={ANIMATION.stagger}>
  <div>Item 1</div> {/* Appears at 0.05s */}
  <div>Item 2</div> {/* Appears at 0.1s */}
  <div>Item 3</div> {/* Appears at 0.15s */}
  {/* Up to 10 children */}
</div>
```
**Delay:** 50ms between items  
**Use for:** Lists, grids, sequential reveals

### Micro-interactions

#### Button Press
```tsx
<button className={ANIMATION.interaction.btnPress}>
  {/* Scales to 95% on active */}
</button>
```
**Use for:** All buttons (already applied globally)

#### Icon Bounce
```tsx
<Icon className={ANIMATION.interaction.iconBounce} />
```
**Use for:** Interactive icons

#### Hover Lift
```tsx
<div className={ANIMATION.interaction.hoverLift}>
  {/* Lifts up on hover with shadow */}
</div>
```
**Use for:** Cards, interactive elements

#### Shake Error
```tsx
<div className={ANIMATION.interaction.shakeError}>
  {/* Shakes horizontally */}
</div>
```
**Use for:** Error states, validation failures

### Utility Animations

```tsx
<div className={ANIMATION.utility.float}>      {/* Floating animation */}
<div className={ANIMATION.utility.pulseGlow}>  {/* Pulsing glow */}
<div className={ANIMATION.utility.spin}>       {/* Spinning (loading) */}
<div className={ANIMATION.utility.pulse}>      {/* Pulsing (skeleton) */}
```

---

## 📏 SPACING SYSTEM

### Importing
```tsx
import { SPACING } from '@/lib/constants/design-system';
```

### Page Layout
```tsx
<div className={SPACING.page.container}>
  {/* Container with responsive padding */}
</div>

<section className={SPACING.page.section}>
  {/* Section with vertical padding */}
</section>
```

### Card Spacing
```tsx
<Card className={SPACING.card.padding}>      {/* p-6 */}
<Card className={SPACING.card.paddingCompact}> {/* p-4 */}
<Card className={SPACING.card.paddingSpacious}> {/* p-8 */}
```

### Grid Layouts
```tsx
<div className={SPACING.grid.cols1}> {/* 1 column */}
<div className={SPACING.grid.cols2}> {/* 1 → 2 columns */}
<div className={SPACING.grid.cols3}> {/* 1 → 2 → 3 columns */}
<div className={SPACING.grid.cols4}> {/* 1 → 2 → 4 columns */}
```

### Stack Spacing (Vertical)
```tsx
<div className={SPACING.stack.tight}>    {/* space-y-2 */}
<div className={SPACING.stack.normal}>   {/* space-y-4 */}
<div className={SPACING.stack.relaxed}>  {/* space-y-6 */}
<div className={SPACING.stack.loose}>    {/* space-y-8 */}
```

---

## 🎨 COLOR SYSTEM

### Semantic Colors
```tsx
text-primary          // Amber (#FFA500)
text-secondary        // Gold (#FFD700)
text-success          // Green (#10B981)
text-warning          // Yellow (#F59E0B)
text-error            // Red (#EF4444)
text-info             // Blue (#3B82F6)
```

### Text Colors
```tsx
text-text-primary     // White (100%)
text-text-secondary   // White (85%)
text-text-tertiary    // White (70%)
text-muted-foreground // White (64%)
```

### Border Colors
```tsx
border-primary/30     // Amber with 30% opacity
border-info/30        // Blue with 30% opacity
border-success/30     // Green with 30% opacity
border-secondary/30   // Gold with 30% opacity
```

---

## ♿ ACCESSIBILITY GUIDELINES

### Focus Indicators
- **Automatically applied** to all focusable elements
- **3px outline** with primary color
- **3px offset** for visibility
- **Box shadow** on interactive elements

### Touch Targets
- **Minimum size:** 44x44px
- **Already compliant** across all buttons and interactive elements

### Screen Readers
- **Use semantic HTML:** `<h1>`, `<nav>`, `<main>`, `<button>`
- **Add ARIA labels** to icon buttons
- **Use `aria-live`** for dynamic content
- **Use `role="status"`** for loading states

### Reduced Motion
- **Automatically supported** via CSS media query
- **Respects user preferences** (`prefers-reduced-motion`)
- **Disables decorative animations** while maintaining functionality

---

## ✅ BEST PRACTICES

### DO:
- ✅ Use design system constants instead of hardcoded values
- ✅ Import from `@/lib/constants/design-system`
- ✅ Use semantic HTML elements
- ✅ Add ARIA labels to icon buttons
- ✅ Test with keyboard navigation
- ✅ Verify focus indicators are visible
- ✅ Use stagger animations for lists/grids
- ✅ Apply hover-lift to interactive cards

### DON'T:
- ❌ Hardcode colors, spacing, or animations
- ❌ Use `div` when semantic HTML exists
- ❌ Forget ARIA labels on icon buttons
- ❌ Create custom animations without checking existing ones
- ❌ Override focus indicators
- ❌ Use animations longer than 500ms
- ❌ Ignore reduced motion preferences

---

## 📚 EXAMPLES

### Complete Card Example
```tsx
import { TYPOGRAPHY, ANIMATION } from '@/lib/constants/design-system';

<div className="glass-card border-primary/30 hover-lift">
  <h3 className={TYPOGRAPHY.h3}>
    Card Title
  </h3>
  <p className={TYPOGRAPHY.body}>
    Card description text
  </p>
  <Button className={ANIMATION.interaction.btnPress}>
    Action
  </Button>
</div>
```

### Staggered Grid Example
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
  {items.map((item) => (
    <div key={item.id} className="glass-card hover-lift">
      {/* Card content */}
    </div>
  ))}
</div>
```

---

**Design System Version:** 2.0  
**Last Updated:** January 2025  
**Maintained by:** Tale Forge Team  
**Status:** ✅ Production Ready

