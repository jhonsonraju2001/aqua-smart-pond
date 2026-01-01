import { useState, useEffect, useCallback } from 'react';

interface SensorHistoryEntry {
  ph: number;
  dissolvedOxygen: number;
  temperature: number;
  timestamp: Date;
}

const MAX_HISTORY = 10;

export function useSensorHistory(pondId: string) {
  const [history, setHistory] = useState<SensorHistoryEntry[]>([]);

  // Generate initial history on mount
  useEffect(() => {
    const initialHistory: SensorHistoryEntry[] = [];
    const baseValues = { ph: 7.2, do: 6.5, temp: 28 };
    
    for (let i = 9; i >= 0; i--) {
      initialHistory.push({
        ph: +(baseValues.ph + (Math.random() - 0.5) * 0.4).toFixed(2),
        dissolvedOxygen: +(baseValues.do + (Math.random() - 0.5) * 0.8).toFixed(2),
        temperature: +(baseValues.temp + (Math.random() - 0.5) * 1).toFixed(1),
        timestamp: new Date(Date.now() - i * 5000),
      });
    }
    
    setHistory(initialHistory);
  }, [pondId]);

  const addReading = useCallback((reading: Omit<SensorHistoryEntry, 'timestamp'>) => {
    setHistory(prev => {
      const newHistory = [...prev, { ...reading, timestamp: new Date() }];
      if (newHistory.length > MAX_HISTORY) {
        return newHistory.slice(-MAX_HISTORY);
      }
      return newHistory;
    });
  }, []);

  return {
    history,
    addReading,
    phHistory: history.map(h => h.ph),
    doHistory: history.map(h => h.dissolvedOxygen),
    tempHistory: history.map(h => h.temperature),
  };
}
