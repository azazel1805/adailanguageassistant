
import React, { useState } from 'react';
import { diagramSentence } from '../services/geminiService';
import { SentenceDiagram } from '../types';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';
import { useChallenge } from '../context/ChallengeContext';

// Refined, more distinct color mapping for grammatical parts.
const partTypeColors: { [key: string]: string } = {
    // Core Components: Distinct primary colors
    'Subject': 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-700',
    'Verb': 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700',
    'Main Verb': 'bg-red-200 text-red-900 border-red-400 font-bold dark:bg-red-800/50 dark:text-red-200 dark:border-red-600',
    'Object': 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700',
    'Complement': 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/50 dark:text-emerald-300 dark:border-emerald-700',

    // Modifiers: Colors related to what they modify
    'Adjective': 'bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-900/50 dark:text-sky-300 dark:border-sky-700', // Modifies nouns (blue/green)
    'Adverb': 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-900/50 dark:text-rose-300 dark:border-rose-700', // Modifies verbs (red)
    'Determiner': 'bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-600', // e.g., 'a', 'the'

    // Phrases & Clauses
    'Prepositional Phrase': 'bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-900/50 dark:text-teal-300 dark:border-teal-700',
    'Clause': 'bg-gray-200 text-gray-800 border-gray-400 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-500',

    // Connectors & Others
    'Conjunction': 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-700',
    'Pronoun': 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-900/50 dark:text-indigo-300 dark:border-indigo-700',
    'Other': 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600',
};

// Function to find the appropriate color class based on the type string from the API.
const getPartColorClass = (type: string): string => {
    const lowerType = type.toLowerCase();
    
    // Order is important: check for more specific/multi-word types first.
    if (lowerType.includes('main verb')) return partTypeColors['Main Verb'];
    if (lowerType.includes('verb')) return partTypeColors['Verb'];
    if (lowerType.includes('subject')) return partTypeColors['Subject'];
    if (lowerType.includes('object')) return partTypeColors['Object'];
    if (lowerType.includes('complement')) return partTypeColors['Complement'];
    if (lowerType.includes('adjective')) return partTypeColors['Adjective'];
    if (lowerType.includes('adverb')) return partTypeColors['Adverb'];
    if (lowerType.includes('determiner')) return partTypeColors['Determiner'];
    if (lowerType.includes('prepositional phrase')) return partTypeColors['Prepositional Phrase'];
    if (lowerType.includes('clause')) return partTypeColors['Clause'];
    if (lowerType.includes('conjunction')) return partTypeColors['Conjunction'];
    if (lowerType.includes('pronoun')) return partTypeColors['Pronoun'];

    // Fallback for types that don't match any keyword.
    return partTypeColors['Other'];
};


const SentenceDiagrammer: React.FC = () => {
    const [sentence, setSentence] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState<SentenceDiagram | null>(null);
    const { trackAction } = useChallenge();

    const handleAnalyze = async () => {
        if (!sentence.trim()) {
            setError('Lütfen analiz edilecek bir cümle girin.');
            return;
        }
        setIsLoading(true);
        setError('');
        setResult(null);
        try {
            const resultText = await diagramSentence(sentence);
            const resultJson: SentenceDiagram = JSON.parse(resultText);
            setResult(resultJson);
            trackAction('diagrammer');
        } catch (e: any) {
            setError(e.message || 'Cümle analizi sırasında bir hata oluştu.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-bg-secondary p-6 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold mb-2 text-text-primary">Cümle Yapısı Görselleştirici</h2>
                <p className="mb-4 text-text-secondary">
                    Karmaşık bir İngilizce cümlenin gramer yapısını görsel olarak analiz edin. Cümleyi aşağıya yapıştırın ve öğelerini renk kodlarıyla ayrıştırılmış şekilde görün.
                </p>
                <textarea
                    value={sentence}
                    onChange={(e) => setSentence(e.target.value)}
                    placeholder="Analiz edilecek İngilizce cümleyi buraya yapıştırın..."
                    className="w-full h-24 p-3 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-adai-primary focus:outline-none text-text-primary resize-y"
                    disabled={isLoading}
                />
                <button
                    onClick={handleAnalyze}
                    disabled={isLoading}
                    className="mt-4 w-full bg-adai-primary hover:bg-adai-secondary text-white font-bold py-3 px-4 rounded-md transition duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center"
                >
                    {isLoading ? 'Analiz Ediliyor...' : 'Cümleyi Analiz Et'}
                </button>
            </div>

            {isLoading && <Loader />}
            <ErrorMessage message={error} />

            {result && (
                <div className="space-y-6">
                    {/* Color-coded sentence */}
                    <div className="bg-bg-secondary p-6 rounded-lg shadow-lg">
                        <h3 className="text-xl font-bold text-adai-primary mb-4">Görselleştirilmiş Cümle</h3>
                        <div className="bg-gray-100 dark:bg-slate-800 p-4 rounded-md">
                            <p className="text-lg leading-relaxed whitespace-pre-wrap">
                                {result.parts.map((part, index) => (
                                    <span key={index} className={`px-1.5 py-1 rounded-md border-b-2 transition-all duration-300 ${getPartColorClass(part.type)}`}>
                                        {part.text}
                                    </span>
                                ))}
                            </p>
                        </div>
                    </div>

                    {/* Legend and Descriptions */}
                    <div className="bg-bg-secondary p-6 rounded-lg shadow-lg">
                        <h3 className="text-xl font-bold text-adai-primary mb-4">Öğe Açıklamaları</h3>
                        <div className="space-y-3">
                            {result.parts.map((part, index) => (
                                <div key={index} className="flex items-start gap-3 p-3 bg-gray-100 dark:bg-slate-800 rounded-md">
                                    <div className="flex-shrink-0">
                                        <span className={`px-3 py-1 text-xs font-bold rounded-full border ${getPartColorClass(part.type)}`}>
                                            {part.type}
                                        </span>
                                    </div>
                                    <div className="flex-grow">
                                        <p className="font-mono text-text-primary text-sm font-semibold">"{part.text}"</p>
                                        <p className="text-text-secondary text-sm mt-1">{part.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SentenceDiagrammer;
