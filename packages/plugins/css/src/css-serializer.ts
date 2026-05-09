import type { TokenValue, ColorValue, DimensionValue, DurationValue } from '@dtt/core';

function serializeDimension(v: DimensionValue | string): string {
  if (typeof v === 'string') return v;
  return `${v.value}${v.unit}`;
}

function serializeColor(v: string | ColorValue): string {
  if (typeof v === 'string') return v;
  const [c1, c2, c3] = v.components;
  const hasAlpha = typeof v.alpha === 'number' && v.alpha < 1;

  switch (v.colorSpace) {
    case 'srgb': {
      const r = Math.round(c1 * 255);
      const g = Math.round(c2 * 255);
      const b = Math.round(c3 * 255);
      return hasAlpha ? `rgb(${r} ${g} ${b} / ${v.alpha})` : `rgb(${r}, ${g}, ${b})`;
    }
    case 'hsl':
      return hasAlpha
        ? `hsl(${c1} ${c2}% ${c3}% / ${v.alpha})`
        : `hsl(${c1}, ${c2}%, ${c3}%)`;
    case 'oklch':
      return hasAlpha ? `oklch(${c1} ${c2} ${c3} / ${v.alpha})` : `oklch(${c1} ${c2} ${c3})`;
    case 'oklab':
      return hasAlpha ? `oklab(${c1} ${c2} ${c3} / ${v.alpha})` : `oklab(${c1} ${c2} ${c3})`;
    case 'lch':
      return hasAlpha ? `lch(${c1} ${c2} ${c3} / ${v.alpha})` : `lch(${c1} ${c2} ${c3})`;
    case 'lab':
      return hasAlpha ? `lab(${c1} ${c2} ${c3} / ${v.alpha})` : `lab(${c1} ${c2} ${c3})`;
    default:
      return `color(${v.colorSpace} ${c1} ${c2} ${c3}${hasAlpha ? ` / ${v.alpha}` : ''})`;
  }
}

function isColorValue(v: unknown): v is ColorValue {
  return typeof v === 'object' && v !== null && 'colorSpace' in (v as object) && 'components' in (v as object);
}

function isDimensionValue(v: unknown): v is DimensionValue {
  return typeof v === 'object' && v !== null && 'value' in (v as object) && 'unit' in (v as object);
}

export function serializeToCSS(varName: string, value: TokenValue, type: string): string[] {
  if (typeof value === 'string' || typeof value === 'number') {
    return [`${varName}: ${value};`];
  }

  if (typeof value !== 'object' || value === null) {
    return [`${varName}: [composite];`];
  }

  switch (type) {
    case 'color':
      if (isColorValue(value)) return [`${varName}: ${serializeColor(value)};`];
      return [`${varName}: [composite];`];

    case 'dimension':
      if (isDimensionValue(value)) return [`${varName}: ${serializeDimension(value)};`];
      return [`${varName}: [composite];`];

    case 'border': {
      const b = value as { width: DimensionValue; style: string; color: string | ColorValue };
      return [`${varName}: ${serializeDimension(b.width)} ${b.style} ${serializeColor(b.color)};`];
    }

    case 'shadow': {
      const s = value as {
        offsetX: DimensionValue; offsetY: DimensionValue; blur: DimensionValue;
        spread?: DimensionValue; color: string | ColorValue; inset?: boolean;
      };
      const parts: string[] = [];
      if (s.inset) parts.push('inset');
      parts.push(serializeDimension(s.offsetX));
      parts.push(serializeDimension(s.offsetY));
      parts.push(serializeDimension(s.blur));
      if (s.spread) parts.push(serializeDimension(s.spread));
      parts.push(serializeColor(s.color));
      return [`${varName}: ${parts.join(' ')};`];
    }

    case 'gradient': {
      // DTCG: gradient $value is a flat array of stop objects — no gradientType
      // CSS serialization defaults to linear-gradient since DTCG intentionally omits type
      if (!Array.isArray(value)) return [`${varName}: [composite];`];
      const stops = value as Array<{ color: string | ColorValue; position: number }>;
      const stopStr = stops.map(s => `${serializeColor(s.color)} ${s.position * 100}%`).join(', ');
      return [`${varName}: linear-gradient(${stopStr});`];
    }

    case 'typography': {
      const t = value as {
        fontFamily?: string; fontSize?: string | DimensionValue;
        fontWeight?: number | string; lineHeight?: number;
        letterSpacing?: string | DimensionValue; fontStyle?: string;
      };
      const lines: string[] = [];
      if (t.fontFamily !== undefined) lines.push(`${varName}-family: ${t.fontFamily};`);
      if (t.fontSize !== undefined) lines.push(`${varName}-size: ${isDimensionValue(t.fontSize) ? serializeDimension(t.fontSize) : t.fontSize};`);
      if (t.fontWeight !== undefined) lines.push(`${varName}-weight: ${t.fontWeight};`);
      if (t.lineHeight !== undefined) lines.push(`${varName}-line-height: ${t.lineHeight};`);
      if (t.letterSpacing !== undefined) lines.push(`${varName}-letter-spacing: ${isDimensionValue(t.letterSpacing) ? serializeDimension(t.letterSpacing as DimensionValue) : t.letterSpacing};`);
      if (t.fontStyle !== undefined) lines.push(`${varName}-style: ${t.fontStyle};`);
      return lines;
    }

    case 'transition': {
      const tr = value as { duration: DurationValue; delay: DurationValue; timingFunction: [number, number, number, number] };
      const dur = `${tr.duration.value}${tr.duration.unit}`;
      const del = `${tr.delay.value}${tr.delay.unit}`;
      const tf = `cubic-bezier(${tr.timingFunction.join(', ')})`;
      return [`${varName}: ${dur} ${tf} ${del};`];
    }

    default:
      return [`${varName}: [composite];`];
  }
}
