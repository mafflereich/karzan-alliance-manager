# Bulk Score Fill (一鍵輸入分數) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "一鍵輸入分數" button below each `GuildRaidTable`'s median row that opens a two-step modal — pick a score and check members (defaulting to those with an empty score), confirm, then write all selected members' scores in a single batch upsert.

**Architecture:** A new presentational component `BulkScoreFillModal` owns the two-step UI and selection state. The write itself lives in `useRaidRecordEditor` as `handleBulkScoreFill`, which builds one payload array, performs a single `member_raid_records` upsert, clears the affected drafts, and recomputes the guild median exactly once. `GuildRaidTable` wires the button and the modal; `GuildRaidManager` passes the hook function down.

**Tech Stack:** React 19, TypeScript 5.8, TailwindCSS 4.1, Supabase (PostgreSQL), i18next, lucide-react

**Spec:** [docs/superpowers/specs/2026-08-04-bulk-score-fill-design.md](../specs/2026-08-04-bulk-score-fill-design.md)

---

## Testing note

This project has **no unit-test framework** — `package.json` only defines `test:e2e` (Playwright). There is no vitest/jest. So each task is verified with:

1. `npm run lint` (which is `tsc --noEmit` — catches type/prop mismatches)
2. A manual verification pass in Task 6 with an explicit checklist

Do **not** add a unit-test framework as part of this feature.

---

## Files Created / Modified

| File | Change |
|------|--------|
| `public/locales/zh-TW/raid.json` | Add 13 `raid.bulk_fill_*` keys |
| `public/locales/en/raid.json` | Add the same 13 keys in English |
| `src/features/raid/hooks/useRaidRecordEditor.ts` | Add `handleBulkScoreFill`, export it |
| `src/features/raid/components/BulkScoreFillModal.tsx` | **Create** — two-step modal |
| `src/features/raid/components/GuildRaidTable.tsx` | Add `onBulkScoreFill` prop, footer button, mount modal |
| `src/features/raid/pages/GuildRaidManager.tsx` | Pass `onBulkScoreFill={editor.handleBulkScoreFill}` |
| `src/features/raid/GuildRaidManager_Architecture.md` | Document the new hook function + component |

---

## Task 1: i18n keys

**Files:**
- Modify: `public/locales/zh-TW/raid.json`
- Modify: `public/locales/en/raid.json`

The file has two top-level namespaces: `alliance_raid` and `raid`. All new keys go inside the **`raid`** object.

- [ ] **Step 1: Add keys to zh-TW**

In `public/locales/zh-TW/raid.json`, inside the `"raid": { ... }` object, add:

```json
    "bulk_fill_button": "一鍵輸入分數",
    "bulk_fill_title": "一鍵輸入分數",
    "bulk_fill_score_label": "分數",
    "bulk_fill_score_placeholder": "輸入要寫入的分數",
    "bulk_fill_select_all": "全選",
    "bulk_fill_select_none": "全不選",
    "bulk_fill_select_empty": "只選空白",
    "bulk_fill_count": "已選 {{selected}} / 共 {{total}} 位",
    "bulk_fill_confirm_summary": "將寫入 {{score}} 分給【{{guild}}】的 {{count}} 位成員",
    "bulk_fill_overwrite_warning": "其中 {{count}} 位已有分數，將被覆蓋",
    "bulk_fill_no_members": "此公會沒有成員",
    "bulk_fill_next": "下一步",
    "bulk_fill_back": "上一步",
    "bulk_fill_confirm": "確認寫入",
    "bulk_fill_saving": "寫入中..."
```

- [ ] **Step 2: Add keys to en**

In `public/locales/en/raid.json`, inside the `"raid": { ... }` object, add:

```json
    "bulk_fill_button": "Bulk Fill Scores",
    "bulk_fill_title": "Bulk Fill Scores",
    "bulk_fill_score_label": "Score",
    "bulk_fill_score_placeholder": "Score to write",
    "bulk_fill_select_all": "Select all",
    "bulk_fill_select_none": "Clear",
    "bulk_fill_select_empty": "Empty only",
    "bulk_fill_count": "{{selected}} of {{total}} selected",
    "bulk_fill_confirm_summary": "Write {{score}} points to {{count}} member(s) of [{{guild}}]",
    "bulk_fill_overwrite_warning": "{{count}} of them already have a score and will be overwritten",
    "bulk_fill_no_members": "This guild has no members",
    "bulk_fill_next": "Next",
    "bulk_fill_back": "Back",
    "bulk_fill_confirm": "Confirm",
    "bulk_fill_saving": "Writing..."
```

