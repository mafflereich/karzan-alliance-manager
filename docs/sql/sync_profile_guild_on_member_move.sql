-- ============================================================
-- 成員轉移公會時，自動同步 profiles.user_guilds
--
-- 目的：成員在系統內被轉移公會（guild_id 變更）後，不需要重新登入
--       就能在前端看到新公會。做法分兩層：
--         1) 本 Trigger：members 的 guild_id / status 變更時，
--            自動重算綁定 profile 的 user_guilds（公會名稱聯集）
--         2) Realtime：把 profiles 加入 realtime publication，
--            前端訂閱 UPDATE 事件即時刷新 userGuildRoles
--            （對應前端：src/store/index.tsx 的 profiles-realtime channel）
--
-- 執行方式：在 Supabase 後台 → SQL Editor 依序執行 STEP 1 ~ STEP 3。
--
-- 備註：
--   * profiles.id 欄位同時被兩套系統使用——Discord 用戶：逗號分隔的
--     member_id 清單（身份綁定）；Email 管理員：auth UUID。本 Trigger
--     只會命中「以 member_id 綁定」的列，管理員 profile 不受影響。
--   * user_guilds 會以 members 表為準重算。若某個 profile 綁定多個
--     member，則取這些 member 所屬公會名稱的聯集。
--   * 之後重新登入觸發 sync-discord-roles 時，仍會以 Discord 身份組
--     覆寫 user_guilds，兩者需保持一致（轉移公會時也要同步 Discord 身份組）。
-- ============================================================

-- ------------------------------------------------------------
-- STEP 1：建立 Trigger Function
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION sync_profile_guild_for_member()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 為所有「綁定此 member 的 profile」重算 user_guilds =
  -- 所有綁定且 active 的 member 之公會名稱聯集（逗號分隔）。
  -- 此處在 AFTER 階段執行，NEW.guild_id / NEW.status 已是新值。
  UPDATE profiles p
  SET user_guilds = (
    SELECT string_agg(DISTINCT g.name, ',' ORDER BY g.name)
    FROM members m
    JOIN guilds g ON g.id = m.guild_id
    WHERE m.status = 'active'
      AND m.guild_id IS NOT NULL
      AND m.id::text = ANY(string_to_array(p.id, ','))
  )
  WHERE NEW.id::text = ANY(string_to_array(p.id, ','));

  RETURN NEW;
END;
$$;

-- ------------------------------------------------------------
-- STEP 2：把 Trigger 掛到 members 表
--         INSERT：新增 member 時也同步（例如重新啟用）
--         UPDATE OF guild_id, status：轉移 / 歸檔 / 啟用時同步
-- ------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_members_sync_profile_guild ON members;

CREATE TRIGGER trg_members_sync_profile_guild
AFTER INSERT OR UPDATE OF guild_id, status ON members
FOR EACH ROW
EXECUTE FUNCTION sync_profile_guild_for_member();

-- ------------------------------------------------------------
-- STEP 3：啟用 profiles 的 Realtime（前端才能收到 UPDATE 事件）
--         已存在時會跳過，因此可重複執行
-- ------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
  END IF;
END $$;

-- ------------------------------------------------------------
-- 驗證
-- 1) 檢查特定 member 的綁定 profile 目前 user_guilds：
--    SELECT p.discord_id, p.user_guilds
--    FROM profiles p
--    WHERE p.id LIKE '%<member_id>%';
-- 2) 把該 member 移到另一個公會（UPDATE members SET guild_id = '<新公會id>'
--    WHERE id = '<member_id>'），再跑一次上面的查詢，
--    user_guilds 應已變成新公會名稱（或 NULL 若該公會已被刪除）。
-- ------------------------------------------------------------
