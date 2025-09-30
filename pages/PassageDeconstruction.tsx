

import React, { useState } from 'react';
import { deconstructPassage } from '../services/geminiService';
import { PassageDeconstructionResult, DeconstructedSentence, KeyVocabulary } from '../types';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';
import { useVocabulary } from '../context/VocabularyContext';
import { useChallenge } from '../context/ChallengeContext';

const PassageDeconstruction: React.FC = () => {
    const [passageText, setPassageText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [analysisResult, setAnalysisResult] = useState<PassageDeconstructionResult | null>(null);
    const [selectedSentenceIndex, setSelectedSentenceIndex] = useState<number | null>(null);
    const { addWord, removeWord, isWordSaved } = useVocabulary();
    const { trackAction } = useChallenge();

    const handleAnalyze = async () => {
        if (!passageText.trim()) {
            setError('Lütfen analiz edilecek bir metin girin.');
            return;
        }
        setIsLoading(true);
        setError('');
        setAnalysisResult(null);
        setSelectedSentenceIndex(null);
        try {
            const resultText = await deconstructPassage(passageText);
            const resultJson: PassageDeconstructionResult = JSON.parse(resultText);
            setAnalysisResult(resultJson);
            trackAction('deconstruction');
        } catch (e: any) {
            setError(e.message || 'Metin analizi sırasında bir hata oluştu.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleSaveWord = (word: string, meaning: string) => {
        if (isWordSaved(word)) {
            removeWord(word);
        } else {
            addWord(word, meaning);
        }
    };

    const AnalysisDetailView = ({ selectedSentence }: { selectedSentence: DeconstructedSentence | null }) => (
        <div className="bg-bg-secondary p-6 rounded-lg shadow-lg h-full max-h-[80vh] overflow-y-auto">
            {!selectedSentence && analysisResult ? (
                <div className="space-y-6">
                    <div>
                        <h3 className="text-xl font-bold text-brand-primary mb-3">Genel Analiz</h3>
                        <p className="text-text-secondary">Detayları görmek için yandaki metinden bir cümleye tıklayın.</p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-text-secondary mb-2">Ana Fikir</h4>
                        <p className="bg-gray-100 dark:bg-slate-800 p-3 rounded-md text-sm">{analysisResult.mainIdea}</p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-text-secondary mb-2">Yazarın Üslubu</h4>
                        <p className="bg-gray-100 dark:bg-slate-800 p-3 rounded-md text-sm">{analysisResult.authorTone}</p>
                    </div>
                </div>
            ) : selectedSentence ? (
                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-brand-primary mb-2">Cümle Analizi</h3>
                    <div>
                        <h4 className="font-semibold text-text-secondary text-sm mb-1">Basitleştirilmiş Hali</h4>
                        <p className="text-sm bg-gray-100 dark:bg-slate-800 p-3 rounded-md font-mono">{selectedSentence.simplifiedSentence}</p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-text-secondary text-sm mb-1">Gramer Açıklaması</h4>
                        <p className="text-sm bg-gray-100 dark:bg-slate-800 p-3 rounded-md">{selectedSentence.grammarExplanation}</p>
                    </div>
                    {selectedSentence.vocabulary.length > 0 && (
                        <div>
                            <h4 className="font-semibold text-text-secondary text-sm mb-2">Anahtar Kelimeler</h4>
                            <ul className="space-y-2">
                                {selectedSentence.vocabulary.map((item, index) => (
                                    <li key={index} className="bg-gray-100 dark:bg-slate-800 p-2 rounded-md flex justify-between items-center text-sm">
                                        <div>
                                            <span className="font-bold text-text-primary">{item.word}:</span>
                                            <span className="text-text-secondary ml-2">{item.meaning}</span>
                                        </div>
                                        <button
                                            onClick={() => handleToggleSaveWord(item.word, item.meaning)}
                                            className="text-lg p-1 rounded-full hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                                            title={isWordSaved(item.word) ? 'Kelimeyi Kaldır' : 'Kelimeyi Kaydet'}
                                        >
                                            {isWordSaved(item.word) ? '✅' : '🔖'}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            ) : (
                <div className="flex items-center justify-center h-full">
                    <p className="text-text-secondary text-lg">Analiz sonuçları burada gösterilecektir.</p>
                </div>
            )}
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="bg-bg-secondary p-6 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold mb-2 text-text-primary">Metin Analizi (Deconstruction)</h2>
                <p className="mb-4 text-text-secondary">
                    Karmaşık bir İngilizce metni cümle cümle analiz ederek derinlemesine anlayın. Metni aşağıya yapıştırın ve her cümlenin basitleştirilmiş halini, gramer yapısını ve anahtar kelimelerini keşfedin.
                </p>
                <textarea
                    value={passageText}
                    onChange={(e) => setPassageText(e.target.value)}
                    placeholder="İngilizce metni buraya yapıştırın..."
                    className="w-full h-48 p-3 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-brand-primary focus:outline-none text-text-primary resize-y"
                    disabled={isLoading}
                />
                <button
                    onClick={handleAnalyze}
                    disabled={isLoading}
                    className="mt-4 w-full bg-brand-primary hover:bg-brand-secondary text-white font-bold py-3 px-4 rounded-md transition duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center"
                >
                    {isLoading ? 'Analiz Ediliyor...' : 'Metni Analiz Et'}
                </button>
            </div>

            {isLoading && <Loader />}
            <ErrorMessage message={error} />

            {analysisResult && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Original Passage */}
                    <div className="bg-bg-secondary p-6 rounded-lg shadow-lg max-h-[80vh] overflow-y-auto">
                        <h3 className="text-xl font-bold text-brand-primary mb-3">Orijinal Metin</h3>
                        <div className="space-y-1">
                            {analysisResult.deconstructedSentences.map((sentence, index) => (
                                <button
                                    key={index}
                                    onClick={() => setSelectedSentenceIndex(index)}
                                    className={`w-full text-left p-2 rounded transition-colors duration-200 ${selectedSentenceIndex === index ? 'bg-brand-secondary text-white' : 'hover:bg-gray-100 dark:hover:bg-slate-700'}`}
                                >
                                    <p className="text-sm leading-relaxed">{sentence.originalSentence}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                    {/* Analysis Details */}
                    <AnalysisDetailView selectedSentence={selectedSentenceIndex !== null ? analysisResult.deconstructedSentences[selectedSentenceIndex] : null} />
                </div>
            )}
        </div>
    );
};

export default PassageDeconstruction;