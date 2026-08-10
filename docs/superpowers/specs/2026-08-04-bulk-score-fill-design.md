# 一鍵輸入分數（Bulk Score Fill）— 設計文件

日期：2026-08-04
範圍：`/raid-manager` 頁面的 `GuildRaidTable`

## 目標

公會戰記分數管理頁面中，管理員經常需要把同一個分數填給大量成員（例如整季未參戰者填底分、或全隊同分）。目前只能逐格輸入，30 人公會要操作 30 次。

提供「一鍵輸入分數」：在公會表格底部按一下，於 Modal 中輸入分數、勾選成員、二次確認後一次寫入。

## 使用者流程

1. 管理員在某個公會表格底部（中位數列下方）按「一鍵輸入分數」
2. **Step 1 — 輸入 + 勾選**
   - Modal 標題顯示該公會名稱
   - 輸入要寫入的分數
   - 下方列出該公會**全部成員**，預設勾選分數為空者
   - 可自由調整勾選
3. **Step 2 — 確認**
   - 顯示「將寫入 X 分給【公會】的 N 位成員」
   - 列出成員名單；若含已有分數者，警示將被覆蓋
4. 確認後一次寫入資料庫，關閉 Modal，表格與中位數即時更新

## UI 規格

### 按鈕

- 位置：`GuildRaidTable` 表格底部，中位數列**下方**
- 顯示條件：`!isArchived && !isComparisonMode`
  （歸檔賽季與比較模式下分數本來就是唯讀）
- 權限：頁面層 `canManage`（manager / admin / creator）已由 `GuildRaidManager` 把關，元件內不重複檢查

### Step 1 — 輸入 + 勾選

| 元素 | 規格 |
|------|------|
| 標題 | `#序號 公會名`，與表格 header 的 `displayGuildName` 一致 |
| 分數輸入 | number，0–10000，與現有分數欄相同限制 |
| 「下一步」啟用條件 | 分數 > 0 **且** 至少勾選 1 位成員 |
| 成員清單 | 該公會**全部**成員（`sortedMembers`），非只有空分數者 |
| 清單排版 | CSS grid：`grid-cols-2 sm:grid-cols-3 md:grid-cols-5`。桌面 5 欄，30 人剛好 5×6。**超過 30 人繼續以 5 欄往下排，不設上限**，容器可捲動 |
| 每格內容 | checkbox + 成員名 + 現有分數 |
| 預設勾選 | 分數為 `0` / `null` / `undefined` 者 |
| 快捷鈕 | 全選 / 全不選 / 只選空白 |
| 計數 | 「已選 N / 共 M 位」，隨勾選即時更新 |

### Step 2 — 確認

| 元素 | 規格 |
|------|------|
| 摘要 | 「將寫入 **X** 分給【**公會名**】的 **N** 位成員」 |
| 覆蓋警示 | 若勾選中含已有分數者：「⚠ 其中 K 位已有分數，將被覆蓋」 |
| 名單 | 同樣 `grid-cols-2 sm:grid-cols-3 md:grid-cols-5`，唯讀 |
| 覆蓋標示 | 會被覆蓋的成員以琥珀色標示，顯示 `1050 → 1200` |
| 按鈕 | 「上一步」／「確認寫入」；寫入中 disabled + loading 文字 |

### 空狀態

若公會沒有任何成員，按鈕仍顯示但點開後 Modal 顯示「此公會沒有成員」並只留關閉鈕。

## 「分數為空」的定義

畫面上顯示為空的即為空，即：

```ts
const current = draftRecords[memberId]?.score ?? records[memberId]?.score;
const isEmpty = !current;   // 0 / null / undefined 皆算空
```

與現有輸入框的 `value={record.score || ''}` 行為一致（0 顯示為空白）。

## 檔案變更

| 檔案 | 變更 |
|------|------|
| `src/features/raid/components/BulkScoreFillModal.tsx` | **新增** — 兩步 Modal，overlay 樣式沿用 `GhostRecordModal` |
| `src/features/raid/components/GuildRaidTable.tsx` | 表格底部加按鈕、掛載 Modal、計算預設勾選集合 |
| `src/features/raid/hooks/useRaidRecordEditor.ts` | 新增 `handleBulkScoreFill(guildId, score, memberIds)` |
| `src/features/raid/pages/GuildRaidManager.tsx` | 把 `editor.handleBulkScoreFill` 傳給 `GuildRaidTable` |
| `public/locales/zh-TW/raid.json`、`public/locales/en/raid.json` | 新增翻譯 key |
| `src/features/raid/GuildRaidManager_Architecture.md` | 同步更新 hook 函式表與 Component Composition |

## 資料流

```
GuildRaidTable
  ├─ sortedMembers / records / draftRecords（已有的 props）
  │    └─ 算出 defaultCheckedIds（分數為空者）
  └─ BulkScoreFillModal
        onConfirm(score, memberIds)
               ↓
useRaidRecordEditor.handleBulkScoreFill(guildId, score, memberIds)
```

