import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface GameState {
  coins: number;
  currentLevel: number;
  unlockedRecipes: string[];
  addCoins: (amount: number) => void;
  unlockRecipe: (recipeId: string) => void;
  nextLevel: () => void;
}

export const useGameStore = create<GameState>()(
  persist(
    (set) => ({
      coins: 0,
      currentLevel: 1,
      unlockedRecipes: ['burger'], // Start with one recipe
      addCoins: (amount) => set((state) => ({ coins: state.coins + amount })),
      unlockRecipe: (recipeId) => set((state) => ({ 
        unlockedRecipes: state.unlockedRecipes.includes(recipeId) ? state.unlockedRecipes : [...state.unlockedRecipes, recipeId] 
      })),
      nextLevel: () => set((state) => ({ currentLevel: state.currentLevel + 1 })),
    }),
    {
      name: 'cooking-chaos-storage', // name of the item in the storage (must be unique)
    }
  )
);
