import type { SavedStoryState } from '../types';

const STORAGE_KEY = 'taleForgeStory';

export const saveStoryState = (state: SavedStoryState): void => {
  try {
    const stateString = JSON.stringify(state);
    localStorage.setItem(STORAGE_KEY, stateString);
  } catch (error) {
    console.error("Could not save story state:", error);
  }
};

export const loadStoryState = (): SavedStoryState | null => {
  try {
    const stateString = localStorage.getItem(STORAGE_KEY);
    if (stateString === null) {
      return null;
    }
    return JSON.parse(stateString);
  } catch (error) {
    console.error("Could not load story state:", error);
    return null;
  }
};

export const hasSavedStory = (): boolean => {
  return localStorage.getItem(STORAGE_KEY) !== null;
};

export const clearSavedStory = (): void => {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
        console.error("Could not clear saved story:", error);
    }
};
