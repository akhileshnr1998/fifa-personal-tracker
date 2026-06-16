# FIFA World Cup 2026 — Official Color Palette

Reference for all UI theming decisions. CSS custom properties live in `web/src/index.css`.

![Official FIFA WC 2026 Color Palette](/home/akhilesh/.cursor/projects/home-akhilesh-sandbox-dump-sandbox-fifa-fifa-personal-tracker/assets/image-d232cb70-cb18-4ff8-9119-9a97ad051f84.png)

---

## Full Palette (Grid Order)

| Swatch | Name | Hex | Role in App |
|---|---|---|---|
| ■ | Dark Maroon | `#6B1028` | — |
| ■ | Vivid Purple | `#6B20C8` | **Primary brand** (`--wc-purple`) |
| ■ | Royal Navy Blue | `#1A3A8A` | — |
| ■ | Dark Teal | `#064840` | — |
| ■ | Crimson Red | `#CC1028` | — (`--wc-crimson`) |
| ■ | Soft Lavender | `#B8A0D8` | — |
| ■ | Cobalt Blue | `#1E60B0` | — |
| ■ | Emerald Green | `#00CC44` | — |
| ■ | Orange | `#FF4400` | — |
| ■ | Dusty Mauve | `#B87080` | — |
| ■ | Periwinkle Blue | `#6682CC` | — |
| ■ | Chartreuse | `#AAFF00` | — |
| ■ | Salmon | `#FF9068` | — |
| ■ | Hot Magenta | `#EE0058` | **Accent/highlight** (`--wc-magenta`) |
| ■ | Turquoise/Mint | `#00D4A4` | **Active states, host stripe** (`--wc-mint`) |
| ■ | Bright Yellow | `#EEFF00` | — |
| ■ | Black | `#000000` | — |
| ■ | White | `#FFFFFF` | Surfaces (`--wc-white`) |

---

## App CSS Custom Properties

Defined in `web/src/index.css` under `:root`.

```css
/* Primary — Vivid Purple */
--wc-purple:        #6B20C8;
--wc-purple-bright: #8B3AEE;   /* hover / gradient end */
--wc-purple-soft:   #EDE5FF;   /* surfaces, chips, pills */

/* Accent — Hot Magenta */
--wc-magenta:       #EE0058;
--wc-magenta-dark:  #AA003E;   /* text on light bg */
--wc-magenta-soft:  #FFE0EE;   /* surfaces */

/* Active/Live — Mint */
--wc-mint:          #00D4A4;
--wc-mint-soft:     #D0FFF4;

/* Base */
--wc-navy:          #0A1628;   /* primary text */
--wc-crimson:       #CC1028;   /* error / danger */
--wc-white:         #ffffff;
--wc-surface:       #F8F5FF;   /* page background (purple-tinted) */
--wc-muted:         #5A5678;   /* secondary text */
--wc-border:        #E2D8EE;   /* borders (purple-tinted) */
```

---

## Usage Guidelines

### Primary actions (CTAs, active tabs, score badges)
Use `--wc-purple`. Gradient CTAs combine `--wc-purple → --wc-purple-bright`.

### Highlighted / followed items
Use `--wc-magenta` for borders, accent stripes, and stars on followed teams.

### Host stripe (header)
Three-part gradient: `--wc-purple` | `--wc-magenta` | `#00D4A4` (mint), representing the bold FIFA WC 2026 brand energy.

### Surfaces and soft backgrounds
- Cards and sections: `--wc-white` with `--wc-border` outlines
- App page background: `#F0EBF8` (body) / `--wc-surface` (root)
- Pill/chip backgrounds: `--wc-purple-soft` or `--wc-magenta-soft`

### Background gradient (shell)
Subtle radial gradients using `rgba` of purple + magenta + mint over a light purple-to-pink linear base, replacing the previous green-tinted gradient.

### Skeleton shimmer
Uses `--wc-purple-soft` ↔ `#f4eeff` sweep animation.

---

## Deprecated (Previous Theme)

These were the old green/gold variables — **do not reintroduce**:

| Old Variable | Old Value | Replaced By |
|---|---|---|
| `--wc-green` | `#0d5c2e` | `--wc-purple` |
| `--wc-green-bright` | `#1a7a43` | `--wc-purple-bright` |
| `--wc-green-soft` | `#e6f4ec` | `--wc-purple-soft` |
| `--wc-gold` | `#c9a227` | `--wc-magenta` |
| `--wc-gold-dark` | `#8a6d12` | `--wc-magenta-dark` |
| `--wc-gold-soft` | `#fdf6dc` | `--wc-magenta-soft` |
