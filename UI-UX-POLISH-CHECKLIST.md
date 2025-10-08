# Tale Forge - UI/UX Polish Checklist

**Date:** January 2025  
**Purpose:** Track progress on UI/UX improvements  
**Related:** UI-UX-POLISH-AUDIT-2025.md, UI-UX-IMPLEMENTATION-GUIDE.md

---

## 🔴 PHASE 1: CRITICAL FIXES (Week 1)

### Day 1-2: Spacing System (8 hours)
- [ ] Create `src/lib/constants/design-system.ts`
- [ ] Define SPACING constants
- [ ] Update Index.tsx to use new spacing
- [ ] Update Dashboard.tsx to use new spacing
- [ ] Update Create.tsx to use new spacing
- [ ] Update StoryViewer.tsx to use new spacing
- [ ] Update Settings.tsx to use new spacing
- [ ] Update Characters.tsx to use new spacing
- [ ] Update Discover.tsx to use new spacing
- [ ] Update Auth pages to use new spacing
- [ ] Update all remaining pages
- [ ] Test responsive spacing on mobile
- [ ] Test responsive spacing on tablet
- [ ] Test responsive spacing on desktop
- [ ] Document spacing system

**Acceptance Criteria:**
- All pages use consistent spacing from design system
- No hardcoded spacing values in components
- Responsive spacing works across all breakpoints

---

### Day 2-3: Border Radius (6 hours)
- [ ] Update RADIUS constants in design-system.ts
- [ ] Update Button component to use rounded-lg
- [ ] Update Input component to use rounded-lg
- [ ] Update Card component to use rounded-lg
- [ ] Update glass-card classes in index.css
- [ ] Update all custom border-radius in components
- [ ] Remove rounded-md from buttons
- [ ] Remove rounded-2xl except for large containers
- [ ] Test visual consistency across all pages
- [ ] Verify no visual regressions

**Acceptance Criteria:**
- Only 3 radius values used: rounded-md, rounded-lg, rounded-xl
- All buttons use rounded-lg
- All cards use rounded-lg
- Large containers use rounded-xl

---

### Day 3-4: Loading Spinners (4 hours)
- [ ] Create consolidated `src/components/ui/loading.tsx`
- [ ] Export unified Loading object
- [ ] Replace LoadingSpinner imports
- [ ] Replace InlineLoader imports
- [ ] Replace custom spinner implementations
- [ ] Remove duplicate loading components
- [ ] Update Create.tsx loading states
- [ ] Update StoryViewer.tsx loading states
- [ ] Update Dashboard.tsx loading states
- [ ] Test all loading states
- [ ] Verify animations work correctly

**Acceptance Criteria:**
- Single loading system used throughout app
- All loading states use Loading.Spinner or Loading.Inline
- No custom spinner implementations remain
- Consistent loading UX across all pages

---

### Day 4-5: Button Variants (6 hours)
- [ ] Update Button component with new variants
- [ ] Remove .btn-primary CSS class
- [ ] Remove .btn-secondary CSS class
- [ ] Remove .btn-accent CSS class
- [ ] Remove .btn-ghost CSS class
- [ ] Remove .btn-icon CSS class
- [ ] Update all buttons in Index.tsx
- [ ] Update all buttons in Dashboard.tsx
- [ ] Update all buttons in Create.tsx
- [ ] Update all buttons in StoryViewer.tsx
- [ ] Update all buttons in Settings.tsx
- [ ] Update all buttons in Navigation.tsx
- [ ] Update all buttons in remaining components
- [ ] Create button usage guidelines
- [ ] Test button variants on all pages
- [ ] Verify hover states work correctly

**Acceptance Criteria:**
- All buttons use standard variants (default, outline, ghost, destructive)
- No custom button CSS classes remain
- Consistent button styling across all pages
- Clear visual hierarchy with button variants

---

### Day 5-6: Typography (4 hours)
- [ ] Define TYPOGRAPHY constants in design-system.ts
- [ ] Update all h1 headings to use TYPOGRAPHY.h1
- [ ] Update all h2 headings to use TYPOGRAPHY.h2
- [ ] Update all h3 headings to use TYPOGRAPHY.h3
- [ ] Update all h4 headings to use TYPOGRAPHY.h4
- [ ] Update lead text to use TYPOGRAPHY.lead
- [ ] Update body text to use TYPOGRAPHY.body
- [ ] Ensure responsive typography works
- [ ] Test typography on mobile
- [ ] Test typography on tablet
- [ ] Test typography on desktop
- [ ] Document typography system

**Acceptance Criteria:**
- Consistent heading sizes across all pages
- Clear visual hierarchy with typography
- Responsive typography works on all devices
- No random text size variations

---

### Day 6-7: Glass Cards (5 hours)
- [ ] Update glass card CSS in index.css
- [ ] Remove .glass-card-dark
- [ ] Remove .glass-card-light
- [ ] Remove .glass-card-primary (convert to border color)
- [ ] Remove .glass-card-secondary (convert to border color)
- [ ] Remove .glass-card-accent (convert to border color)
- [ ] Remove .glass-card-success (convert to border color)
- [ ] Remove .glass-card-info (convert to border color)
- [ ] Remove .glass-card-surface
- [ ] Remove .glass-card-form
- [ ] Remove .glass-card-auth
- [ ] Keep only 4 variants: base, elevated, interactive, subtle
- [ ] Update all glass card usages in Dashboard.tsx
- [ ] Update all glass card usages in Create.tsx
- [ ] Update all glass card usages in Settings.tsx
- [ ] Update all glass card usages in remaining pages
- [ ] Test visual consistency
- [ ] Verify glass effects work correctly

