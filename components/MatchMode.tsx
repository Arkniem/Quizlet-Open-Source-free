import React, { useState, useEffect, useMemo } from 'react';
import type { Flashcard } from '../types';

interface MatchItem {
  id: string;
  type: 'term' | 'definition';
  content: string;
  cardId: string;
}

interface MatchModeProps {
  cards: Flashcard[];
}

const shuffleArray = <T,>(array: T[]): T[] => {
  return [...array].sort(() => Math.random() - 0.5);
};

const PAIR_COUNT = 6;
const LOCAL_STORAGE_KEY = 'intellideck-match-best-time';

export const MatchMode: React.FC<MatchModeProps> = ({ cards }) => {
  const [gridItems, setGridItems] = useState<MatchItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<MatchItem | null>(null);
  const [matchedIds, setMatchedIds] = useState<string[]>([]);
  const [incorrectSelection, setIncorrectSelection] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [bestTime, setBestTime] = useState<number | null>(null);
  const [isNewRecord, setIsNewRecord] = useState(false);
  
  const setupGame = () => {
    const gameCards = shuffleArray(cards).slice(0, Math.min(PAIR_COUNT, Math.floor(cards.length)));
    const items: MatchItem[] = [];
    gameCards.forEach((card) => {
      items.push({ id: `${card.id}-term`, type: 'term', content: card.term, cardId: card.id });
      items.push({ id: `${card.id}-def`, type: 'definition', content: card.definition, cardId: card.id });
    });
    setGridItems(shuffleArray(items));
    setSelectedItem(null);
    setMatchedIds([]);
    setStartTime(null);
    setEndTime(null);
    setIsNewRecord(false);
  };
  
  useEffect(() => {
    const savedBestTime = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedBestTime) {
      setBestTime(parseFloat(savedBestTime));
    }
    setupGame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards]);

  const handleItemClick = (item: MatchItem) => {
    if (endTime || matchedIds.includes(item.cardId)) return;
    
    if(!startTime) setStartTime(Date.now());

    if (!selectedItem) {
      setSelectedItem(item);
    } else {
      if (selectedItem.cardId === item.cardId && selectedItem.type !== item.type) {
        // Match!
        setMatchedIds(prev => [...prev, item.cardId]);
        setSelectedItem(null);
      } else {
        // No match
        setIncorrectSelection(item.id);
        setTimeout(() => {
            setIncorrectSelection(null);
            setSelectedItem(null);
        }, 500);
      }
    }
  };

  useEffect(() => {
    if (gridItems.length > 0 && matchedIds.length > 0 && matchedIds.length === gridItems.length / 2) {
      const finalTime = Date.now();
      setEndTime(finalTime);
      
      if (startTime) {
        const duration = finalTime - startTime;
        if (bestTime === null || duration < bestTime) {
          setBestTime(duration);
          setIsNewRecord(true);
          localStorage.setItem(LOCAL_STORAGE_KEY, duration.toString());
        }
      }
    }
  }, [matchedIds, gridItems.length, startTime, bestTime]);

  const timer = useMemo(() => {
      if(!startTime) return '0.0';
      const now = endTime || Date.now();
      const duration = now > startTime ? now - startTime : 0;
      return (duration / 1000).toFixed(1);
  }, [startTime, endTime]);
  
  if (cards.length < 2) {
    return <div className="text-center text-slate-500 dark:text-slate-400">You need at least 2 cards in this set to play Match.</div>
  }

  if(endTime) {
    return (
       <div className="text-center bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg">
            <h2 className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">You Win!</h2>
            {isNewRecord && <p className="text-green-500 font-semibold mt-2 text-lg">New Record!</p>}
            <p className="text-5xl font-bold my-4 text-slate-800 dark:text-white">{timer}s</p>
            {bestTime && <p className="text-slate-500 dark:text-slate-400">Best time: {(bestTime / 1000).toFixed(1)}s</p>}
            <button onClick={setupGame} className="mt-8 px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition">
                Play Again
            </button>
        </div>
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center">
        <div className="text-4xl font-mono font-bold text-slate-700 dark:text-white mb-6 w-32 text-center bg-white dark:bg-slate-800 p-2 rounded-lg shadow-md">{timer}</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 w-full">
            {gridItems.map(item => {
                const isMatched = matchedIds.includes(item.cardId);
                const isSelected = selectedItem?.id === item.id;
                const isIncorrect = incorrectSelection === item.id || (isSelected && incorrectSelection);

                let itemClass = 'bg-white dark:bg-slate-700 hover:scale-105 hover:shadow-xl';
                if(isMatched) itemClass = 'opacity-0 scale-50 pointer-events-none';
                if(isSelected) itemClass = 'bg-indigo-400 dark:bg-indigo-600 ring-4 ring-indigo-300 scale-105 shadow-xl';
                if(isIncorrect) itemClass = 'bg-red-400 dark:bg-red-600 animate-shake';
                
                return (
                    <div
                        key={item.id}
                        onClick={() => handleItemClick(item)}
                        className={`h-32 flex items-center justify-center p-3 text-center rounded-lg shadow-md cursor-pointer transition-all duration-300 ${itemClass}`}
                    >
                        <p className="text-sm text-slate-800 dark:text-slate-200">{item.content}</p>
                    </div>
                )
            })}
        </div>
    </div>
  );
};