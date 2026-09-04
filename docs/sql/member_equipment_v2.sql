-- ============================================================
-- 裝備表 v2：隱私級別 / 煉製之痕 / 更新日期
--
-- 功能（前端 kazran-alliance-manager 對應）：
--   1) equipment_visibility 隱私級別（取代 is_equipment_hidden 布林）
--        'public'        → 所有人（authenticated/anon）可看
--        'all_manager'   → 所有管理者（creator/admin/manager）可看
--        'guild_manager' → 該成員所屬公會的管理者可看
--        'admin'         → 僅 creator / admin 可看
--      ※ 本人（綁定的 profile）永遠可看自己的資料。
--   2) refining_traces 煉製之痕數量（單一整數總數，預設 0）
--   3) 更新日期：
--        * members.equipment_updated_at  （bigint epoch ms，整張裝備表）
--        * members.costumes_updated_at    （bigint epoch ms，全部服裝/專武）
--        * members.equipment jsonb 內每個部位補 updatedAt（epoch ms）
--        * members.records  jsonb 內每件服裝補 updatedAt（epoch ms）
--
-- 執行方式：在 Supabase 後台 → SQL Editor 整段執行（可重複執行）。
-- 注意：需先執行過 rls_member_equipment_security.sql（STEP 1-5）。
-- ============================================================

-- ------------------------------------------------------------
-- STEP 1：新增欄位（idempotent）
-- ------------------------------------------------------------
ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS equipment_visibility text NOT NULL DEFAULT 'public';

ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS refining_traces integer NOT NULL DEFAULT 0;

ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS equipment_updated_at bigint;

ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS costumes_updated_at bigint;

-- ------------------------------------------------------------
-- STEP 2：將舊版 is_equipment_hidden 布林移植到 equipment_visibility
--   true  → 'all_manager'（舊語意：僅管理者可看）
--   false / NULL → 'public'
-- 注意：只補「還沒有設過 equipment_visibility」的列（即仍為預設 'public'
--       且舊布林為 true 的）。重複執行不會覆蓋使用者之後自行選擇的值。
-- ------------------------------------------------------------
UPDATE public.members
SET equipment_visibility = 'all_manager'
WHERE COALESCE(is_equipment_hidden, false) = true
  AND equipment_visibility = 'public';
-- 說明：若之後真的要區分「使用者從沒改過」與「使用者選了 public」，
-- 需改用 separate is_dirty 旗標；此處以先到的更新為準，可接受。

-- ------------------------------------------------------------
-- STEP 3：身份/權限 helper（可重複建立）
-- ------------------------------------------------------------

-- is_admin()：目前使用者是否為頂層管理者（creator / admin）
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.current_profile() cp
    WHERE cp.user_role IN ('creator', 'admin')
  );
$$;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- is_guild_manager_of(p_guild_id)：目前使用者是否為「該公會」的管理者。
--   規則：是管理者的前提下——
--     * admin / creator → 是（可管所有公會）
--     * manager → 需「綁定至少一位屬於該公會的成員」
CREATE OR REPLACE FUNCTION public.is_guild_manager_of(p_guild_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.current_profile() cp
    WHERE cp.user_role IN ('creator', 'admin')
  )
  OR EXISTS (
    SELECT 1
    FROM public.current_profile() cp
    CROSS JOIN LATERAL unnest(string_to_array(cp.id, ',')) AS mb(owner_member_id)
    JOIN members m ON m.id = mb.owner_member_id
    WHERE cp.user_role IN ('creator', 'admin', 'manager')
      AND (p_guild_id IS NULL OR m.guild_id = p_guild_id)
  );
$$;
GRANT EXECUTE ON FUNCTION public.is_guild_manager_of(text) TO authenticated;

-- can_view_equipment(p_member_id)：目前使用者是否能看該成員的裝備/服裝資料
--   本人永遠可看；其餘依 equipment_visibility 判定。
CREATE OR REPLACE FUNCTION public.can_view_equipment(p_member_id text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_vis text;
  v_guild text;
BEGIN
  IF public.owns_member(p_member_id) THEN
    RETURN TRUE;
  END IF;

  SELECT equipment_visibility, guild_id INTO v_vis, v_guild
  FROM members WHERE id = p_member_id;

  RETURN CASE v_vis
    WHEN 'public' THEN TRUE
    WHEN 'all_manager' THEN public.is_manager()
    WHEN 'guild_manager' THEN public.is_guild_manager_of(v_guild)
    WHEN 'admin' THEN public.is_admin()
    ELSE TRUE
  END;
END;
$$;
GRANT EXECUTE ON FUNCTION public.can_view_equipment(text) TO authenticated;

-- ------------------------------------------------------------
-- STEP 4：更新 SECURITY DEFINER RPC get_member_equipment
--   改為回傳：equipment / records / exclusive_weapons / refining_traces
--   （依 can_view_equipment 遮蔽，不符合回 NULL）。
--   updating 欄位（equipment / costumes 更新日期）非敏感，走一般欄位。
-- ------------------------------------------------------------
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
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    m.id,
    CASE WHEN public.can_view_equipment(m.id) THEN m.equipment ELSE NULL END AS equipment,
    CASE WHEN public.can_view_equipment(m.id) THEN m.records ELSE NULL END AS records,
    CASE WHEN public.can_view_equipment(m.id) THEN m.exclusive_weapons ELSE NULL END AS exclusive_weapons,
    CASE WHEN public.can_view_equipment(m.id) THEN m.refining_traces ELSE NULL END AS refining_traces
  FROM members m
  WHERE (p_member_ids IS NULL OR m.id = ANY(p_member_ids))
    AND (p_guild_id IS NULL OR m.guild_id = p_guild_id);
$$;

GRANT EXECUTE ON FUNCTION public.get_member_equipment(text[], text) TO authenticated;

-- ------------------------------------------------------------
-- STEP 5：更新 members 的 SELECT 政策以使用新隱私語意
--   取代舊的 members_select_public（原本只看 is_equipment_hidden=false）。
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "members_select_public" ON public.members;
CREATE POLICY "members_select_public"
  ON public.members
  FOR SELECT
  TO authenticated, anon
  USING (public.can_view_equipment(id));

-- 其餘政策（manager / owner / insert / update / delete）沿用
-- rls_member_equipment_security.sql 的定義，不需變更（管理階層在
-- can_view_equipment 內已涵蓋更細的隱私判定）。

-- ------------------------------------------------------------
-- STEP 6：把新欄位加入「安全欄位」清單（STEP 4 of
--   rls_member_equipment_security.sql 只授權了部分欄位）。
--   refining_traces 屬於敏感，維持不授權（只能走 RPC）；
--   equipment_visibility / equipment_updated_at / costumes_updated_at
--   為一般（非敏感）欄位，授權給前端讀取。
-- ------------------------------------------------------------
GRANT SELECT (
  equipment_visibility,
  equipment_updated_at,
  costumes_updated_at
) ON public.members TO anon, authenticated;

-- ------------------------------------------------------------
-- 驗證
--   SELECT id, name, equipment_visibility, refining_traces,
--          equipment_updated_at, costumes_updated_at FROM members LIMIT 5;
--   SELECT * FROM public.get_member_equipment(p_member_ids := ARRAY['<member_id>']);
-- ------------------------------------------------------------
