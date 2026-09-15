import { createContext, PropsWithChildren, useContext, useMemo, useState } from 'react';

import { CommunityPost, initialPosts, initialRoomFurniture, PlacedFurniture } from '@/data/mock';

interface AppStateValue {
  roomFurniture: PlacedFurniture[];
  setRoomFurniture: React.Dispatch<React.SetStateAction<PlacedFurniture[]>>;
  posts: CommunityPost[];
  setPosts: React.Dispatch<React.SetStateAction<CommunityPost[]>>;
}

const AppStateContext = createContext<AppStateValue | null>(null);

export function AppStateProvider({ children }: PropsWithChildren) {
  const [roomFurniture, setRoomFurniture] = useState<PlacedFurniture[]>(initialRoomFurniture);
  const [posts, setPosts] = useState<CommunityPost[]>(initialPosts);

  const value = useMemo(
    () => ({ roomFurniture, setRoomFurniture, posts, setPosts }),
    [roomFurniture, posts]
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider');
  return ctx;
}
