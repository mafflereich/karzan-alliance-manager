/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppProvider, useAppContext } from './store';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import GuildDashboard from './pages/GuildDashboard';
import ToastContainer from './components/Toast';

const AppContent = () => {
  const { db, currentView, currentUser, setCurrentView } = useAppContext();

  if (!currentView) {
    return <Login />;
  }

  if (currentView.type === 'admin') {
    const userRole = currentUser ? db.users[currentUser]?.role : null;
    const canAccessAdmin = userRole === 'admin' || userRole === 'creator';
    
    if (!canAccessAdmin) {
      setCurrentView(null);
      return <Login />;
    }
    return <AdminDashboard />;
  }

  return <GuildDashboard guildId={currentView.guildId} />;
};

const BGM_URL = "https://bybjhpiusfnjlbhiesrp.supabase.co/storage/v1/object/public/bgm/Lineage.mp3";
const CACHE_NAME = 'bgm-cache-v1';

const AppContentWrapper = () => {
  const { isMuted } = useAppContext();
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const [audioSrc, setAudioSrc] = React.useState<string>("");

  React.useEffect(() => {
    const loadAudio = async () => {
      // Only download if we are unmuted and haven't loaded yet
      if (isMuted || audioSrc) return;
      
      try {
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(BGM_URL);
        
        if (cachedResponse) {
          console.log("Loading BGM from cache...");
          const blob = await cachedResponse.blob();
          setAudioSrc(URL.createObjectURL(blob));
        } else {
          console.log("Downloading BGM for the first time...");
          const response = await fetch(BGM_URL);
          if (response.ok) {
            const responseToCache = response.clone();
            await cache.put(BGM_URL, responseToCache);
            const blob = await response.blob();
            setAudioSrc(URL.createObjectURL(blob));
          }
        }
      } catch (error) {
        console.error("Error loading/caching BGM:", error);
        // Fallback to direct URL if cache fails
        setAudioSrc(BGM_URL);
      }
    };

    loadAudio();
  }, [isMuted, audioSrc]);

  React.useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
      if (!isMuted && audioSrc) {
        audioRef.current.play().catch(err => console.log("Autoplay blocked or error:", err));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isMuted, audioSrc]);

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 font-sans">
      {audioSrc && (
        <audio
          ref={audioRef}
          src={audioSrc}
          loop
          autoPlay
        />
      )}
      <React.Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
        <AppContent />
      </React.Suspense>
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContentWrapper />
    </AppProvider>
  );
}
