import React, { useState, useEffect, useRef } from 'react';
import { prepositions } from '../data/prepositions';
import { PrepositionData } from '../types';
import { PrepositionIcon } from './icons/Icons';
import Loader from './Loader';

const PEXELS_API_KEY = 'BXJTqpDqYKrp57GTOT012YKebRMmDDGBfDVHoUDu3gdNNwr13TMbJLWq';

// Helper component to highlight the preposition in the sentence
const HighlightedSentence: React.FC<{ text: string; highlight: string }> = ({ text, highlight }) => {
    const regex = new RegExp(`(\\b${highlight}\\b)`, 'gi');
    const parts = text.split(regex);
    
    if (parts.length <= 1) {
        return <>{text}</>;
    }

    return (
        <>
            {parts.map((part, i) =>
                part.toLowerCase() === highlight.toLowerCase() ? (
                    <strong key={i} className="font-bold text-brand-primary bg-brand-primary/10 px-1 rounded-sm">
                        {part}
                    </strong>
                ) : (
                    part
                )
            )}
        </>
    );
};

const PrepositionVisualizerWidget: React.FC = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [imageUrl, setImageUrl] = useState<string>('');
    const [isImageLoading, setIsImageLoading] = useState<boolean>(true);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const imageCache = useRef<Map<string, string>>(new Map());

    // Set the preposition of the day based on the date
    useEffect(() => {
        const dayOfMonth = new Date().getDate();
        const initialIndex = (dayOfMonth - 1) % prepositions.length;
        setCurrentIndex(initialIndex);
    }, []);

    const currentPreposition: PrepositionData = prepositions[currentIndex];

    // Fetch image when preposition changes
    useEffect(() => {
        if (!currentPreposition) return;

        const fetchImage = async () => {
            setIsImageLoading(true);
            const query = currentPreposition.pexelsQuery;
            
            if (imageCache.current.has(query)) {
                setImageUrl(imageCache.current.get(query)!);
                setIsImageLoading(false);
                return;
            }

            try {
                const response = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`, {
                    headers: { Authorization: PEXELS_API_KEY }
                });
                if (!response.ok) throw new Error(`Pexels API error: ${response.statusText}`);
                const data = await response.json();
                if (data.photos && data.photos.length > 0) {
                    const url = data.photos[0].src.large;
                    setImageUrl(url);
                    imageCache.current.set(query, url);
                } else {
                    setImageUrl('');
                    console.warn(`No image found for Pexels query: ${query}`);
                }
            } catch (error) {
                console.error('Error fetching image from Pexels:', error);
                setImageUrl('');
            } finally {
                setIsImageLoading(false);
            }
        };

        fetchImage();
    }, [currentPreposition]);


    const handleNext = () => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % prepositions.length);
    };

    const handlePrev = () => {
        setCurrentIndex((prevIndex) => (prevIndex - 1 + prepositions.length) % prepositions.length);
    };

    return (
        <>
            {isModalOpen && imageUrl && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4 transition-opacity duration-300"
                    onClick={() => setIsModalOpen(false)}
                    role="dialog"
                    aria-modal="true"
                    aria-label="Enlarged image view"
                >
                    <div 
                        className="relative max-w-4xl max-h-[90vh]" 
                        onClick={e => e.stopPropagation()}
                    >
                        <img src={imageUrl} alt={currentPreposition.preposition} className="w-auto h-auto max-w-full max-h-[90vh] rounded-lg shadow-2xl" />
                        <button 
                            onClick={() => setIsModalOpen(false)}
                            className="absolute -top-3 -right-3 bg-white text-slate-800 rounded-full w-8 h-8 flex items-center justify-center text-2xl font-bold hover:bg-slate-200 transition-colors"
                            aria-label="Close image view"
                        >
                            &times;
                        </button>
                    </div>
                </div>
            )}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg h-full flex flex-col">
                <div className="flex items-center gap-3 mb-4">
                    <PrepositionIcon />
                    <h3 className="text-lg font-bold text-slate-950 dark:text-slate-50">Günün Edatı</h3>
                </div>

                <div className="flex-grow flex flex-col items-center justify-center">
                    {/* Visual Stage */}
                    <div className="w-full h-32 bg-slate-100 dark:bg-slate-700/50 rounded-lg mb-4 flex items-center justify-center p-2 overflow-hidden">
                         {isImageLoading ? (
                            <Loader />
                        ) : imageUrl ? (
                            <button onClick={() => setIsModalOpen(true)} className="w-full h-full focus:outline-none focus:ring-2 focus:ring-brand-primary rounded-md" aria-label="Enlarge image">
                                <img src={imageUrl} alt={currentPreposition.preposition} className="w-full h-full object-cover rounded-md" />
                            </button>
                        ) : (
                            <span className="text-sm text-slate-400">Görsel yüklenemedi</span>
                        )}
                    </div>
                    
                    <h4 className="text-2xl font-bold text-brand-primary capitalize">{currentPreposition.preposition}</h4>
                    
                     <div className="text-center mt-2 min-h-[3.5rem]">
                        <p className="text-base text-slate-800 dark:text-slate-200">
                            "<HighlightedSentence text={currentPreposition.exampleSentence} highlight={currentPreposition.preposition} />"
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400 italic mt-1">
                            {currentPreposition.exampleSentenceTr}
                        </p>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-500 text-center mt-1">
                        {currentPreposition.explanation}
                    </p>
                </div>
                
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <button 
                        onClick={handlePrev} 
                        className="px-4 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-md text-sm font-semibold"
                    >
                        &larr; Önceki
                    </button>
                    <span className="text-xs text-slate-500">{currentIndex + 1} / {prepositions.length}</span>
                    <button 
                        onClick={handleNext} 
                        className="px-4 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-md text-sm font-semibold"
                    >
                        Sonraki &rarr;
                    </button>
                </div>
            </div>
        </>
    );
};

export default PrepositionVisualizerWidget;
