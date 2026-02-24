import React from 'react';
import { useAppContext } from '../store';
import { Shield, Users, ChevronRight } from 'lucide-react';

export default function Login() {
  const { db, setCurrentView } = useAppContext();

  const handleAdminLogin = () => {
    setCurrentView({ type: 'admin' });
  };

  const handleGuildSelect = (guildId: string) => {
    setCurrentView({ type: 'guild', guildId });
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-stone-200 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-8 text-stone-800">Karzan 聯盟系統</h1>
        
        <div className="space-y-6">
          <div className="p-6 border border-stone-200 rounded-xl bg-stone-50">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" /> 選擇公會
            </h2>
            <div className="space-y-3">
              {Object.entries(db.guilds).map(([id, guild]: [string, any]) => (
                <button
                  key={id}
                  onClick={() => handleGuildSelect(id)}
                  className="w-full flex items-center justify-between p-4 bg-white border border-stone-200 rounded-xl hover:border-amber-400 hover:shadow-sm transition-all group"
                >
                  <span className="font-medium text-stone-800 group-hover:text-amber-700">{guild.name}</span>
                  <ChevronRight className="w-5 h-5 text-stone-400 group-hover:text-amber-500 transition-colors" />
                </button>
              ))}
              {Object.keys(db.guilds).length === 0 && (
                <div className="text-center text-stone-500 py-4">
                  目前沒有任何公會
                </div>
              )}
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-stone-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-stone-500">或</span>
            </div>
          </div>

          <button 
            onClick={handleAdminLogin}
            className="w-full py-3 border-2 border-stone-800 text-stone-800 hover:bg-stone-800 hover:text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Shield className="w-5 h-5" /> 管理員登入
          </button>
        </div>
      </div>
    </div>
  );
}
