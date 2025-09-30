import React, { useState } from 'react';
import { deconstructPhrasalVerb } from '../services/geminiService';
import { PhrasalVerbDeconstructionResult } from '../types';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';

const PhrasalVerbDeconstructor: React.FC = () => {
    const [phrasalVerb, setPhrasalVerb] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState<PhrasalVerbDeconstructionResult | null>(null);

    const handleAnalyze = async () => {
        if (!phrasalVerb.trim()) {
            setError('Lütfen analiz edilecek bir phrasal verb girin.');
            return;
        }
        setIsLoading(true);
        setError('');
        setResult(null);
        try {
            const resultText = await deconstructPhrasalVerb(phrasalVerb.trim());
            const resultJson: PhrasalVerbDeconstructionResult = JSON.parse(resultText);
            setResult(resultJson);
        } catch (e: any) {
            setError(e.message || 'Analiz sırasında bir hata oluştu.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-bg-secondary p-6 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold mb-2 text-text-primary">Phrasal Verb Parçalayıcı 💥</h2>
                <p className="mb-4 text-text-secondary">
                    Anlamı kafa karıştırıcı olan phrasal verb'leri girerek onları temel parçalarına ayırın. Bu araç, kelime ezberini mantıksal bir anlama sürecine dönüştürür.
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                    <input
                        type="text"
                        value={phrasalVerb}
                        onChange={(e) => setPhrasalVerb(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAnalyze()}
                        placeholder="Örn: 'look up to' veya 'get along with'"
                        className="flex-grow p-3 bg-gray-50 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary focus:outline-none text-text-primary"
                        disabled={isLoading}
                    />
                    <button
                        onClick={handleAnalyze}
                        disabled={isLoading}
                        className="bg-brand-primary hover:bg-brand-secondary text-white font-bold py-3 px-6 rounded-md transition duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Analiz Ediliyor...' : 'Parçala'}
                    </button>
                </div>
            </div>

            {isLoading && <Loader />}
            <ErrorMessage message={error} />

            {result && (
                <div className="bg-bg-secondary p-6 rounded-lg shadow-lg space-y-6 animate-fade-in">
                    <h3 className="text-2xl font-bold text-brand-primary capitalize text-center">{phrasalVerb}</h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                        {/* Main Verb */}
                        <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
                            <h4 className="font-bold text-blue-800">1. Ana Fiil</h4>
                            <p className="text-2xl font-semibold text-blue-600 my-2">{result.mainVerb.verb}</p>
                            <p className="text-sm text-blue-700 italic">"{result.mainVerb.meaning}"</p>
                        </div>

                        {/* Particle */}
                        <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-400">
                            <h4 className="font-bold text-purple-800">2. Edat / Zarf</h4>
                            <p className="text-2xl font-semibold text-purple-600 my-2">{result.particle.particle}</p>
                            <p className="text-sm text-purple-700 italic">"{result.particle.meaning}"</p>
                        </div>

                        {/* Idiomatic Meaning */}
                        <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                            <h4 className="font-bold text-green-800">3. Deyimsel Anlam</h4>
                            <p className="text-xl font-semibold text-green-700 my-2">{result.idiomaticMeaning.meaning}</p>
                        </div>
                    </div>
                    
                    <div className="bg-gray-100 p-4 rounded-lg">
                        <h4 className="font-semibold text-text-primary mb-2">💡 Anlam Oluşumu</h4>
                        <p className="text-sm text-text-secondary">{result.idiomaticMeaning.explanation}</p>
                    </div>

                    <div>
                        <h4 className="text-lg font-bold text-text-primary mb-3">Örnek Cümleler</h4>
                        <div className="space-y-3">
                            {result.exampleSentences.map((ex, index) => (
                                <div key={index} className="bg-gray-100 p-4 rounded-md">
                                    <p className="text-text-primary font-semibold">{ex.en}</p>
                                    <p className="text-sm text-text-secondary italic mt-1">{ex.tr}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PhrasalVerbDeconstructor;