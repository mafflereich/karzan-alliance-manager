import React from 'react';
import { User, EyeOff, ArrowDownNarrowWide, ArrowDownWideNarrow } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAppContext } from '@/store';
import { EQUIPMENT_CATEGORIES } from '@/entities/member/types';
import { normalizeEquipment, normalizePlayPreferences, isManagerRole } from '@/shared/lib/equipment';

interface EquipmentTableProps {
  members: [string, any][];
  sortConfig: { key: string, order: 'asc' | 'desc' };
  handleSort: (key: string) => void;
  hasBoundMemberInGuild: boolean;
  userProfileId: string | null;
  userRole: string | null;
  handleEditClick: (id: string, memberName: string) => void;
  isDragging: boolean;
  handleMouseDown: (e: React.MouseEvent) => void;
  handleMouseLeave: () => void;
  handleMouseUp: () => void;
  handleMouseMove: (e: React.MouseEvent) => void;
  scrollRef: React.RefObject<HTMLDivElement>;
  isMembersLoading: boolean;
  getTruncatedName: (name: string, role: string) => string;
  formatDate: (timestamp: number) => string;
}

export default function EquipmentTable({
  members,
  sortConfig,
  handleSort,
  hasBoundMemberInGuild,
  userProfileId,
  userRole,
  handleEditClick,
  isDragging,
  handleMouseDown,
  handleMouseLeave,
  handleMouseUp,
  handleMouseMove,
  scrollRef,
  isMembersLoading,
  getTruncatedName,
  formatDate
}: EquipmentTableProps) {
  const { t, i18n } = useTranslation();
  const manager = isManagerRole(userRole);

  const visibleMembers = React.useMemo(() => {
    const userMemberIds = userProfileId ? userProfileId.split(',').map(uid => uid.trim()).filter(Boolean) : [];
    return manager
      ? members
      : members.filter(([id, m]) => !m.isEquipmentHidden || userMemberIds.includes(id));
  }, [members, manager, userProfileId]);

  return (
    <div className="bg-white dark:bg-stone-800 rounded-2xl shadow-sm border border-stone-200 dark:border-stone-700 overflow-hidden relative">
      {isMembersLoading && (
        <div className="absolute inset-0 z-50 bg-white/50 dark:bg-stone-800/50 backdrop-blur-sm flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 bg-white dark:bg-stone-700 p-6 rounded-2xl shadow-xl border border-stone-100 dark:border-stone-600">
            <div className="w-8 h-8 border-4 border-stone-200 dark:border-stone-600 border-t-stone-800 dark:border-t-stone-200 rounded-full animate-spin"></div>
            <span className="text-stone-600 dark:text-stone-400 font-medium">{t('common.loading', '載入中...')}</span>
          </div>
        </div>
      )}
      <div
        ref={scrollRef}
        className={`overflow-x-auto cursor-grab [&::-webkit-scrollbar:horizontal]:hidden ${isDragging ? 'cursor-grabbing select-none' : ''}`}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
      >
        <table className="w-full text-left border-collapse min-w-max">
          <thead>
            <tr className="bg-stone-50 dark:bg-stone-700 text-stone-600 dark:text-stone-300">
              <th
                className="p-3 font-semibold sticky top-0 left-0 bg-stone-50 dark:bg-stone-700 z-30 border-r border-b-2 border-stone-200 dark:border-stone-600 shadow-[1px_0_0_0_#e7e5e4] dark:shadow-[1px_0_0_0_#44403c] cursor-pointer hover:bg-stone-100 dark:hover:bg-stone-600 transition-colors"
                onClick={() => handleSort('member')}
              >
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    {t('common.member')}
                    {sortConfig.key === 'member' && (
                      sortConfig.order === 'asc' ? <ArrowDownNarrowWide className="w-4 h-4" /> : <ArrowDownWideNarrow className="w-4 h-4" />
                    )}
                  </div>
                  {hasBoundMemberInGuild && (
                    <div className="text-[10px] font-normal text-amber-600 dark:text-amber-400 mt-0.5">
                      {t('dashboard.click_to_edit')}
                    </div>
                  )}
                </div>
              </th>
              {EQUIPMENT_CATEGORIES.map(cat => (
                <th
                  key={cat.key}
                  className="p-3 font-semibold text-center text-xs border-r border-b-2 border-stone-200 dark:border-stone-600 last:border-r-0 sticky top-0 bg-stone-50 dark:bg-stone-700 z-20"
                >
                  {t(`equipment.categories.${cat.key}`)}
                </th>
              ))}
              <th className="p-3 font-semibold text-center text-xs border-r border-b-2 border-stone-200 dark:border-stone-600 sticky top-0 bg-stone-50 dark:bg-stone-700 z-20">
                {t('equipment.play_preference')}
              </th>
              <th className="p-3 font-semibold text-center text-xs border-r border-b-2 border-stone-200 dark:border-stone-600 last:border-r-0 sticky top-0 bg-stone-50 dark:bg-stone-700 z-20">
                {t('equipment.note')}
              </th>
            </tr>
          </thead>
          <tbody>
            {visibleMembers.map(([id, member]: [string, any]) => {
              const isCurrentUser = userProfileId && userProfileId.split(',').map(uid => uid.trim()).filter(Boolean).includes(id);
              const equipment = normalizeEquipment(member.equipment);
              const playPrefs = normalizePlayPreferences(member.playPreferences);
              return (
              <tr key={id} className={`border-b border-stone-100 dark:border-stone-700 transition-colors group ${isCurrentUser ? 'hover:bg-stone-50 dark:hover:bg-stone-700' : ''}`}>
                <td
                  className={`p-3 font-medium text-stone-800 dark:text-stone-200 sticky left-0 bg-white dark:bg-stone-800 border-r border-stone-200 dark:border-stone-600 shadow-[1px_0_0_0_#e7e5e4] dark:shadow-[1px_0_0_0_#44403c] transition-colors ${isCurrentUser ? 'cursor-pointer group-hover:bg-stone-50 dark:group-hover:bg-stone-700' : ''}`}
                  onClick={() => handleEditClick(id, member.name)}
                >
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      {isCurrentUser && <User className="w-4 h-4 text-indigo-500 dark:text-indigo-400 shrink-0" />}
                      <span
                        title={member.name}
                        className={
                          member.role === 'leader'
                            ? 'px-1.5 py-0.5 rounded bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                            : member.role === 'coleader'
                              ? 'px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                              : ''
                        }
                      >
                        {getTruncatedName(member.name, member.role)}
                      </span>
                      {member.isEquipmentHidden && (
                        <EyeOff className="w-3.5 h-3.5 text-stone-300 dark:text-stone-500" />
                      )}
                    </div>
                    {member.updatedAt && (
                      <span className="text-[10px] text-stone-400 mt-0.5">
                        {formatDate(member.updatedAt)}
                      </span>
                    )}
                  </div>
                </td>
                {EQUIPMENT_CATEGORIES.map(cat => {
                  const item = equipment[cat.key];
                  return (
                    <td key={cat.key} className="p-0 text-center border-r border-stone-100 dark:border-stone-700 last:border-r-0 h-full">
                      <div className="flex flex-col items-center justify-center h-full min-h-[60px] py-2 gap-0.5">
                        {item.c23 > 0 || item.c24 > 0 ? (
                          <>
                            <span className="font-bold text-sm text-red-600 dark:text-red-400">
                              {i18n.language === 'en' ? '23C' : '23C'}: {item.c23}
                            </span>
                            <span className="font-bold text-sm text-purple-600 dark:text-purple-400">
                              {i18n.language === 'en' ? '24C' : '24C'}: {item.c24}
                            </span>
                          </>
                        ) : (
                          <span className="text-sm text-stone-300 dark:text-stone-600">-</span>
                        )}
                      </div>
                    </td>
                  );
                })}
                <td className="p-3 text-center border-r border-stone-100 dark:border-stone-700 align-top">
                  <div className="flex flex-col items-center gap-1.5">
                    {playPrefs.modes.length > 0 && (
                      <div className="flex flex-wrap justify-center gap-1">
                        {playPrefs.modes.map(mode => (
                          <span key={mode} className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 whitespace-nowrap">
                            {t(`equipment.modes_opt.${mode}`)}
                          </span>
                        ))}
                      </div>
                    )}
                    {playPrefs.dedication && (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 whitespace-nowrap">
                        {t(`equipment.dedication_opt.${playPrefs.dedication}`)}
                      </span>
                    )}
                    {playPrefs.modes.length === 0 && !playPrefs.dedication && (
                      <span className="text-sm text-stone-300 dark:text-stone-600">-</span>
                    )}
                  </div>
                </td>
                <td className="p-3 text-center border-r border-stone-100 dark:border-stone-700 last:border-r-0 align-top">
                  {member.equipmentNote ? (
                    <span className="text-xs leading-relaxed text-stone-600 dark:text-stone-300 line-clamp-3 max-w-[220px] break-words inline-block text-left" title={member.equipmentNote}>
                      {member.equipmentNote}
                    </span>
                  ) : (
                    <span className="text-sm text-stone-300 dark:text-stone-600">-</span>
                  )}
                </td>
              </tr>
              );
            })}
            {visibleMembers.length === 0 && (
              <tr>
                <td colSpan={EQUIPMENT_CATEGORIES.length + 3} className="p-8 text-center text-stone-500 dark:text-stone-400">
                  {t('dashboard.no_members')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
