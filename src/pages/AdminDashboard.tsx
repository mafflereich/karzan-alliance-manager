import React, { useState } from 'react';
import { useAppContext } from '../store';
import { LogOut, Users, Shield, Sword, Plus, Edit2, Trash2, ArrowUp, ArrowDown, Save, X, ChevronLeft } from 'lucide-react';
import { Role } from '../types';

export default function AdminDashboard() {
  const { db, setDb, setCurrentView } = useAppContext();
  const [activeTab, setActiveTab] = useState<'guilds' | 'costumes'>('guilds');

  const handleLogout = () => setCurrentView(null);

  return (
    <div className="min-h-screen bg-stone-100">
      <header className="bg-stone-900 text-white p-4 shadow-md">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Shield className="w-6 h-6 text-amber-500" />
            Karzan 聯盟管理後台
          </h1>
          <button onClick={handleLogout} className="flex items-center gap-2 hover:text-amber-400 transition-colors">
            <LogOut className="w-5 h-5" /> 登出
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        <div className="flex gap-4 mb-6 border-b border-stone-300 pb-2">
          <TabButton active={activeTab === 'guilds'} onClick={() => setActiveTab('guilds')} icon={<Shield />} label="公會管理" />
          <TabButton active={activeTab === 'costumes'} onClick={() => setActiveTab('costumes')} icon={<Sword />} label="服裝資料庫" />
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6">
          {activeTab === 'guilds' && <GuildsManager />}
          {activeTab === 'costumes' && <CostumesManager />}
        </div>
      </main>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-t-lg font-medium transition-colors ${
        active ? 'text-amber-600 border-b-2 border-amber-600' : 'text-stone-500 hover:text-stone-800'
      }`}
    >
      {React.cloneElement(icon as React.ReactElement, { className: 'w-5 h-5' })}
      {label}
    </button>
  );
}

function GuildsManager() {
  const { db, setDb } = useAppContext();
  const [newGuildName, setNewGuildName] = useState('');
  const [selectedGuildId, setSelectedGuildId] = useState<string | null>(null);
  const [editingGuildId, setEditingGuildId] = useState<string | null>(null);
  const [editGuildName, setEditGuildName] = useState('');

  const handleAddGuild = () => {
    if (!newGuildName.trim()) return;
    const newId = `g${Date.now()}`;
    setDb(prev => ({
      ...prev,
      guilds: { ...prev.guilds, [newId]: { name: newGuildName.trim() } },
      guildOrder: [...(prev.guildOrder || Object.keys(prev.guilds)), newId]
    }));
    setNewGuildName('');
  };

  const getMemberCount = (guildId: string) => {
    return Object.values(db.members).filter((m: any) => m.guildId === guildId).length;
  };

  const startEdit = (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    setEditingGuildId(id);
    setEditGuildName(name);
  };

  const saveEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!editGuildName.trim() || !editingGuildId) return;
    setDb(prev => ({
      ...prev,
      guilds: {
        ...prev.guilds,
        [editingGuildId]: { ...prev.guilds[editingGuildId], name: editGuildName.trim() }
      }
    }));
    setEditingGuildId(null);
  };

  const moveGuild = (e: React.MouseEvent, index: number, direction: -1 | 1) => {
    e.stopPropagation();
    setDb(prev => {
      const order = [...(prev.guildOrder || Object.keys(prev.guilds))];
      if (index + direction < 0 || index + direction >= order.length) return prev;
      
      const temp = order[index];
      order[index] = order[index + direction];
      order[index + direction] = temp;
      
      return { ...prev, guildOrder: order };
    });
  };

  if (selectedGuildId) {
    return <GuildMembersManager guildId={selectedGuildId} onBack={() => setSelectedGuildId(null)} />;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-stone-800">公會列表</h2>
      
      <div className="flex gap-2 mb-6">
        <input 
          type="text" 
          placeholder="新公會名稱" 
          className="flex-1 p-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
          value={newGuildName}
          onChange={e => setNewGuildName(e.target.value)}
        />
        <button onClick={handleAddGuild} className="px-4 py-2 bg-stone-800 text-white rounded-lg hover:bg-stone-700 flex items-center gap-2">
          <Plus className="w-5 h-5" /> 新增公會
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {(db.guildOrder || Object.keys(db.guilds)).map((id, index, arr) => {
          const guild = db.guilds[id];
          if (!guild) return null;
          return (
          <div 
            key={id} 
            onClick={() => { if (!editingGuildId) setSelectedGuildId(id); }}
            className={`p-4 border border-stone-200 rounded-xl bg-stone-50 flex justify-between items-center transition-colors group ${!editingGuildId ? 'cursor-pointer hover:bg-stone-100 hover:border-amber-300' : ''}`}
          >
            {editingGuildId === id ? (
              <div className="flex-1 flex gap-2 items-center mr-4">
                <input 
                  type="text" 
                  className="flex-1 p-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                  value={editGuildName}
                  onChange={e => setEditGuildName(e.target.value)}
                  onClick={e => e.stopPropagation()}
                  autoFocus
                />
                <button onClick={saveEdit} className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="儲存"><Save className="w-5 h-5" /></button>
                <button onClick={(e) => { e.stopPropagation(); setEditingGuildId(null); }} className="p-2 text-stone-500 hover:bg-stone-100 rounded-lg transition-colors" title="取消"><X className="w-5 h-5" /></button>
              </div>
            ) : (
              <>
                <div>
                  <h3 className="font-bold text-lg text-stone-800 group-hover:text-amber-700 transition-colors">{guild.name}</h3>
                  <p className="text-sm text-stone-500">成員數: {getMemberCount(id)} / 30</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex flex-col gap-1 mr-2">
                    <button 
                      onClick={(e) => moveGuild(e, index, -1)} 
                      disabled={index === 0}
                      className="p-1 text-stone-400 hover:text-stone-800 hover:bg-stone-200 rounded disabled:opacity-30 disabled:hover:bg-transparent"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={(e) => moveGuild(e, index, 1)} 
                      disabled={index === arr.length - 1}
                      className="p-1 text-stone-400 hover:text-stone-800 hover:bg-stone-200 rounded disabled:opacity-30 disabled:hover:bg-transparent"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                  </div>
                  <button onClick={(e) => startEdit(e, id, guild.name)} className="p-2 text-stone-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="編輯"><Edit2 className="w-5 h-5" /></button>
                  <Users className="w-5 h-5 ml-2 text-stone-400 group-hover:text-amber-500 transition-colors" />
                </div>
              </>
            )}
          </div>
        )})}
      </div>
    </div>
  );
}

function GuildMembersManager({ guildId, onBack }: { guildId: string, onBack: () => void }) {
  const { db, setDb } = useAppContext();
  const [isAdding, setIsAdding] = useState(false);
  const [isBatchAdding, setIsBatchAdding] = useState(false);
  const [batchInput, setBatchInput] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({ name: '', role: 'Member' as Role, note: '', targetGuildId: guildId });

  const guild = db.guilds[guildId];
  const members = Object.entries(db.members)
    .filter(([_, m]: [string, any]) => m.guildId === guildId)
    .sort((a: [string, any], b: [string, any]) => {
      const roleOrder = { Master: 1, Deputy: 2, Member: 3 };
      if (roleOrder[a[1].role as Role] !== roleOrder[b[1].role as Role]) {
        return roleOrder[a[1].role as Role] - roleOrder[b[1].role as Role];
      }
      return a[1].name.localeCompare(b[1].name);
    });

  const getMemberCount = (gId: string) => Object.values(db.members).filter((m: any) => m.guildId === gId).length;
  const getGuildMaster = (gId: string) => Object.entries(db.members).find(([_, m]: [string, any]) => m.guildId === gId && m.role === 'Master');
  const getGuildDeputy = (gId: string) => Object.entries(db.members).find(([_, m]: [string, any]) => m.guildId === gId && m.role === 'Deputy');

  const validateMoveOrAdd = (targetGId: string, role: Role, excludeMemberId?: string) => {
    if (!targetGId) return "請選擇公會";
    if (!formData.name.trim()) return "請輸入名稱";

    const currentCount = getMemberCount(targetGId);
    const isSameGuild = excludeMemberId && db.members[excludeMemberId]?.guildId === targetGId;
    
    if (!isSameGuild && currentCount >= 30) return "該公會人數已達 30 人上限";

    if (role === 'Master') {
      const master = getGuildMaster(targetGId);
      if (master && master[0] !== excludeMemberId) return "該公會已有會長";
    }
    if (role === 'Deputy') {
      const deputy = getGuildDeputy(targetGId);
      if (deputy && deputy[0] !== excludeMemberId) return "該公會已有副會長";
    }
    return null;
  };

  const handleSave = () => {
    const error = validateMoveOrAdd(formData.targetGuildId, formData.role, editingId || undefined);
    if (error) {
      alert(error);
      return;
    }

    if (editingId) {
      setDb(prev => ({
        ...prev,
        members: {
          ...prev.members,
          [editingId]: { 
            ...prev.members[editingId], 
            name: formData.name,
            role: formData.role,
            note: formData.note,
            guildId: formData.targetGuildId
          }
        }
      }));
      setEditingId(null);
    } else {
      const newId = `u${Date.now()}`;
      setDb(prev => ({
        ...prev,
        members: {
          ...prev.members,
          [newId]: { 
            name: formData.name,
            role: formData.role,
            note: formData.note,
            guildId: formData.targetGuildId,
            records: {} 
          }
        }
      }));
      setIsAdding(false);
    }
    setFormData({ name: '', role: 'Member', note: '', targetGuildId: guildId });
  };

  const handleDelete = (id: string) => {
    if (confirm('確定要刪除此成員嗎？')) {
      setDb(prev => {
        const newMembers = { ...prev.members };
        delete newMembers[id];
        return { ...prev, members: newMembers };
      });
    }
  };

  const startEdit = (id: string) => {
    setEditingId(id);
    setFormData({
      name: db.members[id].name,
      role: db.members[id].role,
      note: db.members[id].note || '',
      targetGuildId: db.members[id].guildId
    });
  };

  const cancelEdit = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData({ name: '', role: 'Member', note: '', targetGuildId: guildId });
  };

  const handleBatchAdd = () => {
    if (!batchInput.trim()) return;
    const lines = batchInput.split('\n').map(l => l.trim()).filter(l => l);
    
    const currentCount = getMemberCount(guildId);
    if (currentCount + lines.length > 30) {
      alert(`批量新增後將超過 30 人上限 (目前 ${currentCount} 人，欲新增 ${lines.length} 人)`);
      return;
    }

    const newMembers: Record<string, any> = {};
    lines.forEach((line, index) => {
      const parts = line.split(/[,，\t]/).map(s => s.trim());
      const name = parts[0];
      const roleStr = parts[1] || '';
      const note = parts.slice(2).join(',').trim();
      
      let role: Role = 'Member';
      if (roleStr === 'Master' || roleStr === '會長') role = 'Master';
      else if (roleStr === 'Deputy' || roleStr === '副會長') role = 'Deputy';

      newMembers[`u${Date.now()}_${index}_${Math.random().toString(36).substr(2, 5)}`] = {
        name: name || '未命名',
        role,
        note: note || '',
        guildId,
        records: {}
      };
    });

    setDb(prev => ({
      ...prev,
      members: {
        ...prev.members,
        ...newMembers
      }
    }));
    setBatchInput('');
    setIsBatchAdding(false);
  };

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="p-2 hover:bg-stone-100 rounded-lg transition-colors">
          <ChevronLeft className="w-6 h-6 text-stone-600" />
        </button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-stone-800">{guild.name} - 成員管理</h2>
          <p className="text-sm text-stone-500">成員數: {members.length} / 30</p>
        </div>
        {!isAdding && !editingId && !isBatchAdding && (
          <div className="flex gap-2">
            <button onClick={() => setIsAdding(true)} className="px-4 py-2 bg-stone-800 text-white rounded-lg hover:bg-stone-700 flex items-center gap-2">
              <Plus className="w-5 h-5" /> 新增成員
            </button>
            <button onClick={() => setIsBatchAdding(true)} className="px-4 py-2 bg-stone-200 text-stone-800 rounded-lg hover:bg-stone-300 flex items-center gap-2">
              批量新增
            </button>
          </div>
        )}
      </div>

      {isBatchAdding && (
        <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 mb-6 flex flex-col gap-4">
          <label className="block text-sm font-medium text-stone-600">批量新增成員 (每行一筆，格式: 名稱, 職位, 備註) <br/>職位可填: 會長, 副會長, 成員 (預設)</label>
          <textarea 
            className="w-full p-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none min-h-[100px]"
            placeholder="玩家阿明, 會長, 這是備註&#10;玩家阿華, 成員&#10;玩家小美"
            value={batchInput}
            onChange={e => setBatchInput(e.target.value)}
          />
          <div className="flex gap-2 justify-end">
            <button onClick={handleBatchAdd} className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700">確認新增</button>
            <button onClick={() => { setIsBatchAdding(false); setBatchInput(''); }} className="px-4 py-2 bg-stone-300 text-stone-800 rounded-lg hover:bg-stone-400">取消</button>
          </div>
        </div>
      )}

      {(isAdding || editingId) && (
        <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 mb-6 flex gap-4 items-end flex-wrap">
          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm font-medium text-stone-600 mb-1">名稱</label>
            <input 
              type="text" 
              className="w-full p-2 border border-stone-300 rounded-lg"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm font-medium text-stone-600 mb-1">職位</label>
            <select 
              className="w-full p-2 border border-stone-300 rounded-lg"
              value={formData.role}
              onChange={e => setFormData({...formData, role: e.target.value as Role})}
            >
              <option value="Member">成員 (Member)</option>
              <option value="Deputy">副會長 (Deputy)</option>
              <option value="Master">會長 (Master)</option>
            </select>
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm font-medium text-stone-600 mb-1">所屬公會</label>
            <select 
              className="w-full p-2 border border-stone-300 rounded-lg"
              value={formData.targetGuildId}
              onChange={e => setFormData({...formData, targetGuildId: e.target.value})}
            >
              {(db.guildOrder || Object.keys(db.guilds)).map((id) => {
                const g = db.guilds[id];
                if (!g) return null;
                return <option key={id} value={id}>{g.name}</option>;
              })}
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-stone-600 mb-1">備註</label>
            <input 
              type="text" 
              className="w-full p-2 border border-stone-300 rounded-lg"
              value={formData.note}
              onChange={e => setFormData({...formData, note: e.target.value})}
              placeholder="例如: 請假中"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700">儲存</button>
            <button onClick={cancelEdit} className="px-4 py-2 bg-stone-300 text-stone-800 rounded-lg hover:bg-stone-400">取消</button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b-2 border-stone-200 text-stone-600">
              <th className="p-3 font-semibold">名稱</th>
              <th className="p-3 font-semibold">職位</th>
              <th className="p-3 font-semibold">備註</th>
              <th className="p-3 font-semibold text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            {members.map(([id, member]: [string, any]) => (
              <tr key={id} className="border-b border-stone-100 hover:bg-stone-50">
                <td className="p-3 font-medium text-stone-800">{member.name}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    member.role === 'Master' ? 'bg-amber-100 text-amber-800' :
                    member.role === 'Deputy' ? 'bg-blue-100 text-blue-800' :
                    'bg-stone-200 text-stone-700'
                  }`}>
                    {member.role}
                  </span>
                </td>
                <td className="p-3 text-stone-600 text-sm">{member.note || '-'}</td>
                <td className="p-3 flex justify-end gap-2">
                  <button onClick={() => startEdit(id)} className="p-2 text-stone-500 hover:text-amber-600 transition-colors"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(id)} className="p-2 text-stone-500 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
            {members.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-stone-500">
                  該公會目前沒有成員
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CostumesManager() {
  const { db, setDb } = useAppContext();
  const [newChar, setNewChar] = useState('');
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editChar, setEditChar] = useState('');
  const [editName, setEditName] = useState('');
  const [isBatchAdding, setIsBatchAdding] = useState(false);
  const [batchInput, setBatchInput] = useState('');

  const handleAdd = () => {
    if (!newChar.trim() || !newName.trim()) return;
    const newId = `costume_${Date.now()}`;
    setDb(prev => ({
      ...prev,
      costume_definitions: [
        ...prev.costume_definitions,
        { id: newId, character: newChar.trim(), name: newName.trim() }
      ]
    }));
    setNewChar('');
    setNewName('');
  };

  const handleBatchAdd = () => {
    if (!batchInput.trim()) return;
    const lines = batchInput.split('\n').map(l => l.trim()).filter(l => l);
    const newCostumes = lines.map((line, index) => {
      const parts = line.split(/[,，\t]/).map(s => s.trim());
      const char = parts[0];
      const name = parts.slice(1).join(',').trim() || char;
      return {
        id: `costume_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 5)}`,
        character: char,
        name: name
      };
    });

    setDb(prev => ({
      ...prev,
      costume_definitions: [
        ...prev.costume_definitions,
        ...newCostumes
      ]
    }));
    setBatchInput('');
    setIsBatchAdding(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('確定要刪除此服裝嗎？這可能會影響已登記的成員資料。')) {
      setDb(prev => ({
        ...prev,
        costume_definitions: prev.costume_definitions.filter(c => c.id !== id)
      }));
    }
  };

  const startEdit = (costume: any) => {
    setEditingId(costume.id);
    setEditChar(costume.character);
    setEditName(costume.name);
  };

  const saveEdit = () => {
    if (!editChar.trim() || !editName.trim() || !editingId) return;
    setDb(prev => ({
      ...prev,
      costume_definitions: prev.costume_definitions.map(c => 
        c.id === editingId ? { ...c, character: editChar.trim(), name: editName.trim() } : c
      )
    }));
    setEditingId(null);
  };

  const moveCostume = (index: number, direction: -1 | 1) => {
    setDb(prev => {
      const newDefs = [...prev.costume_definitions];
      if (index + direction < 0 || index + direction >= newDefs.length) return prev;
      
      const temp = newDefs[index];
      newDefs[index] = newDefs[index + direction];
      newDefs[index + direction] = temp;
      
      return { ...prev, costume_definitions: newDefs };
    });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-stone-800">服裝資料庫</h2>
      
      <div className="flex gap-2 mb-6 bg-stone-50 p-4 rounded-xl border border-stone-200 items-end flex-wrap">
        {!isBatchAdding ? (
          <>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-stone-600 mb-1">角色名稱 (Character)</label>
              <input 
                type="text" 
                placeholder="例如: 優斯緹亞" 
                className="w-full p-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                value={newChar}
                onChange={e => setNewChar(e.target.value)}
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-stone-600 mb-1">服裝名稱 (Costume)</label>
              <input 
                type="text" 
                placeholder="例如: 劍道社" 
                className="w-full p-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                value={newName}
                onChange={e => setNewName(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <button onClick={handleAdd} className="px-4 py-2 bg-stone-800 text-white rounded-lg hover:bg-stone-700 flex items-center gap-2 h-[42px]">
                <Plus className="w-5 h-5" /> 新增
              </button>
              <button onClick={() => setIsBatchAdding(true)} className="px-4 py-2 bg-stone-200 text-stone-800 rounded-lg hover:bg-stone-300 flex items-center gap-2 h-[42px]">
                批量新增
              </button>
            </div>
          </>
        ) : (
          <div className="w-full flex flex-col gap-2">
            <label className="block text-sm font-medium text-stone-600">批量新增服裝 (每行一筆，格式: 角色名稱, 服裝名稱)</label>
            <textarea 
              className="w-full p-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none min-h-[100px]"
              placeholder="優斯緹亞, 劍道社&#10;莎赫拉查德, 代號S"
              value={batchInput}
              onChange={e => setBatchInput(e.target.value)}
            />
            <div className="flex gap-2 justify-end">
              <button onClick={handleBatchAdd} className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700">確認新增</button>
              <button onClick={() => { setIsBatchAdding(false); setBatchInput(''); }} className="px-4 py-2 bg-stone-300 text-stone-800 rounded-lg hover:bg-stone-400">取消</button>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {db.costume_definitions.map((costume, index) => (
          <div key={costume.id} className="p-4 border border-stone-200 rounded-xl bg-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {editingId === costume.id ? (
              <div className="flex-1 flex gap-2 flex-wrap">
                <input 
                  type="text" 
                  className="flex-1 min-w-[150px] p-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                  value={editChar}
                  onChange={e => setEditChar(e.target.value)}
                  placeholder="角色名稱"
                />
                <input 
                  type="text" 
                  className="flex-1 min-w-[150px] p-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  placeholder="服裝名稱"
                />
              </div>
            ) : (
              <div className="flex-1 flex flex-col">
                <span className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">{costume.character}</span>
                <span className="font-medium text-stone-800">{costume.name}</span>
              </div>
            )}
            
            <div className="flex items-center gap-2">
              {editingId === costume.id ? (
                <>
                  <button onClick={saveEdit} className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="儲存"><Save className="w-5 h-5" /></button>
                  <button onClick={() => setEditingId(null)} className="p-2 text-stone-500 hover:bg-stone-100 rounded-lg transition-colors" title="取消"><X className="w-5 h-5" /></button>
                </>
              ) : (
                <>
                  <div className="flex flex-col gap-1 mr-2">
                    <button 
                      onClick={() => moveCostume(index, -1)} 
                      disabled={index === 0}
                      className="p-1 text-stone-400 hover:text-stone-800 hover:bg-stone-100 rounded disabled:opacity-30 disabled:hover:bg-transparent"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => moveCostume(index, 1)} 
                      disabled={index === db.costume_definitions.length - 1}
                      className="p-1 text-stone-400 hover:text-stone-800 hover:bg-stone-100 rounded disabled:opacity-30 disabled:hover:bg-transparent"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                  </div>
                  <button onClick={() => startEdit(costume)} className="p-2 text-stone-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="編輯"><Edit2 className="w-5 h-5" /></button>
                  <button onClick={() => handleDelete(costume.id)} className="p-2 text-stone-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="刪除"><Trash2 className="w-5 h-5" /></button>
                </>
              )}
            </div>
          </div>
        ))}
        {db.costume_definitions.length === 0 && (
          <div className="p-8 text-center text-stone-500 border border-stone-200 rounded-xl bg-stone-50">
            目前沒有任何服裝資料
          </div>
        )}
      </div>
    </div>
  );
}