- [ ] **Step 3: Verify both files are valid JSON**

Run:
```bash
python3 -c "import json;[json.load(open(p)) for p in ['public/locales/zh-TW/raid.json','public/locales/en/raid.json']];print('OK')"
```
Expected output: `OK`

- [ ] **Step 4: Verify both locales have identical key sets**

Run:
```bash
python3 -c "
import json
a=json.load(open('public/locales/zh-TW/raid.json'))['raid']
b=json.load(open('public/locales/en/raid.json'))['raid']
d=set(a)^set(b)
print('MISMATCH:',d) if d else print('keys match')
"
```
Expected output: `keys match`

- [ ] **Step 5: Commit**

```bash
git add public/locales/zh-TW/raid.json public/locales/en/raid.json
git commit -m "feat(raid): add i18n keys for bulk score fill"
```

---

## Task 2: `handleBulkScoreFill` in useRaidRecordEditor

**Files:**
- Modify: `src/features/raid/hooks/useRaidRecordEditor.ts`

Context you need: the hook already holds `recordsRef` (committed records, a prop), `draftRecordsRef` (unsaved drafts), `setRecords`, `setDraftRecords`, `setSaving`, `setError`, and `updateGuildMedian`. `records` come straight from `supabase.select('*')` on `member_raid_records`, so they are raw DB rows. The `note` field on `MemberRaidRecord` belongs to the **`member_notes`** table, not `member_raid_records` — it must never appear in an upsert payload.

- [ ] **Step 1: Add the function**

Insert this **after** the `doAutoSave` definition and **before** `handleAutoSave` in `src/features/raid/hooks/useRaidRecordEditor.ts`:

```ts
  /**
   * Write the same score to many members at once.
   * Single upsert + single median recompute. Returns true on success.
   */
  const handleBulkScoreFill = useCallback(async (
    guildId: string,
    score: number,
    memberIds: string[],
  ): Promise<boolean> => {
    if (!selectedSeasonId || memberIds.length === 0) return false;

    const clamped = Math.min(Math.max(Number(score) || 0, 0), 10000);

    setSaving(true);
    try {
      const payloads = memberIds.map(memberId => {
        // `note` lives in member_notes — strip it from both sources.
        const committed: Partial<MemberRaidRecord> = { ...recordsRef.current[memberId] };
        const draft: Partial<MemberRaidRecord> = { ...draftRecordsRef.current[memberId] };
        delete committed.note;
        delete draft.note;
        const merged = {
          season_note: '',
          ...committed,
          ...draft,           // keep unsaved season_note / overkill edits
          season_id: selectedSeasonId,
          member_id: memberId,
          score: clamped,
        };
        return {
          ...merged,
          overkill: merged.overkill != null && !isNaN(Number(merged.overkill))
            ? Number(merged.overkill)
            : null,
        };
      });

      const { error } = await supabase
        .from('member_raid_records')
        .upsert(payloads, { onConflict: 'season_id, member_id' });

      if (error) throw error;

      const nextRecords = { ...recordsRef.current };
      payloads.forEach(p => { nextRecords[p.member_id] = p as MemberRaidRecord; });
      setRecords(nextRecords);

      setDraftRecords(prev => {
        const next = { ...prev };
        memberIds.forEach(id => { delete next[id]; });
        return next;
      });

      await updateGuildMedian(guildId, nextRecords);
      return true;
    } catch (err: any) {
      console.error('Bulk score fill failed:', err);
      setError(err.message);
      return false;
    } finally {
      setSaving(false);
    }
  }, [selectedSeasonId, updateGuildMedian]); // recordsRef/draftRecordsRef are stable refs
```

- [ ] **Step 2: Export it**

Change the hook's return object at the bottom of the file from:

```ts
  return {
    draftRecords,
    saving,
    error,
    handleRecordChange,
    handleAutoSave,
    updateGuildMedian,
    handleGuildNoteChange,
  };
```

to:

```ts
  return {
    draftRecords,
    saving,
    error,
    handleRecordChange,
    handleAutoSave,
    handleBulkScoreFill,
    updateGuildMedian,
    handleGuildNoteChange,
  };
```

