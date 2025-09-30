import React, { useState, useRef } from 'react';
import { generateSentenceOrderingExercise } from '../services/geminiService';
import { SentenceOrderingExercise } from '../types';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';
import { DIFFICULTY_LEVELS } from '../constants';
import { useChallenge } from '../context/ChallengeContext';

type DraggableSentence = {
    id: number; // Original index
    text: string;
};

const SentenceOrdering: React.FC = () => {
    const [difficulty, setDifficulty] = useState(DIFFICULTY_LEVELS[1]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [exercise, setExercise] = useState<SentenceOrderingExercise | null>(null);
    const [userOrderedSentences, setUserOrderedSentences] = useState<DraggableSentence[]>([]);
    const [showResults, setShowResults] = useState(false);
    const { trackAction } = useChallenge();

    const draggedItemIndex = useRef<number | null>(null);
    const dropTargetIndex = useRef<number | null>(null);

    const handleGenerate = async () => {
        setIsLoading(true);
        setError('');
        setExercise(null);
        setUserOrderedSentences([]);
        setShowResults(false);
        try {
            const resultText = await generateSentenceOrderingExercise(difficulty);
            const resultJson: SentenceOrderingExercise = JSON.parse(resultText);
            setExercise(resultJson);
            setUserOrderedSentences(resultJson.sentences.map((text, id) => ({ id, text })));
            trackAction('sentence_ordering');
        } catch (e: any) {
            setError(e.message || 'Alıştırma oluşturulurken bir hata oluştu.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleDragStart = (index: number) => {
        draggedItemIndex.current = index;
    };
    
    const handleDragEnter = (index: number) => {
        dropTargetIndex.current = index;
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault(); // Necessary to allow drop
    };
    
    const handleDrop = () => {
        if (draggedItemIndex.current === null || dropTargetIndex.current === null) return;
        
        const newOrder = [...userOrderedSentences];
        const [draggedItem] = newOrder.splice(draggedItemIndex.current, 1);
        newOrder.splice(dropTargetIndex.current, 0, draggedItem);
        
        setUserOrderedSentences(newOrder);
        draggedItemIndex.current = null;
        dropTargetIndex.current = null;
    };
    
    const handleCheckAnswers = () => {
        setShowResults(true);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-bg-secondary p-6 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold mb-2 text-text-primary">Cümle Sıralama Alıştırması</h2>
                <p className="mb-4 text-text-secondary">
                    Karışık olarak verilen cümleleri sürükleyip bırakarak anlamlı bir paragraf oluşturun. Bu alıştırma, metin akışı ve anlamsal bütünlük kurma becerinizi geliştirir.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                    <div className="flex-1 w-full">
                        <label className="block text-sm font-medium text-text-secondary mb-1">Zorluk Seviyesi</label>
                        <select
                            value={difficulty}
                            onChange={(e) => setDifficulty(e.target.value)}
                            className="w-full p-3 bg-gray-50 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary focus:outline-none text-text-primary"
                            disabled={isLoading}
                        >
                            {DIFFICULTY_LEVELS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    </div>
                    <button
                        onClick={handleGenerate}
                        disabled={isLoading}
                        className="w-full sm:w-auto mt-2 sm:mt-0 self-end bg-brand-primary hover:bg-brand-secondary text-white font-bold py-3 px-6 rounded-md transition duration-300 disabled:bg-gray-500"
                    >
                        {isLoading ? 'Oluşturuluyor...' : 'Yeni Alıştırma Oluştur'}
                    </button>
                </div>
            </div>

            {isLoading && <Loader />}
            <ErrorMessage message={error} />
            
            {exercise && (
                <div className="bg-bg-secondary p-6 rounded-lg shadow-lg">
                    <h3 className="text-xl font-bold text-brand-primary mb-4">Paragrafı Oluştur</h3>
                    <p className="text-sm text-text-secondary mb-4">Cümleleri doğru sıraya sürükleyin.</p>

                    <div 
                        className="space-y-3 border border-gray-200 p-4 rounded-lg"
                        onDragOver={handleDragOver}
                    >
                        {userOrderedSentences.map((sentence, index) => {
                             const isCorrect = showResults && exercise.analysis.correctOrderIndices[index] === sentence.id;
                             const resultClass = showResults
                                ? isCorrect
                                    ? 'border-green-500 bg-green-100'
                                    : 'border-red-500 bg-red-100'
                                : 'border-gray-300 bg-gray-50';

                            return (
                                <div
                                    key={sentence.id}
                                    draggable={!showResults}
                                    onDragStart={() => handleDragStart(index)}
                                    onDragEnter={() => handleDragEnter(index)}
                                    onDrop={handleDrop}
                                    className={`flex items-start p-3 rounded-md border-2 transition-all duration-200 ${resultClass} ${!showResults ? 'cursor-move hover:bg-brand-secondary/10' : ''}`}
                                >
                                    <span className="text-xl text-brand-primary font-bold mr-4">{index + 1}.</span>
                                    <p className="text-text-primary flex-1">{sentence.text}</p>
                                </div>
                            );
                        })}
                    </div>

                    {!showResults && (
                        <button onClick={handleCheckAnswers} className="mt-6 w-full bg-brand-secondary hover:bg-brand-primary text-white font-bold py-3 px-4 rounded-md transition duration-300">
                            Cevapları Kontrol Et
                        </button>
                    )}
                </div>
            )}
            
            {showResults && exercise && (
                 <div className="bg-bg-secondary p-6 rounded-lg shadow-lg">
                     <h3 className="text-xl font-bold text-green-600 mb-4">Analiz ve Açıklama</h3>
                     <div className="bg-gray-100 p-4 rounded-md space-y-3">
                         <h4 className="font-semibold text-text-primary">Doğru Sıralama ve Mantığı</h4>
                         <p className="text-sm text-text-secondary whitespace-pre-wrap">{exercise.analysis.explanation}</p>
                     </div>
                 </div>
            )}
        </div>
    );
};

export default SentenceOrdering;