`handleBulkScoreFill` 的步驟：

1. 組 payload 陣列：
   ```ts
   const payloads = memberIds.map(id => {
     const { note, ...draft } = draftRecordsRef.current[id] ?? {};
     return {
       ...(recordsRef.current[id] ?? {}),  // 保留 season_note / overkill / season_guild
       ...draft,                            // 保留未儲存的編輯（note 除外）
       season_id: selectedSeasonId,
       member_id: id,
       score,
     };
   });
   ```
   `note` 欄位屬 `member_notes` 表，必須從 payload 剔除。
2. **單次** `supabase.from('member_raid_records').upsert(payloads, { onConflict: 'season_id, member_id' })`
3. 成功後 `setRecords(next)`，並清除這批 `memberIds` 的 `draftRecords`
4. `updateGuildMedian(guildId, next)` —— 只算一次

### 為何是單次批次 upsert

考慮過的替代方案：

- **逐個呼叫現有 `handleAutoSave`**：完全重用現有邏輯，但 N 位成員 = N 個 request + N 次 `guild_raid_records` upsert，30 人公會會明顯延遲且中位數反覆閃動。
- **只灌入 `draftRecords` 不自動儲存**：與「確認即寫入」的需求矛盾，且草稿不 blur 就永遠不會存。

單次批次 upsert 是一個 request、一次中位數計算，且沒有「寫到一半失敗」的中間狀態。

### Realtime

寫入後 `member_raid_records` 的 Realtime 訂閱會把變更推給其他管理員的分頁，`useRaidData` 既有的 INSERT/UPDATE handler 會更新 `records` 並觸發閃爍高亮，不需額外處理。

## 錯誤處理

`handleBulkScoreFill` 以 try-catch 包住。

**`member_raid_records` upsert 失敗**（唯一會導致整體失敗的情況）：

- 寫入 `editor.error`，回傳 `false`
- 不修改本地 `records` 與 `draftRecords`
- Modal 保持開啟並停在 Step 2，並**在 Modal 內**顯示錯誤訊息 —— 頁面層的 error banner 位於 Modal 的 `z-50` overlay 之下，用家看不到
- 因為是單一 request，分數不會出現部分寫入

**中位數更新失敗**（`guild_raid_records` upsert）：分數此時已寫入成功，因此**不算整體失敗** —— 記錄 `editor.error` 但仍回傳 `true` 並關閉 Modal。誤報失敗會誘使用家重複寫入一個已成功的操作。

### 與逐格自動儲存的競態

`handleAutoSave` 有 300ms debounce。批次寫入前必須先 `clearTimeout` 這批成員的 pending timer，否則一個剛排入的逐格儲存可能在批次寫入之後才落地，把分數改回舊值並用舊值重算中位數。

因為取消了 timer，該批成員未儲存的**成員備註**草稿也會被一併丟棄 —— 備註存在 `member_notes` 表，不在批次 upsert 的 payload 內。所以批次寫入時要另外把有變更的 note 透過 `updateMember` 補存，再清除草稿。

## i18n

所有使用者可見文字使用 `t()`，加入 `raid` namespace，zh-TW 與 en 同步。需要的 key（含複數/插值）：

- `raid.bulk_fill_button` — 一鍵輸入分數
- `raid.bulk_fill_title` — 一鍵輸入分數
- `raid.bulk_fill_score_label` — 分數
- `raid.bulk_fill_select_all` / `select_none` / `select_empty`
- `raid.bulk_fill_count` — 已選 {{selected}} / 共 {{total}} 位
- `raid.bulk_fill_confirm_summary` — 將寫入 {{score}} 分給【{{guild}}】的 {{count}} 位成員
- `raid.bulk_fill_overwrite_warning` — 其中 {{count}} 位已有分數，將被覆蓋
- `raid.bulk_fill_no_members` — 此公會沒有成員
- `raid.bulk_fill_next` / `back` / `confirm` / `saving`

## 驗證

專案在這一層沒有單元測試（僅 Playwright E2E），以下列方式驗證：

1. `npm run lint`（tsc --noEmit）
2. 手動：選一個公會 → 一鍵輸入分數 → 確認預設只勾空白成員 → 寫入 → 檢查表格分數、底部中位數、Supabase 資料
3. 手動：勾選已有分數的成員 → 確認 Step 2 出現覆蓋警示與 `舊 → 新` 標示
4. 手動：開兩個分頁，一邊寫入，確認另一邊 Realtime 更新並閃爍
5. 手動：切到歸檔賽季與比較模式，確認按鈕不出現
6. 手動：桌面寬度確認 5 欄排版；縮窄至手機寬度確認降為 2 欄

## 明確不做（YAGNI）

- 跨公會一次填分（按鈕只影響當前公會）
- 一鍵填 `season_note`、`overkill` 或成員備註
- 復原／撤銷（寫入後在表格直接改即可）
- 歸檔賽季或比較模式下使用