- [ ] **Step 3: Type-check**

Run: `npm run lint`
Expected: no errors.

If `delete committed.note` errors with "The operand of a 'delete' operator must be optional", it means `note` is a required field on `MemberRaidRecord`. The `Partial<MemberRaidRecord>` annotation on both locals is what makes the delete legal — verify you kept those annotations rather than letting TypeScript infer the type from the spread.

- [ ] **Step 4: Commit**

```bash
git add src/features/raid/hooks/useRaidRecordEditor.ts
git commit -m "feat(raid): add handleBulkScoreFill to useRaidRecordEditor"
```

---

## Task 3: BulkScoreFillModal component

**Files:**
- Create: `src/features/raid/components/BulkScoreFillModal.tsx`

Style reference: `src/features/raid/components/GhostRecordModal.tsx` — same fixed overlay + rounded card pattern, dark-mode classes on every surface.

- [ ] **Step 1: Create the file**

Create `src/features/raid/components/BulkScoreFillModal.tsx` with exactly this content:

```tsx
import { useMemo, useState } from 'react';
import { X, ListPlus, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Member } from '@/entities/member/types';
import type { MemberRaidRecord } from '../types';

interface BulkScoreFillModalProps {
  guildId: string;
  guildDisplayName: string;
  members: Member[];
  records: Record<string, MemberRaidRecord>;
  draftRecords: Record<string, MemberRaidRecord>;
  saving: boolean;
  onConfirm: (guildId: string, score: number, memberIds: string[]) => Promise<boolean>;
  onClose: () => void;
}

// Desktop 5 columns (30 members = 5x6); overflows downward past 30 with no cap.
const GRID_CLASS = 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2';

export default function BulkScoreFillModal({
  guildId,
  guildDisplayName,
  members,
  records,
  draftRecords,
  saving,
  onConfirm,
  onClose,
}: BulkScoreFillModalProps) {
  const { t } = useTranslation(['raid', 'translation']);

  // What the table currently shows for this member: 0 / null / undefined all count as empty.
  const currentScoreOf = (memberId: string): number =>
    draftRecords[memberId]?.score ?? records[memberId]?.score ?? 0;

  const emptyScoreIds = useMemo(
    () => members
      .filter(m => !(draftRecords[m.id!]?.score ?? records[m.id!]?.score ?? 0))
      .map(m => m.id!),
    [members, records, draftRecords],
  );

  const [step, setStep] = useState<1 | 2>(1);
  const [scoreInput, setScoreInput] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set(emptyScoreIds));

  const score = Math.min(Math.max(Number(scoreInput) || 0, 0), 10000);
  const selectedMembers = members.filter(m => selectedIds.has(m.id!));
  const overwriteMembers = selectedMembers.filter(m => currentScoreOf(m.id!) > 0);
  const canProceed = score > 0 && selectedMembers.length > 0;

  const toggle = (memberId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(memberId)) next.delete(memberId);
      else next.add(memberId);
      return next;
    });
  };

  const handleConfirm = async () => {
    const ok = await onConfirm(guildId, score, selectedMembers.map(m => m.id!));
    if (ok) onClose();
    // On failure the page-level error banner shows the message and the modal stays on step 2.
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-stone-800 rounded-2xl shadow-xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden border border-stone-200 dark:border-stone-700">

        <div className="flex items-center justify-between p-4 border-b border-stone-200 dark:border-stone-700">
          <h3 className="text-lg font-bold text-stone-800 dark:text-stone-100 flex items-center gap-2">
            <ListPlus className="w-5 h-5 text-indigo-500" />
            {t('raid.bulk_fill_title', '一鍵輸入分數')}
            <span className="text-sm font-normal text-stone-500 dark:text-stone-400">
              {guildDisplayName}
            </span>
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700"
            title={t('common.close', '關閉')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {members.length === 0 ? (
          <div className="p-8 text-center text-stone-500 dark:text-stone-400">
            {t('raid.bulk_fill_no_members', '此公會沒有成員')}
          </div>
        ) : step === 1 ? (
          <>
            <div className="p-4 border-b border-stone-200 dark:border-stone-700 flex flex-wrap items-center gap-3">
              <label className="text-sm font-medium text-stone-700 dark:text-stone-300">
                {t('raid.bulk_fill_score_label', '分數')}
              </label>
              <input
                type="number"
                min="0"
                max="10000"
                autoFocus
                value={scoreInput}
                onChange={(e) => setScoreInput(e.target.value)}
                placeholder={t('raid.bulk_fill_score_placeholder', '輸入要寫入的分數')}
                className="w-40 px-3 py-1.5 text-sm border border-stone-300 dark:border-stone-600 rounded bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-100 focus:ring-2 focus:ring-indigo-500 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <div className="flex items-center gap-1 ml-auto">
                <button
                  onClick={() => setSelectedIds(new Set(members.map(m => m.id!)))}
                  className="px-2 py-1 text-xs rounded border border-stone-300 dark:border-stone-600 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700"
                >
                  {t('raid.bulk_fill_select_all', '全選')}
                </button>
                <button
                  onClick={() => setSelectedIds(new Set())}
                  className="px-2 py-1 text-xs rounded border border-stone-300 dark:border-stone-600 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700"
                >
                  {t('raid.bulk_fill_select_none', '全不選')}
                </button>
                <button
                  onClick={() => setSelectedIds(new Set(emptyScoreIds))}
                  className="px-2 py-1 text-xs rounded border border-stone-300 dark:border-stone-600 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700"
                >
                  {t('raid.bulk_fill_select_empty', '只選空白')}
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4">
              <div className={GRID_CLASS}>
                {members.map(member => {
                  const existing = currentScoreOf(member.id!);
                  const checked = selectedIds.has(member.id!);
                  return (
                    <label
                      key={member.id}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded border cursor-pointer transition-colors ${
                        checked
                          ? 'border-indigo-300 dark:border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                          : 'border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-700/40'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(member.id!)}
                        className="shrink-0 accent-indigo-500"
                      />
                      <span className="truncate text-xs text-stone-800 dark:text-stone-200">
                        {member.name}
                      </span>
                      {existing > 0 && (
                        <span className="ml-auto shrink-0 text-[10px] px-1 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
                          {existing}
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="p-4 border-t border-stone-200 dark:border-stone-700 flex items-center justify-between gap-3">
              <span className="text-xs text-stone-500 dark:text-stone-400">
                {t('raid.bulk_fill_count', '已選 {{selected}} / 共 {{total}} 位', {
                  selected: selectedMembers.length,
                  total: members.length,
                })}
              </span>
              <button
                onClick={() => setStep(2)}
                disabled={!canProceed}
                className="px-4 py-1.5 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {t('raid.bulk_fill_next', '下一步')}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="p-4 border-b border-stone-200 dark:border-stone-700">
              <p className="text-sm text-stone-800 dark:text-stone-200">
                {t('raid.bulk_fill_confirm_summary', '將寫入 {{score}} 分給【{{guild}}】的 {{count}} 位成員', {
                  score,
                  guild: guildDisplayName,
                  count: selectedMembers.length,
                })}
              </p>
              {overwriteMembers.length > 0 && (
                <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {t('raid.bulk_fill_overwrite_warning', '其中 {{count}} 位已有分數，將被覆蓋', {
                    count: overwriteMembers.length,
                  })}
                </p>
              )}
            </div>

            <div className="flex-1 overflow-auto p-4">
              <div className={GRID_CLASS}>
                {selectedMembers.map(member => {
                  const existing = currentScoreOf(member.id!);
                  return (
                    <div
                      key={member.id}
                      className={`px-2 py-1.5 rounded border text-xs ${
                        existing > 0
                          ? 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300'
                          : 'border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200'
                      }`}
                    >
                      <div className="truncate">{member.name}</div>
                      {existing > 0 && (
                        <div className="text-[10px] opacity-80">{existing} → {score}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-4 border-t border-stone-200 dark:border-stone-700 flex items-center justify-end gap-2">
              <button
                onClick={() => setStep(1)}
                disabled={saving}
                className="px-4 py-1.5 text-sm rounded-lg border border-stone-300 dark:border-stone-600 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 disabled:opacity-40"
              >
                {t('raid.bulk_fill_back', '上一步')}
              </button>
              <button
                onClick={handleConfirm}
                disabled={saving}
                className="px-4 py-1.5 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {saving
                  ? t('raid.bulk_fill_saving', '寫入中...')
                  : t('raid.bulk_fill_confirm', '確認寫入')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npm run lint`
