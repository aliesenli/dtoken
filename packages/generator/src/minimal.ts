export const minimalTokens: Record<string, unknown> = {
  color: {
    brand:   { $value: '#3b82f6', $type: 'color', $description: 'Primary brand color' },
    neutral: { $value: '#6b7280', $type: 'color' },
    white:   { $value: '#ffffff', $type: 'color' },
    black:   { $value: '#000000', $type: 'color' },
    success: { $value: '#22c55e', $type: 'color' },
    danger:  { $value: '#ef4444', $type: 'color' },
  },
};

export const minimalSpacing: Record<string, unknown> = {
  spacing: {
    xs: { $value: '4px',  $type: 'dimension' },
    sm: { $value: '8px',  $type: 'dimension' },
    md: { $value: '16px', $type: 'dimension' },
    lg: { $value: '24px', $type: 'dimension' },
    xl: { $value: '32px', $type: 'dimension' },
  },
};
