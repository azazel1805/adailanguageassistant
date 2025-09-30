
import React, { createContext, useContext, ReactNode } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { useAuth } from './AuthContext';
import { VocabularyItem } from '../types';

interface VocabularyContextType {
  vocabularyList: VocabularyItem[];
  addWord: (word: string, meaning: string) => void;
  removeWord: (word: string) => void;
  isWordSaved: (word: string) => boolean;
}

const VocabularyContext = createContext<VocabularyContextType | undefined>(undefined);

export const VocabularyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const vocabularyKey = user ? `vocabulary-list-${user}` : 'vocabulary-list-guest';
  
  const [vocabularyList, setVocabularyList] = useLocalStorage<VocabularyItem[]>(vocabularyKey, []);

  const addWord = (word: string, meaning: string) => {
    const normalizedWord = word.toLowerCase().trim();
    if (!isWordSaved(normalizedWord)) {
      const newItem: VocabularyItem = {
        id: new Date().toISOString(),
        word: normalizedWord,
        meaning: meaning.trim(),
      };
      setVocabularyList(prevList => [newItem, ...prevList]);
    }
  };

  const removeWord = (word: string) => {
    const normalizedWord = word.toLowerCase().trim();
    setVocabularyList(prevList => prevList.filter(item => item.word.toLowerCase() !== normalizedWord));
  };
    
  const isWordSaved = (word: string): boolean => {
    const normalizedWord = word.toLowerCase().trim();
    return vocabularyList.some(item => item.word.toLowerCase() === normalizedWord);
  };

  return (
    <VocabularyContext.Provider value={{ vocabularyList, addWord, removeWord, isWordSaved }}>
      {children}
    </VocabularyContext.Provider>
  );
};

export const useVocabulary = (): VocabularyContextType => {
  const context = useContext(VocabularyContext);
  if (context === undefined) {
    throw new Error('useVocabulary must be used within a VocabularyProvider');
  }
  return context;
};