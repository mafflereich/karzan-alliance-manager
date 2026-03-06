import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabase';
import { useAppContext } from '../store';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Trophy, Plus, Edit2, Save, X, Shield, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface RaidSeason {
  id: string;
  season_number: number;
  period_text: string;
  description: string;
}

interface GuildRaidRecord {
  id: string;
  season_id: string;
  guild_id: string;
  score: number;
  rank: string;
}

export default function AllianceRaidRecord() {
  const { t } = useTranslation();
  const { db, currentUser } = useAppContext();
  
  const [seasons, setSeasons] = useState<RaidSeason[]>([]);
  const [records, setRecords] = useState<GuildRaidRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals state
  const [isSeasonModalOpen, setIsSeasonModalOpen] = useState(false);
  const [newSeason, setNewSeason] = useState({ season_number: 1, period_text: '', description: '' });

  const [editingCell, setEditingCell] = useState<{ guild_id: string, season_id: string } | null>(null);
  const [editRecordData, setEditRecordData] = useState<{ score: number | '', rank: string }>({ score: '', rank: '' });

  const userRole = currentUser ? db.users[currentUser]?.role : null;
  const canManage = userRole === 'manager' || userRole === 'admin' || userRole === 'creator';

  const fetchRaidData = async () => {
    setLoading(true);
    try {
      const [seasonsRes, recordsRes] = await Promise.all([
        supabase.from('raid_seasons').select('*').order('season_number', { ascending: false }),
        supabase.from('guild_raid_records').select('*')
      ]);

      if (seasonsRes.error) throw seasonsRes.error;
      if (recordsRes.error) throw recordsRes.error;

      setSeasons(seasonsRes.data || []);
      setRecords(recordsRes.data || []);
    } catch (err: any) {
      console.error('Error fetching raid data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRaidData();
  }, []);

  const handleAddSeason = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from('raid_seasons')
        .insert([newSeason])
        .select();

      if (error) throw error;
      
      if (data && data.length > 0) {
        setSeasons(prev => [data[0], ...prev].sort((a, b) => b.season_number - a.season_number));
      }
      setIsSeasonModalOpen(false);
      setNewSeason({ season_number: (seasons[0]?.season_number || 0) + 1, period_text: '', description: '' });
    } catch (err: any) {
      alert(`Error adding season: ${err.message}`);
    }
  };

  const handleSaveRecord = async (guild_id: string, season_id: string) => {
    try {
      const existingRecord = records.find(r => r.guild_id === guild_id && r.season_id === season_id);
      
      const scoreToSave = editRecordData.score === '' ? 0 : Number(editRecordData.score);
      const rankToSave = editRecordData.rank;

      if (existingRecord) {
        const { error } = await supabase
          .from('guild_raid_records')
          .update({ score: scoreToSave, rank: rankToSave })
          .eq('id', existingRecord.id);
        
        if (error) throw error;
        
        setRecords(prev => prev.map(r => r.id === existingRecord.id ? { ...r, score: scoreToSave, rank: rankToSave } : r));
      } else {
        const { data, error } = await supabase
          .from('guild_raid_records')
          .insert([{ guild_id, season_id, score: scoreToSave, rank: rankToSave }])
          .select();
          
        if (error) throw error;
        
        if (data && data.length > 0) {
          setRecords(prev => [...prev, data[0]]);
        }
      }
      setEditingCell(null);
    } catch (err: any) {
      alert(`Error saving record: ${err.message}`);
    }
  };

  const startEditing = (guild_id: string, season_id: string) => {
    const existingRecord = records.find(r => r.guild_id === guild_id && r.season_id === season_id);
    setEditRecordData({
      score: existingRecord ? existingRecord.score : '',
      rank: existingRecord ? existingRecord.rank : ''
    });
    setEditingCell({ guild_id, season_id });
  };

  const sortedGuilds = useMemo(() => {
    return Object.values(db.guilds).sort((a, b) => {
      const tierA = a.tier || 99;
      const tierB = b.tier || 99;
      if (tierA !== tierB) return tierA - tierB;
      const orderA = a.orderNum || 99;
      const orderB = b.orderNum || 99;
      return orderA - orderB;
    });
  }, [db.guilds]);

  const getRecord = (guild_id: string, season_id: string) => {
    return records.find(r => r.guild_id === guild_id && r.season_id === season_id);
  };

  return (
    <div className="min-h-screen bg-stone-100 dark:bg-stone-900 flex flex-col">
      <Header />

      <main className="max-w-7xl mx-auto p-4 sm:p-6 flex-1 w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
              <Trophy className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-100">
                {t('header.alliance_raid_record', '聯盟成績記錄')}
              </h1>
              <p className="text-sm text-stone-500 dark:text-stone-400">
                Guild Raid 歷史賽季表現
              </p>
            </div>
          </div>

          {canManage && (
            <button
              onClick={() => {
                setNewSeason({ season_number: (seasons[0]?.season_number || 0) + 1, period_text: '', description: '' });
                setIsSeasonModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-stone-800 dark:bg-stone-700 text-white rounded-lg hover:bg-stone-700 dark:hover:bg-stone-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>新增賽季</span>
            </button>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3 text-red-700 dark:text-red-400">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <div className="bg-white dark:bg-stone-800 rounded-2xl shadow-sm border border-stone-200 dark:border-stone-700 overflow-hidden flex flex-col">
          {loading ? (
            <div className="p-12 text-center text-stone-500 dark:text-stone-400">
              {t('common.loading', '載入中...')}
            </div>
          ) : seasons.length === 0 ? (
            <div className="p-12 text-center text-stone-500 dark:text-stone-400">
              目前沒有任何賽季記錄。
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-max">
                <thead>
                  <tr>
                    <th className="sticky left-0 z-20 bg-stone-100 dark:bg-stone-900/80 p-4 border-b border-r border-stone-200 dark:border-stone-700 font-bold text-stone-700 dark:text-stone-300 w-48 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      公會名稱
                    </th>
                    {seasons.map(season => (
                      <th key={season.id} className="p-4 border-b border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/50 min-w-[160px] align-top">
                        <div className="flex flex-col gap-1">
                          <div className="font-bold text-stone-800 dark:text-stone-200">
                            S{season.season_number} ({season.period_text})
                          </div>
                          <div className="text-xs text-stone-500 dark:text-stone-400 font-normal">
                            {season.description}
                          </div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedGuilds.map((guild, index) => (
                    <tr key={guild.id} className="border-b border-stone-100 dark:border-stone-700/50 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors">
                      <td className="sticky left-0 z-10 bg-white dark:bg-stone-800 p-4 border-r border-stone-200 dark:border-stone-700 font-medium text-stone-800 dark:text-stone-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] group-hover:bg-stone-50 dark:group-hover:bg-stone-800/50">
                        {guild.name}
                      </td>
                      {seasons.map(season => {
                        const record = getRecord(guild.id, season.id);
                        const isEditing = editingCell?.guild_id === guild.id && editingCell?.season_id === season.id;

                        return (
                          <td key={season.id} className="p-4 relative group border-r border-stone-200 dark:border-stone-700/50 min-w-[160px] align-middle">
                            {isEditing ? (
                              <div className="flex flex-col gap-2">
                                <div>
                                  <label className="text-[10px] text-stone-500 uppercase">Score</label>
                                  <input
                                    type="number"
                                    max="1000000"
                                    value={editRecordData.score}
                                    onChange={e => setEditRecordData(prev => ({ ...prev, score: e.target.value ? Number(e.target.value) : '' }))}
                                    className="w-full px-2 py-1 text-sm border border-stone-300 dark:border-stone-600 rounded bg-white dark:bg-stone-700 text-stone-800 dark:text-stone-100"
                                    placeholder="Score"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] text-stone-500 uppercase">Rank</label>
                                  <input
                                    type="text"
                                    value={editRecordData.rank}
                                    onChange={e => setEditRecordData(prev => ({ ...prev, rank: e.target.value }))}
                                    className="w-full px-2 py-1 text-sm border border-stone-300 dark:border-stone-600 rounded bg-white dark:bg-stone-700 text-stone-800 dark:text-stone-100"
                                    placeholder="Rank"
                                  />
                                </div>
                                <div className="flex gap-2 mt-1">
                                  <button
                                    onClick={() => handleSaveRecord(guild.id, season.id)}
                                    className="flex-1 py-1 bg-green-100 text-green-700 hover:bg-green-200 rounded flex items-center justify-center transition-colors"
                                  >
                                    <Save className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => setEditingCell(null)}
                                    className="flex-1 py-1 bg-stone-200 text-stone-700 hover:bg-stone-300 rounded flex items-center justify-center transition-colors"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col gap-1 min-h-[48px] justify-center relative">
                                {record ? (
                                  <>
                                    <div className="text-sm font-bold text-stone-800 dark:text-stone-200">
                                      {record.score.toLocaleString()}
                                    </div>
                                    <div className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                                      {record.rank}
                                    </div>
                                  </>
                                ) : (
                                  <div className="text-sm text-stone-400 dark:text-stone-600 italic">
                                    -
                                  </div>
                                )}
                                
                                {canManage && (
                                  <button
                                    onClick={() => startEditing(guild.id, season.id)}
                                    className="absolute top-1/2 -translate-y-1/2 right-0 p-1.5 text-stone-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded opacity-0 group-hover:opacity-100 transition-all"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Add Season Modal */}
      {isSeasonModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-stone-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-stone-200 dark:border-stone-700">
              <h3 className="text-lg font-bold text-stone-800 dark:text-stone-100">新增賽季</h3>
              <button
                onClick={() => setIsSeasonModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddSeason} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                  賽季編號 (Season Number)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={newSeason.season_number}
                  onChange={e => setNewSeason(prev => ({ ...prev, season_number: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-white dark:bg-stone-700 text-stone-800 dark:text-stone-100"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                  時間字串 (例如：2026年3月)
                </label>
                <input
                  type="text"
                  required
                  value={newSeason.period_text}
                  onChange={e => setNewSeason(prev => ({ ...prev, period_text: e.target.value }))}
                  className="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-white dark:bg-stone-700 text-stone-800 dark:text-stone-100"
                  placeholder="2026年3月"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                  小說明 (例如：15T,超殺局)
                </label>
                <input
                  type="text"
                  value={newSeason.description}
                  onChange={e => setNewSeason(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-white dark:bg-stone-700 text-stone-800 dark:text-stone-100"
                  placeholder="15T,超殺局"
                />
              </div>
              
              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsSeasonModalOpen(false)}
                  className="px-4 py-2 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-lg transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-stone-800 dark:bg-stone-600 text-white rounded-lg hover:bg-stone-700 dark:hover:bg-stone-500 transition-colors"
                >
                  新增
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