Expected: no errors. The component is not mounted yet, so this only proves it compiles.

- [ ] **Step 3: Commit**

```bash
git add src/features/raid/components/BulkScoreFillModal.tsx
git commit -m "feat(raid): add BulkScoreFillModal component"
```

---

## Task 4: Wire button + modal into GuildRaidTable

**Files:**
- Modify: `src/features/raid/components/GuildRaidTable.tsx`

- [ ] **Step 1: Add imports**

Change line 2 from:

```tsx
import { Search, Pencil, ArrowDownWideNarrow, ArrowDownNarrowWide, Copy, Check, Ghost, X } from 'lucide-react';
```

to:

```tsx
import { Search, Pencil, ArrowDownWideNarrow, ArrowDownNarrowWide, Copy, Check, Ghost, X, ListPlus } from 'lucide-react';
```

And add this import after the `GhostRecordModal` import (line 7):

```tsx
import BulkScoreFillModal from './BulkScoreFillModal';
```

- [ ] **Step 2: Add the prop to the interface**

In `GuildRaidTableProps`, add this line right after `onBlur: (memberId: string, guildId: string) => void;`:

```tsx
  onBulkScoreFill?: (guildId: string, score: number, memberIds: string[]) => Promise<boolean>;
```

- [ ] **Step 3: Destructure the prop**

