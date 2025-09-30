

import React, { useState } from 'react';
import { analyzeReadingPassage } from '../services/geminiService';
import { ReadingAnalysisResult } from '../types';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';
import { useChallenge } from '../context/ChallengeContext';
import { useVocabulary } from '../context/VocabularyContext';
import { useExamHistory } from '../context/ExamHistoryContext';

interface ReadingPracticeProps {
    onAskTutor: (context: string) => void;
}

const ReadingPractice: React.FC<ReadingPracticeProps> = ({ onAskTutor }) => {
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<ReadingAnalysisResult | null>(null);
  const [userAnswers, setUserAnswers] = useState<{ [key: number]: string }>({});
  const [showResults, setShowResults] = useState(false);
  const { trackAction } = useChallenge();
  const { addWord, removeWord, isWordSaved } = useVocabulary();
  const { trackSingleQuestionResult } = useExamHistory();

  const handleToggleSaveWord = (word: string, meaning: string) => {
    if (isWordSaved(word)) {
      removeWord(word);
    } else {
      addWord(word, meaning);
    }
  };


  const handleAnalyze = async () => {
    if (!text.trim()) {
      setError('Lütfen analiz edilecek bir metin girin.');
      return;
    }
    setIsLoading(true);
    setError('');
    setResult(null);
    setUserAnswers({});
    setShowResults(false);
    try {
      const resultText = await analyzeReadingPassage(text);
      const resultJson: ReadingAnalysisResult = JSON.parse(resultText);
      setResult(resultJson);
      trackAction('reading');
    } catch (e: any) {
      setError(e.message || 'Metin analizi sırasında bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerChange = (questionIndex: number, answer: string) => {
    setUserAnswers(prev => ({ ...prev, [questionIndex]: answer }));
  };

  const handleCheckAnswers = () => {
    setShowResults(true);
    if (result) {
      result.questions.forEach((q, index) => {
        const isCorrect = userAnswers[index] === q.correctAnswer;
        trackSingleQuestionResult('Okuma Anlama Analizi', isCorrect);
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-bg-secondary p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-4 text-text-primary">Okuma Anlama Analizi</h2>
        <p className="mb-4 text-text-secondary">
          Bir İngilizce okuma parçasını analiz ederek anlama becerilerinizi test edin. Bu araç, metni özetler, anahtar kelimeleri çıkarır ve metinle ilgili sorular oluşturur.
        </p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="İngilizce metni buraya yapıştırın..."
          className="w-full h-64 p-3 bg-gray-50 border border-gray-300 rounded-md focus:ring-2 focus:ring-adai-primary focus:outline-none text-text-primary resize-y"
          disabled={isLoading}
        />
        <button
          onClick={handleAnalyze}
          disabled={isLoading}
          className="mt-4 w-full bg-adai-primary hover:bg-adai-secondary text-white font-bold py-3 px-4 rounded-md transition duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isLoading ? 'Analiz Ediliyor...' : 'Metni Analiz Et'}
        </button>
      </div>

      {isLoading && <Loader />}
      <ErrorMessage message={error} />

      {result && (
        <div className="mt-6 space-y-6">
          {/* Summary Section */}
          <div className="bg-bg-secondary p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-bold text-adai-primary mb-3">Türkçe Özet</h3>
            <p className="text-text-secondary">{result.summary}</p>
          </div>

          {/* Vocabulary Section */}
          <div className="bg-bg-secondary p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-bold text-adai-primary mb-3">Anahtar Kelimeler</h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {result.vocabulary.map((item, index) => (
                <li key={index} className="bg-gray-100 p-3 rounded-md flex justify-between items-center">
                  <div>
                    <span className="font-bold text-text-primary">{item.word}:</span>
                    <span className="text-text-secondary ml-2">{item.meaning}</span>
                  </div>
                  <button
                    onClick={() => handleToggleSaveWord(item.word, item.meaning)}
                    className="text-xl p-2 rounded-full hover:bg-gray-200 transition-colors"
                    title={isWordSaved(item.word) ? 'Kelimeyi Kaldır' : 'Kelimeyi Kaydet'}
                  >
                    {isWordSaved(item.word) ? '✅' : '🔖'}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Questions Section */}
          <div className="bg-bg-secondary p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-bold text-adai-primary mb-3">Anlama Soruları</h3>
            <div className="space-y-6">
              {result.questions.map((q, index) => {
                const userAnswer = userAnswers[index];
                const isCorrect = userAnswer === q.correctAnswer;
                return (
                    <div key={index}>
                      <p className="font-semibold text-text-primary mb-4 whitespace-pre-wrap"><span className="text-adai-primary">{index + 1}.</span> {q.question}</p>
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
                                  stateClass = "bg-adai-secondary border-adai-primary text-white";
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
                                className="w-4 h-4 text-adai-primary bg-gray-100 border-gray-300 focus:ring-adai-primary ring-offset-bg-secondary hidden"
                              />
                              <span className={`font-bold mr-3 ${
                                  showResults 
                                      ? (isCorrectOption ? 'text-green-600' : (isSelected ? 'text-red-600' : 'text-gray-500')) 
                                      : (isSelected ? 'text-white' : 'text-adai-primary')
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
                                    const context = `Merhaba Onur, bu okuma parçası sorusunu yanlış yaptım. Bana nedenini açıklayabilir misin?\n\n---METİN---\n${text}\n\n---SORU---\n${q.question}\n\nSeçenekler:\n${q.options.map(o => `${o.key}) ${o.value}`).join('\n')}\n\n---CEVAPLARIM---\nBenim Cevabım: ${userAnswer || 'Boş'}) ${userAnswerValue}\nDoğru Cevap: ${q.correctAnswer}) ${correctAnswerValue}`;
                                    onAskTutor(context);
                                }}
                                className="text-sm text-cyan-600 hover:text-cyan-700 hover:underline"
                            >
                                Neden yanlış yaptığımı Onur'a sor
                            </button>
                        </div>
                      )}
                    </div>
                );
              })}
            </div>
            {!showResults && result.questions.length > 0 && (
              <button onClick={handleCheckAnswers} className="mt-6 w-full bg-adai-secondary hover:bg-adai-primary text-white font-bold py-3 px-4 rounded-md transition duration-300">
                Cevapları Kontrol Et
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReadingPractice;
