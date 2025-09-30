
import React, { useState } from 'react';
import { generateDialogueExercise } from '../services/geminiService';
import { DialogueCompletionExercise } from '../types';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';
import { useChallenge } from '../context/ChallengeContext';

const DialogueCompletion: React.FC = () => {
    const [difficulty, setDifficulty] = useState('Orta');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [exercise, setExercise] = useState<DialogueCompletionExercise | null>(null);
    const [selectedOptionKey, setSelectedOptionKey] = useState<string | null>(null);
    const [showResults, setShowResults] = useState(false);
    const { trackAction } = useChallenge();

    const handleGenerate = async () => {
        setIsLoading(true);
        setError('');
        setExercise(null);
        setSelectedOptionKey(null);
        setShowResults(false);
        try {
            const resultText = await generateDialogueExercise(difficulty);
            const resultJson: DialogueCompletionExercise = JSON.parse(resultText);
            setExercise(resultJson);
            trackAction('dialogue_completion');
        } catch (e: any) {
            setError(e.message || 'Alıştırma oluşturulurken bir hata oluştu.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleOptionSelect = (optionKey: string) => {
        if (showResults) return;
        setSelectedOptionKey(optionKey);
        setShowResults(true);
    };

    const getExplanationForOption = (optionKey: string): string | null => {
        if (!exercise) return null;
        if (optionKey === exercise.correctOptionKey) {
            return exercise.analysis.correctExplanation;
        }
        const distractor = exercise.analysis.distractorExplanations.find(d => d.optionKey === optionKey);
        return distractor ? distractor.explanation : null;
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-bg-secondary p-6 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold mb-2 text-text-primary">Etkileşimli Diyalog Kurucu 💬</h2>
                <p className="mb-4 text-text-secondary">
                    Bir konuşmanın doğal akışını öğrenin. Size verilen son cümleye mantıksal olarak ulaşan bir önceki adımı bularak diyaloğu tamamlayın.
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
                            <option>Kolay</option>
                            <option>Orta</option>
                            <option>Zor</option>
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
                <div className="bg-bg-secondary p-6 rounded-lg shadow-lg space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold text-text-primary mb-2">Durum</h3>
                        <p className="text-sm text-text-secondary bg-gray-100 p-3 rounded-md">{exercise.situation}</p>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold text-text-primary mb-2">Diyalog</h3>
                        <div className="space-y-3 p-4 border-2 border-dashed border-gray-300 rounded-lg">
                            <div className="text-center text-text-secondary italic">...konuşma devam ediyor...</div>
                            <div className="flex justify-center">
                                <div className="p-3 bg-gray-200 rounded-lg w-full max-w-lg text-center">
                                    <p className="font-bold text-gray-600">Eksik Cümle (?)</p>
                                </div>
                            </div>
                            <div className="flex justify-start">
                                <div className="p-3 bg-brand-secondary text-white rounded-lg rounded-bl-none max-w-lg">
                                    <p className="font-bold">{exercise.finalSentence.speaker}:</p>
                                    <p>"{exercise.finalSentence.text}"</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div>
                        <h3 className="text-lg font-semibold text-text-primary mb-3">Eksik cümleyi tamamlayın:</h3>
                        <div className="space-y-3">
                            {exercise.options.map(opt => {
                                const isSelected = selectedOptionKey === opt.optionKey;
                                const isCorrect = opt.optionKey === exercise.correctOptionKey;
                                let stateClass = "border-transparent bg-gray-100 hover:bg-gray-200";

                                if (showResults) {
                                    if (isCorrect) {
                                        stateClass = "border-green-500 bg-green-100 text-green-800";
                                    } else if (isSelected && !isCorrect) {
                                        stateClass = "border-red-500 bg-red-100 text-red-800";
                                    } else {
                                        stateClass = "border-transparent bg-gray-50 text-gray-500 opacity-70";
                                    }
                                } else if (isSelected) {
                                     stateClass = "bg-brand-secondary border-brand-primary text-white";
                                }

                                return (
                                <button
                                    key={opt.optionKey}
                                    onClick={() => handleOptionSelect(opt.optionKey)}
                                    disabled={showResults}
                                    className={`w-full text-left p-4 rounded-md transition-all duration-200 border-2 ${stateClass} disabled:cursor-not-allowed`}
                                >
                                    <span className="font-bold mr-2">{opt.optionKey}) {opt.speaker}:</span>
                                    <span>{opt.text}</span>
                                </button>
                                );
                            })}
                        </div>
                    </div>

                    {showResults && selectedOptionKey && (
                        <div className="mt-6 border-t border-gray-200 pt-4 animate-fade-in">
                            <h3 className="text-xl font-bold mb-3">Analiz</h3>
                            <div className={`p-4 rounded-lg ${selectedOptionKey === exercise.correctOptionKey ? 'bg-green-100' : 'bg-red-100'}`}>
                                <h4 className={`font-bold text-lg ${selectedOptionKey === exercise.correctOptionKey ? 'text-green-800' : 'text-red-800'}`}>
                                    {selectedOptionKey === exercise.correctOptionKey ? '🎉 Doğru!' : '❌ Tekrar Deneyelim'}
                                </h4>
                                <p className="text-sm mt-1">{getExplanationForOption(selectedOptionKey)}</p>
                            </div>
                        </div>
                    )}

                </div>
            )}
        </div>
    );
};

export default DialogueCompletion;
