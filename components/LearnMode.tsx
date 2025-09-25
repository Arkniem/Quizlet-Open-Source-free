import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { Flashcard } from '../types';
import { generateMcqOptions } from '../services/geminiService';

interface LearnModeProps {
  cards: Flashcard[];
}

const shuffleArray = <T,>(array: T[]): T[] => {
    return [...array].sort(() => Math.random() - 0.5);
};

const ResultsScreen: React.FC<{ knownCount: number; totalCount: number; onRestart: () => void; }> = ({ knownCount, totalCount, onRestart }) => (
    <div className="text-center bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg animate-fade-in">
        <h2 className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">Session Complete!</h2>
        <p className="text-slate-600 dark:text-slate-300 mt-2 text-lg">You've gone through all the cards.</p>
        <div className="my-6">
            <p className="text-5xl font-bold text-slate-800 dark:text-white">{knownCount}</p>
            <p className="text-slate-500 dark:text-slate-400">known out of {totalCount} cards.</p>
        </div>
        <button onClick={onRestart} className="mt-8 px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition">
            Start Over
        </button>
    </div>
);

export const LearnMode: React.FC<LearnModeProps> = ({ cards }) => {
    const [unseen, setUnseen] = useState<Flashcard[]>([]);
    const [learning, setLearning] = useState<Flashcard[]>([]);
    const [known, setKnown] = useState<Flashcard[]>([]);

    const [currentCard, setCurrentCard] = useState<Flashcard | null>(null);
    const [options, setOptions] = useState<string[]>([]);
    const [isLoadingOptions, setIsLoadingOptions] = useState(false);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [isPostAnswer, setIsPostAnswer] = useState(false);

    const allTerms = useMemo(() => cards.map(c => c.term), [cards]);

    const startNewSession = useCallback(() => {
        const shuffled = shuffleArray(cards);
        setUnseen(shuffled);
        setLearning([]);
        setKnown([]);
        setCurrentCard(shuffled[0] || null);
        setSelectedAnswer(null);
        setIsPostAnswer(false);
    }, [cards]);

    useEffect(() => {
        startNewSession();
    }, [cards, startNewSession]);

    useEffect(() => {
        if (currentCard) {
            const fetchOptions = async () => {
                setIsLoadingOptions(true);
                setOptions([]);
                try {
                    const distractors = await generateMcqOptions(currentCard.term, currentCard.definition, allTerms);
                    setOptions(shuffleArray([currentCard.term, ...distractors]));
                } catch (error) {
                    console.error("Failed to fetch MCQ options:", error);
                    // Fallback to simpler method if API fails
                    const otherCards = cards.filter(c => c.id !== currentCard.id);
                    const wrongOptions = shuffleArray(otherCards).slice(0, 3).map(c => c.term);
                    setOptions(shuffleArray([currentCard.term, ...wrongOptions]));
                } finally {
                    setIsLoadingOptions(false);
                }
            };
            fetchOptions();
        }
    }, [currentCard, allTerms, cards]);
    
    const handleAnswer = (answer: string) => {
        if (isPostAnswer) return;
        setSelectedAnswer(answer);
        setIsPostAnswer(true);
    };
    
    const handleNextStep = (wasKnown: boolean) => {
      if (!currentCard) return;

      if (wasKnown) {
        setKnown(prev => [...prev, currentCard]);
      } else {
        setLearning(prev => [...prev, currentCard]);
      }
      
      const newUnseen = unseen.filter(c => c.id !== currentCard.id);
      setUnseen(newUnseen);

      // Determine next card: prioritize learning pile, then unseen
      let nextQueue = learning.length > 0 ? shuffleArray(learning) : newUnseen;
      
      // If the current card was in the learning pile, remove it for the next round's queue
      if (learning.some(c => c.id === currentCard.id)) {
          const newLearning = learning.filter(c => c.id !== currentCard.id);
          setLearning(newLearning);
          nextQueue = newLearning.length > 0 ? shuffleArray(newLearning) : newUnseen;
      }
      
      setCurrentCard(nextQueue[0] || null);
      setSelectedAnswer(null);
      setIsPostAnswer(false);
    };

    if (cards.length === 0) {
      return <div className="text-center text-slate-500 dark:text-slate-400">No cards to display.</div>;
    }

    if (!currentCard) {
        return <ResultsScreen knownCount={known.length} totalCount={cards.length} onRestart={startNewSession} />;
    }

    const isCorrect = selectedAnswer === currentCard.term;

    const getButtonClass = (option: string) => {
        if (!isPostAnswer) {
            return 'bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600';
        }
        if (option === currentCard.term) {
            return 'bg-green-500 text-white';
        }
        if (option === selectedAnswer) {
            return 'bg-red-500 text-white';
        }
        return 'bg-white dark:bg-slate-700 opacity-50 cursor-not-allowed';
    };

    return (
        <div className="w-full max-w-3xl mx-auto">
            <div className="mb-4">
                <div className="flex justify-between text-sm font-semibold text-slate-500 dark:text-slate-400">
                    <span>Known: {known.length}</span>
                    <span>Learning: {learning.length}</span>
                    <span>Remaining: {unseen.length}</span>
                </div>
                <div className="flex w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full mt-1 overflow-hidden">
                    <div className="bg-green-500" style={{ width: `${(known.length / cards.length) * 100}%` }}></div>
                    <div className="bg-yellow-500" style={{ width: `${(learning.length / cards.length) * 100}%` }}></div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8 mb-6 min-h-[150px] flex items-center justify-center">
                <p className="text-2xl text-center text-slate-800 dark:text-white">{currentCard.definition}</p>
            </div>

            {isLoadingOptions ? (
                <div className="text-center text-slate-500 dark:text-slate-400">Generating options...</div>
            ) : (
                <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${isPostAnswer ? 'pointer-events-none' : ''}`}>
                    {options.map(option => (
                        <button key={option} onClick={() => handleAnswer(option)} className={`p-4 rounded-lg text-lg font-semibold text-left transition-all duration-300 shadow ${getButtonClass(option)}`}>
                            {option}
                        </button>
                    ))}
                </div>
            )}
            
            {isPostAnswer && (
                <div className="mt-6 p-6 bg-slate-100 dark:bg-slate-900/50 rounded-lg text-center animate-fade-in">
                   <h3 className="text-2xl font-bold">{isCorrect ? "Correct!" : "Keep practicing!"}</h3>
                   {!isCorrect && <p className="text-slate-600 dark:text-slate-300 mt-1">The correct answer is: <strong className="text-slate-800 dark:text-white">{currentCard.term}</strong></p>}
                    <p className="mt-4 text-slate-500 dark:text-slate-400">Did you know this answer?</p>
                    <div className="flex justify-center space-x-4 mt-3">
                        <button onClick={() => handleNextStep(false)} className="px-6 py-2 bg-white dark:bg-slate-700 text-slate-700 dark:text-white rounded-lg shadow hover:bg-slate-100 dark:hover:bg-slate-600 transition">Keep learning this</button>
                        <button onClick={() => handleNextStep(true)} className="px-6 py-2 bg-green-500 text-white rounded-lg shadow hover:bg-green-600 transition">I knew this</button>
                    </div>
                </div>
            )}
        </div>
    );
};
