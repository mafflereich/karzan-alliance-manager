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
-- 做法（雙層防護）：
--   1) 欄位層級：REVOKE members 的 table 級 SELECT，只 GRANT 安全
--      欄位，讓一般成員無法直接 select(equipment) 等敏感欄位。
--   2) 資料列層級（RLS）：STEP 5 啟用 RLS，以列為單位限制可見性——
--      管理者全見、本人見自己、未隱藏者人人可讀；寫入限定管理者／本人。
--   3) 提供 SECURITY DEFINER RPC `get_member_equipment`，依同一政策
--      遮蔽（CASE WHEN），是唯一返回敏感值（含 NULL）的合法管道。
--   4) 輔助函式 is_manager() / owns_member() 為 SECURITY DEFINER，
--      才能讀受 RLS 保護的 profiles 表判身份。
--
-- 前端（kazran-alliance-manager）對應：
--   * 所有原先把 equipment / records / exclusive_weapons 加進
--     members base select 的讀取，改為呼叫 RPC 再合併。
--   * 寫入（updateMember、updateMemberCostumeLevel 等）：仍可用，
--     因為只 REVOKE SELECT，UPDATE / INSERT 權限保留（Step 5 的
--     policy 也允許管理者／本人寫入）。
--
-- 執行方式：在 Supabase 後台 → SQL Editor 整段執行（可重複執行）。
-- ============================================================

-- ------------------------------------------------------------
-- STEP 1：目前使用者身份解析 helpers
--
-- 目的：可靠地把「目前登入的 auth.uid()」解析成對應的 profiles 列。
--   解析方式（任一命中即可）：
--     * p.auth_id = auth.uid()   （Discord 登入同步後寫入的 Supabase UUID）
--     * p.id      = auth.uid()   （Email 管理員；profiles.id 直接存 auth UUID）
--     * p.discord_id = 目前使用者的 Discord id（從 auth.identities 取得）
--   ※ 多一個 Discord 回退：某些 Discord profile 的 auth_id 可能是 null
--     （尚未同步 / 舊資料），若只靠 auth_id / id 會解析不到身份，導致
--     RLS 誤判為「非管理員、非本人」→ UPDATE 儲存失敗（permission
--     denied for table members）。加上 discord_id 回退即可修正。
-- ------------------------------------------------------------

-- 回傳目前登入使用者的 Discord snowflake（沒有則 NULL）
CREATE OR REPLACE FUNCTION public.current_discord_id()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT provider_id::text
  FROM auth.identities
  WHERE user_id = auth.uid() AND provider = 'discord'
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.current_discord_id() TO authenticated;

-- 回傳目前使用者對應的 profiles（id、user_role、discord_id）
CREATE OR REPLACE FUNCTION public.current_profile()
RETURNS TABLE (id text, user_role text, discord_id text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.user_role, p.discord_id::text
  FROM profiles p
  WHERE p.auth_id::text = auth.uid()::text
     OR p.id::text = auth.uid()::text
     OR p.discord_id::text = public.current_discord_id()
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.current_profile() TO authenticated;

-- is_manager()：目前使用者是否為管理者（creator / admin / manager）
CREATE OR REPLACE FUNCTION public.is_manager()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.current_profile() cp
    WHERE cp.user_role IN ('creator', 'admin', 'manager')
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_manager() TO authenticated;

-- ------------------------------------------------------------
-- STEP 2：owns_member(p_member_id)
-- 判斷目前登入使用者是否「綁定」此成員（Discord 的 profiles.id 為
-- 逗號分隔的 member_id 清單；Email 管理員的 profiles.id 為 auth UUID，
-- 不會命中 member、因此不算 owns）。
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.owns_member(p_member_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.current_profile() cp
    WHERE p_member_id = ANY(string_to_array(cp.id, ','))
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
-- STEP 4：移除 members 的 table 級 SELECT，只授權「安全欄位」
--
-- 關鍵：Postgres 的 table 級權限與 column 級權限是獨立的，只要角色
-- 持有 table 級 SELECT（Supabase 預設對 anon/authenticated 授權
-- `GRANT SELECT ON ALL TABLES`），column 級的 REVOKE 就完全沒效——
-- 直接 select(equipment) 仍會成功。
--
-- 正確作法：先 REVOKE 整個 members 的 table 級 SELECT，再只 GRANT
-- 需要的「安全欄位」。如此 anon/authenticated 只能讀到已授權的欄位，
-- 敏感欄位（equipment / records / exclusive_weapons）即使直接用
-- anon key select 也會回「permission denied for column」。
--
-- 注意：
--   * 僅影響 SELECT / 讀取；UPDATE / INSERT / DELETE 權限不變，成員
--     仍可更新自己的資料。
--   * service_role / postgres（服務端）完全不受影響，仍可讀全部。
--   * 之後新增欄位預設對 anon/authenticated 不可讀（更安全）。
-- ------------------------------------------------------------
REVOKE SELECT ON public.members FROM anon, authenticated;

GRANT SELECT (
  id,
  name,
  guild_id,
  role,
  color,
  total_score,
  updated_at,
  status,
  play_preferences,
  equipment_note,
  is_equipment_hidden
) ON public.members TO anon, authenticated;

-- ------------------------------------------------------------
-- 驗證：
-- 1) 管理員身份可透過 RPC 看到所有成員：
--    SELECT * FROM public.get_member_equipment();
-- 2) 一般成員看不到隱藏成員的資料（該列三欄應為 NULL）：
--    SELECT * FROM public.get_member_equipment(p_member_ids := ARRAY['<member_id>']);
-- 3) 一般成員直接 select 敏感欄位應被拒（permission denied for column）：
--    SELECT equipment FROM members;

