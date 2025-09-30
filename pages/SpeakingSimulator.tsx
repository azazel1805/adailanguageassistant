import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';
import { analyzeConversationForReport } from '../services/geminiService';
import { Scenario, PerformanceReport, SimulatorChatMessage } from '../types';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';
import { useChallenge } from '../context/ChallengeContext';
import { SpeakerIcon, StopIcon } from '../components/icons/Icons';

type SimulatorState = 'selection' | 'briefing' | 'active' | 'processing_report' | 'report';

// --- Static Scenario Data ---
const scenarios: Scenario[] = [
    {
        id: 'cafe_order',
        title: 'Ordering at a Cafe',
        description: 'Go into a cafe and order a drink and something to eat for yourself.',
        difficulty: 'Kolay',
        userRole: 'a customer at a cafe',
        aiRole: 'a friendly and patient cafe barista',
        aiWelcome: "Welcome to The Cozy Corner! What can I get for you today?",
        objectives: [
            "Order a large latte.",
            "Ask if they have any chocolate cake.",
            "Order a piece of cake if they have it.",
            "Confirm your total order."
        ]
    },
    {
        id: 'hotel_checkin',
        title: 'Checking into a Hotel',
        description: 'Check into a hotel where you have a reservation and get information about your room.',
        difficulty: 'Kolay',
        userRole: 'a tourist checking into a hotel',
        aiRole: 'a helpful hotel receptionist',
        aiWelcome: "Good evening! Welcome to the Grand Hotel. How can I assist you?",
        objectives: [
            "State that you have a reservation under your name.",
            "Ask if the room has a sea view.",
            "Inquire about the breakfast time.",
            "Ask what the Wi-Fi password is."
        ]
    },
    {
        id: 'return_item',
        title: 'Returning an Item',
        description: 'Try to return a newly bought but faulty electronic item to the store.',
        difficulty: 'Orta',
        userRole: 'an unsatisfied customer returning a faulty product',
        aiRole: 'a store clerk handling returns',
        aiWelcome: "Hi there, how can I help you today?",
        objectives: [
            "Explain that you bought an item that is not working.",
            "Describe the problem with the item (e.g., it doesn't turn on).",
            "State that you would like a full refund, not a replacement.",
            "Mention that you have the receipt."
        ]
    },
    {
        id: 'directions',
        title: 'Asking for Directions',
        description: 'You are lost in a city and ask a local where the nearest train station is.',
        difficulty: 'Orta',
        userRole: 'a lost tourist',
        aiRole: 'a helpful local person',
        aiWelcome: "Excuse me, you look a bit lost. Can I help you with something?",
        objectives: [
            "Politely get the person's attention.",
            "Ask where the nearest train station is.",
            "Ask how long it takes to walk there.",
            "Thank the person for their help."
        ]
    },
    {
        id: 'job_interview',
        title: 'Job Interview Simulation',
        description: 'Conduct a basic job interview for a software engineer position.',
        difficulty: 'Zor',
        userRole: 'a candidate interviewing for a junior software engineer role',
        aiRole: 'a hiring manager at a tech company',
        aiWelcome: "Hello, thanks for coming in. Please, have a seat. So, tell me a little bit about yourself.",
        objectives: [
            "Briefly introduce yourself and your background.",
            "Explain why you are interested in this role.",
            "Mention one of your key strengths.",
            "Ask a question about the company culture."
        ]
    },
    {
        id: 'discuss_news',
        title: 'Discussing News',
        description: 'Chat with a friend about the latest news on the future of artificial intelligence.',
        difficulty: 'Zor',
        userRole: 'a person interested in technology',
        aiRole: 'a friend who also follows the news',
        aiWelcome: "Hey, did you see that article about the new AI developments? It's pretty wild.",
        objectives: [
            "Express your general opinion on the news.",
            "Mention one potential benefit of AI.",
            "Mention one potential concern about AI.",
            "Ask your friend for their opinion on the future of AI."
        ]
    }
];

