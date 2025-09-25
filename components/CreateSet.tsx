import React, { useState } from 'react';
import type { Flashcard } from '../types';
import { generateFlashcards } from '../services/geminiService';
import { WandIcon, TrashIcon, BackIcon } from './icons';

interface CreateSetProps {
  onSetCreated: (topic: string, cards: Flashcard[]) => void;
  onBackToLibrary: () => void;
}

interface EditableCard extends Partial<Flashcard> {
  localId: number;
  term: string;
  definition: string;
}

const AiGenerator: React.FC<{onCardsGenerated: (cards: Flashcard[]) => void; setLoading: (loading: boolean) => void; setError: (error: string | null) => void;}> = ({ onCardsGenerated, setLoading, setError }) => {
    const [notes, setNotes] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerate = async () => {
        if (!notes.trim()) {
          setError("Please paste your notes for AI generation.");
          return;
        }
        setError(null);
        setIsGenerating(true);
        setLoading(true);
        try {
          const newCards = await generateFlashcards(notes);
          onCardsGenerated(newCards);
          setNotes('');
        } catch (e: any) {
          setError(e.message || "An unknown AI error occurred.");
        } finally {
          setIsGenerating(false);
          setLoading(false);
        }
    };

    return (
        <div className="bg-slate-100 dark:bg-slate-700/50 p-4 rounded-lg mt-4">
            <p className="font-semibold text-slate-700 dark:text-slate-200">Generate from Notes</p>
             <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Paste your notes here. The AI will read them and create flashcards based on the key information."
                disabled={isGenerating}
                rows={8}
                className="w-full mt-2 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-indigo-500 focus:border-indigo-500 resize-y"
            />
            <button
                onClick={handleGenerate}
                disabled={isGenerating || !notes.trim()}
                className="w-full mt-3 flex items-center justify-center bg-indigo-500 text-white font-bold py-2 px-4 rounded-md hover:bg-indigo-600 disabled:bg-indigo-400 disabled:cursor-not-allowed"
            >
                <WandIcon /> {isGenerating ? 'Generating...' : 'Generate Cards'}
            </button>
        </div>
    );
}

export const CreateSet: React.FC<CreateSetProps> = ({ onSetCreated, onBackToLibrary }) => {
    const [title, setTitle] = useState('');
    const [cards, setCards] = useState<EditableCard[]>([
        { localId: 1, term: '', definition: '' },
        { localId: 2, term: '', definition: '' },
        { localId: 3, term: '', definition: '' },
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showAiGenerator, setShowAiGenerator] = useState(false);

    const handleCardChange = (id: number, field: 'term' | 'definition', value: string) => {
        setCards(currentCards => currentCards.map(card => card.localId === id ? { ...card, [field]: value } : card));
    };

    const addCard = () => {
        setCards(currentCards => [...currentCards, { localId: Date.now(), term: '', definition: '' }]);
        setTimeout(() => {
          window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        }, 100);
    };
    
    const removeCard = (id: number) => {
        setCards(currentCards => currentCards.filter(card => card.localId !== id));
    };

    const handleAiCardsGenerated = (newCards: Flashcard[]) => {
      const editableNewCards: EditableCard[] = newCards.map(card => ({
        ...card,
        localId: Date.now() + Math.random(),
      }));
      setCards(currentCards => [...currentCards.filter(c => c.term || c.definition), ...editableNewCards]); // remove empty cards before adding new ones
      setShowAiGenerator(false);
    };

    const createSet = () => {
        setError(null);
        if (!title.trim()) {
            setError('Please enter a title for your study set.');
            return;
        }
        const finalCards = cards
            .filter(card => card.term.trim() && card.definition.trim())
            .map(({ localId, ...cardData }) => ({
                id: `${Date.now()}-${localId}`,
                ...cardData
            }));
        
        if (finalCards.length < 2) {
            setError('Please create at least 2 valid cards (with both term and definition).');
            return;
        }

        onSetCreated(title, finalCards);
    };

    return (
        <div className="w-full max-w-4xl mx-auto">
             <button onClick={onBackToLibrary} className="flex items-center text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-semibold transition mb-4">
                <BackIcon />
                Back to Library
            </button>
            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-2xl">
                <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-6">Create a new study set</h1>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter a title, like 'Biology Chapter 4'"
                    className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-lg focus:ring-2 focus:ring-indigo-500"
                />

                <div className="my-6">
                    <button onClick={() => setShowAiGenerator(!showAiGenerator)} className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
                        {showAiGenerator ? 'Hide AI Generator' : 'Or generate from notes with AI ✨'}
                    </button>
                    {showAiGenerator && <AiGenerator onCardsGenerated={handleAiCardsGenerated} setLoading={setIsLoading} setError={setError} />}
                </div>

                <div className="space-y-4 mt-6">
                    {cards.map((card, index) => (
                        <div key={card.localId} className="flex items-start space-x-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                            <span className="text-slate-400 font-bold mt-3">{index + 1}</span>
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                               <input
                                    type="text"
                                    value={card.term}
                                    onChange={(e) => handleCardChange(card.localId, 'term', e.target.value)}
                                    placeholder="Enter term"
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md"
                                />
                                <input
                                    type="text"
                                    value={card.definition}
                                    onChange={(e) => handleCardChange(card.localId, 'definition', e.target.value)}
                                    placeholder="Enter definition"
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md"
                                />
                            </div>
                            <button onClick={() => removeCard(card.localId)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-100 dark:hover:bg-slate-700 rounded-full">
                                <TrashIcon />
                            </button>
                        </div>
                    ))}
                </div>
                 <button onClick={addCard} className="mt-4 text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
                    + Add Card
                </button>
            </div>
             {error && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mt-4 rounded-r-lg" role="alert">
                    <p>{error}</p>
                </div>
            )}
            <div className="mt-8 flex justify-end">
                <button
                    onClick={createSet}
                    disabled={isLoading}
                    className="px-10 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500 disabled:bg-indigo-400"
                >
                    {isLoading ? 'Loading...' : 'Create Set'}
                </button>
            </div>
        </div>
    );
};