# Design System — FanFlow 26

A clean, high-contrast, accessible design inspired by the energy of the FIFA
World Cup 2026 host nations. All choices must meet **WCAG 2.2 AA** contrast.

---

## 1. Brand Personality
- **Energetic** but calm under pressure (operations-grade clarity).
- **Inclusive & global** — works across languages, cultures, abilities.
- **Trustworthy** — clean layouts, generous spacing, no clutter.

---

## 2. Color Palette

### Primary
| Token | Hex | Use |
|---|---|---|
| `--color-primary` | `#0B5FFF` | Primary actions, links, focus |
| `--color-primary-hover` | `#0A4FD1` | Hover/active on primary |
| `--color-secondary` | `#00A878` | Success, sustainability, positive |
| `--color-accent` | `#FF5A1F` | Highlights, live/urgent accents |

### Neutrals
| Token | Hex | Use |
|---|---|---|
| `--color-bg` | `#0F172A` | App background (dark) |
| `--color-surface` | `#1E293B` | Cards, panels |
| `--color-surface-2` | `#334155` | Elevated surfaces, borders |
| `--color-text` | `#F8FAFC` | Primary text on dark |
| `--color-text-muted` | `#CBD5E1` | Secondary text |

> A **light theme** mirrors these with `--color-bg: #FFFFFF`,
> `--color-surface: #F1F5F9`, `--color-text: #0F172A`. Support both via a
> `data-theme` attribute and respect `prefers-color-scheme`.

### Semantic / Status (crowd + incidents)
| Token | Hex | Meaning |
|---|---|---|
| `--status-ok` | `#22C55E` | Low density / resolved |
| `--status-warn` | `#F59E0B` | Moderate density / attention |
| `--status-crit` | `#EF4444` | High density / critical incident |
| `--status-info` | `#38BDF8` | Informational |

> **Never rely on color alone** — pair status with icons/labels (e.g., a red
> chip also reads "Critical") for colorblind accessibility.

### Contrast rules
- Body text ≥ **4.5:1**; large text & UI components ≥ **3:1**.
- Focus indicators visible on all backgrounds (2px outline `--color-accent`).

---

## 3. Typography

### Font families
- **UI / Body:** `Inter` (fallback: system-ui, -apple-system, sans-serif).
- **Headings / Display:** `Sora` (fallback: Inter, sans-serif).
- **Monospace (code/IDs):** `JetBrains Mono` (fallback: ui-monospace).

> Use variable fonts, self-hosted or via a privacy-friendly source; preload the
> primary weights.

### Type scale (rem, 16px base)
| Token | Size | Line height | Use |
|---|---|---|---|
| `display` | 3.0 (48px) | 1.1 | Hero / big stats |
| `h1` | 2.25 (36px) | 1.2 | Page titles |
| `h2` | 1.75 (28px) | 1.25 | Section titles |
| `h3` | 1.375 (22px) | 1.3 | Subsections |
| `body-lg` | 1.125 (18px) | 1.5 | Lead text |
| `body` | 1.0 (16px) | 1.5 | Default |
| `small` | 0.875 (14px) | 1.45 | Meta, captions |

### Weights
- Regular 400 (body), Medium 500 (emphasis), Semibold 600 (headings),
  Bold 700 (display/stats).
- Minimum body size **16px**; never below 14px for meaningful text.

---

## 4. Spacing & Layout
- **8px spacing scale:** 4, 8, 12, 16, 24, 32, 48, 64.
- Max content width ~1200px; dashboard uses a responsive 12-column grid.
- Corner radius: `--radius-sm 6px`, `--radius-md 12px`, `--radius-lg 20px`.
- Elevation via subtle shadows on `--color-surface`, not heavy borders.
- Mobile-first; breakpoints: `sm 640`, `md 768`, `lg 1024`, `xl 1280`.

---

## 5. Components (guidelines)
- **Buttons:** min touch target 44×44px; primary/secondary/ghost variants;
  visible focus + disabled states.
- **Chat bubbles:** user vs assistant clearly distinguished by shape + label
  (not color alone); assistant area is an `aria-live="polite"` region.
- **Map/heatmap:** density uses the status color ramp + numeric legend + text.
- **Cards/KPIs:** large number (`display`/`h1`), label in `--color-text-muted`,
  trend icon with text.
- **Chips/badges:** icon + text for status.
- **Forms:** labels always visible (no placeholder-only), inline validation
  messages tied via `aria-describedby`.

---

## 6. Motion
- Subtle, purposeful transitions (150–250ms, ease-out).
- Respect `prefers-reduced-motion: reduce` — disable non-essential animation.
- Live-data updates animate gently; never flash or cause layout shift.

---

## 7. Iconography & Imagery
- Consistent icon set (e.g., Lucide) with `aria-hidden` when decorative and
  labels when meaningful.
- Accessibility, transport, and sustainability get distinct, recognizable icons.
- Alt text on all informative images.

---

## 8. Design Tokens (starter)
```css
:root {
  --color-primary: #0B5FFF;
  --color-primary-hover: #0A4FD1;
  --color-secondary: #00A878;
  --color-accent: #FF5A1F;
  --color-bg: #0F172A;
  --color-surface: #1E293B;
  --color-surface-2: #334155;
  --color-text: #F8FAFC;
  --color-text-muted: #CBD5E1;
  --status-ok: #22C55E;
  --status-warn: #F59E0B;
  --status-crit: #EF4444;
  --status-info: #38BDF8;
  --radius-sm: 6px;
  --radius-md: 12px;
  --radius-lg: 20px;
  --font-body: "Inter", system-ui, sans-serif;
  --font-heading: "Sora", "Inter", sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, monospace;
}
```
Map these into `tailwind.config.ts` `theme.extend` so utility classes stay
consistent with the system.
