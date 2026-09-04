-- ============================================================
-- 裝備表 v3：部位個別隱私（category_visibility）
--
-- 功能（前端 kazran-alliance-manager 對應）：
--   在 equipment_visibility（全域隱私）之上，新增每部位 / 每 C 值的
--   獨立隱私覆蓋，形成層級：
--       全域 (equipment_visibility) → 部位 (category_visibility[key].visibility)
--       → C值 (category_visibility[key].c23 / .c24)
--
--   category_visibility 為 jsonb，結構：
--   {
--     "<category_key>": {
--       "visibility": "public" | "all_manager" | "guild_manager" | "admin",
--       "c23": "<EquipmentVisibility>",   // 可選
--       "c24": "<EquipmentVisibility>"    // 可選
--     },
--     ...
--   }
--
-- 執行方式：在 Supabase 後台 → SQL Editor 整段執行（可重複執行）。
-- 注意：需先執行過 member_equipment_v2.sql。
-- ============================================================

-- ------------------------------------------------------------
-- STEP 1：新增欄位（idempotent）
-- ------------------------------------------------------------
ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS category_visibility jsonb;

COMMENT ON COLUMN public.members.category_visibility IS
  '每部位獨立隱私覆蓋（覆蓋 equipment_visibility）。結構見 member_equipment_v3.sql 註解。';

-- ------------------------------------------------------------
-- STEP 2：將 category_visibility 加入「一般（非敏感）欄位」授權清單
--   （模擬 member_equipment_v2.sql STEP 6；一般欄位授權前端讀取。
--   是否對未授權使用者遮蔽，交由前端 canViewCategoryForUI 與
--   can_view_equipment RPC 的粗顆粒判斷。）
-- ------------------------------------------------------------
GRANT SELECT (
  category_visibility
) ON public.members TO anon, authenticated;

-- ------------------------------------------------------------
-- 驗證
--   SELECT id, name, equipment_visibility, category_visibility
--   FROM members LIMIT 5;
-- ------------------------------------------------------------
