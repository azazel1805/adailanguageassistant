import { Achievement, ChallengeState, HistoryItem, VocabularyItem } from './types';

type UnlockCondition = (
  history: HistoryItem[],
  vocabularyList: VocabularyItem[],
  challengeState: ChallengeState
) => boolean;

interface AchievementDefinition extends Achievement {
    isUnlocked: UnlockCondition;
}

export const allAchievements: AchievementDefinition[] = [
    {
        id: 'FIRST_ANALYSIS',
        title: 'İlk Adım',
        description: 'İlk sorunu başarıyla analiz ettin.',
        icon: '🌱',
        isUnlocked: (history) => history.length >= 1,
    },
    {
        id: 'ANALYZER_NOVICE',
        title: 'Meraklı Analist',
        description: '10 soru analiz ettin.',
        icon: '🧐',
        isUnlocked: (history) => history.length >= 10,
    },
    {
        id: 'ANALYZER_PRO',
        title: 'Usta Analist',
        description: '50 soru analiz ettin.',
        icon: '🕵️',
        isUnlocked: (history) => history.length >= 50,
    },
    {
        id: 'FIRST_WORD',
        title: 'Koleksiyoner',
        description: 'İlk kelimeni kaydettin.',
        icon: '🔖',
        isUnlocked: (_, vocabularyList) => vocabularyList.length >= 1,
    },
    {
        id: 'VOCAB_BUILDER',
        title: 'Kelime Avcısı',
        description: '25 kelime kaydettin.',
        icon: '📚',
        isUnlocked: (_, vocabularyList) => vocabularyList.length >= 25,
    },
    {
        id: 'LEXICOGRAPHER',
        title: 'Sözlük Kurdu',
        description: '100 kelime kaydettin.',
        icon: '📕',
        isUnlocked: (_, vocabularyList) => vocabularyList.length >= 100,
    },
    {
        id: 'STREAK_3',
        title: 'Isınma Turu',
        description: '3 günlük seriyi tamamladın.',
        icon: '🔥',
        isUnlocked: (_, __, challengeState) => challengeState.streak >= 3,
    },
    {
        id: 'STREAK_7',
        title: 'Alev Aldı',
        description: '7 günlük seriyi tamamladın.',
        icon: '☄️',
        isUnlocked: (_, __, challengeState) => challengeState.streak >= 7,
    },
    {
        id: 'STREAK_30',
        title: 'Durdurulamaz',
        description: '30 günlük seriyi tamamladın.',
        icon: '☀️',
        isUnlocked: (_, __, challengeState) => challengeState.streak >= 30,
    },
    {
        id: 'POLYGLOT',
        title: 'Çok Yönlü',
        description: '5 farklı türde soru analiz ettin.',
        icon: '🎭',
        isUnlocked: (history) => {
            const uniqueTypes = new Set(history.map(item => item.analysis.soruTipi));
            return uniqueTypes.size >= 5;
        },
    },
     {
        id: 'TUTOR_CHAT',
        title: 'Bilge Danışman',
        description: "AI Eğitmen Onur'dan tavsiye aldın.",
        icon: '🎓',
        isUnlocked: (history) => {
            // This is a proxy. A better way would be to track tutor usage.
            // For now, let's unlock it after 5 analyses.
            return history.length >= 5;
        }
    },
    {
        id: 'QUESTION_GENERATOR_USER',
        title: 'Yaratıcı Zihin',
        description: 'Soru Üreticiyi kullandın.',
        icon: '💡',
        isUnlocked: (history) => {
            // Proxy: unlock after 15 analyses, assuming they will try other features.
            return history.length >= 15;
        }
    }
];
