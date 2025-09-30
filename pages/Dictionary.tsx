import React, { useState, useEffect } from 'react';
import { getDictionaryEntry } from '../services/geminiService';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';
import { SpeakerIcon } from '../components/icons/Icons';
import { useChallenge } from '../context/ChallengeContext';
import { useVocabulary } from '../context/VocabularyContext';
import { DictionaryEntry } from '../types';

const PEXELS_API_KEY = 'BXJTqpDqYKrp57GTOT012YKebRMmDDGBfDVHoUDu3gdNNwr13TMbJLWq';

const Dictionary: React.FC = () => {
  const [word, setWord] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [entry, setEntry] = useState<DictionaryEntry | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const { trackAction } = useChallenge();
  const { addWord, removeWord, isWordSaved } = useVocabulary();


  useEffect(() => {
    const loadVoices = () => {
        setVoices(window.speechSynthesis.getVoices());
    };
    window.speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices();

    return () => {
        window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);


  const fetchImage = async (query: string): Promise<string | null> => {
    try {
      const response = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1`, {
        headers: {
          Authorization: PEXELS_API_KEY
        }
      });
      if (!response.ok) {
        console.error(`Pexels API error: ${response.statusText}`);
        return null;
      }
      const data = await response.json();
      if (data.photos && data.photos.length > 0) {
        return data.photos[0].src.large;
      }
      return null;
    } catch (error) {
      console.error('Error fetching image from Pexels:', error);
      return null;
    }
  };
  
  const executeSearch = async (searchTerm: string) => {
    const cleanedSearchTerm = searchTerm.trim();
    if (!cleanedSearchTerm) {
      setError('Lütfen bir kelime girin.');
      return;
    }
    setWord(cleanedSearchTerm);
    setIsLoading(true);
    setError('');
    setEntry(null);
    setImageUrl(null);
    try {
      const [resultText, fetchedImageUrl] = await Promise.all([
        getDictionaryEntry(cleanedSearchTerm),
        fetchImage(cleanedSearchTerm)
      ]);
      
      const parsedResult: DictionaryEntry = JSON.parse(resultText);
      setEntry(parsedResult);
      setImageUrl(fetchedImageUrl);
      trackAction('dictionary');
    } catch (e: any) {
      setError(e.message || 'Sözlük girdisi alınırken bir hata oluştu. Modelden gelen format hatalı olabilir.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    executeSearch(word);
  };
    
  const handleWordClick = (clickedWord: string) => {
      const cleanedWord = clickedWord.replace(/[^\w\s-]/g, '').trim();
      if(cleanedWord) {
        executeSearch(cleanedWord);
      }
  };

  const handleSpeak = () => {
    if (!word) return;
    window.speechSynthesis.cancel(); // Cancel any previous speech
    const utterance = new SpeechSynthesisUtterance(word);
    const femaleVoice = voices.find(voice => voice.lang === 'en-US' && /female/i.test(voice.name));
    utterance.voice = femaleVoice || voices.find(voice => voice.lang === 'en-US') || null;
    utterance.lang = 'en-US';
    utterance.onerror = (e: SpeechSynthesisErrorEvent) => {
        // Don't show an error message if the speech was simply cancelled.
        if (e.error !== 'canceled' && e.error !== 'interrupted') {
            console.error("Speech synthesis error:", e.error);
            setError("Sorry, the pronunciation could not be played.");
        }
    };
    window.speechSynthesis.speak(utterance);
  };

  const handleToggleSaveWord = () => {
    if (!word || !entry?.turkishMeaning) return;
    if (isWordSaved(word)) {
        removeWord(word);
    } else {
        addWord(word, entry.turkishMeaning);
    }
  };
  
  const WordList = ({ title, words, onClick }: { title: string, words: string[], onClick: (word: string) => void}) => {
      if (!words || words.length === 0) return null;
      
      return (
          <div>
              <h4 className="font-semibold text-lg text-text-secondary mt-4 mb-2">{title}:</h4>
              <div className="flex flex-wrap gap-2">
                  {words.map((item, index) => (
                      <button
                          key={index}
                          onClick={() => onClick(item)}
                          className="px-3 py-1 bg-gray-100 text-brand-primary rounded-full hover:bg-brand-secondary hover:text-white transition-colors duration-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
                      >
                          {item}
                      </button>
                  ))}
              </div>
          </div>
      )
  }
  
  const renderParsedEntry = (entry: DictionaryEntry) => (
    <>
      {entry.pronunciation && (
        <div className="flex items-center gap-3">
          <p className="text-lg text-text-secondary">{entry.pronunciation}</p>
          <button onClick={handleSpeak} className="text-brand-primary hover:text-brand-secondary transition-colors" title="Telaffuzu Dinle">
            <SpeakerIcon />
          </button>
        </div>
      )}
      
      {entry.turkishMeaning && <p><strong className="font-semibold text-text-secondary">Türkçe Anlamı:</strong> {entry.turkishMeaning}</p>}
      {entry.definitions && entry.definitions.length > 0 && <div><h4 className="font-semibold text-lg text-text-secondary mt-4 mb-2">Tanımlar:</h4><ul className="list-disc list-inside space-y-1 pl-2">{entry.definitions.map((def, i) => <li key={i}>{def}</li>)}</ul></div>}

      {entry.synonyms && <WordList title="Eş Anlamlılar" words={entry.synonyms} onClick={handleWordClick} />}
      {entry.antonyms && <WordList title="Zıt Anlamlılar" words={entry.antonyms} onClick={handleWordClick} />}
      
      {entry.etymology && <p className="pt-2"><strong className="font-semibold text-text-secondary">Etimoloji:</strong> {entry.etymology}</p>}
      {entry.exampleSentences && entry.exampleSentences.length > 0 && <div><h4 className="font-semibold text-lg text-text-secondary mt-4 mb-2">Örnek Cümleler:</h4><ul className="list-disc list-inside space-y-1 pl-2">{entry.exampleSentences.map((ex, i) => <li key={i}>{ex}</li>)}</ul></div>}
    </>
  );

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-bg-secondary p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-4 text-text-primary">İngilizce Sözlük</h2>
        <p className="mb-4 text-text-secondary">Anlamını öğrenmek istediğiniz kelime veya ifadeyi girin.</p>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={word}
            onChange={(e) => setWord(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Örn: 'ubiquitous' veya 'break a leg'"
            className="flex-grow p-3 bg-gray-50 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary focus:outline-none text-text-primary"
            disabled={isLoading}
          />
          <button
            onClick={handleSearch}
            disabled={isLoading}
            className="bg-brand-primary hover:bg-brand-secondary text-white font-bold py-3 px-6 rounded-md transition duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Aranıyor...' : 'Ara'}
          </button>
        </div>
      </div>

      {isLoading && <Loader />}
      <ErrorMessage message={error} />

      {entry && (
        <div className="mt-6 bg-bg-secondary p-6 rounded-lg shadow-lg space-y-4">
            <div className="flex justify-between items-start">
                <h3 className="text-3xl font-bold text-brand-primary capitalize">{word}</h3>
                 <button 
                    onClick={handleToggleSaveWord}
                    disabled={!entry.turkishMeaning}
                    className="text-2xl p-2 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title={isWordSaved(word) ? 'Kelimeyi Kaldır' : 'Kelimeyi Kaydet'}
                 >
                    {isWordSaved(word) ? '✅' : '🔖'}
                 </button>
            </div>
          
          {imageUrl && (
            <div className="my-4 rounded-lg overflow-hidden shadow-md">
              <img 
                src={imageUrl} 
                alt={`An image representing '${word}'`} 
                className="w-full h-auto max-h-[400px] object-cover" 
              />
            </div>
          )}
          
          {renderParsedEntry(entry)}

        </div>
      )}
    </div>
  );
};

export default Dictionary;