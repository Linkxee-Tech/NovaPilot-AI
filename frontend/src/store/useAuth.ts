import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
    id: number;
    email: string;
    full_name?: string;
}

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isAuthChecked: boolean;
    setAuth: (user: User) => void;
    setAuthChecked: (checked: boolean) => void;
    updateUser: (user: Partial<User>) => void;
    clearAuth: () => void;
}

export const useAuth = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            isAuthenticated: false,
            isAuthChecked: false,
            setAuth: (user) => {
                set({ user, isAuthenticated: true });
            },
            setAuthChecked: (checked) => {
                set({ isAuthChecked: checked });
            },
            updateUser: (userData) => {
                set((state) => ({
                    user: state.user ? { ...state.user, ...userData } : null,
                }));
            },
            clearAuth: () => {
                set({ user: null, isAuthenticated: false });
            },
        }),
        {
            name: 'novapilot-auth',
            partialize: (state) => ({
                user: state.user,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
);
