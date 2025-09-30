
import React, { useState, useMemo } from 'react';
import { useVocabulary } from '../context/VocabularyContext';
import { generateVocabularyStory } from '../services/geminiService';
import { VocabularyItem } from '../types';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';

const StoryDisplay: React.FC<{ story: string; words: VocabularyItem[] }> = ({ story, words }) => {
    const storyParts = useMemo(() => {
        // Create a regex to find all the vocabulary words in the story
        const wordMap = new Map(words.map(item => [item.word.toLowerCase(), item]));
        const wordRegex = new RegExp(`\\b(${words.map(item => item.word.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')).join('|')})\\b`, 'gi');
        
        const parts = [];
        let lastIndex = 0;
        let match;

        while ((match = wordRegex.exec(story)) !== null) {
            // Add the text before the match
            if (match.index > lastIndex) {
                parts.push({ type: 'text', content: story.substring(lastIndex, match.index) });
            }
            // Add the matched word
            const matchedWord = match[0];
            const vocabItem = wordMap.get(matchedWord.toLowerCase());
            parts.push({ type: 'word', content: matchedWord, meaning: (vocabItem as VocabularyItem | undefined)?.meaning || 'N/A' });
            lastIndex = match.index + matchedWord.length;
        }

        // Add the remaining text after the last match
        if (lastIndex < story.length) {
            parts.push({ type: 'text', content: story.substring(lastIndex) });
        }

        return parts;
    }, [story, words]);

    return (
        <p className="text-lg leading-relaxed text-text-primary whitespace-pre-wrap">
            {storyParts.map((part, index) => {
                if (part.type === 'word') {
                    return (
                        <span key={index} className="relative group">
                            <strong className="text-brand-primary font-bold bg-brand-primary/10 px-1 rounded cursor-pointer">
                                {part.content}
                            </strong>
                            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs px-3 py-1.5 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                                {part.meaning}
                                <svg className="absolute text-gray-800 h-2 w-full left-0 top-full" x="0px" y="0px" viewBox="0 0 255 255"><polygon className="fill-current" points="0,0 127.5,127.5 255,0"/></svg>
                            </span>
                        </span>
                    );
                }
                return <span key={index}>{part.content}</span>;
            })}
        </p>
    );
};


const VocabularyStoryWeaver: React.FC = () => {
    const { vocabularyList } = useVocabulary();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [story, setStory] = useState('');
    const [usedWords, setUsedWords] = useState<VocabularyItem[]>([]);

    const handleGenerateStory = async () => {
        if (vocabularyList.length < 5) {
            setError('Hikaye oluşturmak için en az 5 kelime kaydetmeniz gerekir.');
            return;
        }

        setIsLoading(true);
        setError('');
        setStory('');
        setUsedWords([]);

        try {
            // Select 5 to 10 random words
            const shuffled = [...vocabularyList].sort(() => 0.5 - Math.random());
            const wordCount = Math.min(10, Math.max(5, Math.floor(vocabularyList.length / 2)));
            const selectedWords = shuffled.slice(0, wordCount);
            
            setUsedWords(selectedWords);

            const generatedStory = await generateVocabularyStory(selectedWords);
            setStory(generatedStory);
        } catch (e: any) {
            setError(e.message || 'Hikaye oluşturulurken bir hata oluştu.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-bg-secondary p-6 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold mb-2 text-text-primary">Kelime Hikayesi Oluşturucu</h2>
                <p className="mb-4 text-text-secondary">
                    Kaydettiğiniz kelimelerden rastgele seçilenlerle size özel bir hikaye oluşturalım. Bu, kelimeleri bağlam içinde görerek öğrenmenizi pekiştirir.
                </p>
                <button
                    onClick={handleGenerateStory}
                    disabled={isLoading || vocabularyList.length < 5}
                    className="w-full bg-brand-primary hover:bg-brand-secondary text-white font-bold py-3 px-4 rounded-md transition duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center"
                >
                    {isLoading ? 'Hikaye Oluşturuluyor...' : 'Yeni Hikaye Oluştur'}
                </button>
                {vocabularyList.length < 5 && (
                    <p className="text-xs text-yellow-600 mt-2 text-center">Hikaye oluşturmak için {5 - vocabularyList.length} kelime daha eklemelisiniz.</p>
                )}
            </div>

            {isLoading && <Loader />}
            <ErrorMessage message={error} />
            
            {story && (
                <div className="bg-bg-secondary p-6 rounded-lg shadow-lg">
                    <h3 className="text-xl font-bold text-brand-primary mb-4">Hikayeniz</h3>
                    <div className="mb-6">
                        <h4 className="font-semibold text-text-secondary mb-2">Kullanılan Kelimeler:</h4>
                        <div className="flex flex-wrap gap-2">
                            {usedWords.map(item => (
                                <span key={item.id} className="px-3 py-1 bg-gray-100 text-brand-primary rounded-full text-sm">
                                    {item.word}
                                </span>
                            ))}
                        </div>
                    </div>
                    <div className="border-t border-gray-200 pt-4">
                        <StoryDisplay story={story} words={usedWords} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default VocabularyStoryWeaver;
