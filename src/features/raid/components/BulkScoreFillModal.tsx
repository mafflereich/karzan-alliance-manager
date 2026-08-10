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
  /** Latest editor error, shown inside the modal — the page banner sits behind the overlay. */
  error?: string;
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
  error,
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
  // Local to this modal: the hook's `saving` is shared with per-member auto-saves and can
  // flip back to false mid-write.
  const [submitting, setSubmitting] = useState(false);
  const [failed, setFailed] = useState(false);

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
    const memberIds = selectedMembers.map(m => m.id!);
    if (memberIds.length === 0) {
      setFailed(true);
      return;
    }
    setSubmitting(true);
    setFailed(false);
    try {
      const ok = await onConfirm(guildId, score, memberIds);
      if (ok) onClose();
      else setFailed(true);   // stay on step 2 and show why
    } finally {
      setSubmitting(false);
    }
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
          <>
            <div className="p-8 text-center text-stone-500 dark:text-stone-400">
              {t('raid.bulk_fill_no_members', '此公會沒有成員')}
            </div>
            <div className="p-4 border-t border-stone-200 dark:border-stone-700 flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-1.5 text-sm rounded-lg border border-stone-300 dark:border-stone-600 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700"
              >
                {t('common.close', '關閉')}
              </button>
            </div>
          </>
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
                onChange={(e) => {
                  // Clamp as typed — min/max are not enforced for typed input, and the
                  // field must not show a value different from what gets written.
                  const v = e.target.value;
                  if (v === '') { setScoreInput(''); return; }
                  const n = Number(v);
                  if (isNaN(n)) return;
                  setScoreInput(String(Math.min(Math.max(n, 0), 10000)));
                }}
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

            {failed && (
              <div className="mx-4 mb-2 p-2.5 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-400">
                {error || t('raid.bulk_fill_failed', '寫入失敗，請重試')}
              </div>
            )}

            <div className="p-4 border-t border-stone-200 dark:border-stone-700 flex items-center justify-end gap-2">
              <button
                onClick={() => setStep(1)}
                disabled={submitting}
                className="px-4 py-1.5 text-sm rounded-lg border border-stone-300 dark:border-stone-600 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 disabled:opacity-40"
              >
                {t('raid.bulk_fill_back', '上一步')}
              </button>
              <button
                onClick={handleConfirm}
                disabled={submitting}
                className="px-4 py-1.5 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {submitting
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
