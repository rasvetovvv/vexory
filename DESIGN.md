# Vexory — Design System ("Purple Liquid Glass")

Dark-only product UI. Deep navy-black canvas, violet primary, glass as a
material for elevated layers. Tokens live in `src/app/globals.css` (`@theme`).

## Color

| Role | Value | Use |
|---|---|---|
| background | `#09080f` | body canvas |
| surface | `#0f0e18` | inputs, inset panels |
| surface-raised / high | `#14121f` / `#1b1828` | progress tracks, layering |
| primary | `#7c5cff` (hover `#8d70ff`) | primary actions, active tab/chip |
| primary-muted | `rgba(124,92,255,.16)` | selected nav, role pills, tiles |
| accent | `#a78bfa` | links to entities, highlights |
| foreground | `#eeedf6` | body text |
| muted / faint | `#948fad` / `#64607e` | secondary text / metadata |
| success / warning / danger / info | `#34d399` / `#fbbf24` / `#f87171` / `#60a5fa` | statuses, each with `-muted` tint |
| like | `#f472b6` | like button only |

Accent carries actions and state, never decoration. Status colors appear only
in badges, toasts and status-bearing UI.

## Glass material (three grades + gloss)

- `.glass` — static cards/panels. Directional gradient fill
  (white 5.5% → 1.8% → violet 3.5% at 155deg), 1px `--color-border`, inset
  top specular line, and a **cursor-tracked sheen** (`::after` radial light
  driven by `--mx`/`--my`, fed by `LiquidPointer` in the root layout).
  **No backdrop-filter** — cheap at any count.
- `.glass-deep` — floating panels (project/profile hero, auth card):
  `backdrop-filter: blur(24px) saturate(150%)`, **refractive gradient edge**
  (masked 1px ring, lit top-left, violet at the base) and a top glare.
- `.glass-bar` — sticky chrome (topbar): blur 20px + single bottom border.
- `.btn-liquid` — primary actions: vertical violet gradient (lit top face),
  inset top highlight, violet halo that intensifies on hover.

Form fields get global inset depth (base layer): dark inner shadow + violet
outer glow on focus.

Rule: glass marks elevation. Flat lists and forms stay flat. Never nest glass
inside glass (inner attachments use `bg-surface` + border).

## Ambient background

`.bg-ambient::before` — two large fixed radial fields of low-chroma violet
(max alpha 0.11) with multi-stop falloff; `.bg-ambient::after` — fixed SVG
fractal-noise grain at 5% opacity, `mix-blend-mode: overlay`, to dither
banding. Do not add extra glows on top of content; ambient light lives only
in this layer.

## Typography

- **Inter** (`--font-sans`) — all UI text.
- **JetBrains Mono** (`--font-mono`) — technical metadata only: timestamps,
  status badges, role titles, counters. Pattern: `font-mono text-[11px]
  font-bold uppercase tracking-wider text-faint`.
- Page titles: `text-2xl font-semibold tracking-tight`. Section headers:
  `text-lg font-semibold`.

## Components

- Badges: pill, mono 11px bold uppercase, tinted bg + colored text
  (`StatusBadge`, `CompensationBadge` in `src/components/ui/badges.tsx`).
- Filter chips: rounded-full; active = solid primary, inactive = glass border.
- Inputs: `bg-surface`, 1px border, focus → `--color-border-primary`.
- Buttons: primary solid violet; secondary bordered glass. Focus-visible ring
  is global (`:focus-visible` in globals.css).
- Cards hover: border shifts to `border-strong` + soft shadow, 200ms.

## Motion

150–250ms transitions on color/border/shadow only. No page-load choreography.
Respect `prefers-reduced-motion` for anything beyond micro-transitions.
