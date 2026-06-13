import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { Movie } from '../types/tmdb';

interface MyListContextType {
  myList: Movie[];
  addToList: (movie: Movie) => void;
  removeFromList: (movieId: number) => void;
  isInList: (movieId: number) => boolean;
}

const MyListContext = createContext<MyListContextType | null>(null);
const STORAGE_KEY = 'synema_my_list';

export function MyListProvider({ children }: { children: ReactNode }) {
  const [myList, setMyList] = useState<Movie[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(myList));
  }, [myList]);

  const addToList = useCallback((movie: Movie) => {
    setMyList(prev => {
      if (prev.some(m => m.id === movie.id)) return prev;
      return [...prev, movie];
    });
  }, []);

  const removeFromList = useCallback((movieId: number) => {
    setMyList(prev => prev.filter(m => m.id !== movieId));
  }, []);

  const isInList = useCallback((movieId: number) => {
    return myList.some(m => m.id === movieId);
  }, [myList]);

  return (
    <MyListContext.Provider value={{ myList, addToList, removeFromList, isInList }}>
      {children}
    </MyListContext.Provider>
  );
}

export function useMyList() {
  const context = useContext(MyListContext);
  if (!context) {
    throw new Error('useMyList must be used within MyListProvider');
  }
  return context;
}
