import React, { useState, useEffect } from 'react';
import { analyzeVisualDescription } from '../services/geminiService';
import { VisualDescriptionAnalysis } from '../types';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';

const PEXELS_API_KEY = 'BXJTqpDqYKrp57GTOT012YKebRMmDDGBfDVHoUDu3gdNNwr13TMbJLWq';
const searchQueries = ['busy street', 'city park life', 'crowded market', 'cultural festival', 'people working together', 'family dinner', 'children playing outside', 'street art', 'architecture'];

const VisualReadingTool: React.FC = () => {
    const [isLoadingImage, setIsLoadingImage] = useState(true);
    const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
    const [error, setError] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [imageAlt, setImageAlt] = useState('');
    const [description, setDescription] = useState('');
    const [analysis, setAnalysis] = useState<VisualDescriptionAnalysis | null>(null);

    const fetchImage = async () => {
        setIsLoadingImage(true);
        setError('');
        setAnalysis(null);
        setDescription('');
        try {
            const query = searchQueries[Math.floor(Math.random() * searchQueries.length)];
            const response = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=20&orientation=landscape`, {
                headers: { Authorization: PEXELS_API_KEY }
            });
            if (!response.ok) throw new Error(`Pexels API error: ${response.statusText}`);
            const data = await response.json();
            if (data.photos && data.photos.length > 0) {
                const randomPhoto = data.photos[Math.floor(Math.random() * data.photos.length)];
                setImageUrl(randomPhoto.src.large);
                setImageAlt(randomPhoto.alt || `A photo about ${query}`);
            } else {
                throw new Error(`No images found for query: ${query}`);
            }
        } catch (e: any) {
            setError(e.message || 'Görsel yüklenirken bir hata oluştu.');
        } finally {
            setIsLoadingImage(false);
        }
    };

    useEffect(() => {
        fetchImage();
    }, []);

    const handleAnalyze = async () => {
        const sentenceCount = description.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
        if (sentenceCount < 5) {
            setError('Lütfen görseli tanımlayan en az 5 cümle yazın.');
            return;
        }
        setIsLoadingAnalysis(true);
        setError('');
        setAnalysis(null);
        try {
            const resultText = await analyzeVisualDescription(description);
            const resultJson: VisualDescriptionAnalysis = JSON.parse(resultText);
            setAnalysis(resultJson);
        } catch (e: any) {
            setError(e.message || 'Açıklama analizi sırasında bir hata oluştu.');
        } finally {
            setIsLoadingAnalysis(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-bg-secondary p-6 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold mb-2 text-text-primary">Görsel Okuma Aracı 🖼️</h2>
                <p className="mb-4 text-text-secondary">
                    Aşağıdaki görseli dikkatlice inceleyin ve en az 5 cümle ile İngilizce olarak tanımlayın. Ardından yapay zekadan yazınız hakkında geri bildirim alın.
                </p>
                <button
                    onClick={fetchImage}
                    disabled={isLoadingImage || isLoadingAnalysis}
                    className="w-full bg-brand-secondary hover:bg-brand-primary text-white font-bold py-2 px-4 rounded-md transition duration-300 disabled:bg-gray-500"
                >
                    {isLoadingImage ? 'Yükleniyor...' : 'Yeni Görsel Getir'}
                </button>
            </div>

            <ErrorMessage message={error} />
            
            <div className="bg-bg-secondary p-6 rounded-lg shadow-lg">
                {isLoadingImage ? <Loader /> : (
                    <div className="w-full h-auto max-h-[500px] overflow-hidden rounded-lg shadow-md mb-6 bg-gray-100 flex items-center justify-center">
                        <img src={imageUrl} alt={imageAlt} className="w-full h-full object-contain" />
                    </div>
                )}
                
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Görseli en az 5 cümle ile burada tanımlayın..."
                    className="w-full h-48 p-3 bg-gray-50 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary focus:outline-none text-text-primary resize-y"
                    disabled={isLoadingAnalysis}
                />
                <button
                    onClick={handleAnalyze}
                    disabled={isLoadingAnalysis || description.trim().length === 0}
                    className="mt-4 w-full bg-brand-primary hover:bg-brand-secondary text-white font-bold py-3 px-4 rounded-md transition duration-300 disabled:bg-gray-500 flex items-center justify-center"
                >
                    {isLoadingAnalysis ? 'Analiz Ediliyor...' : 'Açıklamamı Analiz Et'}
                </button>
            </div>

            {isLoadingAnalysis && <Loader />}

            {analysis && (
                <div className="bg-bg-secondary p-6 rounded-lg shadow-lg space-y-6 animate-fade-in">
                    <h2 className="text-xl font-bold text-brand-primary">Analiz Sonuçları</h2>
                    
                    <div>
                        <h3 className="text-lg font-semibold text-text-primary mb-2">Genel Değerlendirme</h3>
                        <p className="text-text-secondary text-sm bg-gray-100 p-3 rounded-md">{analysis.overallFeedback}</p>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold text-text-primary mb-2">Tanımlayıcı Güçlü Yönler</h3>
                        <p className="text-text-secondary text-sm bg-gray-100 p-3 rounded-md">{analysis.descriptiveStrengths}</p>
                    </div>

                    {analysis.improvementSuggestions && analysis.improvementSuggestions.length > 0 && (
                        <div>
                            <h3 className="text-lg font-semibold text-text-primary mb-2">Anlatımı Geliştirme Önerileri 💡</h3>
                            <div className="space-y-4">
                                {analysis.improvementSuggestions.map((item, index) => (
                                    <div key={index} className="bg-gray-50 p-4 rounded-lg border-l-4 border-brand-secondary">
                                        <h4 className="font-bold text-text-primary">{item.suggestion}</h4>
                                        <p className="text-md italic text-text-primary my-2">"{item.example}"</p>
                                        <p className="text-sm text-text-secondary">
                                            <strong className="text-brand-secondary">Neden:</strong> {item.explanation}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {analysis.grammar && analysis.grammar.length > 0 && (
                        <div>
                            <h3 className="text-lg font-semibold text-text-primary mb-2">Gramer Düzeltmeleri</h3>
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-sm text-left text-text-secondary">
                                    <thead className="bg-gray-100 text-xs uppercase">
                                        <tr>
                                            <th scope="col" className="px-4 py-2">Hata</th>
                                            <th scope="col" className="px-4 py-2">Düzeltme</th>
                                            <th scope="col" className="px-4 py-2">Açıklama</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {analysis.grammar.map((item, index) => (
                                            <tr key={index} className="bg-white border-b border-gray-200">
                                                <td className="px-4 py-2 text-red-600 line-through">{item.error}</td>
                                                <td className="px-4 py-2 text-green-600">{item.correction}</td>
                                                <td className="px-4 py-2">{item.explanation}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {analysis.vocabulary && analysis.vocabulary.length > 0 && (
                        <div>
                            <h3 className="text-lg font-semibold text-text-primary mb-2">Kelime Önerileri</h3>
                             <div className="overflow-x-auto">
                                <table className="min-w-full text-sm text-left text-text-secondary">
                                    <thead className="bg-gray-100 text-xs uppercase">
                                        <tr>
                                            <th scope="col" className="px-4 py-2">Orijinal Kelime</th>
                                            <th scope="col" className="px-4 py-2">Öneri</th>
                                            <th scope="col" className="px-4 py-2">Neden</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {analysis.vocabulary.map((item, index) => (
                                            <tr key={index} className="bg-white border-b border-gray-200">
                                                <td className="px-4 py-2 text-yellow-600">{item.original}</td>
                                                <td className="px-4 py-2 text-teal-600">{item.suggestion}</td>
                                                <td className="px-4 py-2">{item.reason}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default VisualReadingTool;