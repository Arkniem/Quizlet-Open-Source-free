
import React, { useState, useEffect, useCallback } from 'react';
import type { Flashcard } from '../types';
import { StarIcon } from './icons';

interface FlashcardsModeProps {
  cards: Flashcard[];
  onToggleStar: (cardId: string) => void;
}

export const FlashcardsMode: React.FC<FlashcardsModeProps> = ({ cards, onToggleStar }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [shuffledCards, setShuffledCards] = useState([...cards]);

  const shuffleCards = useCallback(() => {
    const newShuffledCards = [...cards].sort(() => Math.random() - 0.5);
    setShuffledCards(newShuffledCards);
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [cards]);
  
  useEffect(() => {
     shuffleCards();
  }, [cards, shuffleCards]);

  useEffect(() => {
    if (cards.length > 0 && currentIndex >= cards.length) {
      setCurrentIndex(0);
    }
  }, [cards, currentIndex]);

  const handleNext = () => {
    setIsFlipped(false);
    setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % shuffledCards.length);
    }, 150); // wait for flip back animation
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setTimeout(() => {
        setCurrentIndex((prev) => (prev - 1 + shuffledCards.length) % shuffledCards.length);
    }, 150);
  };
  
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') {
        handleNext();
      } else if (event.key === 'ArrowLeft') {
        handlePrev();
      } else if (event.key === ' ') {
        event.preventDefault();
        setIsFlipped(f => !f);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [shuffledCards.length]);

  if(shuffledCards.length === 0){
    return <div className="text-center text-slate-500 dark:text-slate-400">No cards to display. Try changing the filter to "All Cards".</div>
  }

  const currentCard = shuffledCards[currentIndex];

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col items-center">
      <div className="w-full h-80 perspective-1000">
        <div
          className={`relative w-full h-full transform-style-preserve-3d transition-transform duration-700 ease-in-out ${isFlipped ? 'rotate-y-180' : ''}`}
          onClick={() => setIsFlipped(!isFlipped)}
        >
          <div className="absolute w-full h-full backface-hidden bg-white dark:bg-slate-800 rounded-2xl shadow-xl flex items-center justify-center p-8 cursor-pointer">
            <button 
                onClick={(e) => { e.stopPropagation(); onToggleStar(currentCard.id); }}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-yellow-400"
                aria-label={currentCard?.isStarred ? "Unstar card" : "Star card"}
            >
                <StarIcon isFilled={!!currentCard?.isStarred} />
            </button>
            <p className="text-3xl text-center font-semibold text-slate-800 dark:text-white">{currentCard?.term}</p>
          </div>
          <div className="absolute w-full h-full backface-hidden rotate-y-180 bg-indigo-500 dark:bg-indigo-700 rounded-2xl shadow-xl flex items-center justify-center p-8 cursor-pointer">
             <button 
                onClick={(e) => { e.stopPropagation(); onToggleStar(currentCard.id); }}
                className="absolute top-4 right-4 p-2 text-white hover:text-yellow-300"
                aria-label={currentCard?.isStarred ? "Unstar card" : "Star card"}
            >
                <StarIcon isFilled={!!currentCard?.isStarred} />
            </button>
            <p className="text-xl text-center text-white">{currentCard?.definition}</p>
          </div>
        </div>
      </div>

      <div className="text-center my-4 text-slate-500 dark:text-slate-400 font-medium">
        Card {currentIndex + 1} of {shuffledCards.length}
      </div>

      <div className="flex items-center justify-between w-full max-w-md mt-2">
        <button onClick={handlePrev} className="px-6 py-3 bg-white dark:bg-slate-700 text-slate-700 dark:text-white rounded-lg shadow hover:bg-slate-100 dark:hover:bg-slate-600 transition">Previous</button>
        <button onClick={shuffleCards} className="px-6 py-3 bg-white dark:bg-slate-700 text-slate-700 dark:text-white rounded-lg shadow hover:bg-slate-100 dark:hover:bg-slate-600 transition">Shuffle</button>
        <button onClick={handleNext} className="px-6 py-3 bg-white dark:bg-slate-700 text-slate-700 dark:text-white rounded-lg shadow hover:bg-slate-100 dark:hover:bg-slate-600 transition">Next</button>
      </div>
    </div>
  );
};