In the function signature, add `onBulkScoreFill,` right after `onBlur,`:

```tsx
  onBlur,
  onBulkScoreFill,
  onMemberClick,
```

- [ ] **Step 4: Add modal open state**

After the existing `const [ghostModalMember, setGhostModalMember] = useState<Member | null>(null);` line, add:

```tsx
  const [isBulkFillOpen, setIsBulkFillOpen] = useState(false);
```

- [ ] **Step 5: Add the footer button**

The table lives inside `<div className="flex-1 overflow-auto"> ... </div>`. Immediately **after** that closing `</div>` and **before** the `{ghostModalMember && (` block, insert:

```tsx
      {!isArchived && !isComparisonMode && onBulkScoreFill && (
        <div className="px-4 py-2 border-t border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800">
          <button
            onClick={() => setIsBulkFillOpen(true)}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-indigo-200 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ListPlus className="w-3.5 h-3.5" />
            {t('raid.bulk_fill_button', '一鍵輸入分數')}
          </button>
        </div>
      )}

      {isBulkFillOpen && onBulkScoreFill && (
        <BulkScoreFillModal
          guildId={guildId}
          guildDisplayName={displayGuildName}
          members={sortedMembers}
          records={records}
          draftRecords={draftRecords}
          saving={saving}
          onConfirm={onBulkScoreFill}
          onClose={() => setIsBulkFillOpen(false)}
        />
      )}
```

- [ ] **Step 6: Type-check**

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add src/features/raid/components/GuildRaidTable.tsx
git commit -m "feat(raid): add bulk fill button and modal to GuildRaidTable"
```

---

## Task 5: Pass the handler from GuildRaidManager

**Files:**
- Modify: `src/features/raid/pages/GuildRaidManager.tsx`

- [ ] **Step 1: Add the prop**

In the `<GuildRaidTable ... />` JSX (inside `selectedGuildIds.map`), add this line right after `onBlur={editor.handleAutoSave}`:

```tsx
              onBulkScoreFill={editor.handleBulkScoreFill}
```

- [ ] **Step 2: Type-check**

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: build succeeds with no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add src/features/raid/pages/GuildRaidManager.tsx
git commit -m "feat(raid): wire handleBulkScoreFill into GuildRaidManager"
```

---

## Task 6: Manual verification

**Files:** none (verification only)

Run `npm run dev` and open `http://localhost:3000/raid-manager` logged in as a manager/admin/creator.

- [ ] **Step 1: Button placement**

Pick a non-archived season and a single guild (comparison mode OFF). Confirm the "一鍵輸入分數" button appears **below the 中位數 row**, in a bordered footer strip at the bottom of the guild card.

- [ ] **Step 2: Default selection**

Click the button. Confirm:
- Modal title shows the guild name in `#序號 公會名` form
- **All** guild members are listed, not just empty ones
- Members whose score is 0/empty are **checked** by default
- Members with an existing score are **unchecked** and show an amber badge with their current score
- Counter reads `已選 N / 共 M 位` with M = total member count

