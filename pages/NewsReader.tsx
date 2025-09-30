import React, { useState } from 'react';
import { getNewsSummary, generateNewsQuestions } from '../services/geminiService';
import { GroundingChunk, NewsQuestion } from '../types';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';

type ActiveView = 'quiz' | 'sources';

interface NewsReaderProps {
    onAskTutor: (context: string) => void;
}

const NewsReader: React.FC<NewsReaderProps> = ({ onAskTutor }) => {
    const [topic, setTopic] = useState<string | null>(null);
    const [paragraph, setParagraph] = useState<string>('');
    const [sources, setSources] = useState<GroundingChunk[]>([]);
    const [questions, setQuestions] = useState<NewsQuestion[]>([]);
    const [userAnswers, setUserAnswers] = useState<{ [key: number]: string }>({});
    const [showResults, setShowResults] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
    const [error, setError] = useState('');
    const [activeView, setActiveView] = useState<ActiveView>('quiz');

    const newsCategories = ["Technology", "World", "Sports", "Health", "Economy", "Science"];

    const handleGetNews = async (selectedTopic: string) => {
        setIsLoading(true);
        setError('');
        setTopic(selectedTopic);
        setParagraph('');
        setSources([]);
        setQuestions([]);
        setUserAnswers({});
        setShowResults(false);
        setActiveView('quiz');

        try {
            // Step 1: Fetch the news paragraph
            const result = await getNewsSummary(selectedTopic);
            setParagraph(result.text);
            setSources(result.sources);
            
            // Step 2: Generate questions based on the paragraph
            setIsLoading(false);
            setIsLoadingQuestions(true);
            
            const questionsText = await generateNewsQuestions(result.text);
            const questionsJson = JSON.parse(questionsText);
            
            if (questionsJson.questions && questionsJson.questions.length > 0) {
                setQuestions(questionsJson.questions);
            } else {
                throw new Error("Failed to generate valid questions from the news paragraph.");
            }

        } catch (e: any) {
            setError(e.message || 'An error occurred while fetching the news or generating questions.');
            setIsLoading(false);
        } finally {
            setIsLoadingQuestions(false);
        }
    };

    const handleAnswerChange = (questionIndex: number, answer: string) => {
        setUserAnswers(prev => ({ ...prev, [questionIndex]: answer }));
    };

    const handleCheckAnswers = () => {
        setShowResults(true);
    };

    const renderQuiz = () => (
        <div className="space-y-6">
            {questions.map((q, index) => {
                const userAnswer = userAnswers[index];
                const isCorrect = userAnswer === q.correctAnswer;
                return (
                <div key={index}>
                    <p className="font-semibold text-text-primary mb-4"><span className="text-brand-primary">{index + 1}.</span> {q.question}</p>
                    <div className="space-y-3">
                        {q.options.map(opt => {
                        const isSelected = userAnswer === opt.key;
                        const isCorrectOption = opt.key === q.correctAnswer;
                        let baseClass = "flex items-center p-3 rounded-md transition-all duration-200 border-2";
                        let stateClass;

                        if (showResults) {
                            stateClass = "border-transparent bg-gray-50 text-gray-500";
                            if (isCorrectOption) stateClass = "border-green-500 bg-green-100 text-green-800";
                            else if (isSelected && !isCorrectOption) stateClass = "border-red-500 bg-red-100 text-red-800";
                        } else {
                            if (isSelected) {
                                stateClass = "bg-brand-secondary border-brand-primary text-white";
                            } else {
                                stateClass = "border-transparent bg-gray-100 hover:bg-gray-200 cursor-pointer";
                            }
                        }

                        return (
                            <label key={opt.key} className={`${baseClass} ${stateClass}`}>
                            <input
                                type="radio"
                                name={`question-${index}`}
                                value={opt.key}
                                checked={isSelected}
                                onChange={() => handleAnswerChange(index, opt.key)}
                                disabled={showResults}
                                className="w-4 h-4 text-brand-primary bg-gray-100 border-gray-300 focus:ring-brand-primary ring-offset-bg-secondary hidden"
                            />
                            <span className={`font-bold mr-3 ${
                                showResults 
                                    ? (isCorrectOption ? 'text-green-600' : (isSelected ? 'text-red-600' : 'text-gray-500')) 
                                    : (isSelected ? 'text-white' : 'text-brand-primary')
                            }`}>{opt.key})</span>
                            <span>{opt.value}</span>
                            </label>
                        );
                        })}
                    </div>
                    {showResults && !isCorrect && (
                        <div className="mt-3 text-right">
                            <button
                                onClick={() => {
                                    const userAnswerValue = q.options.find(o => o.key === userAnswer)?.value || 'Boş bırakıldı';
                                    const correctAnswerValue = q.options.find(o => o.key === q.correctAnswer)?.value;
                                    const context = `Merhaba Onur, bu haber metni sorusunu yanlış yaptım. Bana nedenini açıklayabilir misin?\n\n---HABER METNİ---\n${paragraph}\n\n---SORU---\n${q.question}\n\nSeçenekler:\n${q.options.map(o => `${o.key}) ${o.value}`).join('\n')}\n\n---CEVAPLARIM---\nBenim Cevabım: ${userAnswer || 'Boş'}) ${userAnswerValue}\nDoğru Cevap: ${q.correctAnswer}) ${correctAnswerValue}`;
                                    onAskTutor(context);
                                }}
                                className="text-sm text-cyan-600 hover:text-cyan-700 hover:underline"
                            >
                                Neden yanlış yaptığımı Onur'a sor
                            </button>
                        </div>
                    )}
                </div>
            )})}
            {!showResults && questions.length > 0 && (
                <button onClick={handleCheckAnswers} className="mt-6 w-full bg-brand-secondary hover:bg-brand-primary text-white font-bold py-3 px-4 rounded-md transition duration-300">
                    Cevapları Kontrol Et
                </button>
            )}
        </div>
    );
    
    const renderSources = () => (
        <ul className="space-y-1 text-sm">
            {sources.map((source, index) => (
                <li key={index} className="flex items-start">
                    <span className="text-brand-primary mr-2 mt-1">&#10148;</span>
                    <a 
                        href={source.web.uri} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-text-secondary hover:text-brand-primary hover:underline break-all"
                        title={source.web.uri}
                    >
                        {source.web.title || new URL(source.web.uri).hostname}
                    </a>
                </li>
            ))}
        </ul>
    );

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-bg-secondary p-6 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold mb-2 text-text-primary">Etkileşimli Gündem</h2>
                <p className="mb-4 text-text-secondary">
                   Bir kategori seçerek güncel bir haber özeti alın ve yapay zeka tarafından oluşturulan sorularla anlama becerinizi test edin.
                </p>
                <div className="flex flex-wrap gap-3">
                    {newsCategories.map(category => (
                        <button
                            key={category}
                            onClick={() => handleGetNews(category)}
                            disabled={isLoading || isLoadingQuestions}
                            className={`px-4 py-2 rounded-md font-semibold transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                                topic === category && !(isLoading || isLoadingQuestions)
                                    ? 'bg-brand-primary text-white'
                                    : 'bg-gray-100 hover:bg-gray-200 text-text-secondary'
                            }`}
                        >
                            {category}
                        </button>
                    ))}
                </div>
            </div>

            {isLoading && <Loader />}
            <ErrorMessage message={error} />
            
            {paragraph && (
                <div className="bg-bg-secondary p-6 rounded-lg shadow-lg space-y-4">
                    <h3 className="text-2xl font-bold text-brand-primary">{topic} Haberleri</h3>
                    <p className="leading-relaxed text-justify text-text-primary">{paragraph}</p>
                </div>
            )}
            
            {isLoadingQuestions && <Loader />}

            {questions.length > 0 && (
                 <div className="bg-bg-secondary p-6 rounded-lg shadow-lg">
                    <div className="border-b border-gray-200 mb-4">
                        <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                             <button
                                onClick={() => setActiveView('quiz')}
                                className={`${
                                activeView === 'quiz'
                                    ? 'border-brand-primary text-brand-primary'
                                    : 'border-transparent text-text-secondary hover:text-text-primary hover:border-gray-300'
                                } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}
                            >
                                Anlama Soruları
                            </button>
                            <button
                                onClick={() => setActiveView('sources')}
                                className={`${
                                activeView === 'sources'
                                    ? 'border-brand-primary text-brand-primary'
                                    : 'border-transparent text-text-secondary hover:text-text-primary hover:border-gray-300'
                                } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}
                            >
                                Kaynaklar
                            </button>
                        </nav>
                    </div>
                    {activeView === 'quiz' ? renderQuiz() : renderSources()}
                 </div>
            )}
        </div>
    );
};

export default NewsReader;
