import React, { useState, useMemo, useEffect } from 'react';
import type { Flashcard } from '../types';

type QuestionType = 'mc' | 'written';

interface Question {
  id: string;
  type: QuestionType;
  card: Flashcard;
  options?: string[]; // For MC questions
}

interface TestModeProps {
  cards: Flashcard[];
}

const shuffleArray = <T,>(array: T[]): T[] => {
  return [...array].sort(() => Math.random() - 0.5);
};

export const TestMode: React.FC<TestModeProps> = ({ cards }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    const generateQuestions = () => {
      const shuffledCards = shuffleArray(cards);
      const newQuestions: Question[] = shuffledCards.map((card, index) => {
        // Simple logic: half MC, half written
        if (index < Math.floor(cards.length / 2)) {
          const otherCards = cards.filter(c => c.id !== card.id);
          const wrongOptions = shuffleArray(otherCards).slice(0, 3).map(c => c.term);
          return {
            id: card.id,
            type: 'mc',
            card: card,
            options: shuffleArray([card.term, ...wrongOptions]),
          };
        } else {
          return { id: card.id, type: 'written', card: card };
        }
      });
      setQuestions(shuffleArray(newQuestions));
      setAnswers({});
      setIsSubmitted(false);
    };
    generateQuestions();
  }, [cards]);

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };
  
  const handleSubmit = () => {
    setIsSubmitted(true);
  };

  const score = useMemo(() => {
    if (!isSubmitted) return 0;
    return questions.reduce((correctCount, q) => {
      const userAnswer = answers[q.id]?.trim().toLowerCase();
      const correctAnswer = q.card.term.trim().toLowerCase();
      if (userAnswer === correctAnswer) {
        return correctCount + 1;
      }
      return correctCount;
    }, 0);
  }, [isSubmitted, questions, answers]);


  if (isSubmitted) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="text-center bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg mb-8">
            <h2 className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">Test Results</h2>
            <p className="text-5xl font-bold my-4 text-slate-800 dark:text-white">{Math.round((score/questions.length)*100)}%</p>
            <p className="text-slate-600 dark:text-slate-300 text-lg">You answered {score} out of {questions.length} questions correctly.</p>
             <button onClick={() => {
                const newQuestions = shuffleArray(questions);
                setQuestions(newQuestions);
                setAnswers({});
                setIsSubmitted(false);
             }} className="mt-6 px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition">
                Retake Test
            </button>
        </div>
        <div className="space-y-4">
            {questions.map(q => {
                 const userAnswer = answers[q.id] || "No answer";
                 const isCorrect = userAnswer.trim().toLowerCase() === q.card.term.trim().toLowerCase();
                 return (
                    <div key={q.id} className={`p-4 rounded-lg ${isCorrect ? 'bg-green-100 dark:bg-green-900 border-green-500' : 'bg-red-100 dark:bg-red-900 border-red-500'} border-l-4`}>
                        <p className="font-bold text-slate-800 dark:text-slate-200">{q.card.definition}</p>
                        <p className={`mt-2 ${isCorrect ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>Your answer: {userAnswer}</p>
                        {!isCorrect && <p className="mt-1 text-slate-600 dark:text-slate-400">Correct answer: {q.card.term}</p>}
                    </div>
                 )
            })}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
        <div className="space-y-8">
        {questions.map((q, index) => (
            <div key={q.id} className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md">
                <p className="font-semibold text-slate-500 dark:text-slate-400 mb-2">Question {index + 1}</p>
                <p className="text-lg text-slate-800 dark:text-white mb-4">{q.card.definition}</p>
                {q.type === 'mc' && (
                    <div className="space-y-2">
                        {q.options?.map(option => (
                            <label key={option} className="flex items-center p-3 rounded-lg bg-slate-100 dark:bg-slate-700 cursor-pointer transition hover:bg-slate-200 dark:hover:bg-slate-600">
                                <input
                                    type="radio"
                                    name={q.id}
                                    value={option}
                                    checked={answers[q.id] === option}
                                    onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                                    className="h-4 w-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                                />
                                <span className="ml-3 text-slate-700 dark:text-slate-200">{option}</span>
                            </label>
                        ))}
                    </div>
                )}
                {q.type === 'written' && (
                     <input
                        type="text"
                        value={answers[q.id] || ''}
                        onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                        placeholder="Type your answer..."
                        className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                    />
                )}
            </div>
        ))}
        </div>
        <div className="mt-8 text-center">
            <button
                onClick={handleSubmit}
                className="px-12 py-4 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500 focus:ring-opacity-50 transition-transform transform hover:scale-105"
            >
                Submit Test
            </button>
        </div>
    </div>
  );
};