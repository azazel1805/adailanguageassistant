import React from 'react';
import { AnalysisResult } from '../types.ts';

const AnalysisResultDisplay: React.FC<{ result: AnalysisResult }> = ({ result }) => {
    
    const renderValue = (value: any) => {
      if (typeof value === 'object' && value !== null) {
        return JSON.stringify(value);
      }
      return String(value);
    }

    return (
        <div className="space-y-4 mt-4 border-t border-gray-200 pt-4">
            <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-lg font-bold text-brand-primary mb-3">Analiz Özeti</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div><strong className="text-text-secondary">Soru Tipi:</strong> {result.soruTipi || 'Belirtilmemiş'}</div>
                    <div><strong className="text-text-secondary">Konu:</strong> {result.konu || 'Belirtilmemiş'}</div>
                    <div><strong className="text-text-secondary">Zorluk Seviyesi:</strong> {result.zorlukSeviyesi || 'Belirtilmemiş'}</div>
                    <div className="sm:col-span-2"><strong className="text-text-secondary">Doğru Cevap:</strong> <span className="font-bold text-green-600">{result.dogruCevap || 'Belirtilmemiş'}</span></div>
                </div>
            </div>

            {result.analiz && (
                <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-md font-semibold text-brand-primary mb-2">Detaylı Analiz Adımları</h4>
                    <ul className="space-y-2 text-sm text-text-primary">
                        {Object.entries(result.analiz).map(([key, value]) => (
                            <li key={key} className="flex items-start">
                                <span className="text-brand-primary mr-2 mt-1">&#10148;</span>
                                <span><strong className="font-semibold capitalize">{key.replace(/_/g, ' ')}:</strong> {renderValue(value)}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            
            <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-md font-semibold text-brand-primary mb-2">Kapsamlı Açıklama</h4>
                <p className="text-sm">{result.detayliAciklama || 'Açıklama bulunamadı.'}</p>
            </div>

            {result.digerSecenekler && result.digerSecenekler.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-md font-semibold text-brand-primary mb-2">Diğer Seçeneklerin Analizi</h4>
                    <div className="space-y-3">
                        {result.digerSecenekler.map((opt, index) => (
                            <div key={index} className="p-2 bg-gray-100 rounded">
                                <p className="text-sm"><strong className="font-bold text-red-600">{opt.secenek}:</strong> {opt.aciklama}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AnalysisResultDisplay;
