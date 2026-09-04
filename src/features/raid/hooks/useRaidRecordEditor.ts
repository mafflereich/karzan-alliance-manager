import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/shared/api/supabase';
import { useAppContext } from '@/store';
import { Logger } from '@/shared/utils/logger';
import type { MemberRaidRecord, GuildRaidRecord } from '../types';

interface Options {
  selectedSeasonId: string;
  isSelectedSeasonArchived: boolean;
  isComparisonMode: boolean;
  records: Record<string, MemberRaidRecord>;
  setRecords: React.Dispatch<React.SetStateAction<Record<string, MemberRaidRecord>>>;
  recordsRef: React.MutableRefObject<Record<string, MemberRaidRecord>>;
  guildRaidRecords: Record<string, GuildRaidRecord>;
  setGuildRaidRecords: React.Dispatch<React.SetStateAction<Record<string, GuildRaidRecord>>>;
}

export function useRaidRecordEditor({
  selectedSeasonId,
  isSelectedSeasonArchived,
  isComparisonMode,
  records,
  setRecords,
  recordsRef,
  guildRaidRecords,
  setGuildRaidRecords,
}: Options) {
  const { db, updateMember, updateMembersNotes } = useAppContext();

  const [draftRecords, setDraftRecords] = useState<Record<string, MemberRaidRecord>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Mutable refs for stable callbacks — updated on every render
  const draftRecordsRef = useRef(draftRecords);
  draftRecordsRef.current = draftRecords;
  const dbMembersRef = useRef(db.members);
  dbMembersRef.current = db.members;
  const guildRaidRecordsRef = useRef(guildRaidRecords);
  guildRaidRecordsRef.current = guildRaidRecords;

  // Per-member debounce timers for auto-save (300 ms)
  const saveTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // Clear drafts when switching season or comparison mode
  useEffect(() => {
    if (Object.keys(draftRecordsRef.current).length > 0) setDraftRecords({});
  }, [selectedSeasonId, isComparisonMode]);

  // Clear all pending save timers on unmount
  useEffect(() => {
    return () => { Object.values(saveTimersRef.current).forEach(clearTimeout); };
  }, []);

  const handleRecordChange = useCallback((memberId: string, field: 'score' | 'note' | 'season_note' | 'overkill', value: string | number | null) => {
    setDraftRecords(prev => {
      const existingRecord = prev[memberId] || recordsRef.current[memberId] || {
        season_id: selectedSeasonId,
        member_id: memberId,
        score: 0,
        season_note: '',
      };

      let finalValue = value;
      if (field === 'score') {
        finalValue = Math.min(Math.max(Number(value) || 0, 0), 10000);
      }

      return {
        ...prev,
        [memberId]: {
          ...existingRecord,
          note: prev[memberId]?.note ?? dbMembersRef.current[memberId]?.note ?? '',
          [field]: finalValue,
        },
      };
    });
  }, [selectedSeasonId]); // recordsRef/dbMembersRef are stable refs

  const updateGuildMedian = useCallback(async (guildId: string, customRecords?: Record<string, MemberRaidRecord>) => {
    const currentRecords = customRecords || recordsRef.current;
    const guildMembers = Object.values(dbMembersRef.current).filter(m => {
      if (isSelectedSeasonArchived) {
        return currentRecords[m.id!]?.season_guild === guildId;
      }
      return m.guildId === guildId;
    });

    const scores = guildMembers.map(m => currentRecords[m.id!]?.score ?? 0).filter(s => s > 0);
    const sorted = [...scores].sort((a, b) => a - b);
    let median = 0;
    if (sorted.length > 0) {
      const mid = Math.floor(sorted.length / 2);
      median = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    }

    const guildRecord: GuildRaidRecord = {
      ...guildRaidRecordsRef.current[guildId],
      season_id: selectedSeasonId,
      guild_id: guildId,
      member_score_median: Math.floor(median),
    };

    const { error } = await supabase
      .from('guild_raid_records')
      .upsert(guildRecord, { onConflict: 'season_id, guild_id' });

    if (error) throw error;

    setGuildRaidRecords(prev => ({ ...prev, [guildId]: guildRecord }));
  }, [isSelectedSeasonArchived, selectedSeasonId]); // recordsRef/dbMembersRef/guildRaidRecordsRef are stable refs

  const doAutoSave = useCallback(async (memberId: string, guildId: string) => {
    const draft = draftRecordsRef.current[memberId];
    if (!draft) return;

    const originalRecord = recordsRef.current[memberId];
    const originalNote = dbMembersRef.current[memberId]?.note || '';

    const scoreChanged = draft.score !== (originalRecord?.score ?? 0);
    const seasonNoteChanged = (draft.season_note || '') !== (originalRecord?.season_note || '');
    const noteChanged = (draft.note || '') !== originalNote;
    const overkillChanged = (draft.overkill ?? null) !== (originalRecord?.overkill ?? null);

    if (!scoreChanged && !seasonNoteChanged && !noteChanged && !overkillChanged) {
      setDraftRecords(prev => { const next = { ...prev }; delete next[memberId]; return next; });
      return;
    }

    setSaving(true);
    try {
      const { note, ...raidRecord } = draft;

      const payload = {
        ...raidRecord,
        overkill: raidRecord.overkill != null && !isNaN(Number(raidRecord.overkill)) ? Number(raidRecord.overkill) : null,
      };

      const { error } = await supabase
        .from('member_raid_records')
        .upsert(payload, { onConflict: 'season_id, member_id' });

      if (error) throw error;

      if (noteChanged) await updateMember(memberId, { note });

      const nextRecords = { ...recordsRef.current, [memberId]: payload as MemberRaidRecord };
      setRecords(nextRecords);

      setDraftRecords(prev => { const next = { ...prev }; delete next[memberId]; return next; });

      if (scoreChanged) await updateGuildMedian(guildId, nextRecords);

      Logger.info({
        source: 'raid_manager',
        action: 'auto_save_member_record',
        message: '自動儲存成員戰記',
        details: {
          memberId,
          guildId,
          score: payload.score,
          seasonNote: payload.season_note,
          overkill: payload.overkill,
          noteChanged,
        },
      });
    } catch (err: any) {
      console.error('Auto-save failed:', err);
      Logger.error({ source: 'raid_manager', action: 'auto_save_member_record', message: '自動儲存成員戰記失敗', details: { memberId, guildId, error: err.message } });
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }, [updateMember, updateGuildMedian]); // draftRecordsRef/recordsRef/dbMembersRef are stable refs

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

    // Cancel pending per-member auto-saves for these members, otherwise a debounced
    // write armed just before the bulk fill can land afterwards and revert the score.
    memberIds.forEach(id => {
      if (saveTimersRef.current[id]) {
        clearTimeout(saveTimersRef.current[id]);
        delete saveTimersRef.current[id];
      }
    });

    setSaving(true);
    try {
      // Member notes live in member_notes, not member_raid_records. Since we drop these
      // members' drafts below, any unsaved note edit has to be flushed separately —
      // otherwise cancelling their timers above would silently discard it.
      const pendingNotes = memberIds
        .map(id => ({ id, note: draftRecordsRef.current[id]?.note }))
        .filter((n): n is { id: string; note: string } =>
          n.note != null && n.note !== (dbMembersRef.current[n.id]?.note || ''));

      // PostgREST requires every row of a batch upsert to carry the SAME set of columns —
      // any column missing from one row is sent as NULL for that row. So build a fixed
      // shape, and never include `id`: members without an existing record have none, which
      // would make PostgREST send id=NULL and violate the not-null constraint. `onConflict`
      // resolves insert-vs-update without it.
      const payloads = memberIds.map(memberId => {
        const committed = recordsRef.current[memberId];
        const draft = draftRecordsRef.current[memberId];
        // `note` lives in member_notes, so it is never read from either source here.
        const overkill = draft?.overkill ?? committed?.overkill ?? null;

        return {
          season_id: selectedSeasonId,
          member_id: memberId,
          score: clamped,
          season_note: draft?.season_note ?? committed?.season_note ?? '',
          overkill: overkill != null && !isNaN(Number(overkill)) ? Number(overkill) : null,
          season_guild: draft?.season_guild ?? committed?.season_guild ?? null,
        };
      });

      const { error } = await supabase
        .from('member_raid_records')
        .upsert(payloads, { onConflict: 'season_id, member_id' });

      if (error) throw error;

      for (const { id, note } of pendingNotes) {
        await updateMember(id, { note });
      }

      // Merge onto the existing record so the row's `id` (absent from the payload) survives.
      const nextRecords = { ...recordsRef.current };
      payloads.forEach(p => {
        nextRecords[p.member_id] = { ...recordsRef.current[p.member_id], ...p } as MemberRaidRecord;
      });
      setRecords(nextRecords);

      setDraftRecords(prev => {
        const next = { ...prev };
        memberIds.forEach(id => { delete next[id]; });
        return next;
      });

      // The scores are already committed at this point, so a median failure must not
      // report the whole operation as failed — surface it but keep the write.
      try {
        await updateGuildMedian(guildId, nextRecords);
      } catch (medianErr: any) {
        console.error('Bulk score fill: median update failed:', medianErr);
        setError(medianErr.message);
      }

      return true;
    } catch (err: any) {
      console.error('Bulk score fill failed:', err);
      setError(err.message);
      return false;
    } finally {
      setSaving(false);
    }
  }, [selectedSeasonId, updateGuildMedian, updateMember]); // recordsRef/draftRecordsRef/dbMembersRef are stable refs

  const handleClearAllPrevGuildTags = useCallback(async (
    entries: { id: string; note: string }[],
    guildId: string,
  ): Promise<void> => {
    if (entries.length === 0) return;

    const ids = entries.map(e => e.id);

    // 取消這些成員既有的延遲自動儲存，避免其在批次寫入後又落地覆蓋。
    ids.forEach(id => {
      if (saveTimersRef.current[id]) {
        clearTimeout(saveTimersRef.current[id]);
        delete saveTimersRef.current[id];
      }
    });

    setSaving(true);
    try {
      await updateMembersNotes(entries);

      // 清掉這些成員的草稿，並以已提交內容更新 records（note 不存於 records）。
      const nextRecords = { ...recordsRef.current };
      setRecords(nextRecords);
      setDraftRecords(prev => {
        const next = { ...prev };
        ids.forEach(id => { delete next[id]; });
        return next;
      });

      Logger.info({ source: 'raid_manager', action: 'clear_all_prev_guild_tags', message: '清除全部前公會標籤', details: { guildId, count: entries.length } });
    } catch (err: any) {
      console.error('Clear all prev guild tags failed:', err);
      Logger.error({ source: 'raid_manager', action: 'clear_all_prev_guild_tags', message: '清除全部前公會標籤失敗', details: { guildId, count: entries.length, error: err.message } });
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }, [updateMembersNotes]); // recordsRef/draftRecordsRef/saveTimersRef are stable refs

  const handleAutoSave = useCallback((memberId: string, guildId: string) => {
    clearTimeout(saveTimersRef.current[memberId]);
    saveTimersRef.current[memberId] = setTimeout(() => {
      delete saveTimersRef.current[memberId];
      doAutoSave(memberId, guildId);
    }, 300);
  }, [doAutoSave]);

  const handleGuildNoteChange = useCallback(async (guildId: string, note: string) => {
    if (!selectedSeasonId) return;
    try {
      const { error } = await supabase
        .from('guild_raid_records')
        .upsert({ season_id: selectedSeasonId, guild_id: guildId, note }, { onConflict: 'season_id, guild_id' });

      if (error) throw error;

      Logger.info({ source: 'raid_manager', action: 'update_guild_note', message: '更新公會戰記備註', details: { guildId, seasonId: selectedSeasonId, note } });

      setGuildRaidRecords(prev => ({
        ...prev,
        [guildId]: { ...prev[guildId], season_id: selectedSeasonId, guild_id: guildId, note },
      }));
    } catch (err: any) {
      console.error('Error updating guild note:', err);
      Logger.error({ source: 'raid_manager', action: 'update_guild_note', message: '更新公會戰記備註失敗', details: { guildId, seasonId: selectedSeasonId, error: err.message } });
      setError(err.message);
    }
  }, [selectedSeasonId]);

  return {
    draftRecords,
    saving,
    error,
    handleRecordChange,
    handleAutoSave,
    handleBulkScoreFill,
    handleClearAllPrevGuildTags,
    updateGuildMedian,
    handleGuildNoteChange,
  };
}