- [ ] **Step 3: Grid layout**

At desktop width confirm 5 columns per row. Narrow the browser: confirm it drops to 3 columns (`sm`) then 2 columns (mobile). If a guild has more than 30 members, confirm the grid keeps going in 5 columns and the list area scrolls.

- [ ] **Step 4: Next button gating**

With the score box empty, confirm "下一步" is disabled. Type `0` — still disabled. Type `1200` — enabled. Click "全不選" — disabled again. Click "只選空白" to restore.

- [ ] **Step 5: Step 2 summary**

Enter `1200`, keep the default selection, click "下一步". Confirm:
- Summary reads `將寫入 1200 分給【#N 公會名】的 X 位成員`
- No overwrite warning (default selection has no scored members)
- Names listed in the same 5-column grid

- [ ] **Step 6: Overwrite warning**

Click "上一步", additionally check 2 members who already have a score, click "下一步". Confirm:
- Amber warning line reads `其中 2 位已有分數，將被覆蓋`
- Those 2 tiles are amber and show `舊分 → 1200`

- [ ] **Step 7: Write**

Click "確認寫入". Confirm:
- Button shows `寫入中...` and is disabled during the write
- Modal closes on success
- Every selected member's score input now shows 1200
- The 中位數 row updated
- No amber "unsaved draft" row highlighting remains on those rows

- [ ] **Step 8: Database**

In the Supabase Table Editor, filter `member_raid_records` by the current `season_id`. Confirm the selected members have `score = 1200` and that their existing `season_note` / `overkill` values were **not** wiped.

- [ ] **Step 9: Draft preservation**

Pick a member with an empty score, type something into their 賽季備註 but do **not** click away (draft is pending). Open the bulk modal, fill a score for that member, confirm the write. Confirm the season note you typed survived in the DB and the table.

- [ ] **Step 10: Realtime**

Open `/raid-manager` in a second browser tab on the same season and guild. Perform a bulk fill in tab 1. Confirm tab 2's rows update and flash orange.

- [ ] **Step 11: Hidden states**

Switch to an archived season — confirm the button is gone. Switch back and turn comparison mode ON — confirm the button is gone from all compared tables.

- [ ] **Step 12: Dark mode**

Toggle dark mode and re-open the modal. Confirm all surfaces (header, footer, tiles, badges, warning line) are legible.

---

## Task 7: Update architecture doc

**Files:**
- Modify: `src/features/raid/GuildRaidManager_Architecture.md`

- [ ] **Step 1: Add the function to the `useRaidRecordEditor` function list**

In the `### useRaidRecordEditor(options)` section, under **函式**, add this bullet after the `handleAutoSave` bullet:

```markdown
- `handleBulkScoreFill(guildId, score, memberIds)` — 一鍵批次填分：合併既有紀錄與未儲存草稿（剔除 note），單次 upsert `member_raid_records`，清除該批草稿，重算一次公會中位數。回傳 `boolean` 表示成功與否
```

- [ ] **Step 2: Add the modal to Component Composition**

In the `## Component Composition` section, change the `GuildRaidTable` line block from:

```
└── GuildRaidTable × selectedGuildIds.length
      成員列表、分數輸入、排序、公會備註、幽靈成員
```

to:

```
└── GuildRaidTable × selectedGuildIds.length
      成員列表、分數輸入、排序、公會備註、幽靈成員
      └── BulkScoreFillModal（conditional）
            一鍵輸入分數：兩步 Modal（輸入分數 + 勾選成員 → 確認摘要），
            按鈕位於表格底部中位數列下方，僅非歸檔且非比較模式時顯示
```

- [ ] **Step 3: Add a props note**

In the **Props 傳遞重點** list, add:

```markdown
- `GuildRaidTable.onBulkScoreFill` → `editor.handleBulkScoreFill`；未傳時按鈕不渲染
```

- [ ] **Step 4: Commit**

```bash
git add src/features/raid/GuildRaidManager_Architecture.md
git commit -m "docs(raid): document bulk score fill in architecture doc"
```

---

## Out of scope (from spec)

- Cross-guild bulk fill
- Bulk filling `season_note`, `overkill`, or member notes
- Undo / revert
- Use in archived seasons or comparison mode
- Adding a unit-test framework
