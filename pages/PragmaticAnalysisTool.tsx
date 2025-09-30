import React, { useState } from 'react';
import { analyzePragmatics } from '../services/geminiService';
import { PragmaticAnalysisResult } from '../types';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';

const PragmaticAnalysisTool: React.FC = () => {
    const [text, setText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState<PragmaticAnalysisResult | null>(null);

    const handleAnalyze = async () => {
        if (!text.trim()) {
            setError('Please enter some text to analyze.');
            return;
        }
        setIsLoading(true);
        setError('');
        setResult(null);
        try {
            const resultText = await analyzePragmatics(text);
            const resultJson: PragmaticAnalysisResult = JSON.parse(resultText);
            setResult(resultJson);
        } catch (e: any) {
            setError(e.message || 'An error occurred during pragmatic analysis.');
        } finally {
            setIsLoading(false);
        }
    };

    const InfoCard: React.FC<{ label: string; value: string }> = ({ label, value }) => (
        <div className="bg-gray-100 dark:bg-slate-800 p-4 rounded-lg">
            <p className="text-sm font-semibold text-text-secondary">{label}</p>
            <p className="text-lg font-bold text-brand-primary">{value}</p>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-bg-secondary p-6 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold mb-2 text-text-primary">Pragmatic Analysis Tool ⚖️</h2>
                <p className="mb-4 text-text-secondary">
                    Analyze not just what a text says, but *how* it says it. Learn about the text's tone, intent, formality, and how it could be expressed in different contexts.
                </p>
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Paste the English text to analyze here (e.g., 'Hey, I need that report ASAP.')..."
                    className="w-full h-32 p-3 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-brand-primary focus:outline-none text-text-primary resize-y"
                    disabled={isLoading}
                />
                <button
                    onClick={handleAnalyze}
                    disabled={isLoading}
                    className="mt-4 w-full bg-brand-primary hover:bg-brand-secondary text-white font-bold py-3 px-4 rounded-md transition duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center"
                >
                    {isLoading ? 'Analyzing...' : 'Analyze Text'}
                </button>
            </div>

            {isLoading && <Loader />}
            <ErrorMessage message={error} />

            {result && (
                <div className="bg-bg-secondary p-6 rounded-lg shadow-lg space-y-6 animate-fade-in">
                    <div>
                        <h3 className="text-xl font-bold text-brand-primary mb-3">Pragmatic Analysis</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <InfoCard label="Formality" value={result.formality} />
                            <InfoCard label="Tone" value={result.tone} />
                            <InfoCard label="Intent" value={result.intent} />
                            <InfoCard label="Audience" value={result.audience} />
                        </div>
                    </div>

                    <div>
                        <h3 className="text-xl font-bold text-brand-primary mb-3">Alternative Expressions</h3>
                        <div className="space-y-4">
                            {result.alternatives.map((alt, index) => (
                                <div key={index} className="bg-gray-50 dark:bg-slate-800 p-4 rounded-lg border-l-4 border-brand-secondary">
                                    <h4 className="font-bold text-text-primary">{alt.type}</h4>
                                    <p className="text-lg italic text-text-primary my-2">"{alt.text}"</p>
                                    <p className="text-sm text-text-secondary">
                                        <strong className="text-brand-secondary">Reason:</strong> {alt.explanation}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PragmaticAnalysisTool;