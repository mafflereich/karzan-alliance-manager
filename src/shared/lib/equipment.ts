import { EQUIPMENT_CATEGORIES, Equipment, PlayPreferences, DEDICATION_OPTIONS, Dedication, PlayMode, PLAY_MODE_OPTIONS } from '@/entities/member/types';

export const getEmptyEquipment = (): Equipment => {
  const e: Equipment = {};
  EQUIPMENT_CATEGORIES.forEach(c => { e[c.key] = { c23: 0, c24: 0 }; });
  return e;
};

export const normalizeEquipment = (equipment?: Equipment): Equipment => {
  const e = getEmptyEquipment();
  if (!equipment) return e;
  EQUIPMENT_CATEGORIES.forEach(c => {
    e[c.key] = {
      c23: Number(equipment[c.key]?.c23) || 0,
      c24: Number(equipment[c.key]?.c24) || 0,
    };
  });
  return e;
};

export const emptyPlayPreferences = (): PlayPreferences => ({ modes: [] });

export const normalizePlayPreferences = (pp?: PlayPreferences): PlayPreferences => {
  if (!pp) return emptyPlayPreferences();
  return { modes: pp.modes || [], dedication: pp.dedication };
};

// 是否為管理者（可看所有成員裝備表）
export const isManagerRole = (role: string | null): boolean =>
  role === 'manager' || role === 'admin' || role === 'creator';

export { DEDICATION_OPTIONS, PLAY_MODE_OPTIONS };
export type { Dedication, PlayMode };
