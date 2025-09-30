import React, { createContext, useContext, ReactNode } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { MockExamResultData, PerformanceStats } from '../types';
import { useAuth } from './AuthContext';

interface ExamHistoryContextType {
  examHistory: MockExamResultData[];
  performanceStats: PerformanceStats;
  addExamResult: (result: Omit<MockExamResultData, 'id' | 'timestamp'>) => void;
  trackSingleQuestionResult: (questionType: string, isCorrect: boolean) => void;
  clearExamHistory: () => void;
}

const ExamHistoryContext = createContext<ExamHistoryContextType | undefined>(undefined);

export const ExamHistoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const historyKey = user ? `yds-exam-history-${user}` : 'yds-exam-history-guest'; 
  const performanceKey = user ? `yds-performance-stats-${user}` : 'yds-performance-stats-guest';

  const [examHistory, setExamHistory] = useLocalStorage<MockExamResultData[]>(historyKey, []);
  const [performanceStats, setPerformanceStats] = useLocalStorage<PerformanceStats>(performanceKey, {});


  const addExamResult = (result: Omit<MockExamResultData, 'id' | 'timestamp'>) => {
    const newResult: MockExamResultData = {
      ...result,
      id: new Date().toISOString(),
      timestamp: new Date().toLocaleString('tr-TR'),
    };
    setExamHistory(prevHistory => [newResult, ...prevHistory].slice(0, 10)); // Keep last 10 exams
    
    // Also update performance stats from the full exam
    setPerformanceStats(prevStats => {
      const newStats = { ...prevStats };
      for (const type in result.performanceByType) {
        if (Object.prototype.hasOwnProperty.call(result.performanceByType, type)) {
            const perf = result.performanceByType[type];
            const current = newStats[type] || { correct: 0, total: 0 };
            newStats[type] = {
                correct: current.correct + perf.correct,
                total: current.total + perf.total,
            };
        }
      }
      return newStats;
    });
  };

  const trackSingleQuestionResult = (questionType: string, isCorrect: boolean) => {
    setPerformanceStats(prevStats => {
        const newStats = { ...prevStats };
        const current = newStats[questionType] || { correct: 0, total: 0 };
        newStats[questionType] = {
            correct: current.correct + (isCorrect ? 1 : 0),
            total: current.total + 1,
        };
        return newStats;
    });
  };
    
  const clearExamHistory = () => {
    setExamHistory([]);
    setPerformanceStats({}); // Also clear aggregated stats
  }

  return (
    <ExamHistoryContext.Provider value={{ examHistory, performanceStats, addExamResult, trackSingleQuestionResult, clearExamHistory }}>
      {children}
    </ExamHistoryContext.Provider>
  );
};

export const useExamHistory = (): ExamHistoryContextType => {
  const context = useContext(ExamHistoryContext);
  if (context === undefined) {
    throw new Error('useExamHistory must be used within a ExamHistoryProvider');
  }
  return context;
};