const SpeakingSimulator: React.FC = () => {
    const [simulatorState, setSimulatorState] = useState<SimulatorState>('selection');
    const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
    const [conversation, setConversation] = useState<SimulatorChatMessage[]>([]);
    const [report, setReport] = useState<PerformanceReport | null>(null);
    const [error, setError] = useState('');
    const { trackAction } = useChallenge();

    // --- Audio & Live API Refs ---
    const sessionPromiseRef = useRef<Promise<any> | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const outputAudioSources = useRef<Set<AudioBufferSourceNode>>(new Set());
    const nextAudioStartTime = useRef<number>(0);

    // --- Audio Helper Functions (from guidelines) ---
    const encode = (bytes: Uint8Array) => {
        let binary = '';
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    };

    const createBlob = (data: Float32Array): Blob => {
        const l = data.length;
        const int16 = new Int16Array(l);
        for (let i = 0; i < l; i++) {
            // Clamp the value to the [-1.0, 1.0] range to ensure it's valid.
            const s = Math.max(-1, Math.min(1, data[i]));
            // Convert to 16-bit signed integer.
            int16[i] = s < 0 ? s * 32768 : s * 32767;
        }
        return { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
    };
    
    const decode = (base64: string) => {
      const binaryString = atob(base64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes;
    }

    const decodeAudioData = async (data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> => {
      const dataInt16 = new Int16Array(data.buffer);
      const frameCount = dataInt16.length / numChannels;
      const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

      for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) {
          channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
        }
      }
      return buffer;
    }

    // --- Cleanup Functions ---
    const cleanupAudio = () => {
        scriptProcessorRef.current?.disconnect();
        scriptProcessorRef.current = null;
        inputAudioContextRef.current?.close();
        inputAudioContextRef.current = null;
        mediaStreamRef.current?.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
        
        outputAudioSources.current.forEach(source => source.stop());
        outputAudioSources.current.clear();
        outputAudioContextRef.current?.close();
        outputAudioContextRef.current = null;
        nextAudioStartTime.current = 0;
    };
    
    const stopSimulation = async () => {
        if (simulatorState !== 'active') return;
        
        setSimulatorState('processing_report');
        sessionPromiseRef.current?.then(session => session.close());
        cleanupAudio();
        
        try {
            if (conversation.length > 1) { // Need more than just the AI's welcome
                const reportText = await analyzeConversationForReport(selectedScenario!, conversation);
                const reportJson: PerformanceReport = JSON.parse(reportText);
                setReport(reportJson);
                trackAction('speaking_simulator');
            } else {
                setReport(null); // No report if no interaction
            }
        } catch (e: any) {
            setError(e.message || 'An error occurred while generating the analysis report.');
        } finally {
            setSimulatorState('report');
        }
    };
    
    const startSimulation = async () => {
        if (!selectedScenario) return;

        setConversation([{ speaker: 'ai', text: selectedScenario.aiWelcome }]);
        setSimulatorState('active');
        setError('');

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;

            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: () => {
                        const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
                        inputAudioContextRef.current = inputCtx;
                        const source = inputCtx.createMediaStreamSource(stream);
                        const processor = inputCtx.createScriptProcessor(4096, 1, 1);
                        scriptProcessorRef.current = processor;

                        processor.onaudioprocess = (audioEvent) => {
                            const inputData = audioEvent.inputBuffer.getChannelData(0);
                            const pcmBlob = createBlob(inputData);
                            sessionPromiseRef.current?.then(session => session.sendRealtimeInput({ media: pcmBlob }));
                        };
                        source.connect(processor);
                        processor.connect(inputCtx.destination);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        // Handle user's transcription
                        if (message.serverContent?.inputTranscription) {
                            const text = message.serverContent.inputTranscription.text;
                            setConversation(prev => {
                                const last = prev[prev.length - 1];
                                if (last?.speaker === 'user') {
                                    // Append to existing user message
                                    return [...prev.slice(0, -1), { ...last, text: last.text + text }];
                                }
                                // Start a new user message
                                return [...prev, { speaker: 'user', text }];
                            });
                        }
                        // Handle AI's transcription
                        else if (message.serverContent?.outputTranscription) {
                            const text = message.serverContent.outputTranscription.text;
                            setConversation(prev => {
                                const last = prev[prev.length - 1];
                                if (last?.speaker === 'ai') {
                                    // Append to existing AI message
                                    return [...prev.slice(0, -1), { ...last, text: last.text + text }];
                                }
                                // Start a new AI message (the user's turn must be over)
                                return [...prev, { speaker: 'ai', text }];
                            });
                        }
                        
                        // Handle AI's audio output
                        const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                        if (audioData) {
                            if (!outputAudioContextRef.current) {
                                outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
                            }
                            const ctx = outputAudioContextRef.current;
                            nextAudioStartTime.current = Math.max(nextAudioStartTime.current, ctx.currentTime);
                            const audioBuffer = await decodeAudioData(decode(audioData), ctx, 24000, 1);
                            const source = ctx.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(ctx.destination);
                            source.addEventListener('ended', () => outputAudioSources.current.delete(source));
                            source.start(nextAudioStartTime.current);
                            nextAudioStartTime.current += audioBuffer.duration;
                            outputAudioSources.current.add(source);
                        }
                    },
                    onerror: (e: ErrorEvent) => {
                        console.error('Live session error:', e);
                        setError('A conversation session error occurred. Ending session automatically.');
                        stopSimulation();
                    },
                    onclose: (e: CloseEvent) => {
                        console.debug('Live session closed.');
                        cleanupAudio();
                    },
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                    systemInstruction: `You are an AI role-playing as a ${selectedScenario.aiRole}. Your goal is to have a natural conversation with the user, who is playing the role of a ${selectedScenario.userRole}. Act your part convincingly. Do not break character. Keep your responses concise and natural for a spoken conversation.`,
                },
            });

        } catch (err) {
            setError('Mikrofon erişimi reddedildi veya bulunamadı. Lütfen tarayıcı ayarlarınızı kontrol edin.');
            setSimulatorState('briefing');
        }
    };
    
     // Cleanup on unmount
    useEffect(() => {
        return () => {
            sessionPromiseRef.current?.then(session => session.close());
            cleanupAudio();
        }
    }, []);
    
    // --- Render Functions ---
    const renderSelection = () => (
        <div className="bg-bg-secondary p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-2 text-text-primary">Konuşma Simülatörü 🎭</h2>
            <p className="mb-4 text-text-secondary">Pratik yapmak istediğiniz bir senaryo seçin.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {scenarios.map(s => (
                    <button key={s.id} onClick={() => { setSelectedScenario(s); setSimulatorState('briefing'); }}
                        className="p-6 bg-gray-100 dark:bg-gray-700 hover:bg-brand-secondary dark:hover:bg-brand-secondary hover:text-white rounded-lg text-left transition-all duration-200 transform hover:scale-105">
                        <h3 className="font-bold text-lg">{s.title}</h3>
                        <p className="text-sm mt-1">{s.description}</p>
                        <span className={`mt-3 inline-block px-2 py-0.5 text-xs font-semibold rounded-full ${s.difficulty === 'Kolay' ? 'bg-green-200 text-green-800' : s.difficulty === 'Orta' ? 'bg-yellow-200 text-yellow-800' : 'bg-red-200 text-red-800'}`}>
                            {s.difficulty}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
    
    const renderBriefing = () => {
        if (!selectedScenario) return null;
        return (
            <div className="bg-bg-secondary p-6 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold mb-2 text-brand-primary">{selectedScenario.title}</h2>
                <div className="space-y-4 my-4 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <p><strong>🤖 AI Rolü:</strong> {selectedScenario.aiRole}</p>
                    <p><strong>👤 Senin Rolün:</strong> {selectedScenario.userRole}</p>
                    <div>
                        <h4 className="font-bold mb-2">🎯 Hedeflerin:</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                            {selectedScenario.objectives.map((obj, i) => <li key={i}>{obj}</li>)}
                        </ul>
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                    <button onClick={startSimulation} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-md transition duration-300">
                        Simülasyonu Başlat
                    </button>
                    <button onClick={() => setSimulatorState('selection')} className="flex-1 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-200 font-bold py-3 px-4 rounded-md transition duration-300">
                        Geri Dön
                    </button>
                </div>
            </div>
        );
    };

    const renderActive = () => (
         <div className="bg-bg-secondary p-6 rounded-lg shadow-lg">
             <h2 className="text-2xl font-bold mb-2 text-brand-primary">{selectedScenario?.title}</h2>
             <div className="h-80 bg-gray-100 dark:bg-gray-700 rounded-lg p-4 overflow-y-auto space-y-3 mb-4">
                 {conversation.map((msg, i) => (
                     <div key={i} className={`flex items-end gap-2 ${msg.speaker === 'user' ? 'justify-end' : 'justify-start'}`}>
                         {msg.speaker === 'ai' && <span className="text-2xl">🤖</span>}
                         <div className={`max-w-md p-3 rounded-2xl ${msg.speaker === 'user' ? 'bg-blue-500 text-white rounded-br-none' : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-none'}`}>
                             <p className="text-sm">{msg.text}</p>
                         </div>
                          {msg.speaker === 'user' && <span className="text-2xl">👤</span>}
                     </div>
                 ))}
             </div>
             <div className="text-center font-bold text-red-500 animate-pulse mb-4">
                 🔴 KAYIT AKTİF
             </div>
             <button onClick={stopSimulation} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-md transition duration-300">
                 Simülasyonu Bitir ve Rapor Al
             </button>
         </div>
    );
    
    const renderReport = () => (
        <div className="bg-bg-secondary p-6 rounded-lg shadow-lg space-y-6 flex flex-col max-h-[calc(100vh-12rem)]">
            <div className="flex-shrink-0">
                <h2 className="text-2xl font-bold text-brand-primary">Performans Raporu</h2>
                <ErrorMessage message={error} />
            </div>
            {simulatorState === 'processing_report' ? <div className="flex-grow flex items-center justify-center"><Loader /></div> : (
                report ? (
                    <div className="space-y-6 overflow-y-auto pr-4 flex-grow">
                        {/* Objective Completion */}
                        <div>
                            <h3 className="text-lg font-semibold mb-2 text-text-primary">🎯 Hedef Tamamlama Durumu</h3>
                            <ul className="space-y-2">
                                {report.objectiveCompletion.map((obj, i) => (
                                    <li key={i} className={`p-3 rounded-md text-sm ${obj.completed ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'}`}>
                                        <span className={`font-bold ${obj.completed ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'}`}>{obj.completed ? '✅ Tamamlandı:' : '❌ Tamamlanmadı:'}</span> <span className="text-text-primary">{obj.objective}</span>
                                        <p className="text-xs italic mt-1 text-text-secondary">Gerekçe: {obj.reasoning}</p>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Overall Feedback */}
                        <div>
                            <h3 className="text-lg font-semibold mb-2 text-text-primary">💬 Genel Geri Bildirim</h3>
                            <p className="text-sm bg-gray-100 dark:bg-gray-700 p-3 rounded-md text-text-secondary">{report.overallFeedback}</p>
                        </div>

                        {/* Pronunciation Feedback */}
                        {report.pronunciationFeedback.length > 0 && (
                            <div>
                                <h3 className="text-lg font-semibold mb-2 text-text-primary">🗣️ Telaffuz İpuçları</h3>
                                <ul className="space-y-2">
                                    {report.pronunciationFeedback.map((item, i) => (
                                        <li key={i} className="text-sm bg-gray-100 dark:bg-gray-700 p-3 rounded-md text-text-secondary">
                                            <strong className="text-purple-700 dark:text-purple-400">{item.word}:</strong> {item.feedback}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Grammar Feedback */}
                        {report.grammarFeedback.length > 0 && (
                            <div>
                                <h3 className="text-lg font-semibold mb-2 text-text-primary">✍️ Dil Bilgisi Düzeltmeleri</h3>
                                <ul className="space-y-2">
                                    {report.grammarFeedback.map((item, i) => (
                                        <li key={i} className="text-sm bg-gray-100 dark:bg-gray-700 p-3 rounded-md">
                                            <p className="text-text-primary"><span className="text-red-600 dark:text-red-400 line-through">{item.error}</span> &rarr; <span className="text-green-600 dark:text-green-400 font-semibold">{item.correction}</span></p>
                                            <p className="text-xs text-text-secondary mt-1">Açıklama: {item.explanation}</p>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Vocabulary Suggestions */}
                        {report.vocabularySuggestions.length > 0 && (
                            <div>
                                <h3 className="text-lg font-semibold mb-2 text-text-primary">💡 Kelime Önerileri</h3>
                                <ul className="space-y-2">
                                    {report.vocabularySuggestions.map((item, i) => (
                                        <li key={i} className="text-sm bg-gray-100 dark:bg-gray-700 p-3 rounded-md">
                                            <p className="text-text-primary">'{item.original}' yerine '{item.suggestion}' kullanabilirsin.</p>
                                            <p className="text-xs text-text-secondary mt-1">Neden: {item.reason}</p>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                ) : <div className="flex-grow flex items-center justify-center text-text-secondary"><p>Analiz edilecek yeterli konuşma verisi bulunamadı.</p></div>
            )}
            <div className="flex-shrink-0 pt-4">
                <button onClick={() => { setSimulatorState('selection'); setReport(null); setConversation([]); }}
                    className="w-full bg-brand-secondary hover:bg-brand-primary text-white font-bold py-3 px-4 rounded-md transition duration-300">
                    Yeni Simülasyon
                </button>
            </div>
        </div>
    );


    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <ErrorMessage message={error} />
            {simulatorState === 'selection' && renderSelection()}
            {simulatorState === 'briefing' && renderBriefing()}
            {(simulatorState === 'active') && renderActive()}
            {(simulatorState === 'processing_report' || simulatorState === 'report') && renderReport()}
        </div>
    );
};

export default SpeakingSimulator;