/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppProvider, useAppContext } from './store';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import GuildDashboard from './pages/GuildDashboard';

const AppContent = () => {
  const { currentView } = useAppContext();

  if (!currentView) {
    return <Login />;
  }

  if (currentView.type === 'admin') {
    return <AdminDashboard />;
  }

  return <GuildDashboard guildId={currentView.guildId} />;
};

export default function App() {
  return (
    <AppProvider>
      <div className="min-h-screen bg-stone-100 text-stone-900 font-sans">
        <AppContent />
      </div>
    </AppProvider>
  );
}
