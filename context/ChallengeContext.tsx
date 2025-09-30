
import React, { createContext, useContext, ReactNode, useEffect, useCallback } from 'react';
import useLocalStorage from '../hooks/useLocalStorage.ts';
import { useAuth } from './AuthContext.tsx';
import { ChallengeState, ChallengeType, DailyChallenge } from '../types.ts';

const getTodayDateString = () => new Date().toISOString().split('T')[0];

interface ChallengeContextType {
    challengeState: ChallengeState;
    setDailyChallenge: (challengeConfig: Omit<DailyChallenge, 'id' | 'progress' | 'completed'>) => void;
    trackAction: (type: ChallengeType) => void;
}

const ChallengeContext = createContext<ChallengeContextType | undefined>(undefined);

export const ChallengeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    // FIX: Use user.email for a unique key per user, not the user object itself.
    const challengeKey = user ? `challenge-state-${user.email}` : 'challenge-state-guest';
    
    const initialState: ChallengeState = {
        currentChallenge: null,
        lastCompletedDate: null,
        streak: 0,
    };
    
    const [challengeState, setChallengeState] = useLocalStorage<ChallengeState>(challengeKey, initialState);
    
    useEffect(() => {
        const today = getTodayDateString();
        // If the current challenge is from a previous day, reset it.
        // This prompts the user to set a new goal for the day.
        if (challengeState.currentChallenge && challengeState.currentChallenge.id !== today) {
             setChallengeState(prev => {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayString = yesterday.toISOString().split('T')[0];
                
                // Reset streak if the last completed day wasn't yesterday.
                const streak = prev.lastCompletedDate === yesterdayString ? prev.streak : 0;

                return {
                    ...prev,
                    streak,
                    currentChallenge: null
                };
             });
        }
    }, [user, challengeState.currentChallenge, setChallengeState]);

    const setDailyChallenge = (challengeConfig: Omit<DailyChallenge, 'id' | 'progress' | 'completed'>) => {
        const newChallenge: DailyChallenge = {
            ...challengeConfig,
            id: getTodayDateString(),
            progress: 0,
            completed: false,
        };
        setChallengeState(prev => ({...prev, currentChallenge: newChallenge}));
    };

    const trackAction = (type: ChallengeType) => {
        setChallengeState(prev => {
            const { currentChallenge } = prev;
            if (!currentChallenge || currentChallenge.completed) {
                return prev;
            }

            // Check if the action type directly matches the challenge type
            if (currentChallenge.type === type) {
                const newProgress = currentChallenge.progress + 1;
                const isCompleted = newProgress >= currentChallenge.target;
                
                const updatedChallenge: DailyChallenge = {
                    ...currentChallenge,
                    progress: newProgress,
                    completed: isCompleted,
                };
                
                if (isCompleted) {
                    return {
                        ...prev,
                        currentChallenge: updatedChallenge,
                        lastCompletedDate: getTodayDateString(),
                        streak: prev.streak + 1
                    };
                }
                
                return { ...prev, currentChallenge: updatedChallenge };
            }

            return prev;
        });
    };

    return (
        <ChallengeContext.Provider value={{ challengeState, setDailyChallenge, trackAction }}>
            {children}
        </ChallengeContext.Provider>
    );
};

export const useChallenge = (): ChallengeContextType => {
    const context = useContext(ChallengeContext);
    if (context === undefined) {
        throw new Error('useChallenge must be used within a ChallengeProvider');
    }
    return context;
};
