
import React, { useState, useEffect } from 'react';
import { generateListeningTask } from '../services/geminiService';
import { ListeningTask } from '../types';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';
import { useChallenge } from '../context/ChallengeContext';
import { DIFFICULTY_LEVELS } from '../constants';
import { SpeakerIcon, StopIcon } from '../components/icons/Icons';
import { useExamHistory } from '../context/ExamHistoryContext';

interface ListeningPracticeProps {
    onAskTutor: (context: string) => void;
}

const ListeningPractice: React.FC<ListeningPracticeProps> = ({ onAskTutor }) => {
  const [difficulty, setDifficulty] = useState(DIFFICULTY_LEVELS[1]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [task, setTask] = useState<ListeningTask | null>(null);
  const [userAnswers, setUserAnswers] = useState<{ [key: number]: string }>({});
  const [showResults, setShowResults] = useState(false);
  const { trackAction } = useChallenge();
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const { trackSingleQuestionResult } = useExamHistory();

  useEffect(() => {
    const loadVoices = () => setVoices(window.speechSynthesis.getVoices());
    window.speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices();
    return () => { 
        window.speechSynthesis.onvoiceschanged = null; 
        window.speechSynthesis.cancel(); // Stop any speech on unmount
    };
  }, []);

  const handleGenerateTask = async () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsLoading(true);
    setError('');
    setTask(null);
    setUserAnswers({});
    setShowResults(false);
    try {
      const resultText = await generateListeningTask(difficulty);
      const resultJson: ListeningTask = JSON.parse(resultText);
      setTask(resultJson);
      trackAction('listening');
    } catch (e: any) {
      setError(e.message || 'Dinleme görevi oluşturulurken bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayAudio = () => {
    if (!task?.script || isSpeaking) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(task.script);
    const femaleVoice = voices.find(voice => voice.lang === 'en-US' && /female/i.test(voice.name));
    utterance.voice = femaleVoice || voices.find(voice => voice.lang === 'en-US') || null;
    utterance.lang = 'en-US';

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = (e: SpeechSynthesisErrorEvent) => {
        // Don't show an error message if the speech was simply cancelled by the user.
        if (e.error !== 'canceled' && e.error !== 'interrupted') {
            console.error("Speech synthesis error:", e.error);
            setError("Sorry, the audio could not be played. Please try again.");
        }
        setIsSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const handleStopAudio = () => {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
  }

  const handleAnswerChange = (questionIndex: number, answer: string) => {
    setUserAnswers(prev => ({ ...prev, [questionIndex]: answer }));
  };

  const handleCheckAnswers = () => {
    setShowResults(true);
    if (task) {
      task.questions.forEach((q, index) => {
        const isCorrect = userAnswers[index] === q.correctAnswer;
        trackSingleQuestionResult('Dinleme Pratiği', isCorrect);
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-bg-secondary p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-4 text-text-primary">Dinleme Pratiği</h2>
        <p className="mb-4 text-text-secondary">
          Zorluk seviyesi seçin ve yapay zekanın sizin için bir dinleme görevi oluşturmasını sağlayın.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex-1 w-full">
                <label className="block text-sm font-medium text-text-secondary mb-1">Zorluk Seviyesi</label>
                <select 
                    value={difficulty} 
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full p-3 bg-gray-50 border border-gray-300 rounded-md focus:ring-2 focus:ring-adai-primary focus:outline-none text-text-primary"
                    disabled={isLoading}
                >
                    {DIFFICULTY_LEVELS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
            </div>
            <button
              onClick={handleGenerateTask}
              disabled={isLoading}
              className="w-full sm:w-auto mt-2 sm:mt-0 self-end bg-adai-primary hover:bg-adai-secondary text-white font-bold py-3 px-6 rounded-md transition duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Oluşturuluyor...' : 'Görev Oluştur'}
            </button>
        </div>
      </div>

      {isLoading && <Loader />}
      <ErrorMessage message={error} />

      {task && (
        <div className="mt-6 space-y-6">
          <div className="bg-bg-secondary p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-bold text-adai-primary mb-3">Dinleme Metni</h3>
            <div className="flex items-center gap-4 bg-gray-100 p-4 rounded-md">
                {isSpeaking ? (
                    <button 
                        onClick={handleStopAudio}
                        className="text-red-500 hover:text-red-600 transition-colors text-3xl p-2 bg-gray-200 rounded-full"
                        title="Durdur"
                    >
                        <StopIcon />
                    </button>
                ) : (
                    <button 
                        onClick={handlePlayAudio}
                        className="text-adai-primary hover:text-adai-secondary transition-colors text-3xl p-2 bg-gray-200 rounded-full"
                        title="Metni Dinle"
                    >
                        <SpeakerIcon />
                    </button>
                )}
                <p className="text-text-secondary italic">{isSpeaking ? 'Metin okunuyor...' : 'Metni dinlemek için oynat butonuna tıklayın.'}</p>
            </div>
          </div>
          
          <div className="bg-bg-secondary p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-bold text-adai-primary mb-3">Anlama Soruları</h3>
            <div className="space-y-6">
              {task.questions.map((q, index) => {
                const userAnswer = userAnswers[index];
                const isCorrect = userAnswer === q.correctAnswer;
                return (
                    <div key={index}>
                      <p className="font-semibold text-text-primary mb-4"><span className="text-adai-primary">{index + 1}.</span> {q.question}</p>
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
                                    const context = `Merhaba Onur, bu dinleme sorusunu yanlış yaptım. Bana nedenini açıklayabilir misin?\n\n---DİNLEME METNİ---\n${task.script}\n\n---SORU---\n${q.question}\n\nSeçenekler:\n${q.options.map(o => `${o.key}) ${o.value}`).join('\n')}\n\n---CEVAPLARIM---\nBenim Cevabım: ${userAnswer || 'Boş'}) ${userAnswerValue}\nDoğru Cevap: ${q.correctAnswer}) ${correctAnswerValue}`;
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
            {!showResults && task.questions.length > 0 && (
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

export default ListeningPractice;
