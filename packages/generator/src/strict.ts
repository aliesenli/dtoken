export { primitiveColor, primitiveSpacing, semanticRadius, typography } from '@/product-ui.js';

export const semanticColor: Record<string, unknown> = {
  semantic: {
    bg:      { $value: '{color.gray.100}', $type: 'color' },
    surface: { $value: '{color.gray.100}', $type: 'color' },
    text:    { $value: '{color.gray.900}', $type: 'color' },
    primary: { $value: '{color.blue.500}', $type: 'color' },
    danger:  { $value: '{color.red.500}',  $type: 'color' },
  },
};
