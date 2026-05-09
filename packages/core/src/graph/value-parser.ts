import type { TokenValue, ColorValue, DimensionValue, DurationValue, BorderValue, ShadowValue, GradientValue, GradientStop, TypographyValue, TransitionValue, CubicBezierValue } from '@/graph/values.js';

function makeParseError(message: string): Error {
  return Object.assign(new Error(message), { code: 'PARSE_ERROR' as const });
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function parseDimension(raw: unknown, path: string): DimensionValue {
  if (!isObject(raw)) throw makeParseError(`Token "${path}" dimension value must be an object`);
  if (typeof raw.value !== 'number') throw makeParseError(`Token "${path}" dimension missing required "value" (number)`);
  if (typeof raw.unit !== 'string') throw makeParseError(`Token "${path}" dimension missing required "unit" (string)`);
  return { value: raw.value, unit: raw.unit as DimensionValue['unit'] };
}

function parseDuration(raw: unknown, path: string): DurationValue {
  if (!isObject(raw)) throw makeParseError(`Token "${path}" duration value must be an object with "value" and "unit"`);
  if (typeof raw.value !== 'number') throw makeParseError(`Token "${path}" duration missing required "value" (number)`);
  if (raw.unit !== 'ms' && raw.unit !== 's') throw makeParseError(`Token "${path}" duration "unit" must be "ms" or "s"`);
  return { value: raw.value, unit: raw.unit };
}

function parseColorField(raw: unknown, path: string): string | ColorValue {
  if (typeof raw === 'string') return raw;
  if (isObject(raw)) return parseColor(raw, path);
  throw makeParseError(`Token "${path}" color field must be a string or color object`);
}

function parseDimensionField(raw: unknown, path: string): DimensionValue | string {
  if (typeof raw === 'string') return raw;
  return parseDimension(raw, path);
}

function parseColor(raw: Record<string, unknown>, path: string): ColorValue {
  if (typeof raw.colorSpace !== 'string') throw makeParseError(`Token "${path}" color missing required "colorSpace"`);
  if (!Array.isArray(raw.components) || raw.components.length !== 3) throw makeParseError(`Token "${path}" color missing required "components" array of 3 numbers`);
  const result: ColorValue = {
    colorSpace: raw.colorSpace as ColorValue['colorSpace'],
    components: raw.components as [number, number, number],
  };
  if (typeof raw.alpha === 'number') result.alpha = raw.alpha;
  return result;
}

export function parseTokenValue(raw: unknown, type: string, tokenPath: string): TokenValue {
  if (typeof raw === 'string' || typeof raw === 'number') return raw;

  // DTCG gradient $value is a flat array of stop objects
  if (type === 'gradient') {
    if (!Array.isArray(raw)) throw makeParseError(`Token "${tokenPath}" gradient $value must be an array of stop objects`);
    return (raw as unknown[]).map((s, i) => {
      if (!isObject(s)) throw makeParseError(`Token "${tokenPath}" gradient stop ${i} must be an object`);
      if (s.color === undefined) throw makeParseError(`Token "${tokenPath}" gradient stop ${i} missing "color"`);
      if (typeof s.position !== 'number') throw makeParseError(`Token "${tokenPath}" gradient stop ${i} missing "position" (number)`);
      return { color: parseColorField(s.color, tokenPath), position: s.position } as GradientStop;
    }) as GradientValue;
  }

  if (!isObject(raw)) {
    throw makeParseError(`Token "${tokenPath}" $value must be a string, number, object, or array`);
  }

  switch (type) {
    case 'color':
      return parseColor(raw, tokenPath);

    case 'dimension':
      return parseDimension(raw, tokenPath);

    case 'duration':
      return parseDuration(raw, tokenPath);

    case 'border': {
      if (!raw.width) throw makeParseError(`Token "${tokenPath}" border missing required "width"`);
      if (!raw.style) throw makeParseError(`Token "${tokenPath}" border missing required "style"`);
      if (raw.color === undefined) throw makeParseError(`Token "${tokenPath}" border missing required "color"`);
      return {
        width: parseDimension(raw.width, tokenPath),
        style: raw.style as BorderValue['style'],
        color: parseColorField(raw.color, tokenPath),
      };
    }

    case 'shadow': {
      if (!raw.offsetX) throw makeParseError(`Token "${tokenPath}" shadow missing required "offsetX"`);
      if (!raw.offsetY) throw makeParseError(`Token "${tokenPath}" shadow missing required "offsetY"`);
      if (!raw.blur) throw makeParseError(`Token "${tokenPath}" shadow missing required "blur"`);
      if (raw.color === undefined) throw makeParseError(`Token "${tokenPath}" shadow missing required "color"`);
      const shadow: ShadowValue = {
        offsetX: parseDimension(raw.offsetX, tokenPath),
        offsetY: parseDimension(raw.offsetY, tokenPath),
        blur: parseDimension(raw.blur, tokenPath),
        color: parseColorField(raw.color, tokenPath),
      };
      if (raw.spread !== undefined) shadow.spread = parseDimension(raw.spread, tokenPath);
      if (typeof raw.inset === 'boolean') shadow.inset = raw.inset;
      return shadow;
    }

    case 'typography': {
      const typo: TypographyValue = {};
      if (typeof raw.fontFamily === 'string') typo.fontFamily = raw.fontFamily;
      if (raw.fontSize !== undefined) typo.fontSize = parseDimensionField(raw.fontSize, tokenPath);
      if (raw.fontWeight !== undefined) typo.fontWeight = raw.fontWeight as number | string;
      if (typeof raw.lineHeight === 'number') typo.lineHeight = raw.lineHeight;
      if (raw.letterSpacing !== undefined) typo.letterSpacing = parseDimensionField(raw.letterSpacing, tokenPath);
      if (typeof raw.fontStyle === 'string') typo.fontStyle = raw.fontStyle;
      return typo;
    }

    case 'transition': {
      if (raw.duration === undefined) throw makeParseError(`Token "${tokenPath}" transition missing required "duration"`);
      if (raw.delay === undefined) throw makeParseError(`Token "${tokenPath}" transition missing required "delay"`);
      if (!Array.isArray(raw.timingFunction) || raw.timingFunction.length !== 4)
        throw makeParseError(`Token "${tokenPath}" transition "timingFunction" must be a cubic Bézier array [x1, y1, x2, y2]`);
      return {
        duration: parseDuration(raw.duration, tokenPath),
        delay: parseDuration(raw.delay, tokenPath),
        timingFunction: raw.timingFunction as CubicBezierValue,
      };
    }

    default:
      return raw;
  }
}
