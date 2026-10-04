---
name: Re:Learn Minimalist Pedagogical System
colors:
  surface: '#f9f9fb'
  surface-dim: '#d9dadc'
  surface-bright: '#f9f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f5'
  surface-container: '#edeef0'
  surface-container-high: '#e8e8ea'
  surface-container-highest: '#e2e2e4'
  on-surface: '#1a1c1d'
  on-surface-variant: '#414753'
  inverse-surface: '#2f3132'
  inverse-on-surface: '#f0f0f2'
  outline: '#717785'
  outline-variant: '#c1c6d6'
  surface-tint: '#005cbb'
  primary: '#0059b5'
  on-primary: '#ffffff'
  primary-container: '#0071e3'
  on-primary-container: '#fcfbff'
  inverse-primary: '#abc7ff'
  secondary: '#5f5e60'
  on-secondary: '#ffffff'
  secondary-container: '#e2dfe1'
  on-secondary-container: '#636264'
  tertiary: '#5a5b5f'
  on-tertiary: '#ffffff'
  tertiary-container: '#737378'
  on-tertiary-container: '#fcfaff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d7e2ff'
  primary-fixed-dim: '#abc7ff'
  on-primary-fixed: '#001b3f'
  on-primary-fixed-variant: '#00458f'
  secondary-fixed: '#e4e2e4'
  secondary-fixed-dim: '#c8c6c8'
  on-secondary-fixed: '#1b1b1d'
  on-secondary-fixed-variant: '#474649'
  tertiary-fixed: '#e3e2e7'
  tertiary-fixed-dim: '#c7c6cb'
  on-tertiary-fixed: '#1a1b1f'
  on-tertiary-fixed-variant: '#46464b'
  background: '#f9f9fb'
  on-background: '#1a1c1d'
  surface-variant: '#e2e2e4'
  surface-base: '#FBFBFD'
  surface-elevated: '#FFFFFF'
  surface-subtle: '#F5F5F7'
  border-subtle: '#E5E5EA'
  border-strong: '#D1D1D6'
  text-primary: '#1D1D1F'
  text-secondary: '#86868B'
  text-tertiary: '#A1A1A6'
  state-success: '#34C759'
  state-success-subtle: '#EBF9EE'
  state-warning: '#F5A623'
  state-warning-subtle: '#FEF7E8'
  state-error: '#FF3B30'
  state-error-subtle: '#FFECEB'
  code-surface: '#F6F8FA'
  code-border: '#E1E4E8'
typography:
  display-hero:
    fontFamily: Inter
    fontSize: 56px
    fontWeight: '700'
    lineHeight: 64px
    letterSpacing: -0.03em
  display-hero-mobile:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 42px
    letterSpacing: -0.025em
  headline-xl:
    fontFamily: Inter
    fontSize: 40px
    fontWeight: '600'
    lineHeight: 48px
    letterSpacing: -0.025em
  headline-xl-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 34px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.015em
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
    letterSpacing: -0.01em
  body-md:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: -0.005em
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
  eyebrow:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.08em
  label-code-editor:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
    letterSpacing: 0em
  label-code-inline:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
  label-ui:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: -0.005em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 1rem
  margin: 3rem
  margin-mobile: 1.25rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
  space-2xl: 4rem
  space-3xl: 6rem
---

## Brand & Style

The design system embodies the confluence of three distinct paradigms: the intuitive pedagogical clarity of Duolingo, the restrained luxury and typographic discipline of Apple, and the precise, code-first utility of LeetCode. 

The personality is calm, intelligent, encouraging, and razor-sharp. It purposefully avoids standard AI tropes (such as ethereal purple-magenta gradients, sparkling star icons, floating chatbots, or algorithmic jargon). The product never shouts; it quietly assists. Learning programming is framed not as rote syntax memorization, but as the systematic construction of mental models. Mistakes are treated not as failures, but as the precise starting point of cognitive clarity.

The visual style is minimalist and tactile-restrained:
- Pure, quiet surfaces using warm off-whites rather than harsh sterile blues.
- Typographic authority through high-contrast near-black text, tight tracking on display headings, and expansive whitespace.
- Restrained visual density: elements exist only if they deliver instructional value.
- Frictionless affordances: predictable navigation conforming strictly to Jakob’s Law.

## Colors

The color system prioritizes chromatic restraint. The canvas is deliberately quiet to draw deep focus toward code typography and conceptual reasoning.

- **Canvas & Surfaces:** Grounded in a warm off-white (`#FBFBFD`), with pure elevated white (`#FFFFFF`) reserved for functional cards, execution containers, and active panels. Subtle surfaces (`#F5F5F7`) designate secondary panels, code line gutter backdrops, and inactive segments.
- **Brand Primary Accent:** Apple-grade sapphire blue (`#0071E3`). Used strictly for primary calls-to-action, active step highlights, and focused interactive inputs. It is never diluted into gradient washes.
- **Content Hierarchy:** Deep near-black (`#1D1D1F`) delivers maximum typographic clarity for headings and primary content, while muted neutral gray (`#86868B`) handles metadata, secondary hints, and code comments.
- **Semantic Feedback:** Visual feedback reinforces learning without harsh judgment. Success (`#34C759`) is gentle yet crisp; Error (`#FF3B30`) indicates broken logic without punitive alarmism; Warning (`#F5A623`) signals conceptual misalignment or edge cases. Both code execution and conceptual verification use soft tint backdrops (`-subtle`) paired with crisp foreground indicators.

## Typography

Typography establishes immediate structural authority through scale, rhythm, and tight optical tracking.

