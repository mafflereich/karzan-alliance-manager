import React, { useState } from 'react';
import { useAppContext } from '../store';
import { Shield, LogIn, LogOut, Settings, Users, User, Lock, AlertCircle, X, Globe, Volume2, VolumeX, Sun, Moon, Monitor, Layout, Mail, Gamepad2, Trophy } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../ThemeContext';
import { logEvent } from '../analytics';

import { supabase } from '../supabase';
import LoginModal from './LoginModal';

export default function Header() {
  const { t, i18n } = useTranslation();
  const { db, currentUser, setCurrentUser, currentView, setCurrentView, userVolume, setUserVolume, userRoles, userRole } = useAppContext();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [isVolumeHovered, setIsVolumeHovered] = useState(false);
  const { preference, cycleTheme } = useTheme();
  const volumeHoverTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const volumeContainerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (volumeContainerRef.current && !volumeContainerRef.current.contains(event.target as Node)) {
        setIsVolumeHovered(false);
        if (volumeHoverTimeoutRef.current) {
          clearTimeout(volumeHoverTimeoutRef.current);
          volumeHoverTimeoutRef.current = null;
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleVolumeMouseEnter = () => {
    if (volumeHoverTimeoutRef.current) {
      clearTimeout(volumeHoverTimeoutRef.current);
      volumeHoverTimeoutRef.current = null;
    }
    setIsVolumeHovered(true);
  };

  const handleVolumeMouseLeave = () => {
    volumeHoverTimeoutRef.current = setTimeout(() => {
      setIsVolumeHovered(false);
    }, 300); // 300ms delay before hiding
  };

  const handleLogout = async () => {

    logEvent('User', 'Logout', currentUser || 'unknown');
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setCurrentUser(null);
      setCurrentView(null);
    }
  };

  const sortedGuilds = (Object.entries(db.guilds) as [string, any][]).sort((a, b) => {
    const tierA = a[1].tier || 99;
    const tierB = b[1].tier || 99;
    if (tierA !== tierB) return tierA - tierB;
    const orderA = a[1].orderNum || 99;
    const orderB = b[1].orderNum || 99;
    return orderA - orderB;
  });

  const canSeeAllGuilds = userRole === 'admin' || userRole === 'creator' || userRole === 'manager';
  const canAccessAdmin = userRole === 'admin' || userRole === 'creator';

  const getDefaultRoles = (pageId: string): ('member' | 'manager' | 'admin' | 'creator')[] => {
    switch (pageId) {
      case 'costume_list': return ['member', 'manager', 'admin', 'creator'];
      case 'application_mailbox': return ['member', 'manager', 'admin', 'creator'];
      case 'arcade': return ['manager', 'admin', 'creator'];
      case 'alliance_raid_record': return ['creator'];
      default: return ['creator', 'admin'];
    }
  };

  const canAccessPage = (pageId: string) => {
    const roles = db.accessControl?.[pageId]?.roles || getDefaultRoles(pageId);
    if (!currentUser) return false;
    return roles.includes(userRole as any);
  };

  const userGuilds = !canSeeAllGuilds && userRoles.length > 0 ? Object.entries(db.guilds).filter(([_, g]) => userRoles.includes(g.username || '') || userRoles.includes(g.name || '')) : [];
  const userGuildId = userGuilds.length > 0 ? userGuilds[0][0] : null;

  const topGuildId = canSeeAllGuilds ? (sortedGuilds.length > 0 ? sortedGuilds[0][0] : null) : userGuildId;

  const isCostumeListActive = currentView?.type === 'guild';
  const isAdminActive = currentView?.type === 'admin';

  const firstSettingId = db.settings && Object.keys(db.settings).length > 0 ? Object.keys(db.settings)[0] : 'default';
  const hasBgm = !!db.settings?.[firstSettingId]?.bgmUrl;
  const bgmDefaultVolume = db.settings?.[firstSettingId]?.bgmDefaultVolume ?? 50;
  const currentVolume = userVolume !== null ? userVolume : bgmDefaultVolume;
  const isMuted = currentVolume === 0;

  const toggleMute = () => {
    if (isMuted) {
      setUserVolume(bgmDefaultVolume > 0 ? bgmDefaultVolume : 50);
    } else {
      setUserVolume(0);
    }
  };

  return (
    <>
      <header className="bg-stone-900 text-white p-4 shadow-md shrink-0 sticky top-0 z-[100]">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1
            className="text-xl font-bold flex items-center gap-2 cursor-pointer hover:text-amber-400 transition-colors"
            onClick={() => setCurrentView(null)}
          >
            <Shield className="w-6 h-6 text-amber-500" />
            <span className="hidden sm:inline">{t('header.system_title')}</span>
          </h1>
          <div className="flex items-center gap-6 text-sm font-medium">
            <button
              onClick={() => {
                if (topGuildId) {
                  logEvent('Navigation', 'Click', 'Costume List');
                  setCurrentView({ type: 'guild', guildId: topGuildId });
                }
              }}
              disabled={isCostumeListActive || !topGuildId}
              className={`flex items-center gap-2 transition-colors ${isCostumeListActive ? 'text-amber-500 cursor-default' : 'hover:text-amber-400 disabled:opacity-50 disabled:cursor-not-allowed'} ${!canAccessPage('costume_list') ? 'hidden' : ''}`}
            >
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">{t('header.costume_list')}</span>
            </button>

            {canAccessPage('application_mailbox') && (
              <button
                onClick={() => {
                  logEvent('Navigation', 'Click', 'Application Mailbox');
                  setCurrentView({ type: 'application_mailbox' });
                }}
                disabled={currentView?.type === 'application_mailbox'}
                className={`flex items-center gap-2 transition-colors ${currentView?.type === 'application_mailbox' ? 'text-amber-500 cursor-default' : 'hover:text-amber-400'}`}
              >
                <Mail className="w-4 h-4" />
                <span className="hidden sm:inline">{t('header.application_mailbox')}</span>
              </button>
            )}

            {canAccessPage('arcade') && (
              <button
                onClick={() => {
                  logEvent('Navigation', 'Click', 'Arcade');
                  setCurrentView({ type: 'arcade' });
                }}
                disabled={currentView?.type === 'arcade'}
                className={`flex items-center gap-2 transition-colors ${currentView?.type === 'arcade' ? 'text-amber-500 cursor-default' : 'hover:text-amber-400'}`}
              >
                <Gamepad2 className="w-4 h-4" />
                <span className="hidden sm:inline">{t('header.arcade')}</span>
              </button>
            )}

            {currentUser ? (
              <div className="flex items-center gap-6">
                {canAccessPage('alliance_raid_record') && (
                  <button
                    onClick={() => {
                      logEvent('Navigation', 'Click', 'Alliance Raid Record');
                      setCurrentView({ type: 'alliance_raid_record' });
                    }}
                    disabled={currentView?.type === 'alliance_raid_record'}
                    className={`flex items-center gap-2 transition-colors ${currentView?.type === 'alliance_raid_record' ? 'text-amber-500 cursor-default' : 'hover:text-amber-400'}`}
                  >
                    <Trophy className="w-4 h-4" />
                    <span className="hidden sm:inline">{t('header.alliance_raid_record')}</span>
                  </button>
                )}

                {canAccessAdmin && (
                  <button
                    onClick={() => {
                      logEvent('Navigation', 'Click', 'Admin Settings');
                      setCurrentView({ type: 'admin' });
                    }}
                    disabled={isAdminActive}
                    className={`flex items-center gap-2 transition-colors ${isAdminActive ? 'text-amber-500 cursor-default' : 'hover:text-amber-400'}`}
                  >
                    <Settings className="w-4 h-4" />
                    <span className="hidden sm:inline">{t('header.admin_settings')}</span>
                  </button>
                )}

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 hover:text-amber-400 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('header.logout', { user: currentUser })}</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="flex items-center gap-2 hover:text-amber-400 transition-colors"
              >
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline">{t('header.login_btn')}</span>
              </button>
            )}

            <div className="flex items-center gap-4 border-l border-stone-800 pl-4">
              <div className="relative">
                <button
                  onClick={cycleTheme}
                  className="flex items-center justify-center hover:text-amber-400 transition-colors p-1"
                  title={preference === 'system' ? t('header.theme_system') : preference === 'light' ? t('header.theme_light') : t('header.theme_dark')}
                >
                  {preference === 'light' && <Sun className="w-4 h-4" />}
                  {preference === 'dark' && <Moon className="w-4 h-4" />}
                  {preference === 'system' && <Monitor className="w-4 h-4" />}
                </button>
              </div>
              <div className="relative" ref={volumeContainerRef}>
                <button
                  onMouseEnter={handleVolumeMouseEnter}
                  onMouseLeave={handleVolumeMouseLeave}
                  onClick={() => hasBgm && toggleMute()}
                  disabled={!hasBgm}
                  className={`flex items-center justify-center transition-colors p-1 ${hasBgm ? 'hover:text-amber-400' : 'text-stone-600 cursor-not-allowed'}`}
                  title={!hasBgm ? t('common.no_bgm') : isMuted ? t('common.unmute') : t('common.mute')}
                >
                  {isMuted || !hasBgm ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>

                {isVolumeHovered && hasBgm && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-4 bg-stone-800 p-3 rounded-lg shadow-xl z-[100] flex flex-col items-center gap-2 w-10 h-32 border border-stone-700">
                    <div className="h-24 flex items-center justify-center">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={currentVolume}
                        onChange={(e) => setUserVolume(Number(e.target.value))}
                        className="h-20 w-1 appearance-none bg-stone-600 rounded-lg accent-amber-500 cursor-pointer"
                        style={{ writingMode: 'vertical-lr', direction: 'rtl' }}
                      />
                    </div>
                    <span className="text-[10px] text-stone-400 font-mono">{currentVolume}</span>
                  </div>
                )}
              </div>

              <div className="relative">
                <button
                  onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                  className="flex items-center justify-center hover:text-amber-400 transition-colors p-1"
                  title={t('footer.language')}
                >
                  <Globe className="w-4 h-4" />
                </button>

                {isLangDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-[90]"
                      onClick={() => setIsLangDropdownOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-32 bg-stone-800 border border-stone-700 rounded-lg shadow-xl z-[100] overflow-hidden">
                      <button
                        onClick={() => {
                          i18n.changeLanguage('zh-TW');
                          setIsLangDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-xs hover:bg-stone-700 transition-colors ${i18n.language === 'zh-TW' ? 'text-amber-500 font-bold' : 'text-stone-300'}`}
                      >
                        繁體中文
                      </button>
                      <button
                        onClick={() => {
                          i18n.changeLanguage('en');
                          setIsLangDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-xs hover:bg-stone-700 transition-colors ${i18n.language === 'en' ? 'text-amber-500 font-bold' : 'text-stone-300'}`}
                      >
                        English
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {isLoginModalOpen && (
        <LoginModal onClose={() => setIsLoginModalOpen(false)} />
      )}
    </>
  );
}


