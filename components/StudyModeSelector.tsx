
import React from 'react';
import { StudyMode } from '../types';
import { CardsIcon, LearnIcon, TestIcon, MatchIcon, WriteIcon } from './icons';

interface StudyModeSelectorProps {
  currentMode: StudyMode;
  onModeChange: (mode: StudyMode) => void;
}

const studyModes = [
  { mode: StudyMode.Flashcards, icon: <CardsIcon />, label: 'Flashcards' },
  { mode: StudyMode.Learn, icon: <LearnIcon />, label: 'Learn' },
  { mode: StudyMode.Write, icon: <WriteIcon />, label: 'Write' },
  { mode: StudyMode.Test, icon: <TestIcon />, label: 'Test' },
  { mode: StudyMode.Match, icon: <MatchIcon />, label: 'Match' },
];

export const StudyModeSelector: React.FC<StudyModeSelectorProps> = ({ currentMode, onModeChange }) => {
  return (
    <div className="flex justify-center items-center space-x-2 md:space-x-4 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm p-2 rounded-xl shadow-md mb-6">
      {studyModes.map(({ mode, icon, label }) => (
        <button
          key={mode}
          onClick={() => onModeChange(mode)}
          className={`flex items-center justify-center px-3 py-2 md:px-5 md:py-2.5 rounded-lg text-sm md:text-base font-semibold transition-all duration-300 ease-in-out ${
            currentMode === mode
              ? 'bg-indigo-600 text-white shadow-lg scale-105'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          {icon}
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
};
