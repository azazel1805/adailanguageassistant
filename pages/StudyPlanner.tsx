

import React, { useState, useMemo } from 'react';
import { generateStudyPlan } from '../services/geminiService';
import { FullStudyPlan, Tab, StudyTask } from '../types';
import { useExamHistory } from '../context/ExamHistoryContext';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';

interface StudyPlannerProps {
    onNavigate: (tab: Tab) => void;
}

const StudyPlanner: React.FC<StudyPlannerProps> = ({ onNavigate }) => {
    const { performanceStats } = useExamHistory();
    const [targetDate, setTargetDate] = useState('');
    const [studyHours, setStudyHours] = useState(5);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [plan, setPlan] = useState<FullStudyPlan | null>(null);

    const today = useMemo(() => new Date().toISOString().split('T')[0], []);

    const handleGeneratePlan = async () => {
        if (!targetDate || studyHours < 1) {
            setError('Lütfen geçerli bir hedef tarih ve haftalık çalışma süresi girin.');
            return;
        }
        if (Object.keys(performanceStats).length === 0) {
            setError('Kişiselleştirilmiş bir plan oluşturmak için önce pratik araçlarını kullanarak veri oluşturmalısınız.');
            return;
        }

        setIsLoading(true);
        setError('');
        setPlan(null);

        try {
            const resultText = await generateStudyPlan(performanceStats, targetDate, studyHours);
            const resultJson: FullStudyPlan = JSON.parse(resultText);
            setPlan(resultJson);
        } catch (e: any) {
            setError(e.message || 'Çalışma planı oluşturulurken bir hata oluştu.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleTaskClick = (task: StudyTask) => {
        if (task.action) {
            const { navigateTo } = task.action;
            onNavigate(navigateTo);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-bg-secondary p-6 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold mb-2 text-text-primary">Akıllı Çalışma Planlayıcısı</h2>
                <p className="mb-4 text-text-secondary">
                    Hedeflerinizi ve performans verilerinizi analiz ederek size özel bir çalışma planı oluşturalım.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="target-date" className="block text-sm font-medium text-text-secondary mb-1">Hedef Tarih</label>
                        <input
                            type="date"
                            id="target-date"
                            value={targetDate}
                            min={today}
                            onChange={(e) => setTargetDate(e.target.value)}
                            className="w-full p-2 bg-gray-50 border border-gray-300 rounded-md focus:ring-2 focus:ring-adai-primary focus:outline-none text-text-primary"
                        />
                    </div>
                    <div>
                        <label htmlFor="study-hours" className="block text-sm font-medium text-text-secondary mb-1">Haftalık Çalışma Süresi (saat)</label>
                        <input
                            type="number"
                            id="study-hours"
                            min="1"
                            max="40"
                            value={studyHours}
                            onChange={(e) => setStudyHours(parseInt(e.target.value))}
                            className="w-full p-2 bg-gray-50 border border-gray-300 rounded-md focus:ring-2 focus:ring-adai-primary focus:outline-none text-text-primary"
                        />
                    </div>
                </div>
                <button
                    onClick={handleGeneratePlan}
                    disabled={isLoading}
                    className="mt-4 w-full bg-adai-primary hover:bg-adai-secondary text-white font-bold py-3 px-4 rounded-md transition duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center"
                >
                    {isLoading ? 'Plan Oluşturuluyor...' : 'Çalışma Planı Oluştur'}
                </button>
            </div>

            {isLoading && <Loader />}
            
            <ErrorMessage message={error} />

            {plan && (
                <div className="bg-bg-secondary p-6 rounded-lg shadow-lg space-y-6">
                    <div>
                        <h3 className="text-xl font-bold text-adai-primary">Kişisel Çalışma Planın</h3>
                        <p className="mt-2 text-sm text-text-secondary bg-gray-100 p-3 rounded-md">{plan.overallRecommendation}</p>
                    </div>

                    <div className="space-y-8">
                        {plan.weeks.map(week => (
                            <div key={week.weekNumber} className="border-t border-gray-200 pt-4">
                                <h4 className="text-lg font-bold text-text-primary">
                                    {week.weekNumber}. Hafta: <span className="text-adai-primary">{week.weeklyFocus}</span>
                                </h4>
                                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {week.dailyTasks && week.dailyTasks.map(day => (
                                        <div key={day.day} className="bg-gray-100 p-4 rounded-lg">
                                            <h5 className="font-bold text-text-secondary border-b border-gray-200 pb-2 mb-2">{day.day}</h5>
                                            <ul className="space-y-2">
                                                {day.tasks && day.tasks.map((task, taskIndex) => (
                                                    <li key={taskIndex} className="text-sm">
                                                        {task.action ? (
                                                            <button 
                                                                onClick={() => handleTaskClick(task)}
                                                                className="text-left text-blue-600 hover:text-blue-800 hover:underline"
                                                            >
                                                                - {task.description} &rarr;
                                                            </button>
                                                        ) : (
                                                            <span>- {task.description}</span>
                                                        )}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudyPlanner;
