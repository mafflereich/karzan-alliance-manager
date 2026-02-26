import React, { useState, useEffect } from 'react';
import { useAppContext } from '../store';
import { Shield, Users, ChevronRight, Lock } from 'lucide-react';
import { getTierColor, getTierBorderHoverClass, getTierTextHoverClass } from '../utils';
import Footer from '../components/Footer';
import Header from '../components/Header';

export default function Login() {
  const { db, setCurrentView } = useAppContext();
  const [isSiteUnlocked, setIsSiteUnlocked] = useState(false);
  const [sitePasswordInput, setSitePasswordInput] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const unlockTimestamp = localStorage.getItem('siteUnlockTimestamp');
    if (unlockTimestamp) {
      const sevenDaysInMillis = 7 * 24 * 60 * 60 * 1000;
      if (Date.now() - parseInt(unlockTimestamp, 10) < sevenDaysInMillis) {
        setIsSiteUnlocked(true);
      }
    }
  }, []);

  const handleSiteUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (sitePasswordInput === db.settings.site_password) {
      localStorage.setItem('siteUnlockTimestamp', Date.now().toString());
      setIsSiteUnlocked(true);
      setError('');
    } else {
      const redirectUrl = db.settings.redirect_url || 'https://www.browndust2.com/';
      window.location.href = redirectUrl;
    }
  };

  const handleGuildSelect = (guildId: string) => {
    setCurrentView({ type: 'guild', guildId });
  };

  const sortedGuilds = (Object.entries(db.guilds) as [string, any][]).sort((a, b) => {
    const tierA = a[1].tier || 99;
    const tierB = b[1].tier || 99;
    if (tierA !== tierB) return tierA - tierB;
    const orderA = a[1].order_num || 99;
    const orderB = b[1].order_num || 99;
    return orderA - orderB;
  });

  return (
    <div className="flex flex-col min-h-screen bg-stone-200">
      {isSiteUnlocked && <Header />}
      <div className="flex-1 flex items-center justify-center p-4">
        {!isSiteUnlocked ? (
          <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md transition-all duration-300">
            <h1 className="text-2xl font-bold text-center mb-6 text-stone-800">請輸入進入密碼</h1>
            <form onSubmit={handleSiteUnlock} className="space-y-4">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                <input 
                  type="password" 
                  required
                  className="w-full pl-10 pr-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-white"
                  value={sitePasswordInput}
                  onChange={e => setSitePasswordInput(e.target.value)}
                  placeholder="請輸入密碼"
                  autoFocus
                />
              </div>
              <button 
                type="submit"
                className="w-full py-2 bg-stone-800 text-white hover:bg-stone-700 rounded-lg font-medium transition-colors"
              >
                進入系統
              </button>
            </form>
          </div>
        ) : (
          <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-5xl transition-all duration-300">
            <h1 className="text-3xl font-bold text-center mb-8 text-stone-800">Kazran 聯盟系統</h1>
            
            <div className="space-y-8">
              <div className="p-6 border border-stone-200 rounded-xl bg-stone-50">
                <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                  <Users className="w-5 h-5" /> 選擇公會
                </h2>
                
                {Object.keys(db.guilds).length === 0 ? (
                  <div className="text-center text-stone-500 py-8">
                    目前沒有任何公會
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(tier => {
                      const tierGuilds = sortedGuilds.filter(g => (g[1].tier || 1) === tier);
                      if (tierGuilds.length === 0) return null;
                      return (
                        <div key={tier} className="space-y-3">
                          <h3 className={`font-bold text-center py-2 rounded-lg border ${getTierColor(tier)}`}>梯隊 {tier}</h3>
                          {tierGuilds.map(([id, guild]: [string, any]) => (
                            <button
                              key={id}
                              onClick={() => handleGuildSelect(id)}
                              className={`w-full flex items-center justify-between p-4 bg-white border border-stone-200 rounded-xl transition-all group ${getTierBorderHoverClass(tier)}`}
                            >
                              <span className={`font-medium text-stone-800 transition-colors ${getTierTextHoverClass(tier)}`}>{guild.name}</span>
                              <ChevronRight className={`w-5 h-5 text-stone-400 transition-colors ${getTierTextHoverClass(tier)}`} />
                            </button>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
