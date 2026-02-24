import React, { createContext, useContext, useState, useEffect } from 'react';
import { Database } from './types';
import { db as firestore } from './firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

const defaultData: Database = {
  guilds: {
    "g001": { name: "Karzan一會" },
    "g002": { name: "Karzan二會" }
  },
  guildOrder: ["g001", "g002"],
  members: {
    "u123": {
      name: "玩家阿明",
      guildId: "g001",
      role: "Member",
      records: {
        "costume_001": { level: 5, weapon: true },
        "costume_002": { level: -1, weapon: false }
      }
    }
  },
  costume_definitions: [
    { id: "costume_001", name: "優斯緹亞 (劍道社)", character: "Justia" },
    { id: "costume_002", name: "莎赫拉查德 (代號S)", character: "Schera" }
  ]
};

type ViewState = { type: 'admin' } | { type: 'guild', guildId: string } | null;

interface AppContextType {
  db: Database;
  setDb: React.Dispatch<React.SetStateAction<Database>>;
  currentView: ViewState;
  setCurrentView: React.Dispatch<React.SetStateAction<ViewState>>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [db, setDbState] = useState<Database>(defaultData);
  const [currentView, setCurrentView] = useState<ViewState>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const docRef = doc(firestore, 'appData', 'main');
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setDbState(docSnap.data() as Database);
      } else {
        // Initialize with default data if document doesn't exist
        setDoc(docRef, defaultData).catch(console.error);
      }
      setIsLoaded(true);
    }, (error) => {
      console.error("Error fetching data from Firestore:", error);
      // Fallback to local state if Firebase is not configured or fails
      setIsLoaded(true);
    });

    return () => unsubscribe();
  }, []);

  const setDb = (value: React.SetStateAction<Database>) => {
    setDbState(prev => {
      const next = typeof value === 'function' ? value(prev) : value;
      // Sync to Firestore
      setDoc(doc(firestore, 'appData', 'main'), next).catch(console.error);
      return next;
    });
  };

  if (!isLoaded) {
    return <div className="min-h-screen flex items-center justify-center bg-stone-100 text-stone-500">載入中...</div>;
  }

  return (
    <AppContext.Provider value={{ db, setDb, currentView, setCurrentView }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
};
