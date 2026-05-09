export const primitiveColor: Record<string, unknown> = {
  color: {
    blue: {
      '100': { $value: '#dbeafe', $type: 'color' },
      '500': { $value: '#3b82f6', $type: 'color' },
      '900': { $value: '#1e3a8a', $type: 'color' },
    },
    gray: {
      '100': { $value: '#f3f4f6', $type: 'color' },
      '500': { $value: '#6b7280', $type: 'color' },
      '900': { $value: '#111827', $type: 'color' },
    },
    red: { '500': { $value: '#ef4444', $type: 'color' } },
  },
};

export const primitiveSpacing: Record<string, unknown> = {
  spacing: {
    '1': { $value: '4px',  $type: 'dimension' },
    '2': { $value: '8px',  $type: 'dimension' },
    '4': { $value: '16px', $type: 'dimension' },
    '6': { $value: '24px', $type: 'dimension' },
    '8': { $value: '32px', $type: 'dimension' },
  },
};

export const semanticColor: Record<string, unknown> = {
  semantic: {
    bg:      { $value: '{color.gray.100}', $type: 'color' },
    surface: { $value: '{color.gray.100}', $type: 'color' },
    text:    { $value: '{color.gray.900}', $type: 'color' },
    primary: { $value: '{color.blue.500}', $type: 'color' },
    danger:  { $value: '{color.red.500}',  $type: 'color' },
  },
};

export const semanticRadius: Record<string, unknown> = {
  radius: {
    none: { $value: '0px',    $type: 'dimension' },
    sm:   { $value: '2px',    $type: 'dimension' },
    md:   { $value: '4px',    $type: 'dimension' },
    lg:   { $value: '8px',    $type: 'dimension' },
    full: { $value: '9999px', $type: 'dimension' },
  },
};

export const typography: Record<string, unknown> = {
  font: {
    family: {
      sans: { $value: 'Inter, system-ui, sans-serif', $type: 'fontFamily' },
      mono: { $value: 'JetBrains Mono, monospace',   $type: 'fontFamily' },
    },
    size: {
      sm: { $value: '14px', $type: 'dimension' },
      md: { $value: '16px', $type: 'dimension' },
      lg: { $value: '20px', $type: 'dimension' },
      xl: { $value: '24px', $type: 'dimension' },
    },
    weight: {
      regular: { $value: 400, $type: 'fontWeight' },
      medium:  { $value: 500, $type: 'fontWeight' },
      bold:    { $value: 700, $type: 'fontWeight' },
    },
  },
};
