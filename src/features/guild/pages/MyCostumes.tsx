import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '@/store';
import { useTranslation } from 'react-i18next';
import { Swords, Shield, User, Search, FilterX, LayoutGrid, BookUser, RefreshCw, Loader2, Sparkles } from 'lucide-react';
import { getImageUrl, getTierColor } from '@/shared/lib/utils';
import { isManagerRole } from '@/shared/lib/equipment';
import { getSortedCostumes } from '../utils/sort';
import CostumeMatrixTable from '../components/CostumeMatrixTable';

const GENDER_FILTERS = ['男', '女'];
const ATK_TYPE_FILTERS = ['物', '魔'];
const STAR_FILTERS = ['5', '4', '3'];
const ATTRIBUTE_FILTERS = ['火', '水', '風', '光', '暗'];

interface CostumeFilters {
  gender?: string[];
  atkType?: string[];
  star?: string[];
  attribute?: string[];
}

export default function MyCostumesPage() {
  const { t, i18n } = useTranslation();
  const { db, userProfileId, userGuildRoles, updateMember, showToast, isRoleLoading, userRole, fetchMembers, loadMembersByIds, isMembersLoading } = useAppContext();
  const [saveState, setSaveState] = useState<Record<string, 'saving' | 'done'>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<CostumeFilters>({});
  const [selectedGuildIds, setSelectedGuildIds] = useState<string[]>([]);

  const isManager = isManagerRole(userRole);
  const [view, setView] = useState<'matrix' | 'my'>(() => (isManagerRole(userRole) ? 'matrix' : 'my'));
  const [loadingFailed, setLoadingFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  // 全部公會（含沒有成員的公會），依梯次/管理順序排序
  const allGuilds = useMemo(() => {
    return Object.values(db.guilds)
      .filter(Boolean)
      .sort((a, b) => (a.tier ?? 99) - (b.tier ?? 99) || (a.orderNum ?? 99) - (b.orderNum ?? 99));
  }, [db.guilds]);

  // 依梯次分組（公會篩選表用）
  const guildsByTier = useMemo(() => {
    const map = new Map<number, typeof allGuilds>();
    allGuilds.forEach(g => {
      const tier = g.tier ?? 99;
      if (!map.has(tier)) map.set(tier, []);
      map.get(tier)!.push(g);
    });
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
  }, [allGuilds]);

  useEffect(() => {
    if (isRoleLoading) return;
    if (!isManager) {
      setView('my');
      return;
    }
    setView('matrix');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isManager, isRoleLoading]);

  // 預設以第一公會作為進入點
  useEffect(() => {
    if (isRoleLoading || !isManager) return;
    if (selectedGuildIds.length > 0) return;
    const firstId = allGuilds[0]?.id;
    if (firstId) setSelectedGuildIds([firstId]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isManager, isRoleLoading, allGuilds]);

  // 為已選但尚未載入的公會抓取成員（點選公會時觸發）
  useEffect(() => {
    if (!isManager || selectedGuildIds.length === 0) return;
    let failed = false;
    (async () => {
      for (const gid of selectedGuildIds) {
        const hasCached = Object.values(db.members).some(m => m.guildId === gid);
        if (hasCached) continue;
        const ok = await fetchMembers(gid, undefined, true);
        if (!ok) failed = true;
      }
      setLoadingFailed(failed);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isManager, selectedGuildIds, reloadKey, db.members]);

  // 「重整成員」：強制重新載入目前選取的公會
  useEffect(() => {
    if (!isManager || reloadKey === 0 || selectedGuildIds.length === 0) return;
    let failed = false;
    (async () => {
      for (const gid of selectedGuildIds) {
        const ok = await fetchMembers(gid, undefined, true);
        if (!ok) failed = true;
      }
      setLoadingFailed(failed);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadKey]);

  const myMemberIds = useMemo(() => {
    // userGuildRoles 才是該使用者管理的成員 id 列表（來自 profiles.user_guilds）
    const ids = userGuildRoles.length > 0 ? userGuildRoles : (userProfileId ? userProfileId.split(',').map(uid => uid.trim()).filter(Boolean) : []);
    return [...new Set(ids)];
  }, [userGuildRoles, userProfileId]);

  // 非管理者：依綁定的 id 載入自己的成員資料，避免誤判為「未綁定」
  useEffect(() => {
    if (isRoleLoading || isManager || myMemberIds.length === 0) return;
    const missing = myMemberIds.filter(id => !db.members[id]);
    if (missing.length === 0) return;
    const t = setTimeout(() => {
      loadMembersByIds(myMemberIds, true);
    }, 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isManager, isRoleLoading, myMemberIds]);

  const myMembers = myMemberIds.map(id => db.members[id]).filter(Boolean);

  const matrixMembers = useMemo(() => {
    let list = Object.values(db.members).filter(m => m && m.status !== 'archived');
    if (selectedGuildIds.length > 0) {
      list = list.filter(m => selectedGuildIds.includes(m.guildId));
    }
    return list.sort((a, b) => {
      const orderA = db.guilds[a.guildId]?.orderNum ?? 99;
      const orderB = db.guilds[b.guildId]?.orderNum ?? 99;
      if (orderA !== orderB) return orderA - orderB;
      const roleOrder: Record<string, number> = { leader: 1, coleader: 2, member: 3 };
      const ra = roleOrder[a.role] || 99;
      const rb = roleOrder[b.role] || 99;
      if (ra !== rb) return ra - rb;
      return a.name.localeCompare(b.name);
    });
  }, [db.members, db.guilds, selectedGuildIds]);

  const characters = useMemo(() => {
    const list = Object.values(db.characters).sort((a, b) => {
      const aHasNew = Object.values(db.costumes).some(c => c.characterId === a.id && c.isNew);
      const bHasNew = Object.values(db.costumes).some(c => c.characterId === b.id && c.isNew);
      if (aHasNew && !bHasNew) return -1;
      if (!aHasNew && bHasNew) return 1;
      return a.orderNum - b.orderNum;
    });
    const filtered = list.filter(c => {
      if (filters.gender?.length && !filters.gender.includes(c.gender)) return false;
      if (filters.atkType?.length && !filters.atkType.includes(c.atkType)) return false;
      if (filters.star?.length && !filters.star.includes(c.star)) return false;
      if (filters.attribute?.length && !filters.attribute.includes(c.attribute)) return false;
      return true;
    });
    if (!searchQuery.trim()) return filtered;
    const q = searchQuery.trim().toLowerCase();
    return filtered.filter(c => {
      const cName = (i18n.language === 'en' ? c.nameE || c.name : c.name).toLowerCase();
      return cName.includes(q) || Object.values(db.costumes).some(co => co.characterId === c.id && (i18n.language === 'en' ? co.nameE || co.name : co.name).toLowerCase().includes(q));
    });
  }, [db.characters, db.costumes, searchQuery, filters, i18n.language]);

  // 服裝表：只顯示通過搜尋/篩選的角色之服裝
  const characterIds = useMemo(() => new Set(characters.map(c => c.id)), [characters]);
  const matrixCostumes = useMemo(() => {
    return getSortedCostumes(db.costumes, db.characters).filter(c => characterIds.has(c.characterId));
  }, [db.costumes, db.characters, characterIds]);

  const setFilter = (key: keyof CostumeFilters, value: string) => {
    setFilters(prev => {
      const next = { ...prev };
      const current = next[key] || [];
      const has = current.includes(value);
      const updated = has ? current.filter(v => v !== value) : [...current, value];
      if (updated.length === 0) {
        delete next[key];
      } else {
        next[key] = updated;
      }
      return next;
    });
  };

  const toggleGuild = (guildId: string) => {
    setSelectedGuildIds(prev => {
      const selected = prev.includes(guildId) ? prev.filter(id => id !== guildId) : [...prev, guildId];
      // 至少保留一個公會
      if (selected.length === 0) return prev;
      return selected;
    });
  };

  const hasActiveFilters = Object.values(filters).some(f => !!f?.length) || selectedGuildIds.length > 0;

  const resetFilters = () => {
    setFilters({});
    setSelectedGuildIds([]);
  };

  const handleSave = async (member: any) => {
    setSaveState(prev => ({ ...prev, [member.id]: 'saving' }));
    try {
      await updateMember(member.id, {
        records: member.records,
        exclusiveWeapons: member.exclusiveWeapons
      });
      setSaveState(prev => ({ ...prev, [member.id]: 'done' }));
      setTimeout(() => setSaveState(prev => {
        const next = { ...prev };
        delete next[member.id];
        return next;
      }), 1200);
    } catch (error) {
      console.error('Error saving costumes:', error);
      showToast(t('common.save_failed'), 'error');
      setSaveState(prev => {
        const next = { ...prev };
        delete next[member.id];
        return next;
      });
    }
  };

  if (isRoleLoading) {
    return (
      <div className="bg-stone-100 dark:bg-stone-900">
        <div className="max-w-6xl mx-auto p-6">
          <div className="bg-white dark:bg-stone-800 rounded-2xl shadow-sm border border-stone-200 dark:border-stone-700 p-8 flex items-center justify-center text-stone-500 dark:text-stone-400">
            {t('common.loading')}
          </div>
        </div>
      </div>
    );
  }

  interface FilterChipGroupProps {
    label: string;
    options: { value: string; label: string }[];
    selected: string[];
    onToggle: (value: string) => void;
  }

  function FilterChipGroup({ label, options, selected, onToggle }: FilterChipGroupProps) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-stone-500 dark:text-stone-400 whitespace-nowrap">{label}</span>
        <div className="flex flex-wrap gap-1.5">
          {options.map(opt => {
            const active = selected.includes(opt.value);
            return (
              <button
                key={opt.value}
                onClick={() => onToggle(opt.value)}
                className={`px-2.5 py-1 text-xs font-bold rounded-full border transition-all ${active ? 'bg-amber-500 border-amber-500 text-white shadow-sm' : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-600 text-stone-600 dark:text-stone-300 hover:border-amber-400'}`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-stone-100 dark:bg-stone-900 min-h-full flex flex-col">
      <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6 flex-1">
        <div className="bg-white dark:bg-stone-800 rounded-2xl shadow-sm border border-stone-200 dark:border-stone-700 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-200 flex items-center gap-2">
                {view === 'matrix' ? <LayoutGrid className="w-6 h-6 text-amber-500" /> : <Shield className="w-6 h-6 text-amber-500" />}
                {t(view === 'matrix' ? 'my_costumes.title' : 'my_costumes.view_my')}
              </h1>
              <p className="text-stone-500 dark:text-stone-400 text-sm mt-1">{t('my_costumes.desc')}</p>
            </div>
            <div className="flex items-center gap-3">
              {isManager && (
                <div className="flex bg-stone-100 dark:bg-stone-700 rounded-xl p-1">
                  <button
                    onClick={() => setView('matrix')}
                    className={`px-3 py-1.5 text-sm font-bold rounded-lg transition-all flex items-center gap-1.5 ${view === 'matrix' ? 'bg-white dark:bg-stone-600 text-amber-600 dark:text-amber-400 shadow-sm' : 'text-stone-500 dark:text-stone-400'}`}
                  >
                    <LayoutGrid className="w-4 h-4" />
                    {t('my_costumes.view_matrix')}
                  </button>
                  <button
                    onClick={() => setView('my')}
                    className={`px-3 py-1.5 text-sm font-bold rounded-lg transition-all flex items-center gap-1.5 ${view === 'my' ? 'bg-white dark:bg-stone-600 text-amber-600 dark:text-amber-400 shadow-sm' : 'text-stone-500 dark:text-stone-400'}`}
                  >
                    <BookUser className="w-4 h-4" />
                    {t('my_costumes.view_my')}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 搜尋 + 篩選（兩種檢視共用） */}
          <div className="mt-4 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[180px] sm:max-w-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="w-4 h-4 text-stone-400 dark:text-stone-500" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('my_costumes.search_placeholder')}
                  className="w-full pl-10 pr-4 py-2 border border-stone-300 dark:border-stone-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all bg-stone-50 dark:bg-stone-700 focus:bg-white dark:focus:bg-stone-600 dark:text-stone-100 text-sm"
                />
              </div>
              <button
                onClick={resetFilters}
                disabled={!hasActiveFilters}
                className={`px-3 py-2 text-sm font-bold rounded-xl transition-colors flex items-center gap-1.5 ${hasActiveFilters ? 'bg-stone-200 hover:bg-stone-300 text-stone-700 dark:bg-stone-600 dark:hover:bg-stone-500 dark:text-stone-200' : 'bg-stone-100 dark:bg-stone-700 text-stone-400 dark:text-stone-500 cursor-not-allowed'}`}
              >
                <FilterX className="w-4 h-4" />
                {t('my_costumes.reset_filters')}
              </button>
              {view === 'matrix' && (
                <button
                  onClick={() => setReloadKey(k => k + 1)}
                  disabled={isMembersLoading}
                  className={`px-3 py-2 text-sm font-bold rounded-xl transition-colors flex items-center gap-1.5 ${isMembersLoading ? 'bg-stone-100 dark:bg-stone-700 text-stone-400 dark:text-stone-500 cursor-not-allowed' : 'bg-amber-100 hover:bg-amber-200 text-amber-800 dark:bg-amber-900/30 dark:hover:bg-amber-900/50 dark:text-amber-300'}`}
                >
                  <RefreshCw className={`w-4 h-4 ${isMembersLoading ? 'animate-spin' : ''}`} />
                  {t('my_costumes.reload_members')}
                </button>
              )}
            </div>

            {/* 公會篩選表（僅矩陣檢視）：依梯次/管理順序排列，可點按複選 */}
            {view === 'matrix' && allGuilds.length > 0 && (
              <div className="bg-stone-50 dark:bg-stone-700/40 border border-stone-200 dark:border-stone-700 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                    {t('my_costumes.filter_guild')}
                  </span>
                  <span className="text-[11px] text-stone-400 dark:text-stone-500">
                    {t('my_costumes.selected_guilds', { count: selectedGuildIds.length })}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {guildsByTier.map(([tier, guilds]) => (
                    <div key={tier} className="flex flex-wrap items-center gap-1.5">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${getTierColor(tier)}`}>T{tier}</span>
                      {guilds.map(g => {
                        const active = selectedGuildIds.includes(g.id);
                        return (
                          <button
                            key={g.id}
                            onClick={() => toggleGuild(g.id)}
                            className={`px-3 py-1.5 text-xs font-bold rounded-full border transition-all flex items-center gap-1.5 ${active ? 'bg-amber-500 border-amber-500 text-white shadow-sm' : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-600 text-stone-600 dark:text-stone-300 hover:border-amber-400'}`}
                          >
                            {g.name}
                            {g.serial && <span className={`text-[10px] ${active ? 'text-white/70' : 'text-stone-400'}`}>#{g.serial}</span>}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 其餘篩選：點按複選 */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <FilterChipGroup
                label={t('my_costumes.filter_gender')}
                options={GENDER_FILTERS.map(v => ({ value: v, label: v === '男' ? t('my_costumes.gender_male') : t('my_costumes.gender_female') }))}
                selected={filters.gender ?? []}
                onToggle={(v) => setFilter('gender', v)}
              />
              <FilterChipGroup
                label={t('my_costumes.filter_atk_type')}
                options={ATK_TYPE_FILTERS.map(v => ({ value: v, label: v === '物' ? t('my_costumes.atk_phys') : t('my_costumes.atk_magic') }))}
                selected={filters.atkType ?? []}
                onToggle={(v) => setFilter('atkType', v)}
              />
              <FilterChipGroup
                label={t('my_costumes.filter_star')}
                options={STAR_FILTERS.map(v => ({ value: v, label: `${v}★` }))}
                selected={filters.star ?? []}
                onToggle={(v) => setFilter('star', v)}
              />
              <FilterChipGroup
                label={t('my_costumes.filter_attribute')}
                options={ATTRIBUTE_FILTERS.map(v => ({ value: v, label: t(`my_costumes.attr_${v === '火' ? 'fire' : v === '水' ? 'water' : v === '風' ? 'wind' : v === '光' ? 'light' : 'dark'}`) }))}
                selected={filters.attribute ?? []}
                onToggle={(v) => setFilter('attribute', v)}
              />
            </div>
          </div>

          {view === 'matrix' ? (
            <>
              <div className="mt-3 text-xs text-stone-500 dark:text-stone-400">
                {t('common.member')} {matrixMembers.length} • {t('my_costumes.characters_count', { count: characterIds.size })}
              </div>
              {isMembersLoading && (
                <div className="mt-3 bg-white dark:bg-stone-800 rounded-2xl shadow-sm border border-stone-200 dark:border-stone-700 p-6 flex items-center justify-center gap-2 text-stone-500 dark:text-stone-400 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t('common.loading')}
                </div>
              )}
              {loadingFailed && (
                <div className="mt-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <p className="text-sm text-red-700 dark:text-red-300 flex items-center gap-2">
                    <Shield className="w-4 h-4 shrink-0" />
                    {t('my_costumes.load_failed')}
                  </p>
                  <button
                    onClick={() => setReloadKey(k => k + 1)}
                    className="px-3 py-1.5 text-sm font-bold rounded-xl bg-red-600 hover:bg-red-700 text-white transition-colors flex items-center gap-1.5 shrink-0"
                  >
                    <RefreshCw className={`w-4 h-4 ${isMembersLoading ? 'animate-spin' : ''}`} />
                    {t('my_costumes.retry')}
                  </button>
                </div>
              )}
              <div className="mt-2">
                <CostumeMatrixTable
                  members={matrixMembers}
                  costumes={matrixCostumes}
                />
              </div>
            </>
          ) : (
            <>
              {isMembersLoading && myMembers.length === 0 && (
                <div className="mt-8 p-8 text-center text-stone-500 dark:text-stone-400 flex flex-col items-center gap-3">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto" />
                  <p>{t('common.loading')}</p>
                </div>
              )}
              {!isMembersLoading && myMembers.length === 0 ? (
                <div className="mt-8 p-8 text-center text-stone-500 dark:text-stone-400 flex flex-col items-center gap-3">
                  <User className="w-10 h-10 text-stone-300 dark:text-stone-600" />
                  <p>{t('my_costumes.no_member')}</p>
                </div>
              ) : (
                myMembers.length > 0 && (
                  <div className="mt-6 space-y-6">
                    {myMembers.map(member => (
                      <MemberCostumeEditor
                        key={member.id}
                        member={member}
                        characters={characters}
                        saveState={saveState[member.id]}
                        onSave={() => handleSave(member)}
                      />
                    ))}
                  </div>
                )
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

interface EditorProps {
  member: any;
  characters: any[];
  saveState?: string;
  onSave: () => void;
}

function MemberCostumeEditor({ member, characters, saveState, onSave }: EditorProps) {
  const { t, i18n } = useTranslation();
  const { db, updateMemberCostumeLevel, updateMemberExclusiveWeapon } = useAppContext();
  const [records, setRecords] = useState<any>(member.records ?? {});
  const [exclusiveWeapons, setExclusiveWeapons] = useState<any>(member.exclusiveWeapons ?? {});

  const changeLevel = (costumeId: string, level: number) => {
    const next = { ...records, [costumeId]: { ...(records[costumeId] || { level: -1 }), level } };
    setRecords(next);
    updateMemberCostumeLevel(member.id, costumeId, level);
  };

  const toggleWeapon = (characterId: string, has: boolean) => {
    const next = { ...exclusiveWeapons, [characterId]: has };
    setExclusiveWeapons(next);
    updateMemberExclusiveWeapon(member.id, characterId, has);
  };

  const setAllLevels = (level: number) => {
    const costumeIds = Object.values(db.costumes).map(c => c.id);
    const next = { ...records };
    costumeIds.forEach(id => {
      next[id] = { ...(next[id] || { level: -1 }), level };
    });
    setRecords(next);
    // 依序持久化每個服裝（取最快路徑，失敗個別忽略）
    costumeIds.forEach(costumeId => {
      updateMemberCostumeLevel(member.id, costumeId, level);
    });
  };

  const grantAllWeapons = (has: boolean) => {
    const characterIds = Object.values(db.costumes).map(c => c.characterId);
    const next = { ...exclusiveWeapons };
    characterIds.forEach(id => {
      next[id] = has;
    });
    setExclusiveWeapons(next);
    characterIds.forEach(characterId => {
      updateMemberExclusiveWeapon(member.id, characterId, has);
    });
  };

  return (
    <div className="border border-stone-200 dark:border-stone-700 rounded-xl overflow-hidden">
      <div className="bg-stone-50 dark:bg-stone-700 px-5 py-3 border-b border-stone-200 dark:border-stone-600 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-bold text-stone-800 dark:text-stone-200 flex items-center gap-2">
          <User className="w-4 h-4 text-indigo-500" />
          {member.name}
          {member.guildId && db.guilds[member.guildId] && (
            <span className="text-xs font-normal text-stone-500 dark:text-stone-400">({db.guilds[member.guildId].name})</span>
          )}
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setAllLevels(5)}
            className="px-3 py-1.5 rounded-lg text-sm font-bold bg-green-100 hover:bg-green-200 text-green-800 dark:bg-green-900/30 dark:hover:bg-green-900/50 dark:text-green-300 transition-colors flex items-center gap-1.5"
            title={t('my_costumes.fill_all_5_title')}
          >
            <Sparkles className="w-3.5 h-3.5" />
            {t('my_costumes.fill_all_5')}
          </button>
          <button
            onClick={() => grantAllWeapons(true)}
            className="px-3 py-1.5 rounded-lg text-sm font-bold bg-purple-100 hover:bg-purple-200 text-purple-800 dark:bg-purple-900/30 dark:hover:bg-purple-900/50 dark:text-purple-300 transition-colors flex items-center gap-1.5"
            title={t('my_costumes.grant_all_weapons_title')}
          >
            <Swords className="w-3.5 h-3.5" />
            {t('my_costumes.grant_all_weapons')}
          </button>
          <button
            onClick={onSave}
            disabled={saveState === 'saving'}
            className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${saveState === 'done' ? 'bg-green-600 text-white' : saveState === 'saving' ? 'bg-stone-300 dark:bg-stone-600 text-stone-500' : 'bg-amber-600 hover:bg-amber-700 text-white'}`}
          >
            {saveState === 'done' ? t('common.saved') : saveState === 'saving' ? t('common.saving') : t('common.save_changes')}
          </button>
        </div>
      </div>

      <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
        {characters.length === 0 && (
          <p className="text-stone-500 dark:text-stone-400 text-center py-8">{t('my_costumes.no_results')}</p>
        )}
        {characters.map(character => {
          const hasExclusiveWeapon = exclusiveWeapons[character.id] ?? false;
          const costumes = Object.values(db.costumes)
            .filter(c => c.characterId === character.id)
            .sort((a, b) => (a.orderNum ?? 999) - (b.orderNum ?? 999));
          if (costumes.length === 0) return null;

          return (
            <div key={character.id} className={`bg-white dark:bg-stone-800 rounded-xl shadow-sm border ${hasExclusiveWeapon ? 'border-orange-400' : 'border-stone-200 dark:border-stone-700'} overflow-hidden`}>
              <div className="bg-stone-50 dark:bg-stone-700 px-4 py-2.5 border-b border-stone-200 dark:border-stone-600 flex justify-between items-center">
                <h3 className="font-bold text-stone-800 dark:text-stone-200">{i18n.language === 'en' ? (character.nameE || character.name) : character.name}</h3>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <Swords className={`w-4 h-4 ${hasExclusiveWeapon ? 'text-amber-600' : 'text-stone-400'}`} />
                  <span className={`text-sm font-bold ${hasExclusiveWeapon ? 'text-amber-700' : 'text-stone-500 dark:text-stone-400'}`}>{t('common.ur_exclusive')}</span>
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={hasExclusiveWeapon}
                    onChange={(e) => toggleWeapon(character.id, e.target.checked)}
                  />
                  <div className="w-9 h-5 bg-stone-200 dark:bg-stone-600 rounded-full peer peer-checked:bg-amber-500 transition-colors shadow-inner relative">
                    <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4 shadow-md"></div>
                  </div>
                </label>
              </div>
              <div className="divide-y divide-stone-100 dark:divide-stone-700">
                {costumes.map(costume => {
                  const record = records[costume.id] || { level: -1 };
                  return (
                    <div key={costume.id} className="p-3 flex items-center gap-3 hover:bg-stone-50/50 dark:hover:bg-stone-700/50 transition-colors">
                      {costume.imageName && (
                        <div className="w-[40px] h-[40px] bg-stone-100 dark:bg-stone-700 rounded-lg overflow-hidden border border-stone-200 dark:border-stone-600 flex-shrink-0">
                          <img
                            src={getImageUrl(costume.imageName)}
                            alt={i18n.language === 'en' ? (costume.nameE || costume.name) : costume.name}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                            onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = 'none'; }}
                          />
                        </div>
                      )}
                      <div className="font-medium text-stone-800 dark:text-stone-200 flex-1">{i18n.language === 'en' ? (costume.nameE || costume.name) : costume.name}</div>
                      <div className="flex flex-wrap gap-1">
                        {[
                          { val: -1, label: t('common.not_owned') },
                          { val: 0, label: '+0' },
                          { val: 1, label: '+1' },
                          { val: 2, label: '+2' },
                          { val: 3, label: '+3' },
                          { val: 4, label: '+4' },
                          { val: 5, label: '+5' }
                        ].map(opt => {
                          let active = "bg-orange-400 text-stone-900 shadow-sm scale-105";
                          if (opt.val <= 0) active = "bg-stone-300 text-stone-900 shadow-sm scale-105";
                          else if (opt.val === 1) active = "bg-blue-300 text-stone-900 shadow-sm scale-105";
                          else if (opt.val === 2) active = "bg-blue-400 text-stone-900 shadow-sm scale-105";
                          else if (opt.val === 3) active = "bg-purple-300 text-stone-900 shadow-sm scale-105";
                          else if (opt.val === 4) active = "bg-purple-400 text-stone-900 shadow-sm scale-105";

                          return (
                            <button
                              key={opt.val}
                              onClick={() => changeLevel(costume.id, opt.val)}
                              className={`px-2.5 py-1 text-sm font-bold rounded-lg transition-all ${record.level == opt.val
                                ? active
                                : 'bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-stone-700 dark:text-stone-300 dark:hover:bg-stone-600'}`}
                            >
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}