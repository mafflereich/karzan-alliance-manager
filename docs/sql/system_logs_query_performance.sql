-- ============================================================
-- system_logs：新增索引以解決「statement timeout」問題
--
-- 症狀：Admin Panel → 系統日誌 讀取時報
--       "canceling statement due to statement timeout"
--
-- 原因：列表查詢為
--       SELECT ... WHERE level IN (...) ORDER BY created_at DESC LIMIT 100
--       但 system_logs 沒有 level / created_at 索引，
--       資料表變大後會做全表掃描 (seq scan) + 排序 (sort)，
--       超出 Supabase 的 statement timeout。
--
-- 修復：建立兩支索引
--       1. (created_at DESC)：讓「不篩選層級」的排序直接走索引
--       2. (level, created_at DESC)：讓預設的 error/fatal 篩選查詢
--          直接走索引（index-only scan），不必全表掃描
--
-- 執行方式：在 Supabase 後台 → SQL Editor 依序執行。
-- ============================================================

-- ------------------------------------------------------------
-- 建議先跑：確認目前該表的資料量（評估是否為瓶頸）
-- ------------------------------------------------------------
SELECT count(*) AS total_logs
FROM system_logs;

-- ------------------------------------------------------------
-- 建立索引（IF NOT EXISTS 可重複執行）
-- ------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at
  ON system_logs (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_system_logs_level_created_at
  ON system_logs (level, created_at DESC);

-- ------------------------------------------------------------
-- 驗證：EXPLAIN 應顯示使用上方索引，而非 Seq Scan + Sort
-- ------------------------------------------------------------
EXPLAIN
SELECT id, created_at, level, source, action, user_id, discord_id, message
FROM system_logs
WHERE level IN ('error', 'fatal')
ORDER BY created_at DESC
LIMIT 100;
