---
name: Maple Pod
description: A quiet, atmospheric MapleStory music player built around artwork, translucent surfaces, and restrained red interaction accents.
colors:
  action-primary: "rgb(219, 66, 66)"
  action-secondary: "rgb(255, 193, 95)"
  action-danger: "rgb(255, 82, 82)"
  text-primary: "rgb(17, 17, 17)"
  text-secondary: "rgb(77, 77, 77)"
  surface-canvas: "rgb(220, 220, 220)"
  surface-card: "rgba(254, 254, 254, 0.7)"
  surface-solid: "rgb(254, 254, 254)"
  slider-thumb: "rgb(254, 254, 254)"
  border-subtle: "rgba(102, 102, 102, 0.2)"
  state-hover-mask: "rgba(16, 15, 15, 0.4)"
  focus-ring: "rgb(219, 66, 66)"
typography:
  display:
    fontFamily: "Comfortaa, system-ui, sans-serif"
    fontSize: "32px"
    fontWeight: 700
    lineHeight: 1.25
  title:
    fontFamily: "Comfortaa, system-ui, sans-serif"
    fontSize: "24px"
    fontWeight: 300
    lineHeight: 1.25
  body:
    fontFamily: "system-ui, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.25
  label:
    fontFamily: "system-ui, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.25
rounded:
  control: "8px"
  surface: "16px"
  circle: "50%"
  pill: "9999px"
spacing:
  s1: "4px"
  s2: "8px"
  s3: "12px"
  s4: "16px"
  s6: "24px"
  s8: "32px"
components:
  button-primary:
    backgroundColor: "{colors.action-primary}"
    textColor: "{colors.surface-solid}"
    rounded: "{rounded.control}"
    padding: "8px 16px"
  icon-button:
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.circle}"
    size: "44px"
  card:
    backgroundColor: "{colors.surface-card}"
    rounded: "{rounded.surface}"
    padding: "16px"
  slider-hit-area:
    size: "44px"
---

# Design System: Maple Pod

## Overview

**Creative North Star: "Maple Memory Player"**

MapleStory scenery and music carry the nostalgia and atmosphere; Maple Pod itself stays modern, quiet, clear, and subordinate to the content. Artwork may fill the background, while translucent blurred surfaces provide enough structure for controls and text without turning the application into opaque chrome.

This document formalizes the incumbent visual identity rather than replacing it. Red remains the primary interaction accent, warm yellow stays secondary, and light/dark themes preserve the same hierarchy. Reusable `Ui*` primitives should own interaction and accessibility contracts when practical so feature code does not repeatedly reconstruct them.

**Key Characteristics:**
- artwork-led atmosphere with restrained UI decoration;
- translucent 16px-radius glass surfaces with subtle borders;
- one dominant red action/focus accent;
- system sans-serif interface copy with Comfortaa reserved for brand and selected headings;
- compact visual controls backed by larger touch targets;
- short, state-oriented motion with deliberate reduced-motion behavior.

## Colors

The palette uses a single restrained red action voice over neutral translucent surfaces; dark mode changes the neutral values but not semantic hierarchy.

### Primary
- **Maple Action Red** (`rgb(219, 66, 66)`; dark `rgb(227, 98, 98)`): primary actions, selected/toggled emphasis, active progress, and the baseline focus ring.

### Secondary
- **Warm Maple Gold** (`rgb(255, 193, 95)`): secondary/status emphasis such as offline state; it must not compete with the primary action hierarchy.
- **Danger Red** (`rgb(255, 82, 82)`): destructive and error emphasis only.

### Neutral
- **Primary Text** (`rgb(17, 17, 17)`; dark `rgb(238, 238, 238)`): principal readable content.
- **Secondary Text** (`rgb(77, 77, 77)`; dark `rgb(170, 170, 170)`): supporting copy and resting icon color.
- **Canvas** (`rgb(220, 220, 220)`; dark `rgb(50, 50, 50)`): fallback page background beneath artwork.
- **Glass Card** (`rgba(254, 254, 254, 0.7)`; dark `rgba(1, 1, 1, 0.6)`): main translucent surface.
- **Slider Thumb** (`rgb(254, 254, 254)` in both themes): the visible 16px slider handle stays light so its position remains legible against both the quiet rail and dark player surfaces.
- **Subtle Border** (`rgba(102, 102, 102, 0.2)`; dark `rgba(170, 170, 170, 0.2)`): structural separation without heavy chrome.