**Acceptance Criteria:**
- Only 4 glass card variants remain
- Color variants use border colors instead
- Consistent glass effect across all pages
- No visual regressions

---

### Day 7-8: Form Inputs (4 hours)
- [ ] Update Input component with consistent styling
- [ ] Remove .input-field CSS class
- [ ] Update all custom input implementations
- [ ] Ensure consistent focus states
- [ ] Update Textarea component
- [ ] Update Select component
- [ ] Test form inputs on Auth pages
- [ ] Test form inputs on Settings page
- [ ] Test form inputs on Create page
- [ ] Verify keyboard navigation works
- [ ] Test focus states

**Acceptance Criteria:**
- All inputs use standard Input component
- Consistent focus states across all forms
- No custom input implementations remain
- Keyboard navigation works correctly

---

### Day 8-9: Accessibility (8 hours)
- [ ] Audit all icon buttons for aria-label
- [ ] Add aria-label to Settings icon buttons
- [ ] Add aria-label to Navigation icon buttons
- [ ] Add aria-label to StoryViewer icon buttons
- [ ] Add alt text to all images
- [ ] Add alt text to logo images
- [ ] Add alt text to story images
- [ ] Add alt text to character images
- [ ] Associate labels with form inputs
- [ ] Add proper ARIA to dialogs
- [ ] Add proper ARIA to modals
- [ ] Add proper ARIA to tooltips
- [ ] Test with NVDA screen reader
- [ ] Test with JAWS screen reader (if available)
- [ ] Test keyboard navigation on all pages
- [ ] Run axe DevTools audit
- [ ] Fix all critical accessibility issues
- [ ] Fix all serious accessibility issues
- [ ] Document accessibility improvements

**Acceptance Criteria:**
- All icon buttons have aria-label
- All images have alt text
- All form inputs have associated labels
- All dialogs have proper ARIA
- Screen reader can navigate entire app
- Keyboard navigation works on all pages
- axe DevTools shows no critical/serious issues

---

## 🟠 PHASE 2: HIGH PRIORITY (Week 2)

### Card Padding Standardization (2-3 hours)
- [ ] Audit all CardContent padding
- [ ] Standardize to p-6 (default)
- [ ] Use p-4 for compact layouts
- [ ] Use p-8 for spacious layouts
- [ ] Update all card usages
- [ ] Test visual consistency

---

### Navigation Consistency (4-5 hours)
- [ ] Create shared navigation styles
- [ ] Update desktop menu styling
- [ ] Update mobile menu styling
- [ ] Ensure consistent hover states
- [ ] Test navigation on mobile
- [ ] Test navigation on desktop
- [ ] Verify accessibility

---

### Error Message Styling (2-3 hours)
- [ ] Audit all error messages
- [ ] Create consistent error component
- [ ] Update all error displays
- [ ] Test error states

---

### Modal/Dialog Consistency (3-4 hours)
- [ ] Audit all modals and dialogs
- [ ] Standardize modal styling
- [ ] Ensure consistent padding
- [ ] Test modal animations
- [ ] Verify accessibility

---

## 🟡 PHASE 3: MEDIUM PRIORITY (Week 3)

### Grid Gap Standardization (2-3 hours)
- [ ] Audit all grid gaps
- [ ] Standardize to gap-6
- [ ] Update all grid layouts
- [ ] Test responsive grids

---

### Badge Variant Consistency (2 hours)
- [ ] Audit all badge usages
- [ ] Standardize badge variants
- [ ] Update all badges
- [ ] Test visual consistency

---

### Hover State Consistency (3-4 hours)
- [ ] Audit all hover states
- [ ] Standardize hover effects
- [ ] Update all interactive elements
- [ ] Test hover states

---

### Animation Timing (2-3 hours)
- [ ] Audit all animations
- [ ] Standardize animation durations
- [ ] Update all transitions
- [ ] Test animations

---

## 📊 PROGRESS TRACKING

### Overall Progress
- [ ] Phase 1: Critical Fixes (0/8 complete)
- [ ] Phase 2: High Priority (0/4 complete)
- [ ] Phase 3: Medium Priority (0/4 complete)

### Time Tracking
- **Estimated Total:** 36-52 hours
- **Actual Time Spent:** ___ hours
- **Remaining:** ___ hours

### Blockers
- None currently

### Notes
- Add any notes or observations here
- Document any deviations from the plan
- Track any additional issues discovered

---

## ✅ DEFINITION OF DONE

A task is considered complete when:
1. Code changes are implemented
2. Visual consistency is verified
3. Responsive design is tested (mobile, tablet, desktop)
4. Accessibility is verified
5. No console errors
6. No visual regressions
7. Changes are documented
8. Code is reviewed (if applicable)

---

## 🎯 SUCCESS METRICS

### Before
- 13 glass card variants
- 6+ button styling methods
- 20+ spacing variations
- 3 loading spinner implementations
- Missing accessibility labels

### After
- 4 glass card variants ✓
- 1 button system with 6 variants ✓
- Consistent spacing system ✓
- 1 unified loading system ✓
- 100% accessibility compliance ✓

---

## 📝 DAILY STANDUP TEMPLATE

**Date:** ___________

**Yesterday:**
- Completed: ___________
- Blockers: ___________

**Today:**
- Plan to complete: ___________
- Estimated time: ___________

**Blockers:**
- None / List blockers

---

**Last Updated:** January 2025  
**Next Review:** After Phase 1 completion

