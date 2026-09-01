import { useState } from 'react';
import { useAppContext } from '@/store';
import { X, Save, CheckCircle2, EyeOff, Eye } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { logEvent } from '@/analytics';
import { EQUIPMENT_CATEGORIES, PLAY_MODE_OPTIONS, DEDICATION_OPTIONS } from '@/entities/member/types';
import { normalizeEquipment, normalizePlayPreferences } from '@/shared/lib/equipment';

export default function MemberEquipmentModal({ memberId, onClose }: { memberId: string, onClose: () => void }) {
  const { t, i18n } = useTranslation();
  const { db, updateMemberProfile, showToast } = useAppContext();
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const member = db.members[memberId];
  if (!member) return null;

  const [equipment, setEquipment] = useState(normalizeEquipment(member.equipment));
  const [playPrefs, setPlayPrefs] = useState(normalizePlayPreferences(member.playPreferences));
  const [note, setNote] = useState(member.equipmentNote || '');
  const [isHidden, setIsHidden] = useState(Boolean(member.isEquipmentHidden));

  const toggleMode = (mode: any) => {
    setPlayPrefs(prev => {
      const modes = prev.modes.includes(mode)
        ? prev.modes.filter(m => m !== mode)
        : [...prev.modes, mode];
      return { ...prev, modes };
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    logEvent('GuildDashboard', 'Update Member Equipment', member.name);
    try {
      setShowSuccess(true);
      await updateMemberProfile(memberId, { equipment, playPreferences: playPrefs, equipmentNote: note, isEquipmentHidden: isHidden });
      setTimeout(() => {
        setShowSuccess(false);
        onClose();
      }, 1000);
    } catch (error) {
      console.error("Error updating member equipment:", error);
      showToast(t('common.save_failed'), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const updateCount = (key: string, field: 'c23' | 'c24', value: number) => {
    setEquipment(prev => ({
      ...prev,
      [key]: { ...prev[key], [field]: Math.max(0, value) }
    }));
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-start justify-center p-4 bg-stone-900/60 dark:bg-black/70 backdrop-blur-sm pt-[80px]">
      <div className="bg-stone-100 dark:bg-stone-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[calc(100vh-120px)] flex flex-col overflow-hidden">
        <div className="bg-white dark:bg-stone-800 px-6 py-4 border-b border-stone-200 dark:border-stone-700 flex justify-between items-center sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-bold text-stone-800 dark:text-stone-200">{t('equipment.edit_title', { name: member.name })}</h2>
            <p className="text-stone-500 dark:text-stone-400 text-sm">{t('equipment.edit_desc')}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-full transition-colors">
            <X className="w-6 h-6 text-stone-500 dark:text-stone-400" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* 裝備數量 */}
          <section className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-200 dark:border-stone-700 overflow-hidden">
            <h3 className="bg-stone-50 dark:bg-stone-700 px-5 py-3 border-b border-stone-200 dark:border-stone-600 font-bold text-stone-800 dark:text-stone-200">
              {t('equipment.title')}
            </h3>
            <div className="divide-y divide-stone-100 dark:divide-stone-700">
              {EQUIPMENT_CATEGORIES.map(cat => {
                const item = equipment[cat.key] || { c23: 0, c24: 0 };
                return (
                  <div key={cat.key} className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={cat.icon}
                        alt=""
                        className="w-9 h-9 object-contain rounded bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-600"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                      <div>
                        <div className="font-medium text-stone-800 dark:text-stone-200">
                          {t(`equipment.categories.${cat.key}`)}
                        </div>
                        {cat.icons && cat.icons.length > 1 && (
                          <div className="text-[11px] text-stone-400 dark:text-stone-500">
                            {cat.icons.map(i => i.name).join(' / ')}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 text-sm font-bold text-red-600 dark:text-red-400">
                        23C
                        <input
                          type="number"
                          min={0}
                          value={item.c23}
                          onChange={(e) => updateCount(cat.key, 'c23', Number(e.target.value))}
                          className="w-16 px-2 py-1.5 border border-stone-300 dark:border-stone-600 rounded-lg bg-stone-50 dark:bg-stone-700 text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                        />
                      </label>
                      <label className="flex items-center gap-2 text-sm font-bold text-purple-600 dark:text-purple-400">
                        24C
                        <input
                          type="number"
                          min={0}
                          value={item.c24}
                          onChange={(e) => updateCount(cat.key, 'c24', Number(e.target.value))}
                          className="w-16 px-2 py-1.5 border border-stone-300 dark:border-stone-600 rounded-lg bg-stone-50 dark:bg-stone-700 text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                        />
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* 遊玩傾向 - 內容（可複選） */}
          <section className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-200 dark:border-stone-700 overflow-hidden">
            <h3 className="bg-stone-50 dark:bg-stone-700 px-5 py-3 border-b border-stone-200 dark:border-stone-600 font-bold text-stone-800 dark:text-stone-200">
              {t('equipment.play_preference')}
            </h3>
            <div className="p-5 space-y-5">
              <div>
                <p className="text-sm font-semibold text-stone-600 dark:text-stone-400 mb-2">{t('equipment.modes')} <span className="text-xs font-normal">({t('equipment.multi_select')})</span></p>
                <div className="flex flex-wrap gap-2">
                  {PLAY_MODE_OPTIONS.map(mode => {
                    const active = playPrefs.modes.includes(mode);
                    return (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => toggleMode(mode)}
                        className={`px-3 py-1.5 text-sm font-bold rounded-lg border transition-colors ${active
                          ? 'bg-amber-500 text-white border-amber-500'
                          : 'bg-stone-50 dark:bg-stone-700 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-600 hover:bg-stone-100 dark:hover:bg-stone-600'}`}
                      >
                        {t(`equipment.modes_opt.${mode}`)}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-stone-600 dark:text-stone-400 mb-2">{t('equipment.dedication')} <span className="text-xs font-normal">({t('equipment.single_select')})</span></p>
                <div className="flex flex-wrap gap-2">
                  {DEDICATION_OPTIONS.map(d => {
                    const active = playPrefs.dedication === d;
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setPlayPrefs(prev => ({ ...prev, dedication: d }))}
                        className={`px-3 py-1.5 text-sm font-bold rounded-lg border transition-colors ${active
                          ? 'bg-indigo-500 text-white border-indigo-500'
                          : 'bg-stone-50 dark:bg-stone-700 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-600 hover:bg-stone-100 dark:hover:bg-stone-600'}`}
                      >
                        {t(`equipment.dedication_opt.${d}`)}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          {/* 備註 */}
          <section className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-200 dark:border-stone-700 overflow-hidden">
            <h3 className="bg-stone-50 dark:bg-stone-700 px-5 py-3 border-b border-stone-200 dark:border-stone-600 font-bold text-stone-800 dark:text-stone-200">
              {t('equipment.note')}
            </h3>
            <div className="p-5">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder={t('equipment.note_placeholder')}
                className="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-stone-50 dark:bg-stone-700 text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500/30 resize-none"
              />
            </div>
          </section>

          {/* 隱藏開關 */}
          <section className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-200 dark:border-stone-700 overflow-hidden">
            <div className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isHidden ? <EyeOff className="w-5 h-5 text-stone-400" /> : <Eye className="w-5 h-5 text-amber-500" />}
                <div>
                  <p className="font-bold text-stone-800 dark:text-stone-200">{t('equipment.hide_toggle')}</p>
                  <p className="text-xs text-stone-500 dark:text-stone-400">{t('equipment.hide_desc')}</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="peer sr-only" checked={isHidden} onChange={(e) => setIsHidden(e.target.checked)} />
                <div className="w-10 h-6 bg-stone-200 dark:bg-stone-600 rounded-full peer peer-checked:bg-red-500 transition-colors shadow-inner"></div>
                <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4 shadow-md"></div>
              </label>
            </div>
          </section>
        </div>

        <div className="bg-white dark:bg-stone-800 px-6 py-4 border-t border-stone-200 dark:border-stone-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="p-2 text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-xl transition-colors"
            title={t('common.cancel')}
          >
            <X className="w-6 h-6" />
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`flex items-center justify-center p-2 rounded-xl font-medium shadow-sm transition-all active:scale-95 disabled:opacity-70 ${showSuccess ? 'bg-green-600 text-white' : 'bg-amber-600 hover:bg-amber-700 text-white'}`}
            title={showSuccess ? t('common.saved') : isSaving ? t('common.saving') : t('common.save_changes')}
          >
            {showSuccess ? <CheckCircle2 className="w-6 h-6" /> : <Save className="w-6 h-6" />}
          </button>
        </div>
      </div>
    </div>
  );
}
