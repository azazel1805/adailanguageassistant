
import React, { useState, useMemo } from 'react';
import { useExamHistory } from '../context/ExamHistoryContext';
import { PerformanceStats } from '../types';

const SKILL_CATEGORIES = {
    'Okuduğunu Anlama': ['Paragraf Sorusu', 'Akışı Bozan Cümle Sorusu', 'Paragraf Tamamlama Sorusu', 'Okuma Anlama Analizi'],
    'Gramer ve Kelime': ['Kelime Sorusu', 'Dil Bilgisi Sorusu', 'Cloze Test Sorusu'],
    'Cümle Yapısı': ['Cümle Tamamlama Sorusu', 'Restatement (Yeniden Yazma) Sorusu'],
    'Çeviri Becerileri': ['Çeviri Sorusu'],
    'Dinlediğini Anlama': ['Dinleme Pratiği'],
    'Diyalog': ['Diyalog Tamamlama Sorusu'],
};

const SkillTree: React.FC = () => {
    const { performanceStats } = useExamHistory();
    const [selectedSkill, setSelectedSkill] = useState<string | null>(null);

    const aggregatedStats = useMemo(() => {
        const newStats: PerformanceStats = {};
        for (const category in SKILL_CATEGORIES) {
            const types = SKILL_CATEGORIES[category as keyof typeof SKILL_CATEGORIES];
            newStats[category] = { correct: 0, total: 0 };
            for (const type of types) {
                if (performanceStats[type]) {
                    newStats[category].correct += performanceStats[type].correct;
                    newStats[category].total += performanceStats[type].total;
                }
            }
        }
        return newStats;
    }, [performanceStats]);

    const getProficiencyStyle = (skill: string) => {
        const data = aggregatedStats[skill];
        if (!data || data.total === 0) {
            return {
                level: 'Derecelenmedi',
                bgColor: 'bg-gray-100 dark:bg-slate-700',
                borderColor: 'border-gray-300 dark:border-slate-600',
                textColor: 'text-gray-500 dark:text-slate-400',
                progressColor: 'bg-gray-300 dark:bg-slate-500',
                percentage: 0,
                description: 'Bu beceride henüz hiç soru çözmedin. İlgili pratik araçlarını kullanarak bu becerini geliştirmeye başlayabilirsin.'
            };
        }
        const percentage = (data.correct / data.total) * 100;
        const total = data.total;

        let levelTitle = '';
        if (total >= 50) levelTitle = 'Usta';
        else if (total >= 25) levelTitle = 'Deneyimli';
        else if (total >= 10) levelTitle = 'Azimli';
        else levelTitle = 'Çaylak';

        if (percentage >= 80) {
            return {
                level: levelTitle,
                bgColor: 'bg-green-100 dark:bg-green-900/20',
                borderColor: 'border-green-400',
                textColor: 'text-green-700 dark:text-green-300',
                progressColor: 'bg-green-400',
                percentage,
                description: `Bu becerideki ustalığın etkileyici! Yüksek başarı oranınla bu konuya hakim olduğunu gösteriyorsun.`
            };
        }
        if (percentage >= 50) {
            return {
                level: levelTitle,
                bgColor: 'bg-blue-100 dark:bg-blue-900/20',
                borderColor: 'border-blue-400',
                textColor: 'text-blue-600 dark:text-blue-300',
                progressColor: 'bg-blue-400',
                percentage,
                description: `Bu beceride istikrarlı bir ilerleme kaydediyorsun. Zayıf noktalarını belirleyip pratik yaparak bir sonraki seviyeye geçebilirsin.`
            };
        }
        return {
            level: levelTitle,
            bgColor: 'bg-orange-100 dark:bg-orange-900/20',
            borderColor: 'border-orange-400',
            textColor: 'text-orange-700 dark:text-orange-300',
            progressColor: 'bg-orange-400',
            percentage,
            description: `Bu becerinin temellerini atıyorsun. Pratiğe devam ettikçe hem soru sayın artacak hem de başarı oranın yükselecektir.`
        };
    };
    
    const selectedSkillData = selectedSkill ? aggregatedStats[selectedSkill] : null;
    const selectedSkillStyle = selectedSkill ? getProficiencyStyle(selectedSkill) : null;

    if (Object.keys(performanceStats).length === 0) {
        return (
            <div className="text-center py-10 bg-bg-secondary rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold mb-2">Yetenek Ağacınız Henüz Boş</h2>
                <p className="text-text-secondary">Performansınızı analiz etmek ve yetenek ağacınızı oluşturmak için lütfen pratik araçlarını kullanın.</p>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div>
                <h2 className="text-3xl font-bold text-text-primary">Yetenek Ağacı</h2>
                <p className="text-text-secondary mt-1">Genel İngilizce becerilerinize ve uygulama performansınıza genel bir bakış.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {Object.keys(SKILL_CATEGORIES).map(skill => {
                    const style = getProficiencyStyle(skill);
                    const data = aggregatedStats[skill] || { correct: 0, total: 0 };
                    if (data.total === 0) return null; // Don't show skills with no data
                    return (
                        <div
                            key={skill}
                            onClick={() => setSelectedSkill(skill)}
                            className={`p-4 rounded-lg shadow-md border-l-4 cursor-pointer transition-transform transform hover:scale-105 ${style.bgColor} ${style.borderColor}`}
                        >
                            <div className="flex justify-between items-center">
                                <h3 className={`font-bold text-sm truncate pr-2 ${style.textColor}`}>{skill}</h3>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${style.progressColor} text-white`}>{style.level}</span>
                            </div>
                            <div className="text-center my-4">
                                <span className={`text-3xl font-bold ${style.textColor}`}>{data.correct}</span>
                                <span className="text-lg text-gray-500"> / {data.total}</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-slate-600 rounded-full h-2.5">
                                <div className={`${style.progressColor} h-2.5 rounded-full`} style={{ width: `${style.percentage}%` }}></div>
                            </div>
                        </div>
                    );
                })}
            </div>
            
            {/* Modal for Skill Details */}
            {selectedSkill && selectedSkillData && selectedSkillStyle && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4" 
                    onClick={() => setSelectedSkill(null)}
                >
                    <div 
                        className="bg-bg-secondary rounded-lg shadow-xl w-full max-w-md" 
                        onClick={e => e.stopPropagation()}
                    >
                        <div className={`p-4 rounded-t-lg border-b-4 ${selectedSkillStyle.bgColor} ${selectedSkillStyle.borderColor}`}>
                            <div className="flex justify-between items-center">
                                <h3 className={`text-xl font-bold ${selectedSkillStyle.textColor}`}>{selectedSkill}</h3>
                                <button onClick={() => setSelectedSkill(null)} className="text-text-secondary text-2xl hover:text-text-primary">&times;</button>
                            </div>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="text-center">
                                <span className={`text-sm font-bold px-3 py-1 rounded-full ${selectedSkillStyle.progressColor} text-white`}>
                                    Seviye: {selectedSkillStyle.level}
                                </span>
                            </div>
                            <p className="text-sm text-text-secondary text-center bg-gray-50 dark:bg-slate-700 p-3 rounded-md">
                                {selectedSkillStyle.description}
                            </p>
                            <div className="grid grid-cols-2 gap-4 text-center">
                                <div>
                                    <p className="text-sm text-text-secondary">Toplam Çözülen</p>
                                    <p className="text-2xl font-bold">{selectedSkillData.total}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-text-secondary">Doğru Sayısı</p>
                                    <p className="text-2xl font-bold text-green-600">{selectedSkillData.correct}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-text-secondary">Yanlış Sayısı</p>
                                    <p className="text-2xl font-bold text-red-600">{selectedSkillData.total - selectedSkillData.correct}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-text-secondary">Başarı Oranı</p>
                                    <p className={`text-2xl font-bold ${selectedSkillStyle.textColor}`}>
                                        {selectedSkillStyle.percentage.toFixed(1)}%
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SkillTree;
