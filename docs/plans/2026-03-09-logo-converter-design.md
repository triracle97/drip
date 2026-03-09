# Drip Logo Converter CLI — Design

## Summary

Offline Node.js CLI tool that converts PNG brand logos into monochrome 24x24 SVG files. Produces a filled variant and an outline variant per logo. Output SVGs live in `assets/logos/` as individual files consumed by the app via `react-native-svg`.

## Pipeline

```
Input PNG
  → ImageMagick: resize to 256x256, remove background, threshold to pure B&W bitmap
  → Potrace: trace bitmap to SVG vector paths
  → Post-process: normalize viewBox to 0 0 24 24, clean up with SVGO
  → Output: assets/logos/<name>-fill.svg + assets/logos/<name>-outline.svg
```

## Outline Mode

Potrace traces edges by tracing at two slightly different thresholds and subtracting the inner path from the outer, producing a stroke-like result. Fallback: trace the fill and apply `fill="none" stroke="currentColor"` with a calculated stroke width.

## CLI Interface

```bash
# Single logo
node scripts/convert-logo.ts spotify.png

# Batch — all PNGs in a folder
node scripts/convert-logo.ts --batch assets/logos-raw/

# Options
--threshold <0-255>    # B&W cutoff, default 128
--invert               # Invert colors before tracing (for dark logos)
--size <px>            # Pre-resize input, default 256
```

## Output Structure

```
assets/
  logos-raw/           # Source PNGs
  logos/
    spotify-fill.svg
    spotify-outline.svg
    netflix-fill.svg
    netflix-outline.svg
```

## App Integration

The `icon` field on `Sub` (currently emoji string) gains a new convention:

- Emoji: `"📦"` — rendered as `<Text>` (unchanged, backward compatible)
- SVG logo: `"svg:spotify-fill"` — rendered via `<BrandLogo>` component

`SubRow` checks if `icon` starts with `"svg:"` — if yes, renders `<BrandLogo>`; otherwise renders emoji `<Text>` as today.

### BrandLogo Component

```tsx
// components/BrandLogo.tsx
<Svg width={size} height={size} viewBox="0 0 24 24">
  <Path d={...} fill={color} />
</Svg>
```

## Dependencies

- **ImageMagick** — system install (`brew install imagemagick`)
- **Potrace** — system install (`brew install potrace`)
- **sharp** (npm, devDependency) — image preprocessing in Node
- **svgo** (npm, devDependency) — SVG optimization of Potrace output

## Scope Boundaries

- No runtime conversion — all tracing is offline
- No color extraction — monochrome output, uses subscription's `color` prop
- No auto-fetching of logos — user supplies the PNG
