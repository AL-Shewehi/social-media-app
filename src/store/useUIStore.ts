import { create } from "zustand"

interface UIState {
    // create post dialog state 
    isCreatePostOpen: boolean,
    setCreatePostOpen: (open: boolean) => void,
    openCreatePost: () => void,
    closeCreatePost: () => void

    // mobile side bar state
    isMobileSidebarOpen: boolean,
    setMobileSidebarOpen: (open: boolean) => void;
    toggleMobileSidebar: () => void;

}

export const useUIStore = create<UIState>((set) => ({
    // Initial States
    isCreatePostOpen: false,
    isMobileSidebarOpen: false,

    // الدالات المتحكمة في الـ Create Post Modal
    setCreatePostOpen: (open) => set({ isCreatePostOpen: open }),
    openCreatePost: () => set({ isCreatePostOpen: true }),
    closeCreatePost: () => set({ isCreatePostOpen: false }),

    // الدالات المتحكمة في الـ Mobile Sidebar
    setMobileSidebarOpen: (open) => set({ isMobileSidebarOpen: open }),
    toggleMobileSidebar: () => set((state) => ({ isMobileSidebarOpen: !state.isMobileSidebarOpen })),
}));