import React, { useState, useRef, useEffect, useCallback } from 'react';
import { identifyObjectsInImage } from '../services/geminiService';
import { IdentifiedObject } from '../types';
import { useVocabulary } from '../context/VocabularyContext';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';
import { VisualDictionaryIcon } from '../components/icons/Icons';

type ViewState = 'idle' | 'camera' | 'captured' | 'analyzing' | 'results';

const VisualDictionary: React.FC = () => {
    const [viewState, setViewState] = useState<ViewState>('idle');
    const [error, setError] = useState('');
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [identifiedObjects, setIdentifiedObjects] = useState<IdentifiedObject[]>([]);
    
    const { addWord, isWordSaved } = useVocabulary();
    
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    }, []);

    const startCamera = async () => {
        stopCamera(); // Stop any existing stream
        setError('');
        setViewState('camera');
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error("Kamera bu tarayıcıda desteklenmiyor.");
            }
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'environment' } // Prefer rear camera
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err: any) {
            console.error("Error accessing camera:", err);
            setError("Kamera erişimi reddedildi veya bir hata oluştu. Lütfen tarayıcı izinlerinizi kontrol edin.");
            setViewState('idle');
        }
    };
    
    const analyzeImage = async (base64Image: string) => {
        setViewState('analyzing');
        setIdentifiedObjects([]);
        try {
            const mimeType = 'image/jpeg';
            // Remove the data URL prefix for the API call
            const pureBase64 = base64Image.split(',')[1];
            
            const resultText = await identifyObjectsInImage(pureBase64, mimeType);
            const resultJson: IdentifiedObject[] = JSON.parse(resultText);
            setIdentifiedObjects(resultJson);
            setViewState('results');
        } catch (e: any) {
            setError(e.message || 'Görsel analizi sırasında bir hata oluştu.');
            setViewState('captured'); // Go back to captured state on error
        }
    };

    const captureImage = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            if (context) {
                context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.9); // Use JPEG for smaller size
                setCapturedImage(dataUrl);
                setViewState('captured');
                stopCamera();
                analyzeImage(dataUrl);
            }
        }
    };

    const reset = () => {
        stopCamera();
        setViewState('idle');
        setCapturedImage(null);
        setIdentifiedObjects([]);
        setError('');
    };

    // Cleanup camera on component unmount
    useEffect(() => {
        return () => stopCamera();
    }, [stopCamera]);

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-bg-secondary p-6 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold mb-2 text-text-primary">Görsel Sözlük 📸</h2>
                <p className="mb-4 text-text-secondary">
                    Kameranızla bir nesnenin fotoğrafını çekin ve İngilizce adını anında öğrenin.
                </p>
            </div>

            <ErrorMessage message={error} />
            
            <div className="bg-bg-secondary p-6 rounded-lg shadow-lg">
                {/* Idle State */}
                {viewState === 'idle' && (
                    <div className="text-center">
                        <button onClick={startCamera} className="bg-brand-primary hover:bg-brand-secondary text-white font-bold py-4 px-8 rounded-lg transition duration-300 text-lg">
                            Kamerayı Başlat
                        </button>
                    </div>
                )}
                
                {/* Camera View */}
                {viewState === 'camera' && (
                    <div className="flex flex-col items-center">
                        <div className="w-full bg-black rounded-lg overflow-hidden mb-4 border-4 border-gray-200">
                             <video ref={videoRef} autoPlay playsInline muted className="w-full h-auto" />
                        </div>
                        <canvas ref={canvasRef} className="hidden" />
                        <button onClick={captureImage} className="bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-8 rounded-full transition duration-300 text-lg">
                            Fotoğraf Çek
                        </button>
                    </div>
                )}

                {/* Captured/Analyzing/Results View */}
                {(viewState === 'captured' || viewState === 'analyzing' || viewState === 'results') && (
                     <div className="space-y-6">
                        <div className="relative w-full bg-black rounded-lg overflow-hidden border-4 border-gray-200">
                            <img src={capturedImage!} alt="Captured" className="w-full h-auto" />
                            {viewState === 'analyzing' && (
                                <div className="absolute inset-0 bg-black bg-opacity-60 flex flex-col items-center justify-center">
                                    <Loader />
                                    <p className="text-white mt-4">Nesneler tanımlanıyor...</p>
                                </div>
                            )}
                        </div>

                        {viewState === 'results' && identifiedObjects.length > 0 && (
                            <div className="animate-fade-in">
                                <h3 className="text-xl font-bold text-brand-primary mb-3">Tanımlanan Nesneler</h3>
                                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {identifiedObjects.map((obj, index) => (
                                        <li key={index} className="bg-gray-100 p-3 rounded-md flex justify-between items-center">
                                            <div>
                                                <p className="font-bold text-text-primary capitalize">{obj.englishName}</p>
                                                <p className="text-sm text-text-secondary">{obj.turkishName}</p>
                                            </div>
                                            <button
                                                onClick={() => addWord(obj.englishName, obj.turkishName)}
                                                disabled={isWordSaved(obj.englishName)}
                                                className="text-xl p-2 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed enabled:hover:bg-gray-200"
                                                title={isWordSaved(obj.englishName) ? 'Kelime Zaten Kayıtlı' : 'Kelimeyi Kaydet'}
                                            >
                                                {isWordSaved(obj.englishName) ? '✅' : '🔖'}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        
                        {viewState === 'results' && identifiedObjects.length === 0 && (
                             <div className="text-center text-text-secondary py-4">
                                <p>Bu görselde belirgin bir nesne bulunamadı. Lütfen daha net bir fotoğraf deneyin.</p>
                            </div>
                        )}

                        <button onClick={reset} className="w-full bg-brand-secondary hover:bg-brand-primary text-white font-bold py-3 px-6 rounded-md transition duration-300">
                           Yeni Fotoğraf Çek
                        </button>
                     </div>
                )}
            </div>
        </div>
    );
};

export default VisualDictionary;