-- ============================================================
-- characters：新增角色篩選 metadata 欄位 + 填寫既有角色資料
--
-- 目的：支援「我的輸出服裝」頁面依
--       性別（gender）、攻擊類型（atk_type）、星數（star）、
--       屬性（attribute）篩選角色。
--
-- 資料來源：https://browndust2-db.souseha.com 的角色資料集
--           （characters_base，僅對既有資料庫補齊欄位；
--            全新資料庫請直接用 seed_characters_from_bd2db.sql）
--
-- 執行方式：Supabase 後台 → SQL Editor 執行。
-- 設計：ADD COLUMN IF NOT EXISTS + WHERE id 精準更新，
--       不影響其他現有欄位，可安全重複執行。
-- ============================================================

-- ------------------------------------------------------------
-- STEP 1：新增 metadata 欄位（皆可為 NULL，舊角色未填時不會崩潰）
-- ------------------------------------------------------------
ALTER TABLE characters ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE characters ADD COLUMN IF NOT EXISTS atk_type TEXT;
ALTER TABLE characters ADD COLUMN IF NOT EXISTS star TEXT;
ALTER TABLE characters ADD COLUMN IF NOT EXISTS attribute TEXT;

-- ------------------------------------------------------------
-- STEP 2：依角色 id 填寫資料（共 84 位）
--         註：Aquila 的性別在資料集原始資料即為空值，設為 NULL
--             （未知），避免臆測標註。
-- ------------------------------------------------------------
UPDATE characters
  SET gender = '男', atk_type = '物', star = '5', attribute = '火'
  WHERE id = 'Alec';

UPDATE characters
  SET gender = '女', atk_type = '物', star = '5', attribute = '火'
  WHERE id = 'Anastasia';

UPDATE characters
  SET gender = '男', atk_type = '物', star = '4', attribute = '火'
  WHERE id = 'Andrew';

UPDATE characters
  SET gender = '女', atk_type = '魔', star = '5', attribute = '光'
  WHERE id = 'Angelica';

UPDATE characters
  SET gender = NULL, atk_type = '物', star = '5', attribute = '火'
  WHERE id = 'Aquila';

UPDATE characters
  SET gender = '女', atk_type = '魔', star = '3', attribute = '光'
  WHERE id = 'Arines';

UPDATE characters
  SET gender = '女', atk_type = '物', star = '3', attribute = '火'
  WHERE id = 'Beatrice';

UPDATE characters
  SET gender = '女', atk_type = '物', star = '4', attribute = '風'
  WHERE id = 'Bernie';

UPDATE characters
  SET gender = '女', atk_type = '物', star = '5', attribute = '暗'
  WHERE id = 'Blade';

UPDATE characters
  SET gender = '男', atk_type = '物', star = '3', attribute = '水'
  WHERE id = 'Carlson';

UPDATE characters
  SET gender = '女', atk_type = '魔', star = '5', attribute = '暗'
  WHERE id = 'Celia';

UPDATE characters
  SET gender = '女', atk_type = '魔', star = '3', attribute = '水'
  WHERE id = 'Cynthia';

UPDATE characters
  SET gender = '女', atk_type = '魔', star = '5', attribute = '風'
  WHERE id = 'Dalvi';

UPDATE characters
  SET gender = '女', atk_type = '物', star = '5', attribute = '水'
  WHERE id = 'Darian';

UPDATE characters
  SET gender = '女', atk_type = '魔', star = '5', attribute = '風'
  WHERE id = 'Diana';

UPDATE characters
  SET gender = '女', atk_type = '魔', star = '5', attribute = '暗'
  WHERE id = 'Eclipse';

UPDATE characters
  SET gender = '女', atk_type = '物', star = '5', attribute = '暗'
  WHERE id = 'Eleaneer';

UPDATE characters
  SET gender = '女', atk_type = '物', star = '5', attribute = '火'
  WHERE id = 'Elise';

UPDATE characters
  SET gender = '女', atk_type = '魔', star = '4', attribute = '暗'
  WHERE id = 'Elpis';

UPDATE characters
  SET gender = '女', atk_type = '物', star = '3', attribute = '光'
  WHERE id = 'Emma';

UPDATE characters
  SET gender = '女', atk_type = '物', star = '5', attribute = '火'
  WHERE id = 'Eris';

UPDATE characters
  SET gender = '男', atk_type = '物', star = '3', attribute = '風'
  WHERE id = 'Fred';

