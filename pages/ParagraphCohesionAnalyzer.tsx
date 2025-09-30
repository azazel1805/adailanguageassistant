

import React, { useState } from 'react';
import { analyzeParagraphCohesion } from '../services/geminiService';
import { ParagraphCohesionAnalysis, CohesionSentenceAnalysis } from '../types';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';
import { useChallenge } from '../context/ChallengeContext';

const ParagraphCohesionAnalyzer: React.FC = () => {
    const [paragraphText, setParagraphText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [analysisResult, setAnalysisResult] = useState<ParagraphCohesionAnalysis | null>(null);
    const [selectedSentence, setSelectedSentence] = useState<CohesionSentenceAnalysis | null>(null);
    const { trackAction } = useChallenge();

    const handleAnalyze = async () => {
        if (!paragraphText.trim()) {
            setError('Lütfen analiz edilecek bir paragraf girin.');
            return;
        }
        setIsLoading(true);
        setError('');
        setAnalysisResult(null);
        setSelectedSentence(null);
        try {
            const resultText = await analyzeParagraphCohesion(paragraphText);
            const resultJson: ParagraphCohesionAnalysis = JSON.parse(resultText);
            setAnalysisResult(resultJson);
            // Initially select the first sentence to show details
            if (resultJson.sentenceAnalyses && resultJson.sentenceAnalyses.length > 0) {
                setSelectedSentence(resultJson.sentenceAnalyses[0]);
            }
            trackAction('cohesion_analyzer');
        } catch (e: any) {
            setError(e.message || 'Paragraf analizi sırasında bir hata oluştu.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const getRatingColor = (rating: string) => {
        const lowerRating = rating.toLowerCase();
        if (lowerRating.includes('güçlü') || lowerRating.includes('strong') || lowerRating.includes('yüksek')) return 'border-green-500';
        if (lowerRating.includes('orta') || lowerRating.includes('medium')) return 'border-yellow-500';
        if (lowerRating.includes('zayıf') || lowerRating.includes('weak') || lowerRating.includes('düşük')) return 'border-red-500';
        return 'border-gray-500';
    };

    const getRatingBgColor = (rating: string) => {
        const lowerRating = rating.toLowerCase();
        if (lowerRating.includes('güçlü') || lowerRating.includes('strong') || lowerRating.includes('yüksek')) return 'bg-green-100 dark:bg-green-900/40';
        if (lowerRating.includes('orta') || lowerRating.includes('medium')) return 'bg-yellow-100 dark:bg-yellow-900/40';
        if (lowerRating.includes('zayıf') || lowerRating.includes('weak') || lowerRating.includes('düşük')) return 'bg-red-100 dark:bg-red-900/40';
        return 'bg-gray-100 dark:bg-slate-700/50';
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="bg-bg-secondary p-6 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold mb-2 text-text-primary">Paragraf Bağlantı Analisti</h2>
                <p className="mb-4 text-text-secondary">
                    Bir İngilizce paragrafın cümleleri arasındaki mantıksal akışı ve bağlantıları analiz edin. Bu araç, metin akışı ve anlamsal bütünlük kurma becerilerinizi geliştirmenize yardımcı olur.
                </p>
                <textarea
                    value={paragraphText}
                    onChange={(e) => setParagraphText(e.target.value)}
                    placeholder="Analiz edilecek İngilizce paragrafı buraya yapıştırın..."
                    className="w-full h-48 p-3 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-brand-primary focus:outline-none text-text-primary resize-y"
                    disabled={isLoading}
                />
                <button
                    onClick={handleAnalyze}
                    disabled={isLoading}
                    className="mt-4 w-full bg-brand-primary hover:bg-brand-secondary text-white font-bold py-3 px-4 rounded-md transition duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center"
                >
                    {isLoading ? 'Analiz Ediliyor...' : 'Paragrafı Analiz Et'}
                </button>
            </div>

            {isLoading && <Loader />}
            <ErrorMessage message={error} />

            {analysisResult && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Color-coded Paragraph */}
                    <div className="bg-bg-secondary p-6 rounded-lg shadow-lg space-y-4">
                        <h3 className="text-xl font-bold text-brand-primary mb-3">Analiz Edilen Paragraf</h3>
                        <div className="text-text-primary leading-relaxed dark:text-slate-200">
                            {analysisResult.sentenceAnalyses.map((item, index) => (
                                <span
                                    key={index}
                                    onClick={() => setSelectedSentence(item)}
                                    className={`cursor-pointer p-1 rounded transition-colors duration-200 border-b-2 ${getRatingColor(item.rating)} ${selectedSentence?.sentence === item.sentence ? getRatingBgColor(item.rating) : 'hover:bg-gray-100 dark:hover:bg-slate-700'}`}
                                >
                                    {item.sentence}{' '}
                                </span>
                            ))}
                        </div>
                         <div className="text-xs text-text-secondary dark:text-slate-400 pt-4 border-t border-gray-200 dark:border-slate-700 mt-4">
                            <p><span className="w-3 h-3 inline-block rounded-full bg-green-500 mr-2"></span>Güçlü Bağlantı</p>
                            <p><span className="w-3 h-3 inline-block rounded-full bg-yellow-500 mr-2"></span>Orta Bağlantı</p>
                            <p><span className="w-3 h-3 inline-block rounded-full bg-red-500 mr-2"></span>Zayıf Bağlantı</p>
                        </div>
                    </div>

                    {/* Analysis Details */}
                    <div className="bg-bg-secondary p-6 rounded-lg shadow-lg space-y-4">
                         <h3 className="text-xl font-bold text-brand-primary mb-3">Detaylı Analiz</h3>
                         {selectedSentence ? (
                            <div className="space-y-3 p-3 bg-gray-50 dark:bg-slate-800 rounded-lg animate-fade-in">
                                <div>
                                    <h4 className="font-semibold text-text-secondary dark:text-slate-400 text-sm mb-1">Cümlenin Rolü</h4>
                                    <p className="text-sm bg-gray-100 dark:bg-slate-700 p-2 rounded-md">{selectedSentence.role}</p>
                                </div>
                                 <div>
                                    <h4 className="font-semibold text-text-secondary dark:text-slate-400 text-sm mb-1">Önceki Cümleyle Bağlantısı</h4>
                                    <p className="text-sm bg-gray-100 dark:bg-slate-700 p-2 rounded-md">{selectedSentence.connection}</p>
                                </div>
                                {selectedSentence.suggestion.toLowerCase() !== 'yok' && selectedSentence.suggestion.toLowerCase() !== 'geliştirmeye gerek yok.' && (
                                     <div>
                                        <h4 className="font-semibold text-yellow-600 dark:text-yellow-400 text-sm mb-1">İyileştirme Önerisi 💡</h4>
                                        <p className="text-sm bg-yellow-100 dark:bg-yellow-900/40 p-2 rounded-md">{selectedSentence.suggestion}</p>
                                    </div>
                                )}
                            </div>
                         ) : (
                            <p className="text-text-secondary dark:text-slate-400">Detayları görmek için yandaki metinden bir cümleye tıklayın.</p>
                         )}

                        <div className="pt-4 border-t border-gray-200 dark:border-slate-700 mt-4">
                             <h4 className="font-semibold text-text-secondary dark:text-slate-400 mb-2">Genel Değerlendirme</h4>
                             <p className="text-sm bg-gray-100 dark:bg-slate-800 p-3 rounded-md">{analysisResult.overallCohesion}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ParagraphCohesionAnalyzer;