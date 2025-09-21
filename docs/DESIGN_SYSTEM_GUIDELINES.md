# Tale Forge Design System Updates (September 2025)

## Typography
- `--font-sans` (`Inter`, system fallbacks) now powers the base `font-sans` utility. Use it for body copy and UI text.
- `--font-heading` (`Cinzel`, serif fallbacks) is mapped to `font-heading` and applied to all headings; keep hero titles on this stack for brand consistency.
- Global line heights are exposed as `--body-line-height` (1.6) and `--heading-line-height` (1.25). Respect them when crafting custom components to maintain rhythm.

## Color Tokens & Themes
- Theme colors remain defined in `src/lib/utils/theme.ts`; the new typography block in `src/index.css` ensures all variants share the same font tokens.
- The body overlay gradient now references `hsl(var(--background))`, so switching between Midnight, Twilight, and Dawn automatically adjusts the backdrop.
- When authoring custom styles, prefer the semantic classes Tailwind exposes (e.g. `text-primary-foreground`, `bg-surface`) over hard-coded hex values.

## Buttons
- `btn-primary` now inherits `text-primary-foreground`; avoid adding manual text colors on top of it.
- `btn-secondary` and `btn-accent` expose color overrides via `hsl(var(--text-primary))` / `hsl(var(--accent-foreground))`. Only adjust padding/radius when creating variants.
- For icon-only buttons use `btn-icon`—it now keys into `text-text-secondary` and `primary` hover states for better accessibility.

## Form Inputs
- `.input-field` background and borders reference `--surface-overlay` and `--muted-foreground`; the Dawn/Twilight overrides still apply, so new form components should extend these utilities.
- Placeholder color is driven by `--text-tertiary`. Keep helper text and hint elements in the same tonal range for consistency.

## Implementation Pointers
- Tailwind configuration (`tailwind.config.ts`) now reads the CSS font tokens; no component code changes are required to adopt these tweaks.
- For surface cards or callouts, continue using the `glass-card*` helpers; they inherit the new theme-aware text colors automatically.
- If you need additional typography scales or semantic colors, add them through custom properties inside the existing theme configs to stay aligned with the system.
