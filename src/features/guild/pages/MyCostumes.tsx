import React, { useState, useMemo } from 'react';
import { useAppContext } from '@/store';
import { useTranslation } from 'react-i18next';
import { Swords, Shield, User, Search, FilterX } from 'lucide-react';
import { getImageUrl } from '@/shared/lib/utils';

const GENDER_FILTERS = ['男', '女'];
const ATK_TYPE_FILTERS = ['物', '魔'];
const STAR_FILTERS = ['5', '4', '3'];
const ATTRIBUTE_FILTERS = ['火', '水', '風', '光', '暗'];

interface CostumeFilters {
  gender?: string;
  atkType?: string;
  star?: string;
  attribute?: string;
}

export default function MyCostumesPage() {
  const { t, i18n } = useTranslation();
  const { db, userProfileId, updateMember, showToast, isRoleLoading } = useAppContext();
  const [saveState, setSaveState] = useState<Record<string, 'saving' | 'done'>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<CostumeFilters>({});

  const myMemberIds = useMemo(() => {
    return userProfileId ? userProfileId.split(',').map(uid => uid.trim()).filter(Boolean) : [];
  }, [userProfileId]);

  const myMembers = myMemberIds.map(id => db.members[id]).filter(Boolean);

  const characters = useMemo(() => {
    const list = Object.values(db.characters).sort((a, b) => {
      const aHasNew = Object.values(db.costumes).some(c => c.characterId === a.id && c.isNew);
      const bHasNew = Object.values(db.costumes).some(c => c.characterId === b.id && c.isNew);
      if (aHasNew && !bHasNew) return -1;
      if (!aHasNew && bHasNew) return 1;
      return a.orderNum - b.orderNum;
    });
    const filtered = list.filter(c => {
      if (filters.gender && c.gender !== filters.gender) return false;
      if (filters.atkType && c.atkType !== filters.atkType) return false;
      if (filters.star && c.star !== filters.star) return false;
      if (filters.attribute && c.attribute !== filters.attribute) return false;
      return true;
    });
    if (!searchQuery.trim()) return filtered;
    const q = searchQuery.trim().toLowerCase();
    return filtered.filter(c => {
      const cName = (i18n.language === 'en' ? c.nameE || c.name : c.name).toLowerCase();
      return cName.includes(q) || Object.values(db.costumes).some(co => co.characterId === c.id && (i18n.language === 'en' ? co.nameE || co.name : co.name).toLowerCase().includes(q));
    });
  }, [db.characters, db.costumes, searchQuery, filters, i18n.language]);

  const setFilter = (key: keyof CostumeFilters, value: string) => {
    setFilters(prev => {
      const next = { ...prev };
      if (value === '' || next[key] === value) {
        delete next[key];
      } else {
        next[key] = value;
      }
      return next;
    });
  };

  const hasActiveFilters = Object.keys(filters).length > 0;

  const resetFilters = () => setFilters({});

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
      <div className="min-h-screen bg-stone-100 dark:bg-stone-900">
        <div className="max-w-6xl mx-auto p-6">
          <div className="bg-white dark:bg-stone-800 rounded-2xl shadow-sm border border-stone-200 dark:border-stone-700 p-8 flex items-center justify-center text-stone-500 dark:text-stone-400">
            {t('common.loading')}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 dark:bg-stone-900">
      <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
        <div className="bg-white dark:bg-stone-800 rounded-2xl shadow-sm border border-stone-200 dark:border-stone-700 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-200 flex items-center gap-2">
                <Shield className="w-6 h-6 text-amber-500" />
                {t('my_costumes.title')}
              </h1>
              <p className="text-stone-500 dark:text-stone-400 text-sm mt-1">{t('my_costumes.desc')}</p>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="w-4 h-4 text-stone-400 dark:text-stone-500" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('my_costumes.search_placeholder')}
                className="w-full sm:w-64 pl-10 pr-4 py-2 border border-stone-300 dark:border-stone-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all bg-stone-50 dark:bg-stone-700 focus:bg-white dark:focus:bg-stone-600 dark:text-stone-100 text-sm"
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <select
              value={filters.gender ?? ''}
              onChange={(e) => setFilter('gender', e.target.value)}
              className="px-3 py-2 text-sm border border-stone-300 dark:border-stone-600 rounded-xl bg-stone-50 dark:bg-stone-700 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
            >
              <option value="">{t('my_costumes.filter_gender')} • {t('my_costumes.filter_all')}</option>
              {GENDER_FILTERS.map(v => (
                <option key={v} value={v}>{v === '男' ? t('my_costumes.gender_male') : t('my_costumes.gender_female')}</option>
              ))}
            </select>
            <select
              value={filters.atkType ?? ''}
              onChange={(e) => setFilter('atkType', e.target.value)}
              className="px-3 py-2 text-sm border border-stone-300 dark:border-stone-600 rounded-xl bg-stone-50 dark:bg-stone-700 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
            >
              <option value="">{t('my_costumes.filter_atk_type')} • {t('my_costumes.filter_all')}</option>
              {ATK_TYPE_FILTERS.map(v => (
                <option key={v} value={v}>{v === '物' ? t('my_costumes.atk_phys') : t('my_costumes.atk_magic')}</option>
              ))}
            </select>
            <select
              value={filters.star ?? ''}
              onChange={(e) => setFilter('star', e.target.value)}
              className="px-3 py-2 text-sm border border-stone-300 dark:border-stone-600 rounded-xl bg-stone-50 dark:bg-stone-700 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
            >
              <option value="">{t('my_costumes.filter_star')} • {t('my_costumes.filter_all')}</option>
              {STAR_FILTERS.map(v => (
                <option key={v} value={v}>{v}★</option>
              ))}
            </select>
            <select
              value={filters.attribute ?? ''}
              onChange={(e) => setFilter('attribute', e.target.value)}
              className="px-3 py-2 text-sm border border-stone-300 dark:border-stone-600 rounded-xl bg-stone-50 dark:bg-stone-700 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
            >
              <option value="">{t('my_costumes.filter_attribute')} • {t('my_costumes.filter_all')}</option>
              {ATTRIBUTE_FILTERS.map(v => (
                <option key={v} value={v}>{t(`my_costumes.attr_${v === '火' ? 'fire' : v === '水' ? 'water' : v === '風' ? 'wind' : v === '光' ? 'light' : 'dark'}`)}</option>
              ))}
            </select>
            <button
              onClick={resetFilters}
              disabled={!hasActiveFilters}
              className={`px-3 py-2 text-sm font-bold rounded-xl transition-colors flex items-center gap-1.5 ${hasActiveFilters ? 'bg-stone-200 hover:bg-stone-300 text-stone-700 dark:bg-stone-600 dark:hover:bg-stone-500 dark:text-stone-200' : 'bg-stone-100 dark:bg-stone-700 text-stone-400 dark:text-stone-500 cursor-not-allowed'}`}
            >
              <FilterX className="w-4 h-4" />
              {t('my_costumes.reset_filters')}
            </button>
          </div>

          {myMembers.length === 0 ? (
            <div className="mt-8 p-8 text-center text-stone-500 dark:text-stone-400 flex flex-col items-center gap-3">
              <User className="w-10 h-10 text-stone-300 dark:text-stone-600" />
              <p>{t('my_costumes.no_member')}</p>
            </div>
          ) : (
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

  return (
    <div className="border border-stone-200 dark:border-stone-700 rounded-xl overflow-hidden">
      <div className="bg-stone-50 dark:bg-stone-700 px-5 py-3 border-b border-stone-200 dark:border-stone-600 flex justify-between items-center">
        <h2 className="font-bold text-stone-800 dark:text-stone-200 flex items-center gap-2">
          <User className="w-4 h-4 text-indigo-500" />
          {member.name}
          {member.guildId && db.guilds[member.guildId] && (
            <span className="text-xs font-normal text-stone-500 dark:text-stone-400">({db.guilds[member.guildId].name})</span>
          )}
        </h2>
        <button
          onClick={onSave}
          disabled={saveState === 'saving'}
          className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${saveState === 'done' ? 'bg-green-600 text-white' : saveState === 'saving' ? 'bg-stone-300 dark:bg-stone-600 text-stone-500' : 'bg-amber-600 hover:bg-amber-700 text-white'}`}
        >
          {saveState === 'done' ? t('common.saved') : saveState === 'saving' ? t('common.saving') : t('common.save_changes')}
        </button>
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