### Named Rules

**The One Action Voice Rule.** Red communicates primary action, selection, and focus. Do not introduce a competing high-salience accent for ordinary controls.

**The Semantic Role Rule.** New or materially changed components should prefer semantic tokens such as `action-primary`, `text-secondary`, `surface-card`, and `border-subtle` rather than copying primitive colors or raw values.

## Typography

- **Display Font:** Comfortaa (with system sans-serif fallback)
- **Body Font:** system-ui / Segoe UI / Roboto / Helvetica / Arial

**Character:** Comfortaa supplies Maple Pod's rounded brand character, while the system sans stack keeps dense player controls and lists neutral and highly readable. Comfortaa is an accent voice, not the default typeface for all interface copy.

### Hierarchy
- **Display** (700, 32px, 1.25): application identity and the strongest brand-bearing labels.
- **Title** (300, 24px, 1.25): dialog and player-level titles where the incumbent UI uses a lighter editorial voice.
- **Body** (400, 16px, 1.25): default interface copy and controls.
- **Label** (400, 14px, 1.25): supporting metadata, tooltips, menu items, and compact descriptions.

### Named Rules

**The Brand Accent Rule.** Use Comfortaa where identity or structural hierarchy benefits from its character; keep long-form and operational copy in the system sans stack.

## Layout

The application uses a compact centered shell with 4px outer rhythm and glass-card sections. Mobile width is capped around 500px; at the existing 768px viewport breakpoint the shell expands to 1024px and the main area becomes a two-column layout with a `minmax(400px, 1fr)` content region and `minmax(300px, 400px)` side panel.

The established viewport breakpoints are 360 / 640 / 768 / 1024 / 1280px. Use viewport queries for page-shell changes and named container queries for reusable component behavior that depends on local width. The music player is the reference pattern: it adapts at 420px and 640px container widths instead of coupling its internals to the viewport.

The preferred spacing rhythm is 4 / 8 / 12 / 16 / 24 / 32px, with 16px as the default card padding. Existing specialized dimensions should not be mechanically rewritten merely to fit the scale.

## Motion

Motion communicates state changes without competing with the music or artwork. The shared duration steps are **fast 100ms**, **normal 200ms**, and **slow 300ms**. Fast is for direct control feedback, normal is for small component transitions such as scrollbar geometry/opacity, and slow is reserved for larger surface transitions such as dialog entrance/exit. Specialized data visualization timing may exceed this scale when the represented state benefits from smoothing.

Animate only the properties that carry the intended state change; `transition: all` is not part of the system. Prefer opacity/color for quiet feedback and keep spatial scaling or translation short. Under `prefers-reduced-motion: reduce`, remove non-essential spatial/decorative motion and preserve state through immediate geometry plus color/opacity where useful.

### Named Rules

**The State-First Motion Rule.** Motion must explain a state or relationship; it is not decoration by default.

**The Property-Specific Rule.** Name the properties that move. Broad transitions make future layout changes accidentally animated and are prohibited in shared primitives.

## Elevation & Depth

Depth is primarily tonal and atmospheric rather than shadow-driven. Main surfaces use translucent `surface-card`, a subtle 1px border, and 16px `backdrop-filter` blur over the artwork. Dark mode adds a 50% black artwork mask to protect foreground contrast.

Shadows are exceptional rather than foundational. The slider's small `0 2px 6px rgba(0, 0, 0, 0.2)` thumb shadow is an affordance cue, not a general card-elevation vocabulary.

### Named Rules

**The Glass-Once Rule.** Use glass treatment for meaningful structural surfaces. Do not nest blurred cards merely to create spacing or decoration.

## Shapes

The form language is soft but controlled: normal controls use an 8px radius, structural cards use 16px, icon actions are circular, and `9999px` is reserved for genuine pill geometry. Borders are thin and low-contrast; shape should establish grouping before heavier borders or shadows are introduced.

Interactive size and visible size are separate concepts. Primary touch controls expose at least a 44×44 CSS px hit area even when the visible icon is 20–24px or a slider rail remains 6px thick.

## Components

