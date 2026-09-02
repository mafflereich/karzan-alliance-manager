import { supabase } from './supabase';

/**
 * 敏感欄位（equipment / records / exclusive_weapons）只能透過
 * docs/sql/rls_member_equipment_security.sql 建立的 SECURITY DEFINER
 * RPC `get_member_equipment` 讀取（一般成員的 base SELECT 已被 REVOKE）。
 *
 * 此 helper 統一負責撈取並合併，前端各處不要再直接從 members
 * select 這三個欄位，否則會因權限不足而失敗。
 */

export interface MemberSecretRow {
  equipment: any;
  records: any;
  exclusiveWeapons: any;
}

export async function fetchMemberSecrets(memberIds: string[]): Promise<Record<string, MemberSecretRow>> {
  const ids = [...new Set((memberIds || []).filter(Boolean))];
  if (ids.length === 0) return {};

  try {
    const { data, error } = await supabase.rpc('get_member_equipment', {
      p_member_ids: ids,
    });
    if (error) {
      console.error('Error fetching member sensitive data via get_member_equipment:', error);
      return {};
    }

    const map: Record<string, MemberSecretRow> = {};
    (data || []).forEach((row: any) => {
      if (!row || !row.id) return;
      map[String(row.id)] = {
        equipment: row.equipment ?? undefined,
        records: row.records ?? undefined,
        exclusiveWeapons: row.exclusive_weapons ?? undefined,
      };
    });
    return map;
  } catch (err) {
    console.error('Error calling get_member_equipment:', err);
    return {};
  }
}

/** 將 RPC 回傳的敏感資料合併進 member 物件（只覆寫有回傳列的成員）。 */
export function applySecretsToMembers<T extends { id?: string | null }>(
  members: T[],
  secrets: Record<string, MemberSecretRow>,
): T[] {
  return members.map((m) => {
    if (!m?.id) return m;
    const secret = secrets[String(m.id)];
    if (!secret) return m;
    return {
      ...m,
      equipment: secret.equipment ?? m.equipment,
      records: secret.records ?? m.records,
      exclusiveWeapons: secret.exclusiveWeapons ?? m.exclusiveWeapons,
    };
  });
}