- **Primary Typeface (Inter):** Serves all interface, display, and editorial prose. Display weights feature negative tracking (`-0.02em` to `-0.03em`) emulating Apple’s SF Pro Display, delivering a solid, crafted presence.
- **Code Typeface (JetBrains Mono):** Reserved for code snippets, code execution displays, memory traces, and technical identifiers. It maintains optimal character distinctions (such as `0` vs `O` and `1` vs `l`) critical for pedagogical code verification.
- **Hierarchy & Case:** Eyebrows are styled in disciplined uppercase with wide tracking (`0.08em`) to frame topics without overwhelming the main headline. Headlines prioritize compact vertical line spacing to keep hero blocks cohesive.

## Layout & Spacing

The layout is built on an 8-point typographic and spatial grid, emphasizing generous negative space to minimize cognitive fatigue.

- **Layout Grid:** A fluid 12-column system constrained to a maximum content width of 1120px for marketing/landing views and 1440px for learning workspace layouts.
- **Responsive Adaptations:**
  - **Desktop (≥ 1024px):** 12 columns, 1.5rem (`gutter`), 3rem to 4rem canvas margins. Split-screen interactions (such as Code Editor vs. Socratic Questioning) lock to a balanced 6-col / 6-col or an asymmetric 7-col / 5-col split.
  - **Tablet (768px - 1023px):** 8 columns, 1.25rem gutter, 2rem margins. Complex panels stack into progressive disclosure views.
  - **Mobile (< 768px):** 4 columns, 1rem gutter, 1.25rem margins. Interactive comparisons (Traditional vs. Re:Learn) collapse from side-by-side into a vertical sequential stack.
- **Rhythm:** Landing sections breathe with expansive spacing (`space-3xl` top/bottom paddings), separating conceptual pillars without requiring dividing lines or heavy drop shadows.

## Elevation & Depth

Depth is tactile, crisp, and quiet. The design system eschews floating multi-layer blurs, neomorphic bevels, or colored ambient halos in favor of disciplined structural tiers:

- **Level 0 (Base Canvas):** Background color `#FBFBFD`. Completely un-elevated, flat, and spacious.
- **Level 1 (Card / Component Surface):** Pure `#FFFFFF` surface bounded by a subtle outline: `1px solid #E5E5EA`. Enhanced with an ultra-soft hairline drop shadow: `0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)`.
- **Level 2 (Interactive Floating / Active Panels):** Elevated white surfaces for floating modals, active dropdown menus, and dragging code tokens: `0 8px 24px rgba(0, 0, 0, 0.06), 0 2px 6px rgba(0, 0, 0, 0.04)`, bounded by `1px solid #D1D1D6`.
- **Code Panes:** Inset treatment with a faint border (`#E1E4E8`) and surface (`#F6F8FA`) to signal an isolated runtime context distinct from prose cards.

## Shapes

The shape vocabulary balances modern software ergonomics with Apple-style rounded rects and refined pills.

- **Base Radius (roundedness = 2):** Standard elements (cards, code preview containers, instructional dialogs) utilize `12px` to `16px` (`rounded-lg` to `rounded-xl`), creating friendly yet architecturally stable forms.
- **Pill Geometry:** Applied exclusively to interactive targets: primary and secondary action buttons, filter tags, step markers, and status indicators (`border-radius: 9999px`).
- **Code Insets:** Inner blocks within editors or execution traces maintain a cohesive nested radius of `6px` to `8px` to ensure optical harmony with parent card containers.

## Components

### Buttons
- **Primary Button ("Start learning"):** Full pill radius (`9999px`), solid `#0071E3` fill, white `#FFFFFF` label with `label-ui` typography. Hover: `#0077ED` with transition `150ms ease-out`. Active: scaled down subtly to `0.98`.
- **Secondary Button ("See how it works"):** Full pill radius, transparent background with `1px solid #E5E5EA` border and `#1D1D1F` text. Hover: `#F5F5F7` background, border transitioning to `#D1D1D6`.
- **Destructive/Tertiary Actions:** No border, text-only button with `#86868B`, transitioning to `#1D1D1F` on hover.

### Cards & Comparison Panels
- Never wrap every element in an individual card. Cards exist exclusively to group contextual entities (e.g., Code vs Reasoning panels).
- **The Problem/Solution Panel:**
  - *Traditional Panel:* Inactive off-white surface (`#F5F5F7`), `#E5E5EA` border, muted red accent text for error highlights.
  - *Re:Learn Panel:* Elevated `#FFFFFF` surface, subtle shadow, crisp `#0071E3` or `#34C759` hairline indicators for guided thought loops.
- Internal padding is strictly generous: minimum `space-lg` (24px) to `space-xl` (40px).

### Code Editor & Execution Views
- Clean header strip displaying runtime context (e.g., `main.py`) in `body-sm` muted text.
- JetBrains Mono monospaced body text with generous line-height (`22px` on `14px` font).
- Execution state badge: Inset pill badge showing "✓ Code works" in `#34C759` over `#EBF9EE`.

### Socratic Step / Progress Indicators
- Four horizontal steps (Practice, Understand, Improve, Master).
- Step numbers rendered in monospaced or structured numerical typography (`01`, `02`).
- Connected via a refined `1px` horizontal rule (`#E5E5EA`). Active steps feature a filled `#0071E3` pill dot; incomplete steps feature `#D1D1D6`.

### Inputs & Interactive Choices
- Selection options for conceptual questions (e.g., "Why does numbers[1] return 20?") use full-width rounded selection tiles (`rounded-lg`), `1px solid #E5E5EA` resting border, shifting to `#0071E3` with an ultra-light tint (`#F0F7FF`) upon selection.
- No harsh checkboxes or radio circles; the entire surface serves as the clean hit target.