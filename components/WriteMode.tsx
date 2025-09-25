import React, { useState, useEffect, useRef } from 'react';
import type { Flashcard } from '../types';

interface WriteModeProps {
  cards: Flashcard[];
}

const shuffleArray = <T,>(array: T[]): T[] => {
  return [...array].sort(() => Math.random() - 0.5);
};

// Calculates the Levenshtein distance between two strings (number of edits to change one to the other).
const calculateLevenshteinDistance = (a: string, b: string): number => {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));

  for (let i = 0; i <= a.length; i++) {
    matrix[0][i] = i;
  }
  for (let j = 0; j <= b.length; j++) {
    matrix[j][0] = j;
  }

  for (let j = 1; j <= b.length; j++) {
    for (let i = 1; i <= a.length; i++) {
      const substitutionCost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + substitutionCost // substitution
      );
    }
  }

  return matrix[b.length][a.length];
};


export const WriteMode: React.FC<WriteModeProps> = ({ cards }) => {
  const [remainingCards, setRemainingCards] = useState<Flashcard[]>([]);
  const [incorrectlyAnswered, setIncorrectlyAnswered] = useState<Flashcard[]>([]);
  const [correctlyAnswered, setCorrectlyAnswered] = useState<Flashcard[]>([]);
  
  const [currentCard, setCurrentCard] = useState<Flashcard | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [answerState, setAnswerState] = useState<'unanswered' | 'correct' | 'incorrect'>('unanswered');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const newSessionCards = shuffleArray(cards);
    setRemainingCards(newSessionCards);
    setCurrentCard(newSessionCards[0] || null);
    setIncorrectlyAnswered([]);
    setCorrectlyAnswered([]);
    setInputValue('');
    setAnswerState('unanswered');
  }, [cards]);

  const nextCard = () => {
    setInputValue('');
    setAnswerState('unanswered');
    
    const nextQueue = remainingCards.length > 1 ? remainingCards.slice(1) : shuffleArray(incorrectlyAnswered);
    
    if (remainingCards.length > 1) {
       setRemainingCards(remainingCards.slice(1));
    } else {
       setRemainingCards(shuffleArray(incorrectlyAnswered));
       setIncorrectlyAnswered([]);
    }

    setCurrentCard(nextQueue[0] || null);
    inputRef.current?.focus();
  };

  const handleAnswerSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (answerState !== 'unanswered' || !currentCard || !inputValue.trim()) return;

    const userAnswer = inputValue.trim().toLowerCase();
    const correctAnswer = currentCard.term.trim().toLowerCase();

    let isCorrect = userAnswer === correctAnswer;

    // If not an exact match, check for typos using Levenshtein distance
    if (!isCorrect) {
      const distance = calculateLevenshteinDistance(userAnswer, correctAnswer);
      // Allow 1 typo for short words, 2 for longer words
      const threshold = correctAnswer.length > 7 ? 2 : 1;
      if (distance <= threshold) {
        isCorrect = true;
      }
    }

    if (isCorrect) {
      setAnswerState('correct');
      setCorrectlyAnswered(prev => [...prev, currentCard]);
      setTimeout(nextCard, 1200);
    } else {
      setAnswerState('incorrect');
      setIncorrectlyAnswered(prev => [...prev, currentCard]);
      setTimeout(nextCard, 2500);
    }
  };
  
  useEffect(() => {
    if(answerState === 'unanswered'){
        inputRef.current?.focus();
    }
  }, [currentCard, answerState]);

  if (cards.length === 0) {
    return <div className="text-center text-slate-500 dark:text-slate-400">No cards to study in this mode.</div>;
  }
  
  if (!currentCard) {
      return (
         <div className="text-center bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg">
            <h2 className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">Set Complete!</h2>
            <p className="text-slate-600 dark:text-slate-300 mt-2 text-lg">You've written all the terms correctly.</p>
            <p className="text-5xl font-bold my-6 text-slate-800 dark:text-white">{cards.length} / {cards.length}</p>
            <button onClick={() => {
                const newSessionCards = shuffleArray(cards);
                setRemainingCards(newSessionCards);
                setCurrentCard(newSessionCards[0] || null);
                setIncorrectlyAnswered([]);
                setCorrectlyAnswered([]);
            }} className="mt-8 px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition">
                Start Over
            </button>
        </div>
      )
  }
  
  const totalAnswered = correctlyAnswered.length + incorrectlyAnswered.length;
  const progress = (correctlyAnswered.length / cards.length) * 100;

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="mb-4">
          <div className="flex justify-between text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">
            <span>Progress</span>
            <span>{correctlyAnswered.length} / {cards.length}</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
              <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
          </div>
      </div>
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8">
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Definition</p>
        <p className="text-xl text-slate-800 dark:text-white mt-2 min-h-[60px]">{currentCard.definition}</p>
        
        <form onSubmit={handleAnswerSubmit} className="mt-6">
            <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={answerState !== 'unanswered'}
                placeholder="Type the term..."
                className={`w-full px-4 py-3 text-lg bg-slate-100 dark:bg-slate-700 border-2 rounded-lg outline-none transition-colors duration-300
                    ${answerState === 'unanswered' ? 'border-slate-300 dark:border-slate-600 focus:border-indigo-500 focus:ring-indigo-500' : ''}
                    ${answerState === 'correct' ? 'border-green-500 bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200' : ''}
                    ${answerState === 'incorrect' ? 'border-red-500 bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200' : ''}
                `}
            />
             <button type="submit" className="hidden">Submit</button>
        </form>
         {answerState === 'incorrect' && (
            <div className="mt-4 text-red-600 dark:text-red-400">
                <p className="font-bold">Correct answer:</p>
                <p>{currentCard.term}</p>
            </div>
        )}
        {answerState === 'correct' && (
            <div className="mt-4 text-green-600 dark:text-green-400 font-bold">
                <p>Correct!</p>
            </div>
        )}
      </div>
    </div>
  );
};