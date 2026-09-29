import { createContext, PropsWithChildren, useContext, useMemo, useState } from 'react';

import { CommunityPost, initialPosts, initialRoomFurniture, initialRoomShape, PlacedFurniture, RoomShape } from '@/data/mock';

interface AppStateValue {
  roomFurniture: PlacedFurniture[];
  setRoomFurniture: React.Dispatch<React.SetStateAction<PlacedFurniture[]>>;
  roomShape: RoomShape;
  setRoomShape: React.Dispatch<React.SetStateAction<RoomShape>>;
  posts: CommunityPost[];
  setPosts: React.Dispatch<React.SetStateAction<CommunityPost[]>>;
}

const AppStateContext = createContext<AppStateValue | null>(null);

export function AppStateProvider({ children }: PropsWithChildren) {
  const [roomFurniture, setRoomFurniture] = useState<PlacedFurniture[]>(initialRoomFurniture);
  const [roomShape, setRoomShape] = useState<RoomShape>(initialRoomShape);
  const [posts, setPosts] = useState<CommunityPost[]>(initialPosts);

  const value = useMemo(
    () => ({ roomFurniture, setRoomFurniture, roomShape, setRoomShape, posts, setPosts }),
    [roomFurniture, roomShape, posts]
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider');
  return ctx;
}
