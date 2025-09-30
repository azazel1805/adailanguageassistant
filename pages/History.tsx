import React, { useState, useEffect } from 'react';
import { useHistory } from '../context/HistoryContext.tsx';
import { HistoryItem } from '../types.ts';
import AnalysisResultDisplay from '../components/AnalysisResultDisplay.tsx';

const History: React.FC = () => {
  const { history, clearHistory } = useHistory();
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);

  // If the selected item is no longer in the history (e.g., after clearing), deselect it.
  useEffect(() => {
    if (selectedItem && !history.find(item => item.id === selectedItem.id)) {
      setSelectedItem(null);
    }
  }, [history, selectedItem]);

  const handleClearHistory = () => {
    // The window.confirm() call is blocked in the sandboxed environment.
    // It has been removed. Clicking the button now immediately clears the history.
    setSelectedItem(null); 
    clearHistory();
  };

  if (history.length === 0) {
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-bold mb-2">Geçmiş Boş</h2>
        <p className="text-text-secondary">Henüz hiçbir soru analizi yapmadınız.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-text-primary">Analiz Geçmişi</h2>
        <button
          onClick={handleClearHistory}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md transition duration-300 text-sm">
          Geçmişi Temizle
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 bg-bg-secondary p-4 rounded-lg shadow-lg h-full max-h-[80vh] overflow-y-auto">
          <ul className="space-y-3">
            {history.map(item => (
              <li key={item.id}>
                <button
                  onClick={() => setSelectedItem(item)}
                  className={`w-full text-left p-3 rounded-md transition-colors duration-200 ${selectedItem?.id === item.id ? 'bg-brand-primary text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                >
                  <p className="font-semibold truncate text-sm">{item.question}</p>
                  <p className="text-xs opacity-70">{item.timestamp}</p>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="md:col-span-2 bg-bg-secondary p-6 rounded-lg shadow-lg max-h-[80vh] overflow-y-auto">
          {selectedItem ? (
            <div>
              <div className="mb-4">
                <h4 className="font-semibold text-text-secondary mb-2">Soru:</h4>
                <p className="bg-gray-100 p-3 rounded-md whitespace-pre-wrap">{selectedItem.question}</p>
              </div>
              <AnalysisResultDisplay result={selectedItem.analysis} />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-text-secondary text-lg">Detayları görmek için bir analiz seçin.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default History;
