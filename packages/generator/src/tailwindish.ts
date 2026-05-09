function scale(steps: number[], valueFn: (n: number) => string, type: string) {
  return Object.fromEntries(steps.map(n => [String(n), { $value: valueFn(n), $type: type }]));
}

export const tailwindishColor: Record<string, unknown> = {
  color: {
    blue: scale([100,200,300,400,500,600,700,800,900], n => `hsl(217, ${100 - n/10}%, ${105 - n/10}%)`, 'color'),
    gray: scale([100,200,300,400,500,600,700,800,900], n => `hsl(220, 9%, ${100 - n/10}%)`, 'color'),
    red:  scale([100,200,300,400,500,600,700,800,900], n => `hsl(0, ${100 - n/15}%, ${100 - n/10}%)`, 'color'),
  },
};

export const tailwindishSpacing: Record<string, unknown> = {
  spacing: scale([1,2,3,4,5,6,8,10,12,16], n => `${n * 4}px`, 'dimension'),
};

export const tailwindishRadius: Record<string, unknown> = {
  radius: {
    '1': { $value: '2px',  $type: 'dimension' },
    '2': { $value: '4px',  $type: 'dimension' },
    '3': { $value: '8px',  $type: 'dimension' },
    '4': { $value: '16px', $type: 'dimension' },
  },
};
