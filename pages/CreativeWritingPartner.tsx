

import React, { useState, useRef, useEffect } from 'react';
import type { Chat } from '@google/genai';
import { createCreativeWritingSession } from '../services/geminiService';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';
import { SendIcon } from '../components/icons/Icons';

type WritingState = 'setup' | 'writing';
type WritingFormat = 'Short Story' | 'Poem' | 'Dialogue';

interface StoryPart {
    author: 'user' | 'ai';
    text: string;
}

const CreativeWritingPartner: React.FC = () => {
    const [writingState, setWritingState] = useState<WritingState>('setup');
    const [format, setFormat] = useState<WritingFormat | ''>('');
    const [startInput, setStartInput] = useState('');
    const [storyParts, setStoryParts] = useState<StoryPart[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    
    const chatSessionRef = useRef<Chat | null>(null);
    const storyContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (storyContainerRef.current) {
            storyContainerRef.current.scrollTop = storyContainerRef.current.scrollHeight;
        }
    }, [storyParts]);

    const handleStartCollaboration = async () => {
        if (!format || !startInput.trim()) {
            setError('Please choose a format and provide a starting point.');
            return;
        }
        setIsLoading(true);
        setError('');

        try {
            chatSessionRef.current = createCreativeWritingSession(format, startInput);
            setStoryParts([{ author: 'user', text: startInput }]);

            const stream = await chatSessionRef.current.sendMessageStream({ message: startInput });
            
            setStoryParts(prev => [...prev, { author: 'ai', text: '' }]);

            for await (const chunk of stream) {
                const chunkText = chunk.text;
                setStoryParts(prev => {
                    const lastPart = prev[prev.length - 1];
                    if (lastPart.author === 'ai') {
                        const updatedPart = { ...lastPart, text: lastPart.text + chunkText };
                        return [...prev.slice(0, -1), updatedPart];
                    }
                    return prev;
                });
            }
            setWritingState('writing');
        } catch (e: any) {
            setError(e.message || 'An error occurred while starting the writing session.');
            setStoryParts([]); // Clear parts on error
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendUserTurn = async () => {
        if (!userInput.trim() || isLoading || !chatSessionRef.current) return;
        
        setIsLoading(true);
        setError('');
        const userText = userInput.trim();
        setStoryParts(prev => [...prev, { author: 'user', text: userText }]);
        setUserInput('');

        try {
            const stream = await chatSessionRef.current.sendMessageStream({ message: userText });

            setStoryParts(prev => [...prev, { author: 'ai', text: '' }]);

            for await (const chunk of stream) {
                const chunkText = chunk.text;
                setStoryParts(prev => {
                    const lastPart = prev[prev.length - 1];
                    const updatedPart = { ...lastPart, text: lastPart.text + chunkText };
                    return [...prev.slice(0, -1), updatedPart];
                });
            }
        } catch (e: any) {
            setError(e.message || 'Failed to get a response from the AI partner.');
            // Remove the user's part and the AI's placeholder on error
            setStoryParts(prev => prev.slice(0, -2));
        } finally {
            setIsLoading(false);
        }
    };

    const handleNewStory = () => {
        setWritingState('setup');
        setFormat('');
        setStartInput('');
        setStoryParts([]);
        setUserInput('');
        setError('');
        chatSessionRef.current = null;
    };

    const renderSetup = () => (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-bg-secondary p-6 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold mb-2 text-text-primary">Creative Writing Partner ✒️</h2>
                <p className="mb-4 text-text-secondary">
                    Write something together with your AI writing partner, Alex. Choose a format, set a starting point, and let your creativity flow.
                </p>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">1. Choose a format:</label>
                        <div className="flex flex-wrap gap-2">
                            {(['Short Story', 'Poem', 'Dialogue'] as WritingFormat[]).map(f => (
                                <button key={f} onClick={() => setFormat(f)}
                                    className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors ${format === f ? 'bg-brand-primary text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">2. Provide a starting point:</label>
                        <textarea
                            value={startInput}
                            onChange={(e) => setStartInput(e.target.value)}
                            placeholder="A starting sentence, a few keywords (e.g., rain, library, secret), or a theme (e.g., an unexpected friendship)..."
                            className="w-full h-32 p-3 bg-gray-50 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary focus:outline-none text-text-primary resize-y"
                        />
                    </div>
                </div>
                
                <ErrorMessage message={error} />

                <button
                    onClick={handleStartCollaboration}
                    disabled={isLoading || !format || !startInput.trim()}
                    className="mt-4 w-full bg-brand-primary hover:bg-brand-secondary text-white font-bold py-3 px-4 rounded-md transition duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center"
                >
                    {isLoading ? 'Starting...' : 'Start Writing'}
                </button>
            </div>
        </div>
    );

    const renderWriting = () => (
        <div className="max-w-3xl mx-auto space-y-4 h-[calc(100vh-12rem)] flex flex-col">
             <div className="flex justify-between items-center bg-bg-secondary p-4 rounded-lg shadow-lg">
                <h2 className="text-xl font-bold text-brand-primary">Writing: {format}</h2>
                <button onClick={handleNewStory} className="text-sm bg-gray-200 hover:bg-gray-300 font-semibold px-4 py-2 rounded-md">
                    Start New Story
                </button>
            </div>
            <div ref={storyContainerRef} className="flex-grow bg-bg-secondary p-6 rounded-lg shadow-lg overflow-y-auto">
                <div className="prose prose-lg dark:prose-invert max-w-none">
                    {storyParts.map((part, index) => (
                        <span key={index} className={part.author === 'user' ? 'text-text-primary' : 'text-indigo-500 dark:text-indigo-400'}>
                            {part.text}{' '}
                        </span>
                    ))}
                    {isLoading && <span className="text-gray-400 animate-pulse">Alex is writing...</span>}
                </div>
            </div>
             <div className="bg-bg-secondary p-4 rounded-lg shadow-lg">
                <ErrorMessage message={error} />
                <div className="flex items-center gap-2">
                    <textarea
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        placeholder={isLoading ? 'Waiting for Alex to finish...' : 'Your turn...'}
                        className="flex-grow p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:outline-none text-text-primary resize-none"
                        rows={2}
                        disabled={isLoading}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendUserTurn();
                            }
                        }}
                    />
                    <button
                        onClick={handleSendUserTurn}
                        disabled={isLoading || !userInput.trim()}
                        className="bg-brand-primary hover:bg-brand-secondary text-white font-bold w-12 h-12 rounded-full transition duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center shrink-0"
                    >
                        <SendIcon />
                    </button>
                </div>
             </div>
        </div>
    );

    return writingState === 'setup' ? renderSetup() : renderWriting();
};

export default CreativeWritingPartner;