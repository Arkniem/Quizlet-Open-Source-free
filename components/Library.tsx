import React from 'react';
import type { StudySet } from '../types';
import { UploadIcon, PlusIcon, CardsIcon } from './icons';

interface LibraryProps {
  sets: StudySet[];
  onSelectSet: (set: StudySet) => void;
  onCreateNew: () => void;
  onLoadFolder: () => void;
}

export const Library: React.FC<LibraryProps> = ({ sets, onSelectSet, onCreateNew, onLoadFolder }) => {
  return (
    <div className="w-full">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-slate-800 dark:text-white">Your Library</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Select a set to start studying or create a new one.</p>
        </div>
        <div className="flex space-x-2 mt-4 sm:mt-0">
          <button onClick={onLoadFolder} className="flex items-center justify-center px-4 py-2 bg-white dark:bg-slate-700 text-slate-700 dark:text-white rounded-lg shadow font-semibold hover:bg-slate-100 dark:hover:bg-slate-600 transition">
            <UploadIcon />
            <span className="ml-2">Load Folder</span>
          </button>
          <button onClick={onCreateNew} className="flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-lg shadow font-semibold hover:bg-indigo-700 transition">
            <PlusIcon />
            <span className="ml-2">Create New</span>
          </button>
        </div>
      </header>

      {sets.length === 0 ? (
        <div className="text-center py-20 px-6 bg-white dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700">
          <h2 className="text-2xl font-semibold text-slate-700 dark:text-slate-200">Your library is empty.</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Create a new study set or load a folder to get started!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {sets.map((set, index) => (
            <div
              key={`${set.topic}-${index}`}
              onClick={() => onSelectSet(set)}
              className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 cursor-pointer transition-transform transform hover:-translate-y-1 hover:shadow-2xl"
            >
              <h3 className="text-xl font-bold text-slate-800 dark:text-white truncate" title={set.topic}>{set.topic}</h3>
              <div className="flex items-center text-slate-500 dark:text-slate-400 mt-2">
                <CardsIcon />
                <span className="text-sm font-medium">{set.cards.length} cards</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};