-- ============================================================
-- STEP 5：啟用 Row-Level Security（RLS）做縱深防禦
--
-- STEP 4 用「欄位授權」封鎖了敏感欄位；STEP 5 再以「資料列」為單位
-- 加上 RLS，雙層防護：
--   1) 敏感欄位（equipment / records / exclusive_weapons）→ 欄位權限擋
--   2) 整列可見性 → RLS 擋（管理者全見、本人見自己、未隱藏者人人可讀）
--
-- 政策使用 SECURITY DEFINER helper（is_manager / owns_member）判斷
-- 目前登入者身份。RLS policy 在 invoker 角色下求值，但 helper 以
-- 函式擁有者身份執行，因此能讀取受 RLS 保護的 profiles 表判身份。
--
-- 重要：
--   * service_role / postgres（Supabase 服務端，具 BYPASSRLS）不受
--     RLS 影響，後端仍可讀全部資料。
--   * 啟用 RLS 前，請先確認所有需要寫入 members 的既有流程有對應的
--     INSERT / UPDATE policy（STEP 5 已含：管理者、本人）。
--   * 可重複執行（DROP POLICY IF EXISTS + ENABLE）。
-- ============================================================

ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

-- 管理者：資料列全見
DROP POLICY IF EXISTS "members_select_manager" ON public.members;
CREATE POLICY "members_select_manager"
  ON public.members
  FOR SELECT
  TO authenticated, anon
  USING (public.is_manager());

-- 本人（綁定的 profile）：可讀自己的列
DROP POLICY IF EXISTS "members_select_owner" ON public.members;
CREATE POLICY "members_select_owner"
  ON public.members
  FOR SELECT
  TO authenticated, anon
  USING (public.owns_member(id));

-- 一般成員：可讀「未隱藏裝備表」的列
DROP POLICY IF EXISTS "members_select_public" ON public.members;
CREATE POLICY "members_select_public"
  ON public.members
  FOR SELECT
  TO authenticated, anon
  USING (COALESCE(is_equipment_hidden, false) = false);

-- 新增成員：管理者 或 本人
DROP POLICY IF EXISTS "members_insert" ON public.members;
CREATE POLICY "members_insert"
  ON public.members
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_manager() OR public.owns_member(id));

-- 更新成員：管理者 或 本人（本人可更新自己的紀錄／裝備／隱藏開關）
DROP POLICY IF EXISTS "members_update" ON public.members;
CREATE POLICY "members_update"
  ON public.members
  FOR UPDATE
  TO authenticated
  USING (public.is_manager() OR public.owns_member(id))
  WITH CHECK (public.is_manager() OR public.owns_member(id));

-- 刪除成員：僅管理者
DROP POLICY IF EXISTS "members_delete" ON public.members;
CREATE POLICY "members_delete"
  ON public.members
  FOR DELETE
  TO authenticated
  USING (public.is_manager());

-- ------------------------------------------------------------
--（可選）FORCE ROW LEVEL SECURITY：
-- 讓即使是資料表擁有者也要經過 RLS。一般 Supabase 情境不需要，
-- 需要時再取消下面註解：
-- ALTER TABLE public.members FORCE ROW LEVEL SECURITY;
-- ------------------------------------------------------------

-- ------------------------------------------------------------
-- 驗證：
-- 1) 確認已啟用與政策清單：
--    SELECT relname, relrowsecurity
--      FROM pg_class WHERE relname = 'members';
--    SELECT polname, cmd, qual
--      FROM pg_policies WHERE tablename = 'members';
-- 2) 管理員身份：SELECT id, name FROM members; 應看得到所有列。
-- 3) 一般成員：應只看到 is_equipment_hidden = false（及自己的）列。
-- ------------------------------------------------------------
-- ------------------------------------------------------------
