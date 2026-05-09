export type ScalarValue = string | number;

export type ColorSpace =
  | 'srgb' | 'hsl' | 'hsb' | 'hsv'
  | 'lch' | 'oklch' | 'lab' | 'oklab'
  | 'display-p3' | 'a98-rgb' | 'prophoto-rgb' | 'rec2020'
  | 'xyz-d50' | 'xyz-d65';

export interface ColorValue {
  colorSpace: ColorSpace;
  components: [number, number, number];
  alpha?: number;
}

export type DimensionUnit =
  | 'px' | 'rem' | 'em' | '%'
  | 'vw' | 'vh' | 'vmin' | 'vmax'
  | 'pt' | 'pc' | 'cm' | 'mm' | 'in' | 'ex' | 'ch';

export interface DimensionValue {
  value: number;
  unit: DimensionUnit;
}

export interface DurationValue {
  value: number;
  unit: 'ms' | 's';
}

export type BorderStyle =
  | 'solid' | 'dashed' | 'dotted' | 'double'
  | 'groove' | 'ridge' | 'inset' | 'outset'
  | 'none' | 'hidden';

export interface BorderValue {
  width: DimensionValue;
  style: BorderStyle;
  color: string | ColorValue;
}

export interface ShadowValue {
  offsetX: DimensionValue;
  offsetY: DimensionValue;
  blur: DimensionValue;
  spread?: DimensionValue;
  color: string | ColorValue;
  inset?: boolean;
}

export interface GradientStop {
  color: string | ColorValue;
  position: number;
}

// DTCG spec: gradient $value is a flat array of stops — no gradientType or angle
export type GradientValue = GradientStop[];

export interface TypographyValue {
  fontFamily?: string;
  fontSize?: string | DimensionValue;
  fontWeight?: number | string;
  lineHeight?: number;  // multiplier per DTCG spec
  letterSpacing?: string | DimensionValue;
  fontStyle?: string;
}

// DTCG spec: timingFunction is a cubic Bézier array [x1, y1, x2, y2]
export type CubicBezierValue = [number, number, number, number];

export interface TransitionValue {
  duration: DurationValue;
  delay: DurationValue;
  timingFunction: CubicBezierValue;
}

export type CompositeValue =
  | ColorValue
  | DimensionValue
  | DurationValue
  | BorderValue
  | ShadowValue
  | GradientValue
  | TypographyValue
  | TransitionValue;

export type TokenValue = ScalarValue | CompositeValue | Record<string, unknown>;