UPDATE characters
  SET gender = '女', atk_type = '魔', star = '5', attribute = '水'
  WHERE id = 'Glacia';

UPDATE characters
  SET gender = '男', atk_type = '物', star = '5', attribute = '火'
  WHERE id = 'GoblinSlayer';

UPDATE characters
  SET gender = '女', atk_type = '魔', star = '5', attribute = '水'
  WHERE id = 'Granadair';

UPDATE characters
  SET gender = '女', atk_type = '物', star = '5', attribute = '光'
  WHERE id = 'Granhildr';

UPDATE characters
  SET gender = '男', atk_type = '物', star = '5', attribute = '風'
  WHERE id = 'Gray';

UPDATE characters
  SET gender = '男', atk_type = '物', star = '3', attribute = '風'
  WHERE id = 'Gynt';

UPDATE characters
  SET gender = '女', atk_type = '魔', star = '5', attribute = '光'
  WHERE id = 'Helena';

UPDATE characters
  SET gender = '女', atk_type = '物', star = '5', attribute = '風'
  WHERE id = 'HighElfArcher';

UPDATE characters
  SET gender = '女', atk_type = '物', star = '5', attribute = '風'
  WHERE id = 'Hikage';

UPDATE characters
  SET gender = '女', atk_type = '物', star = '5', attribute = '火'
  WHERE id = 'Ikaruga';

UPDATE characters
  SET gender = '女', atk_type = '物', star = '3', attribute = '水'
  WHERE id = 'Ingrid';

UPDATE characters
  SET gender = '男', atk_type = '魔', star = '4', attribute = '光'
  WHERE id = 'Jayden';

UPDATE characters
  SET gender = '女', atk_type = '魔', star = '3', attribute = '風'
  WHERE id = 'Julie';

UPDATE characters
  SET gender = '女', atk_type = '物', star = '5', attribute = '光'
  WHERE id = 'Justia';

UPDATE characters
  SET gender = '男', atk_type = '物', star = '4', attribute = '暗'
  WHERE id = 'Kry';

UPDATE characters
  SET gender = '男', atk_type = '物', star = '5', attribute = '火'
  WHERE id = 'Lathel';

UPDATE characters
  SET gender = '女', atk_type = '物', star = '4', attribute = '光'
  WHERE id = 'Layla';

UPDATE characters
  SET gender = '女', atk_type = '物', star = '5', attribute = '風'
  WHERE id = 'Lecliss';

UPDATE characters
  SET gender = '女', atk_type = '魔', star = '5', attribute = '火'
  WHERE id = 'Levia';

UPDATE characters
  SET gender = '女', atk_type = '物', star = '5', attribute = '火'
  WHERE id = 'Liatris';

UPDATE characters
  SET gender = '女', atk_type = '物', star = '5', attribute = '火'
  WHERE id = 'Liberta';

UPDATE characters
  SET gender = '女', atk_type = '魔', star = '4', attribute = '風'
  WHERE id = 'Lisianne';

UPDATE characters
  SET gender = '女', atk_type = '魔', star = '5', attribute = '火'
  WHERE id = 'Loen';

UPDATE characters
  SET gender = '女', atk_type = '魔', star = '4', attribute = '暗'
  WHERE id = 'Lucrezia';

UPDATE characters
  SET gender = '女', atk_type = '物', star = '5', attribute = '暗'
  WHERE id = 'Luvencia';

UPDATE characters
  SET gender = '女', atk_type = '物', star = '3', attribute = '水'
  WHERE id = 'Lydia';

UPDATE characters
  SET gender = '女', atk_type = '魔', star = '5', attribute = '水'
  WHERE id = 'Mamonir';

UPDATE characters
  SET gender = '女', atk_type = '魔', star = '3', attribute = '暗'
  WHERE id = 'Maria';

UPDATE characters
  SET gender = '女', atk_type = '魔', star = '5', attribute = '光'
  WHERE id = 'Michaela';

UPDATE characters
  SET gender = '女', atk_type = '魔', star = '5', attribute = '水'
  WHERE id = 'Morpeah';

UPDATE characters
  SET gender = '男', atk_type = '魔', star = '5', attribute = '暗'
  WHERE id = 'Nartas';

UPDATE characters
  SET gender = '女', atk_type = '物', star = '5', attribute = '風'
  WHERE id = 'Nebris';

