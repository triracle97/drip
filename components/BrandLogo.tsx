import { LOGOS } from '@/assets/logos';
import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface Props {
  name: string;
  size?: number;
  color?: string;
  variant?: 'fill' | 'outline'; // request a specific variant
  useOriginalColor?: boolean;    // use logo's embedded brand color instead of override
}

export default function BrandLogo({ name, size = 24, color, variant, useOriginalColor }: Props) {
  // If a variant is requested, try {name}-{variant} first, then fall back to the raw name
  let logo = variant ? LOGOS[`${name}-${variant}`] : null;
  if (!logo) logo = LOGOS[name];
  if (!logo) return null;

  // useOriginalColor: use the logo's embedded color (for multicolor-on-white-bg icons)
  const renderColor = useOriginalColor
    ? (logo.color ?? '#000000')
    : (color ?? logo.color ?? '#FFFFFF');

  if (logo.stroke) {
    return (
      <Svg width={size} height={size} viewBox={logo.viewBox}>
        <Path
          d={logo.d}
          fill="none"
          stroke={renderColor}
          strokeWidth={logo.strokeWidth ?? 8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    );
  }

  // Multi-path logos: render each path with its own fill color
  if (logo.paths && logo.paths.length > 0) {
    return (
      <Svg width={size} height={size} viewBox={logo.viewBox}>
        {logo.paths.map((p, i) => (
          <Path key={i} d={p.d} fill={p.fill} fillRule={logo.fillRule ?? 'nonzero'} />
        ))}
      </Svg>
    );
  }

  return (
    <Svg width={size} height={size} viewBox={logo.viewBox}>
      <Path d={logo.d} fill={renderColor} fillRule={logo.fillRule ?? 'nonzero'} />
    </Svg>
  );
}
