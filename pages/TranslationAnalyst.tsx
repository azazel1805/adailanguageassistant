import React, { useState } from 'react';
import { analyzeAndTranslateSentence } from '../services/geminiService';
import { TranslationAnalysisResult } from '../types';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';

const TranslationAnalyst: React.FC = () => {
    const [sentence, setSentence] = useState('');
    const [direction, setDirection] = useState<'tr_to_en' | 'en_to_tr'>('tr_to_en');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState<TranslationAnalysisResult | null>(null);

    const handleAnalyze = async () => {
        if (!sentence.trim()) {
            setError('Lütfen analiz edilecek bir cümle girin.');
            return;
        }
        setIsLoading(true);
        setError('');
        setResult(null);
        try {
            const resultText = await analyzeAndTranslateSentence(sentence, direction);
            const resultJson: TranslationAnalysisResult = JSON.parse(resultText);
            setResult(resultJson);
        } catch (e: any) {
            setError(e.message || 'Analiz sırasında bir hata oluştu.');
        } finally {
            setIsLoading(false);
        }
    };

    const ResultCard: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className }) => (
        <div className={`bg-gray-50 p-4 rounded-lg ${className || ''}`}>
            <h4 className="text-md font-semibold text-brand-primary mb-2">{title}</h4>
            <div className="text-sm text-text-primary space-y-2">{children}</div>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-bg-secondary p-6 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold mb-2 text-text-primary">Etkileşimli Çeviri Analisti</h2>
                <p className="mb-4 text-text-secondary">
                    Bir cümlenin sadece çevirisini değil, arkasındaki dilbilimsel mantığı da öğrenin. Bu araç, size farklı çeviri alternatifleri sunar ve nedenlerini açıklar.
                </p>
                <textarea
                    value={sentence}
                    onChange={(e) => setSentence(e.target.value)}
                    placeholder="Türkçe veya İngilizce bir cümle girin..."
                    className="w-full h-32 p-3 bg-gray-50 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary focus:outline-none text-text-primary resize-y"
                    disabled={isLoading}
                />
                <div className="flex flex-col sm:flex-row items-center justify-between mt-4 gap-4">
                    <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-full">
                        <button 
                            onClick={() => setDirection('tr_to_en')}
                            className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-colors ${direction === 'tr_to_en' ? 'bg-brand-primary text-white' : 'text-text-secondary hover:bg-gray-200'}`}
                        >
                            TR &rarr; EN
                        </button>
                        <button 
                            onClick={() => setDirection('en_to_tr')}
                            className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-colors ${direction === 'en_to_tr' ? 'bg-brand-primary text-white' : 'text-text-secondary hover:bg-gray-200'}`}
                        >
                            EN &rarr; TR
                        </button>
                    </div>
                    <button
                        onClick={handleAnalyze}
                        disabled={isLoading}
                        className="w-full sm:w-auto bg-brand-primary hover:bg-brand-secondary text-white font-bold py-3 px-6 rounded-md transition duration-300 disabled:bg-gray-500 flex items-center justify-center"
                    >
                        {isLoading ? 'Analiz Ediliyor...' : 'Analiz Et ve Çevir'}
                    </button>
                </div>
            </div>

            {isLoading && <Loader />}
            <ErrorMessage message={error} />

            {result && (
                <div className="bg-bg-secondary p-6 rounded-lg shadow-lg space-y-6 animate-fade-in">
                    <div>
                        <h3 className="text-xl font-bold text-brand-primary mb-3">Analiz Sonuçları</h3>
                         <ResultCard title="Orijinal Cümle Analizi">
                             <p><strong>Tespit Edilen Dil:</strong> {result.originalSentenceAnalysis.language}</p>
                             <p><strong>Anahtar Gramer:</strong> {result.originalSentenceAnalysis.keyGrammar}</p>
                             <p><strong>Anahtar Kelime:</strong> {result.originalSentenceAnalysis.keyVocabulary}</p>
                        </ResultCard>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold text-text-primary mb-3">Çeviri Seçenekleri</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                             <ResultCard title="Birebir Çeviri" className="bg-blue-50 border-l-4 border-blue-300">
                                <p className="italic">"{result.translations.literal}"</p>
                            </ResultCard>
                             <ResultCard title="Doğal Çeviri" className="bg-green-50 border-l-4 border-green-400">
                                <p className="font-semibold text-base">"{result.translations.natural}"</p>
                            </ResultCard>
                             <ResultCard title="Akademik (YDS) Çeviri" className="bg-purple-50 border-l-4 border-purple-300">
                                <p className="italic">"{result.translations.academic}"</p>
                            </ResultCard>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <ResultCard title="💡 Çeviri Gerekçesi">
                           <p>{result.translationRationale}</p>
                        </ResultCard>
                         <ResultCard title="✅ Anlam Doğrulama (Ters Çeviri)">
                            <p>Doğal çevirinin tekrar orijinal dile çevrilmiş hali:</p>
                            <p className="font-semibold italic bg-gray-100 p-2 rounded mt-1">"{result.reverseTranslation}"</p>
                        </ResultCard>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TranslationAnalyst;
