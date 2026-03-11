# Brand Logo & Icon System Rules

## The Rule

Every subscription icon follows this pattern:

**Brand-colored circle + white monochrome logo inside (fill variant)**

```
┌─────────────────────────┐
│  ┌───────┐              │
│  │ RED   │  Netflix     │
│  │  N    │  $15.99/mo   │
│  │ (wht) │              │
│  └───────┘              │
└─────────────────────────┘
       ↑
  Brand color (#E60000) fills the circle
  Logo rendered in white (#FFFFFF)
```

## How It Works

### Data Flow

1. **LOGOS registry** (`assets/logos/index.ts`) — stores path data + brand color
2. **Sub.icon** — uses `"svg:netflix-fill"` prefix to reference SVG logos
3. **Sub.color** — the brand color (e.g. `#E60000`) used as the circle background
4. **BrandLogo component** — renders the SVG path; pass `color="#FFFFFF"` for white
5. **SubRow / AddSubSheet** — sets circle background to `sub.color`, renders logo in white

### Icon Rendering Rules by Variant

| Variant | Circle Background | Logo Color |
|---------|------------------|------------|
| **Default** | `color` (solid brand) | `#FFFFFF` (white) |
| **Trial** | `color` (solid brand) | `#FFFFFF` (white) |
| **Inactive** | `${color}66` (faded) | `#FFFFFF` (white) |
| **AddSubSheet** | `color` (solid brand) | `#FFFFFF` (white) |

### Emoji Fallback

When no SVG logo exists (`icon` does not start with `"svg:"`), the emoji is rendered as-is inside the colored circle.

## Adding New Brand Logos

```bash
# From tools/logo-converter/
node convert.mjs <logo.png or logo.svg> --register

# This will:
# 1. Convert to monochrome fill + outline SVGs
# 2. Extract brand color
# 3. Auto-register in assets/logos/index.ts
```

Then set the subscription's `icon` to `"svg:<name>-fill"` and `color` to the brand hex.
