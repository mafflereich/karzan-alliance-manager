-- ============================================================
-- characters：新增全部角色資料（資料來源：browndust2-db.souseha.com）
--
-- 目的：初始化角色資料庫（管理後台「服裝設定」左欄），
--       供 costumes.character_id 的外鍵參照。
-- 需先執行本檔，再執行 seed_costumes_from_bd2db.sql。
--
-- 資料來源：https://browndust2-db.souseha.com 的角色資料集
--           （characters_base + characters_i18n）
--
-- 欄位對應：
--   id        = 角色 id（characterId，如 Lathel）
--   name      = 中文名（character）
--   name_e    = 英文名（enName / character_en）
--   order_num = 排序（依資料集角色登場順序遞增）
--   gender    = 性別（男 / 女）
--   atk_type  = 攻擊類型（物 / 魔）
--   star      = 星數（5 / 4 / 3）
--   attribute = 屬性（火 / 水 / 風 / 光 / 暗）
--
-- 設計：使用 ON CONFLICT (id) DO NOTHING，
--       已存在的手動角色（id 相同）不會被覆寫，可安全重複執行。
--
-- 執行方式：Supabase 後台 → SQL Editor 執行。
-- ============================================================

INSERT INTO characters (id, name, name_e, order_num, gender, atk_type, star, attribute) VALUES
  ('Lathel', '拉德爾', 'Lathel', 1, '男', '物', '5', '火'),
  ('Justia', '悠絲緹亞', 'Justia', 2, '女', '物', '5', '光'),
  ('Scheherazade', '莎赫拉查德', 'Scheherazade', 3, '女', '魔', '5', '水'),
  ('Gray', '格雷', 'Gray', 4, '男', '物', '5', '風'),
  ('Rou', '魯', 'Rou', 5, '女', '物', '5', '暗'),
  ('Olstein', '奧爾施塔因', 'Olstein', 6, '男', '魔', '5', '風'),
  ('Sylvia', '席比雅', 'Sylvia', 7, '女', '物', '5', '水'),
  ('Rubia', '露比雅', 'Rubia', 8, '女', '物', '5', '火'),
  ('Eclipse', '伊柯利普斯', 'Eclipse', 9, '女', '魔', '5', '暗'),
  ('Teresse', '泰瑞絲', 'Teresse', 10, '女', '物', '5', '水'),
  ('Liatris', '莉亞特里斯', 'Liatris', 11, '女', '物', '5', '火'),
  ('Alec', '艾瑞克', 'Alec', 12, '男', '物', '5', '火'),
  ('Seir', '賽爾', 'Seir', 13, '女', '魔', '5', '暗'),
  ('Celia', '西利亞', 'Celia', 14, '女', '魔', '5', '暗'),
  ('Anastasia', '安娜塔西亞', 'Anastasia', 15, '女', '物', '5', '火'),
  ('Lecliss', '萊克莉斯', 'Lecliss', 16, '女', '物', '5', '風'),
  ('Rafina', '拉菲娜', 'Rafina', 17, '女', '物', '5', '水'),
  ('Elise', '愛麗潔', 'Elise', 18, '女', '物', '5', '火'),
  ('Helena', '海倫娜', 'Helena', 19, '女', '魔', '5', '光'),
  ('Eleaneer', '艾尼爾', 'Eleaneer', 20, '女', '物', '5', '暗'),
  ('Angelica', '安潔莉卡', 'Angelica', 21, '女', '魔', '5', '光'),
  ('Glacia', '克蕾西亞', 'Glacia', 22, '女', '魔', '5', '水'),
  ('Ventana', '班塔納', 'Ventana', 23, '女', '物', '5', '光'),
  ('Diana', '黛安娜', 'Diana', 24, '女', '魔', '5', '風'),
  ('Zenith', '傑尼斯', 'Zenith', 25, '女', '物', '5', '風'),
  ('Yuri', '尤里', 'Yuri', 26, '女', '物', '5', '光'),
  ('Dalvi', '達非', 'Dalvi', 27, '女', '魔', '5', '風'),
  ('Nartas', '納羅達斯', 'Nartas', 28, '男', '魔', '5', '暗'),
  ('Granhildr', '葛蘭西特', 'Granhildr', 29, '女', '物', '5', '光'),
  ('Refithea', '芮彼泰雅', 'Refithea', 30, '女', '魔', '5', '光'),
  ('Loen', '羅安', 'Loen', 31, '女', '魔', '5', '火'),
  ('Roxy', '洛琪希', 'Roxy', 32, '女', '魔', '5', '水'),
  ('Eris', '艾莉絲', 'Eris', 33, '女', '物', '5', '火'),
  ('Venaka', '貝那卡', 'Venaka', 34, '女', '魔', '5', '風'),
  ('Nebris', '內布利斯', 'Nebris', 35, '女', '物', '5', '風'),
  ('SacredJustia', '神聖悠絲緹亞', 'Sacred Justia', 36, '女', '物', '5', '光'),
  ('Levia', '萊維亞', 'Levia', 37, '女', '魔', '5', '火'),
  ('Morpeah', '墨菲亞', 'Morpeah', 38, '女', '魔', '5', '水'),
  ('Michaela', '米卡埃拉', 'Michaela', 39, '女', '魔', '5', '光'),
  ('Yomi', '詠', 'Yomi', 40, '女', '物', '5', '風'),
  ('Yozakura', '夜櫻', 'Yozakura', 41, '女', '魔', '5', '風'),
  ('Hikage', '日影', 'Hikage', 42, '女', '物', '5', '風'),
  ('Yumi', '雪泉', 'Yumi', 43, '女', '魔', '5', '水'),
  ('Luvencia', '盧班希亞', 'Luvencia', 44, '女', '物', '5', '暗'),
  ('Liberta', '黎維塔', 'Liberta', 45, '女', '物', '5', '火'),
  ('Blade', '布萊德', 'Blade', 46, '女', '物', '5', '暗'),
  ('Wilhelmina', '威廉明娜', 'Wilhelmina', 47, '女', '物', '5', '水'),
  ('GoblinSlayer', '哥布林殺手', 'Goblin Slayer', 48, '男', '物', '5', '火'),
  ('Priestess', '女神官', 'Priestess', 49, '女', '魔', '5', '光'),
  ('HighElfArcher', '妖精弓手', 'High Elf Archer', 50, '女', '物', '5', '風'),
  ('SwordMaiden', '劍之聖女', 'Sword Maiden', 51, '女', '魔', '5', '光'),
  ('Olivier', '奧利維爾', 'Olivier', 52, '女', '魔', '5', '光'),
  ('Sonya', '索妮亞', 'Sonya', 53, '女', '魔', '5', '暗'),
  ('Tyr', '提爾', 'Tyr', 54, '女', '物', '5', '風'),
  ('Darian', '達麗安', 'Darian', 55, '女', '物', '5', '水'),
  ('Granadair', '葛拉娜德', 'Granadair', 56, '女', '魔', '5', '水'),
  ('Palette', '帕萊特', 'Palette', 57, '女', '魔', '5', '暗'),
  ('Mamonir', '馬莫尼勒', 'Mamonir', 58, '女', '魔', '5', '水'),
  ('Ikaruga', '斑鳩', 'Ikaruga', 59, '女', '物', '5', '火'),
  ('Nekyndalia', '涅肯達莉亞', 'Nekyndalia', 60, '女', '魔', '5', '風'),
  ('Aquila', '阿奇拉', 'Aquila', 61, NULL, '物', '5', '火'),
  ('Lisianne', '莉西安', 'Lisianne', 62, '女', '魔', '4', '風'),
  ('Bernie', '維爾尼', 'Bernie', 63, '女', '物', '4', '風'),
  ('Layla', '蕾拉', 'Layla', 64, '女', '物', '4', '光'),
  ('Lucrezia', '盧克雷齊亞', 'Lucrezia', 65, '女', '魔', '4', '暗'),
  ('Samay', '莎美', 'Samay', 66, '女', '魔', '4', '暗'),
  ('Kry', '克萊', 'Kry', 67, '男', '物', '4', '暗'),
  ('Jayden', '傑登', 'Jayden', 68, '男', '魔', '4', '光'),
  ('Andrew', '安德魯', 'Andrew', 69, '男', '物', '4', '火'),
  ('Elpis', '厄爾比斯', 'Elpis', 70, '女', '魔', '4', '暗'),
  ('Fred', '弗雷德', 'Fred', 71, '男', '物', '3', '風'),
  ('Gynt', '君特', 'Gynt', 72, '男', '物', '3', '風'),
  ('Remnunt', '雷南特', 'Remnunt', 73, '男', '物', '3', '水'),
  ('Maria', '瑪麗亞', 'Maria', 74, '女', '魔', '3', '暗'),
  ('Arines', '阿里內斯', 'Arines', 75, '女', '魔', '3', '光'),
  ('Emma', '艾瑪', 'Emma', 76, '女', '物', '3', '光'),
  ('Ingrid', '英格利得', 'Ingrid', 77, '女', '物', '3', '水'),
  ('Cynthia', '辛西亞', 'Cynthia', 78, '女', '魔', '3', '水'),
  ('Julie', '茱莉', 'Julie', 79, '女', '魔', '3', '風'),
  ('Carlson', '卡森', 'Carlson', 80, '男', '物', '3', '水'),
  ('Lydia', '黎迪雅', 'Lydia', 81, '女', '物', '3', '水'),
  ('Rigenette', '莉茲內', 'Rigenette', 82, '女', '物', '3', '風'),
  ('Beatrice', '比阿特麗絲', 'Beatrice', 83, '女', '物', '3', '火'),
  ('Wiggle', '威格', 'Wiggle', 84, '男', '物', '3', '火')
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------
-- 驗證：應回傳 84 列
-- ------------------------------------------------------------
SELECT count(*) AS total FROM characters;