UPDATE characters
  SET gender = '女', atk_type = '魔', star = '5', attribute = '風'
  WHERE id = 'Nekyndalia';

UPDATE characters
  SET gender = '女', atk_type = '魔', star = '5', attribute = '光'
  WHERE id = 'Olivier';

UPDATE characters
  SET gender = '男', atk_type = '魔', star = '5', attribute = '風'
  WHERE id = 'Olstein';

UPDATE characters
  SET gender = '女', atk_type = '魔', star = '5', attribute = '暗'
  WHERE id = 'Palette';

UPDATE characters
  SET gender = '女', atk_type = '魔', star = '5', attribute = '光'
  WHERE id = 'Priestess';

UPDATE characters
  SET gender = '女', atk_type = '物', star = '5', attribute = '水'
  WHERE id = 'Rafina';

UPDATE characters
  SET gender = '女', atk_type = '魔', star = '5', attribute = '光'
  WHERE id = 'Refithea';

UPDATE characters
  SET gender = '男', atk_type = '物', star = '3', attribute = '水'
  WHERE id = 'Remnunt';

UPDATE characters
  SET gender = '女', atk_type = '物', star = '3', attribute = '風'
  WHERE id = 'Rigenette';

UPDATE characters
  SET gender = '女', atk_type = '物', star = '5', attribute = '暗'
  WHERE id = 'Rou';

UPDATE characters
  SET gender = '女', atk_type = '魔', star = '5', attribute = '水'
  WHERE id = 'Roxy';

UPDATE characters
  SET gender = '女', atk_type = '物', star = '5', attribute = '火'
  WHERE id = 'Rubia';

UPDATE characters
  SET gender = '女', atk_type = '物', star = '5', attribute = '光'
  WHERE id = 'SacredJustia';

UPDATE characters
  SET gender = '女', atk_type = '魔', star = '4', attribute = '暗'
  WHERE id = 'Samay';

UPDATE characters
  SET gender = '女', atk_type = '魔', star = '5', attribute = '水'
  WHERE id = 'Scheherazade';

UPDATE characters
  SET gender = '女', atk_type = '魔', star = '5', attribute = '暗'
  WHERE id = 'Seir';

UPDATE characters
  SET gender = '女', atk_type = '魔', star = '5', attribute = '暗'
  WHERE id = 'Sonya';

UPDATE characters
  SET gender = '女', atk_type = '魔', star = '5', attribute = '光'
  WHERE id = 'SwordMaiden';

UPDATE characters
  SET gender = '女', atk_type = '物', star = '5', attribute = '水'
  WHERE id = 'Sylvia';

UPDATE characters
  SET gender = '女', atk_type = '物', star = '5', attribute = '水'
  WHERE id = 'Teresse';

UPDATE characters
  SET gender = '女', atk_type = '物', star = '5', attribute = '風'
  WHERE id = 'Tyr';

UPDATE characters
  SET gender = '女', atk_type = '魔', star = '5', attribute = '風'
  WHERE id = 'Venaka';

UPDATE characters
  SET gender = '女', atk_type = '物', star = '5', attribute = '光'
  WHERE id = 'Ventana';

UPDATE characters
  SET gender = '男', atk_type = '物', star = '3', attribute = '火'
  WHERE id = 'Wiggle';

UPDATE characters
  SET gender = '女', atk_type = '物', star = '5', attribute = '水'
  WHERE id = 'Wilhelmina';

UPDATE characters
  SET gender = '女', atk_type = '物', star = '5', attribute = '風'
  WHERE id = 'Yomi';

UPDATE characters
  SET gender = '女', atk_type = '魔', star = '5', attribute = '風'
  WHERE id = 'Yozakura';

UPDATE characters
  SET gender = '女', atk_type = '魔', star = '5', attribute = '水'
  WHERE id = 'Yumi';

UPDATE characters
  SET gender = '女', atk_type = '物', star = '5', attribute = '光'
  WHERE id = 'Yuri';

UPDATE characters
  SET gender = '女', atk_type = '物', star = '5', attribute = '風'
  WHERE id = 'Zenith';

-- ------------------------------------------------------------
-- 驗證：應回傳 83 列（Aquila 性別為 NULL 不被列出）
-- ------------------------------------------------------------
SELECT id, name, gender, atk_type, star, attribute
FROM characters
WHERE gender IS NOT NULL
ORDER BY order_num;
