
import React, { createContext, useContext, ReactNode } from 'react';
import useLocalStorage from '../hooks/useLocalStorage.ts';
import { HistoryItem, AnalysisResult } from '../types.ts';
import { useAuth } from './AuthContext.tsx';

interface HistoryContextType {
  history: HistoryItem[];
  addHistoryItem: (question: string, analysis: AnalysisResult) => void;
  clearHistory: () => void;
}

const HistoryContext = createContext<HistoryContextType | undefined>(undefined);

export const HistoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  // FIX: Use user.email for a unique key per user, not the user object itself.
  const historyKey = user ? `yds-analysis-history-${user.email}` : 'yds-analysis-history-guest'; 
  
  const [history, setHistory] = useLocalStorage<HistoryItem[]>(historyKey, []);

  const addHistoryItem = (question: string, analysis: AnalysisResult) => {
    const newItem: HistoryItem = {
      id: new Date().toISOString(),
      question,
      analysis,
      timestamp: new Date().toLocaleString('tr-TR'),
    };
    // The `setHistory` from `useLocalStorage` will correctly update the state
    // and persist it under the current `historyKey`.
    setHistory(prevHistory => [newItem, ...prevHistory].slice(0, 50)); // Keep last 50
  };
    
  const clearHistory = () => {
    setHistory([]);
  }

  return (
    <HistoryContext.Provider value={{ history, addHistoryItem, clearHistory }}>
      {children}
    </HistoryContext.Provider>
  );
};

export const useHistory = (): HistoryContextType => {
  const context = useContext(HistoryContext);
  if (context === undefined) {
    throw new Error('useHistory must be used within a HistoryProvider');
  }
  return context;
};
