import type React from "react";

// Re-points the light theme's primary color at a brand color, for product
// demos and documents drawn in the `.proto-light` theme.
export const brandStyle = (accent: string) =>
  ({
    "--color-gold": accent,
    "--color-gold-bright": accent,
    "--color-gold-deep": accent,
    "--color-gold-wash": `color-mix(in srgb, ${accent} 9%, white)`,
  }) as React.CSSProperties;
