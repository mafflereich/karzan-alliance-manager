-- ============================================================
-- 移除 3★、4★ 角色及其服裝
--
-- 目的：僅保留 5★ 角色的輸出服裝資料。
--       現階段只追蹤 5★ 角色，故將 3★、4★ 角色及其服裝一併移除。
--
-- 資料來源：browndust2-db.souseha.com 的角色資料集（star 欄位）
--
-- 注意：
--   1. 需先刪除 costumes（含 character_id 外鍵）再刪 characters。
--   2. 此為不可回復操作，建議執行前先備份：
--      CREATE TABLE costumes_backup AS SELECT * FROM costumes;
--      CREATE TABLE characters_backup AS SELECT * FROM characters;
--
-- 執行方式：Supabase 後台 → SQL Editor 執行。
-- ============================================================

-- ------------------------------------------------------------
-- STEP 1（可選）：備份，以免誤刪
-- ------------------------------------------------------------
-- CREATE TABLE costumes_backup AS SELECT * FROM costumes;
-- CREATE TABLE characters_backup AS SELECT * FROM characters;

-- ------------------------------------------------------------
-- STEP 2：刪除 3★、4★ 角色的所有服裝（共 29 件）
-- ------------------------------------------------------------
DELETE FROM costumes
WHERE id IN ('Lisianne_1', 'Bernie_1', 'Layla_1', 'Lucrezia_1', 'Samay_1', 'Samay_2', 'Kry_1', 'Kry_2', 'Jayden_1', 'Jayden_2', 'Andrew_1', 'Andrew_2', 'Elpis_1', 'Fred_1', 'Gynt_1', 'Remnunt_1', 'Maria_1', 'Arines_1', 'Emma_1', 'Emma_2', 'Ingrid_1', 'Cynthia_1', 'Julie_1', 'Carlson_1', 'Lydia_1', 'Rigenette_1', 'Beatrice_1', 'Wiggle_1', 'Wiggle_2');

-- ------------------------------------------------------------
-- STEP 3：刪除 3★、4★ 角色（共 23 位）
-- ------------------------------------------------------------
DELETE FROM characters
WHERE id IN ('Andrew', 'Arines', 'Beatrice', 'Bernie', 'Carlson', 'Cynthia', 'Elpis', 'Emma', 'Fred', 'Gynt', 'Ingrid', 'Jayden', 'Julie', 'Kry', 'Layla', 'Lisianne', 'Lucrezia', 'Lydia', 'Maria', 'Remnunt', 'Rigenette', 'Samay', 'Wiggle');

-- ------------------------------------------------------------
-- 驗證：以下應回傳 0 列
-- ------------------------------------------------------------
SELECT c.id, c.name, c.star
FROM characters c
WHERE c.star IN ('3', '4');
