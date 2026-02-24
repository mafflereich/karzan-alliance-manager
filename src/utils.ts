export const getTierColor = (tier: number) => {
  switch (tier) {
    case 1: return 'bg-orange-100 text-orange-800 border-orange-200';
    case 2: return 'bg-blue-100 text-blue-800 border-blue-200';
    case 3: return 'bg-stone-200 text-stone-800 border-stone-300';
    case 4: return 'bg-green-100 text-green-800 border-green-200';
    default: return 'bg-stone-100 text-stone-800 border-stone-200';
  }
};

export const getTierTextColorDark = (tier: number) => {
  switch (tier) {
    case 1: return 'text-orange-400';
    case 2: return 'text-blue-400';
    case 3: return 'text-stone-400';
    case 4: return 'text-green-400';
    default: return 'text-stone-500';
  }
};