### Buttons
- **Shape:** 8px control radius; icon actions are circular.
- **Primary:** Maple Action Red background with the strong surface contrast color; standard text-button padding is 8px 16px.
- **Hover / Active:** restrained scale feedback (1.05 / 0.95) only when reduced motion is not requested; color/opacity state remains available without spatial motion.
- **Focus:** explicit 2px `focus-ring` outline with 2px offset.
- **Disabled:** reduced opacity and non-interactive cursor semantics.

### Icon Buttons
- **Contract:** `UiIconButton` is the preferred primitive for repeated icon-only controls.
- **Accessible name:** explicit and independent of tooltip visibility.
- **Hit area:** minimum 44×44 CSS px for primary player controls; glyph remains approximately 20–24px.
- **Toggle state:** binary toggles use `aria-pressed`; multi-state controls such as repeat expose a changing action label/state instead of pretending to be binary.
- **Tooltip:** supplemental explanation only, never the sole accessible name.

### Cards / Containers
- **Corner Style:** 16px.
- **Background:** translucent `surface-card` over artwork or canvas.
- **Depth:** 16px backdrop blur plus subtle 1px border; no default card shadow.
- **Internal Padding:** 16px by default.

### Inputs / Fields
- **Style:** inherit the neutral surface/border hierarchy; labels and validation semantics belong to the reusable field layer.
- **Focus:** must be at least as visible as the shared focus-ring baseline.
- **Error / Disabled:** destructive semantics use Danger Red; disabled state must remain readable and clearly non-interactive.

### Slider / Progress
- **Track:** visually quiet 6px rail with primary-red filled range.
- **Thumb:** 16px high-contrast light neutral using the `slider-thumb` semantic role; it must remain visibly distinct from the rail and surrounding surface in both light and dark themes.
- **Touch area:** the slider control and thumb expose a 44px interaction target while the visible thumb remains 16px.
- **Focus:** the thumb uses the shared focus-ring treatment.
- **Reduced motion:** animated progress/marquee movement becomes immediate or non-spatial while preserving the represented state.

### Dialog
- reka-ui owns dialog semantics/focus behavior.
- Modal separation uses a blurred overlay and the standard glass-card surface.
- Entrance/exit fades use the slow 300ms motion step and become immediate under reduced motion.

### Navigation and Menus
- reka-ui owns keyboard/menu behavior where applicable.
- Menu items use the shared hover overlay and compact 14px label style.
- Component-local open/selected state should reuse semantic action/state roles instead of adding isolated highlight colors.

## Governance

`DESIGN.md` is the human- and agent-readable design contract. `pika.config.ts` and PikaCSS design tokens are the executable style layer, while local `Ui*` components own reusable interaction and accessibility contracts.

PikaCSS strict token governance currently runs at **warning** severity for color. Semantic color aliases carry an explicit `color` type so strict governance recognizes them as first-class tokens. Dimension and duration governance remain off while incumbent spacing and motion literals migrate incrementally; enable those types at warning severity only when the resulting diagnostics are actionable rather than noisy. A governed type may advance to error only after incumbent usage complies and validation is clean.

Repeated literals should migrate to tokens or component contracts when doing so reduces drift. Do not perform mass tokenization solely for numerical purity, and do not use design-system work as justification for unrelated visual churn. A change that intentionally alters the creative direction, semantic hierarchy, or a shared component contract should update this document and the corresponding engineering artifact in the same transaction.

## Do's and Don'ts

- **Do** let MapleStory artwork carry the emotional character while controls remain quiet and legible.
- **Do** reuse semantic color roles, the established spacing/radius vocabulary, and `Ui*` interaction primitives.
- **Do** keep player actions easy to locate, touch, and operate by keyboard.
- **Do** use container queries when a reusable component owns the responsive decision.
- **Do** verify light/dark, keyboard, touch, reduced-motion, and narrow/wide component states.

- **Don't** introduce a second competing primary accent hierarchy.
- **Don't** use tooltip text as the only accessible name of an icon action.
- **Don't** shrink an interaction target merely because its glyph is visually small.
- **Don't** use `transition: all`; enumerate the properties intended to animate.
- **Don't** let global shortcuts steal native behavior from editable or interactive controls.
- **Don't** add blur, shadow, gradients, or motion without a structural/state purpose.
- **Don't** use design-system cleanup as justification for an unrelated visual redesign.
