import React, { useState, useMemo, useRef } from 'react';
import type { StudySet, Flashcard } from './types';
import { StudyMode } from './types';
import { Library } from './components/Library';
import { CreateSet } from './components/CreateSet';
import { StudyModeSelector } from './components/StudyModeSelector';
import { FlashcardsMode } from './components/FlashcardsMode';
import { LearnMode } from './components/LearnMode';
import { TestMode } from './components/TestMode';
import { MatchMode } from './components/MatchMode';
import { WriteMode } from './components/WriteMode';
import { BackIcon, StarIcon, DownloadIcon } from './components/icons';

type AppView = 'library' | 'create' | 'study';

const App: React.FC = () => {
  const [allSets, setAllSets] = useState<StudySet[]>([]);
  const [activeSet, setActiveSet] = useState<StudySet | null>(null);
  const [view, setView] = useState<AppView>('library');
  const [currentMode, setCurrentMode] = useState<StudyMode>(StudyMode.Flashcards);
  const [cardFilter, setCardFilter] = useState<'all' | 'starred'>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSetCreated = (topic: string, cards: Flashcard[]) => {
    const newSet: StudySet = { topic, cards: cards.map(c => ({ ...c, isStarred: false })) };
    setAllSets(prev => [...prev, newSet]);
    setActiveSet(newSet);
    setCurrentMode(StudyMode.Flashcards);
    setCardFilter('all');
    setView('study');
  };

  const handleSelectSet = (set: StudySet) => {
    setActiveSet(set);
    setCurrentMode(StudyMode.Flashcards);
    setCardFilter('all');
    setView('study');
  };
  
  const handleToggleStar = (cardId: string) => {
    const updateSet = (set: StudySet | null) => {
      if (!set) return null;
      const updatedCards = set.cards.map(card =>
        card.id === cardId ? { ...card, isStarred: !card.isStarred } : card
      );
      return { ...set, cards: updatedCards };
    };
    
    setActiveSet(prevSet => updateSet(prevSet));
    setAllSets(prevSets => prevSets.map(s => s.topic === activeSet?.topic ? updateSet(s)! : s));
  };

  const handleBackToLibrary = () => {
    setActiveSet(null);
    setView('library');
  };
  
  const handleSaveSet = () => {
    if (!activeSet) return;
    const jsonString = JSON.stringify(activeSet, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeSet.topic.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const handleLoadFolderClick = () => {
    fileInputRef.current?.click();
  };

  const handleFilesSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;
    
    const loadedSets: StudySet[] = [];
    for (const file of Array.from(files)) {
      if (file.name.endsWith('.json')) {
        try {
          const content = await file.text();
          const set = JSON.parse(content);
          // Basic validation
          if (set.topic && Array.isArray(set.cards)) {
            loadedSets.push(set);
          }
        } catch (e) {
          console.error(`Error parsing file ${file.name}:`, e);
        }
      }
    }
    
    // Avoid duplicates by topic name
    const newSets = loadedSets.filter(ls => !allSets.some(as => as.topic === ls.topic));
    setAllSets(prev => [...prev, ...newSets]);
  };

  const filteredCards = useMemo(() => {
    if (!activeSet) return [];
    if (cardFilter === 'starred') {
      return activeSet.cards.filter(card => card.isStarred);
    }
    return activeSet.cards;
  }, [activeSet, cardFilter]);

  const starredCount = useMemo(() => activeSet?.cards.filter(c => c.isStarred).length || 0, [activeSet]);

  const renderStudyMode = () => {
    if (!activeSet) return null;
    switch (currentMode) {
      case StudyMode.Flashcards:
        return <FlashcardsMode cards={filteredCards} onToggleStar={handleToggleStar} />;
      case StudyMode.Learn:
        return <LearnMode cards={filteredCards} />;
      case StudyMode.Write:
        return <WriteMode cards={filteredCards} />;
      case StudyMode.Test:
        return <TestMode cards={filteredCards} />;
      case StudyMode.Match:
        return <MatchMode cards={filteredCards} />;
      default:
        return null;
    }
  };

  const renderContent = () => {
    switch (view) {
      case 'create':
        return <CreateSet onSetCreated={handleSetCreated} onBackToLibrary={handleBackToLibrary} />;
      case 'study':
        if (activeSet) {
          return (
            <main className="w-full">
              <header className="mb-4 text-center relative flex justify-between items-center">
                 <button onClick={handleBackToLibrary} className="flex items-center text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-semibold transition">
                   <BackIcon />
                   Library
                 </button>
                 <div className="flex-1 text-center">
                    <h1 className="text-3xl sm:text-4xl font-bold text-slate-800 dark:text-white truncate" title={activeSet.topic}>{activeSet.topic}</h1>
                    <p className="text-slate-500 dark:text-slate-400">{activeSet.cards.length} cards</p>
                 </div>
                 <button onClick={handleSaveSet} className="flex items-center text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-semibold transition">
                   <DownloadIcon />
                   Save
                 </button>
              </header>
              
              <div className="flex justify-center mb-6">
                  <div className="bg-slate-200 dark:bg-slate-700 p-1 rounded-full flex items-center space-x-1">
                      <button onClick={() => setCardFilter('all')} className={`px-4 py-1 rounded-full text-sm font-semibold ${cardFilter === 'all' ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}>
                          All Cards
                      </button>
                      <button onClick={() => setCardFilter('starred')} disabled={starredCount === 0} className={`flex items-center px-4 py-1 rounded-full text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed ${cardFilter === 'starred' ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}>
                          <StarIcon isFilled={cardFilter === 'starred'} className="h-4 w-4 mr-1" />
                          Starred ({starredCount})
                      </button>
                  </div>
              </div>

              <StudyModeSelector currentMode={currentMode} onModeChange={setCurrentMode} />
              <div className="mt-8">
                  {renderStudyMode()}
              </div>
            </main>
          );
        }
        return null; // Should not happen
      case 'library':
      default:
        return <Library sets={allSets} onSelectSet={handleSelectSet} onCreateNew={() => setView('create')} onLoadFolder={handleLoadFolderClick} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white p-4 sm:p-8 flex flex-col items-center transition-colors duration-500">
      <div className="w-full max-w-6xl mx-auto">
        {renderContent()}
        <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            multiple
            // @ts-ignore
            webkitdirectory="true"
            directory="true"
            onChange={handleFilesSelected}
        />
      </div>
    </div>
  );
};

export default App;