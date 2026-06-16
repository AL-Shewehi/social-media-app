import { create } from "zustand";

interface OnlineState {
  onlineIds: Set<string>;
  setOnlineIds: (ids: Set<string>) => void;
  addOnlineId: (id: string) => void;
  removeOnlineId: (id: string) => void;
}

export const useOnlineStore = create<OnlineState>((set) => ({
  onlineIds: new Set<string>(),
  setOnlineIds: (ids) => set({ onlineIds: ids }),
  addOnlineId: (id) =>
    set((state) => {
      const next = new Set(state.onlineIds);
      next.add(id);
      return { onlineIds: next };
    }),
  removeOnlineId: (id) =>
    set((state) => {
      const next = new Set(state.onlineIds);
      next.delete(id);
      return { onlineIds: next };
    }),
}));
