export interface Flashcard {
  id: string;
  term: string;
  definition: string;
  isStarred?: boolean;
}

export interface StudySet {
  topic: string;
  cards: Flashcard[];
}

export enum StudyMode {
  Flashcards = 'Flashcards',
  Learn = 'Learn',
  Test = 'Test',
  Match = 'Match',
  Write = 'Write',
}
