

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Chat, LiveServerMessage } from '@google/genai';
import { GoogleGenAI, Modality, Blob } from '@google/genai';
import { createTutorChatSession } from '../services/geminiService';
import { ChatMessage } from '../types';
import ErrorMessage from '../components/ErrorMessage';
import { SendIcon } from '../components/icons/Icons';
import { useChallenge } from '../context/ChallengeContext';

interface AITutorProps {
    initialMessage?: string | null;
    onMessageSent?: () => void;
}

const AITutor: React.FC<AITutorProps> = ({ initialMessage, onMessageSent }) => {
    // --- Shared State ---
    const [error, setError] = useState('');
    const [isEnglishMode, setIsEnglishMode] = useState(false);

    // --- Turkish Text Chat State ---
    const [chatSession, setChatSession] = useState<Chat | null>(null);
    const [history, setHistory] = useState<ChatMessage[]>([
        { role: 'model', text: 'Merhaba! Ben Onur, senin kişisel AI İngilizce eğitmenin. İngilizce yolculuğunda sana nasıl yardımcı olabilirim?' }
    ]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const { trackAction } = useChallenge();
    
    // --- English Voice Chat State & Refs ---
    const [conversationState, setConversationState] = useState<'idle' | 'active'>('idle');
    const [liveHistory, setLiveHistory] = useState<{ speaker: 'user' | 'ai'; text: string }[]>([]);
    const sessionPromiseRef = useRef<Promise<any> | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const outputAudioSources = useRef<Set<AudioBufferSourceNode>>(new Set());
    const nextAudioStartTime = useRef<number>(0);

    // --- Audio Helper Functions ---
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
            const s = Math.max(-1, Math.min(1, data[i]));
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
    };

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
    };
    
    // --- Live Session Cleanup ---
    const stopConversation = useCallback(() => {
        if (conversationState !== 'active') return;
        
        sessionPromiseRef.current?.then(session => session.close());
        sessionPromiseRef.current = null;
    
        scriptProcessorRef.current?.disconnect();
        scriptProcessorRef.current = null;
        inputAudioContextRef.current?.close().catch(console.error);
        inputAudioContextRef.current = null;
        mediaStreamRef.current?.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
    
        outputAudioSources.current.forEach(source => source.stop());
        outputAudioSources.current.clear();
        outputAudioContextRef.current?.close().catch(console.error);
        outputAudioContextRef.current = null;
        nextAudioStartTime.current = 0;
    
        setConversationState('idle');
    }, [conversationState]);

    // --- Turkish Mode Logic ---
    useEffect(() => {
        if (!isEnglishMode) {
            try {
                const session = createTutorChatSession();
                setChatSession(session);
            } catch (e: any) {
                setError(e.message || "Failed to initialize AI Tutor session.");
            }
        }
    }, [isEnglishMode]);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [history, liveHistory]);
    
    useEffect(() => {
        if (initialMessage && chatSession && !isEnglishMode) {
          const processInitialMessage = async () => {
            const userMessage: ChatMessage = { role: 'user', text: initialMessage };
            setHistory(prev => [...prev, userMessage]);
            setIsLoading(true);
            setError('');
            
            onMessageSent?.();

            try {
              const stream = await chatSession.sendMessageStream({ message: initialMessage });
              setHistory(prev => [...prev, { role: 'model', text: '' }]);

              for await (const chunk of stream) {
                const chunkText = chunk.text;
                setHistory(prev => {
                  const lastMessage = prev[prev.length - 1];
                  if (lastMessage.role === 'model') {
                    const updatedMessage = { ...lastMessage, text: lastMessage.text + chunkText };
                    return [...prev.slice(0, -1), updatedMessage];
                  }
                  return prev;
                });
              }
            } catch (e: any) {
              setError(e.message || 'Failed to get response from AI Tutor.');
              setHistory(prev => prev.filter(msg => msg.text !== initialMessage));
            } finally {
              setIsLoading(false);
            }
          };
          processInitialMessage();
        }
      }, [initialMessage, onMessageSent, chatSession, isEnglishMode]);


    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userInput.trim() || isLoading || !chatSession) return;

        const userMessage: ChatMessage = { role: 'user', text: userInput };
        setIsLoading(true);
        setError('');
        setHistory(prev => [...prev, userMessage]);
        setUserInput('');
        trackAction('tutor');


        try {
            const stream = await chatSession.sendMessageStream({ message: userInput });
            
            setHistory(prev => [...prev, { role: 'model', text: '' }]);

            for await (const chunk of stream) {
                const chunkText = chunk.text;
                setHistory(prev => {
                    const lastMessage = prev[prev.length - 1];
                    const updatedMessage = { ...lastMessage, text: lastMessage.text + chunkText };
                    return [...prev.slice(0, -1), updatedMessage];
                });
            }
        } catch (e: any) {
            setError(e.message || 'Failed to get response from AI Tutor.');
            setHistory(prev => prev.slice(0, -1)); 
        } finally {
            setIsLoading(false);
        }
    };
    
    // --- English Mode Logic ---
     const startConversation = async () => {
        if (!isEnglishMode) return;
        setConversationState('active');
        setError('');
        setLiveHistory([]);

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;

            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: () => {
                        const context = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
                        inputAudioContextRef.current = context;
                        const source = context.createMediaStreamSource(stream);
                        const processor = context.createScriptProcessor(4096, 1, 1);
                        scriptProcessorRef.current = processor;

                        processor.onaudioprocess = (audioEvent) => {
                            const inputData = audioEvent.inputBuffer.getChannelData(0);
                            const pcmBlob = createBlob(inputData);
                            sessionPromiseRef.current?.then(session => session.sendRealtimeInput({ media: pcmBlob }));
                        };
                        source.connect(processor);
                        processor.connect(context.destination);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        let currentInputTranscription = '';
                        let currentOutputTranscription = '';

                         if (message.serverContent?.inputTranscription) {
                            currentInputTranscription += message.serverContent.inputTranscription.text;
                         }
                         if (message.serverContent?.outputTranscription) {
                            currentOutputTranscription += message.serverContent.outputTranscription.text;
                         }
                        
                        if (currentInputTranscription) {
                           setLiveHistory(prev => {
                                const last = prev[prev.length - 1];
                                if (last?.speaker === 'user') {
                                    return [...prev.slice(0, -1), { ...last, text: last.text + currentInputTranscription }];
                                }
                                return [...prev, { speaker: 'user', text: currentInputTranscription }];
                            });
                        }
                        if (currentOutputTranscription) {
                            setLiveHistory(prev => {
                                const last = prev[prev.length - 1];
                                if (last?.speaker === 'ai') {
                                    return [...prev.slice(0, -1), { ...last, text: last.text + currentOutputTranscription }];
                                }
                                return [...prev, { speaker: 'ai', text: currentOutputTranscription }];
                            });
                        }

                        const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                        if (audioData) {
                            if (!outputAudioContextRef.current || outputAudioContextRef.current.state === 'closed') {
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
                        setError('Konuşma oturumunda bir hata oluştu.');
                        stopConversation();
                    },
                    onclose: (e: CloseEvent) => {
                        console.debug('Live session closed.');
                        stopConversation();
                    },
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' }}},
                    systemInstruction: "You are 'Alex', a friendly and patient English conversation partner. Your goal is to have a natural, spoken conversation with the user in English. Keep your responses conversational and not overly long. Encourage the user to speak and express themselves. Do not act as a teacher or correct grammar unless explicitly asked. Your responses will be converted to audio, so write in a way that sounds natural when spoken.",
                },
            });
        } catch (err) {
            setError('Mikrofon erişimi reddedildi veya bulunamadı. Lütfen tarayıcı ayarlarınızı kontrol edin.');
            setConversationState('idle');
        }
    };

    const handleModeChange = (englishMode: boolean) => {
        if (isEnglishMode && conversationState === 'active') {
            stopConversation();
        }
        setIsEnglishMode(englishMode);
        setError('');
        if (englishMode) {
            setLiveHistory([]);
        } else {
             setHistory([
                { role: 'model', text: 'Merhaba! Ben Onur, senin kişisel AI İngilizce eğitmenin. İngilizce yolculuğunda sana nasıl yardımcı olabilirim?' }
            ]);
        }
    };
    
    // Cleanup on component unmount
    useEffect(() => {
        return () => {
            stopConversation();
        }
    }, [stopConversation]);

    const ModeSwitcher = () => (
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-900 p-1 rounded-lg mb-4">
            <button onClick={() => handleModeChange(false)} className={`flex-1 text-center text-sm font-bold py-2 rounded-md transition-colors ${!isEnglishMode ? 'bg-indigo-500 text-white shadow' : 'text-gray-700 dark:text-gray-400'}`}>
                Türkçe Modu (Yazılı)
            </button>
            <button onClick={() => handleModeChange(true)} className={`flex-1 text-center text-sm font-bold py-2 rounded-md transition-colors ${isEnglishMode ? 'bg-teal-500 text-white shadow' : 'text-gray-700 dark:text-gray-400'}`}>
                English Mode (Speaking)
            </button>
        </div>
    );
    
    const renderTurkishMode = () => (
        <div className="lg:col-span-3 h-[calc(100vh-14rem)] flex flex-col">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-t-lg shadow-lg border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-bold text-gray-950 dark:text-gray-50">AI Eğitmen: Onur</h2>
                <p className="text-gray-700 dark:text-gray-400">İngilizce veya sınavlar hakkında aklınıza takılan her şeyi sorun.</p>
            </div>
            <div ref={chatContainerRef} className="flex-grow bg-white dark:bg-gray-800 p-6 overflow-y-auto space-y-4">
                {history.map((msg, index) => (
                    <div key={index} className={`flex items-end gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.role === 'model' && <span className="text-3xl mb-1">🎓</span>}
                        <div className={`max-w-xl p-3 rounded-2xl ${msg.role === 'user' ? 'bg-brand-primary text-white rounded-br-none' : 'bg-gray-200 dark:bg-gray-700 text-gray-950 dark:text-gray-50 rounded-bl-none'}`}>
                            <p className="whitespace-pre-wrap text-sm">{msg.text}</p>
                        </div>
                        {msg.role === 'user' && <span className="text-3xl mb-1">🧑‍🎓</span>}
                    </div>
                ))}
                {isLoading && (
                    <div className="flex items-end gap-3 justify-start mt-4">
                        <span className="text-3xl mb-1">🎓</span>
                        <div className="max-w-lg p-3 rounded-2xl bg-gray-200 dark:bg-gray-700 text-gray-950 dark:text-gray-50 rounded-bl-none">
                            <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-brand-primary rounded-full animate-pulse"></div>
                                <div className="w-2 h-2 bg-brand-primary rounded-full animate-pulse [animation-delay:0.2s]"></div>
                                <div className="w-2 h-2 bg-brand-primary rounded-full animate-pulse [animation-delay:0.4s]"></div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <div className="p-4 bg-white dark:bg-gray-800 rounded-b-lg shadow-lg">
                <ErrorMessage message={error} />
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <input
                        type="text"
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        placeholder={isLoading ? 'Onur düşünüyor...' : 'Onur\'a bir mesaj yazın...'}
                        className="flex-grow p-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-full focus:ring-2 focus:ring-brand-primary focus:outline-none text-gray-950 dark:text-gray-50 disabled:opacity-50"
                        disabled={isLoading}
                    />
                    <button type="submit" disabled={isLoading || !userInput.trim()} className="bg-brand-primary hover:bg-brand-secondary text-white font-bold w-12 h-12 rounded-full transition duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center shrink-0">
                        <SendIcon />
                    </button>
                </form>
            </div>
        </div>
    );

    const renderEnglishMode = () => (
        <div className="lg:col-span-3 h-[calc(100vh-14rem)] flex flex-col">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-t-lg shadow-lg border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-bold text-gray-950 dark:text-gray-50">Speaking Partner: Alex</h2>
                <p className="text-gray-700 dark:text-gray-400">Start a conversation and practice your English speaking skills.</p>
            </div>
            <div ref={chatContainerRef} className="flex-grow bg-white dark:bg-gray-800 p-6 overflow-y-auto space-y-4">
                {liveHistory.length === 0 && conversationState === 'idle' && (
                     <div className="text-center text-gray-500">Press "Start Conversation" to begin.</div>
                )}
                {liveHistory.map((msg, index) => (
                    <div key={index} className={`flex items-end gap-3 ${msg.speaker === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.speaker === 'ai' && <span className="text-3xl mb-1">🤖</span>}
                        <div className={`max-w-xl p-3 rounded-2xl ${msg.speaker === 'user' ? 'bg-blue-500 text-white rounded-br-none' : 'bg-gray-200 dark:bg-gray-700 text-gray-950 dark:text-gray-50 rounded-bl-none'}`}>
                            <p className="whitespace-pre-wrap text-sm">{msg.text}</p>
                        </div>
                        {msg.speaker === 'user' && <span className="text-3xl mb-1">🎤</span>}
                    </div>
                ))}
            </div>
            <div className="p-4 bg-white dark:bg-gray-800 rounded-b-lg shadow-lg text-center">
                 <ErrorMessage message={error} />
                 {conversationState === 'active' ? (
                     <button onClick={stopConversation} className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-full transition duration-300 text-lg flex items-center gap-2 mx-auto">
                        <div className="w-3 h-3 bg-white rounded-sm animate-pulse"></div> Stop Conversation
                     </button>
                 ) : (
                     <button onClick={startConversation} className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-full transition duration-300 text-lg flex items-center gap-2 mx-auto">
                        🎤 Start Conversation
                     </button>
                 )}
            </div>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto">
            <ModeSwitcher />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {isEnglishMode ? renderEnglishMode() : renderTurkishMode()}
            </div>
        </div>
    );
};

export default AITutor;
