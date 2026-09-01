-- ============================================================
-- members：新增「裝備表 / 遊玩傾向 / 備註 / 隱藏開關」欄位
--
-- 對應前端（kazran-alliance-manager）的個人裝備表功能：
--   - equipment            jsonb   → 每項裝備類別的 23C / 24C 數量
--   - play_preferences     jsonb   → 遊玩傾向（modes 可複選 + dedication 單選）
--   - equipment_note       text    → 成員自行填寫的備註
--   - is_equipment_hidden  boolean → 勾選後僅管理者可查看裝備表
--
-- 執行方式：在 Supabase 後台 → SQL Editor 執行整段即可（可重複執行）。
-- 說明：ALTER TABLE ... ADD COLUMN IF NOT EXISTS 加上後可安全重跑，
--       不會因為欄位已存在而報錯。
-- ============================================================

-- ------------------------------------------------------------
-- equipment：每項裝備類別的 23C / 24C 數量
-- 形如 { "phys_weapon": {"c23": 2, "c24": 1}, "magic_weapon": ... }
-- ------------------------------------------------------------
ALTER TABLE members
  ADD COLUMN IF NOT EXISTS equipment jsonb;

-- ------------------------------------------------------------
-- play_preferences：遊玩傾向
-- 形如 { "modes": ["guild_raid", "story"], "dedication": "normal" }
--   modes      可複選：guild_raid / beast / golden_mirror / story
--   dedication 只能選一：aggressive / normal / casual
-- ------------------------------------------------------------
ALTER TABLE members
  ADD COLUMN IF NOT EXISTS play_preferences jsonb;

-- ------------------------------------------------------------
-- equipment_note：成員自行填寫的備註（純文字）
-- ------------------------------------------------------------
ALTER TABLE members
  ADD COLUMN IF NOT EXISTS equipment_note text;

-- ------------------------------------------------------------
-- is_equipment_hidden：裝備表隱藏開關
--   true  = 一般成員看不到該成員的裝備表，僅管理者可查看
--   false / NULL = 所有登入成員都可查看
-- ------------------------------------------------------------
ALTER TABLE members
  ADD COLUMN IF NOT EXISTS is_equipment_hidden boolean DEFAULT false;

-- ------------------------------------------------------------
-- （建議）建立 GIN 索引以加速 jsonb 查詢（若之後會用 equipment 內容篩選）
-- 若暫時不需要，可略過。
-- ------------------------------------------------------------
-- CREATE INDEX IF NOT EXISTS idx_members_equipment
--   ON members USING GIN (equipment);

-- ------------------------------------------------------------
-- 驗證：確認四欄位皆已存在
-- ------------------------------------------------------------
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'members'
  AND column_name IN ('equipment', 'play_preferences', 'equipment_note', 'is_equipment_hidden')
ORDER BY column_name;
