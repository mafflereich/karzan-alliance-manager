-- ============================================================
-- 資料庫層級權限：equipment / records / exclusive_weapons
--
-- 目的：讓「服裝／裝備」敏感欄位在資料庫層級受控，不只是一般
--       成員前端看不到就合規。只有以下使用者能讀取某成員的
--       敏感資料：
--         * 管理者（creator / admin / manager）→ 可讀全部
--         * 該成員自己（綁定的 profile）→ 一定可讀自己的
--         * 一般成員 → 僅可讀「is_equipment_hidden = false」的成員
--       其餘情況一律回傳 NULL。
--
-- 做法：
--   1) REVOKE 直接 SELECT 敏感欄位，讓一般成員無法繞過前端直接
--      用 Supabase client 撈取（column-level privilege）。
--   2) 提供 SECURITY DEFINER RPC `get_member_equipment`，裡面依
--      上述政策遮蔽（CASE WHEN），是唯一合法的讀取管道。
--   3) 輔助函式 is_manager() / owns_member() 同為 SECURITY DEFINER，
--      才能讀 profiles（其上有 RLS）判身份。
--
-- 前端（kazran-alliance-manager）對應：
--   * 所有原先把 equipment / records / exclusive_weapons 加進
--     members base select 的讀取，改為呼叫此 RPC 再合併。
--   * 寫入（updateMember、updateMemberCostumeLevel 等）不受影響，
--     因為只 REVOKE SELECT，UPDATE 權限仍在。
--
-- 執行方式：在 Supabase 後台 → SQL Editor 整段執行（可重複執行）。
-- ============================================================

-- ------------------------------------------------------------
-- STEP 1：is_manager()
-- 判斷目前登入使用者是否為管理者（creator / admin / manager）。
-- SECURITY DEFINER 以函式擁有者身份執行，可讀取受 RLS 保護的
-- profiles 表。
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_manager()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM profiles p
    WHERE (p.auth_id::text = auth.uid()::text OR p.id::text = auth.uid()::text)
      AND p.user_role IN ('creator', 'admin', 'manager')
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_manager() TO authenticated;

-- ------------------------------------------------------------
-- STEP 2：owns_member(p_member_id)
-- 判斷目前登入使用者是否「綁定」此成員（Discord profile 的 id
-- 為逗號分隔的 member_id 清單；Email 管理員 profile 的 id 為
-- auth UUID，不會命中 member、因此不算 owns）。
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.owns_member(p_member_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM profiles p
    WHERE (p.auth_id::text = auth.uid()::text OR p.id::text = auth.uid()::text)
      AND p_member_id = ANY(string_to_array(p.id, ','))
  );
$$;

GRANT EXECUTE ON FUNCTION public.owns_member(text) TO authenticated;

-- ------------------------------------------------------------
-- STEP 3：get_member_equipment(p_member_ids, p_guild_id)
-- 唯一合法的敏感資料讀取管道。回傳遮罩後的 equipment / records /
-- exclusive_weapons：不符合政策時回傳 NULL。
--
-- 參數可省略（皆為 NULL 時回傳所有可見資料）：
--   p_member_ids text[] → 限定某些成員
--   p_guild_id   text   → 限定某些公會
--   ※ members.id / guild_id 為 text（成員 id 並非 UUID），故使用 text。
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_member_equipment(
  p_member_ids text[] DEFAULT NULL,
  p_guild_id text DEFAULT NULL
)
RETURNS TABLE (
  id text,
  equipment jsonb,
  records jsonb,
  exclusive_weapons jsonb
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    m.id,
    CASE
      WHEN public.is_manager()
        OR COALESCE(m.is_equipment_hidden, false) = false
        OR public.owns_member(m.id)
      THEN m.equipment
      ELSE NULL
    END AS equipment,
    CASE
      WHEN public.is_manager()
        OR COALESCE(m.is_equipment_hidden, false) = false
        OR public.owns_member(m.id)
      THEN m.records
      ELSE NULL
    END AS records,
    CASE
      WHEN public.is_manager()
        OR COALESCE(m.is_equipment_hidden, false) = false
        OR public.owns_member(m.id)
      THEN m.exclusive_weapons
      ELSE NULL
    END AS exclusive_weapons
  FROM members m
  WHERE (p_member_ids IS NULL OR m.id = ANY(p_member_ids))
    AND (p_guild_id IS NULL OR m.guild_id = p_guild_id);
$$;

GRANT EXECUTE ON FUNCTION public.get_member_equipment(text[], text) TO authenticated;

-- ------------------------------------------------------------
-- STEP 4：REVOKE 敏感欄位的直接 SELECT
-- 一般成員（authenticated）、未登入（anon）不再能從 members
-- 直接 select 這三個欄位，只能透過 STEP 3 的 RPC 讀取。
-- UPDATE / INSERT 權限不受影響，成員仍可更新自己的資料。
-- ------------------------------------------------------------
REVOKE SELECT (equipment, records, exclusive_weapons)
  ON public.members FROM anon, authenticated;

-- ------------------------------------------------------------
-- 驗證：
-- 1) 管理員身份可透過 RPC 看到所有成員：
--    SELECT * FROM public.get_member_equipment();
-- 2) 一般成員看不到隱藏成員的資料（該列三欄應為 NULL）：
--    SELECT * FROM public.get_member_equipment(p_member_ids := ARRAY['<member_id>']);
-- 3) 一般成員直接 select 敏感欄位應被拒（權限不足）：
--    SELECT equipment FROM members;
-- ------------------------------------------------------------
