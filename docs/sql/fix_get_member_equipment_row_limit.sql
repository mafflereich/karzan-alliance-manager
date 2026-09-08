-- ============================================================
-- 修正 get_member_equipment 超過 1000 列被截斷的問題
--
-- 問題：
--   PostgREST 對「可內聯(inlinable)」的 table-valued 函式會套用
--   db-max-rows（預設 1000）當作響應的預設上限。原 get_member_equipment
--   是 LANGUAGE sql STABLE、結構單純，因此會被 PostgREST 內聯，
--   當一次傳入 >1000 個 p_member_ids 時，只會回傳前 1000 列，
--   其餘成員的敏感資料（equipment / records / exclusive_weapons /
--   refining_traces）會靜默遺失。
--
-- 修正：
--   改為 LANGUAGE plpgsql + RETURN QUERY（不可被 PostgREST 內聯），
--   非內聯的 set-returning 函式不會被套用 1000 列的預設上限，
--   因此可一次回傳所有符合條件成員的資料。
--   遮蔽邏輯 / 回傳欄位 / 權限皆與原本完全相同。
--
-- 執行方式：Supabase 後台 → SQL Editor 直接執行（可重複執行）。
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_member_equipment(
  p_member_ids text[] DEFAULT NULL,
  p_guild_id text DEFAULT NULL
)
RETURNS TABLE (
  id text,
  equipment jsonb,
  records jsonb,
  exclusive_weapons jsonb,
  refining_traces integer
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id,
    CASE WHEN public.can_view_equipment(m.id) THEN m.equipment ELSE NULL END AS equipment,
    CASE WHEN public.can_view_equipment(m.id) THEN m.records ELSE NULL END AS records,
    CASE WHEN public.can_view_equipment(m.id) THEN m.exclusive_weapons ELSE NULL END AS exclusive_weapons,
    CASE WHEN public.can_view_equipment(m.id) THEN m.refining_traces ELSE NULL END AS refining_traces
  FROM members m
  WHERE (p_member_ids IS NULL OR m.id = ANY(p_member_ids))
    AND (p_guild_id IS NULL OR m.guild_id = p_guild_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_member_equipment(text[], text) TO authenticated;

-- ------------------------------------------------------------
-- 驗證：
--   SELECT * FROM public.get_member_equipment(
--     p_member_ids := (SELECT array_agg(id) FROM members)
--   );
--   -- 若原本會截斷，這支改版後應回傳與 members 相同筆數（>1000 也可）。
-- ------------------------------------------------------------
