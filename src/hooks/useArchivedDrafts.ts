import { useState, useCallback, useEffect } from 'react';

export interface ArchivedDraft<T> {
  id: string;
  name: string;
  data: T;
  createdAt: string;
  updatedAt: string;
  calculatorType: 'xirr' | 'rental-roi';
  userId?: string; // Optional for backward compatibility
}

const STORAGE_KEY = 'baliinvest_archived_drafts';

// Load drafts from localStorage synchronously
function loadDraftsFromStorage<T>(calculatorType: 'xirr' | 'rental-roi', userId?: string): ArchivedDraft<T>[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const allDrafts: ArchivedDraft<T>[] = JSON.parse(saved);
      // Filter by calculator type and user ID
      return allDrafts.filter(d => {
        if (d.calculatorType !== calculatorType) return false;
        // If userId is provided, only show drafts for that user
        // If no userId (not logged in), show drafts without userId (legacy) or anonymous
        if (userId) {
          return d.userId === userId;
        } else {
          return !d.userId; // Show only anonymous/legacy drafts when not logged in
        }
      });
    }
  } catch (e) {
    console.error('Failed to load archived drafts:', e);
  }
  return [];
}

export function useArchivedDrafts<T>(calculatorType: 'xirr' | 'rental-roi', userId?: string) {
  // Initialize state synchronously from localStorage to prevent race conditions
  const [drafts, setDrafts] = useState<ArchivedDraft<T>[]>(() =>
    loadDraftsFromStorage<T>(calculatorType, userId)
  );

  // Re-load drafts when userId changes
  useEffect(() => {
    const loaded = loadDraftsFromStorage<T>(calculatorType, userId);
    setDrafts(loaded);
  }, [calculatorType, userId]);

  // Save all drafts to localStorage
  const persistDrafts = useCallback((newDrafts: ArchivedDraft<T>[]) => {
    try {
      // Get all drafts from storage first
      const saved = localStorage.getItem(STORAGE_KEY);
      let allDrafts: ArchivedDraft<unknown>[] = saved ? JSON.parse(saved) : [];

      // Remove drafts of current calculator type AND current user
      allDrafts = allDrafts.filter(d => {
        if (d.calculatorType !== calculatorType) return true;
        // Keep drafts from other users
        if (userId) {
          return d.userId !== userId;
        } else {
          return d.userId; // Keep drafts that have a userId when saving anonymous
        }
      });

      // Add updated drafts
      allDrafts = [...allDrafts, ...newDrafts];

      localStorage.setItem(STORAGE_KEY, JSON.stringify(allDrafts));
    } catch (e) {
      console.error('Failed to persist drafts:', e);
    }
  }, [calculatorType, userId]);

  // Save a new draft or update existing one
  const saveDraft = useCallback((name: string, data: T, existingId?: string): ArchivedDraft<T> => {
    const now = new Date().toISOString();

    let newDraft: ArchivedDraft<T>;
    let newDrafts: ArchivedDraft<T>[];

    if (existingId) {
      // Update existing draft
      newDrafts = drafts.map(d => {
        if (d.id === existingId) {
          newDraft = { ...d, name, data, updatedAt: now };
          return newDraft;
        }
        return d;
      });
      if (!newDraft!) {
        // ID not found, create new
        newDraft = {
          id: crypto.randomUUID(),
          name,
          data,
          createdAt: now,
          updatedAt: now,
          calculatorType,
          userId,
        };
        newDrafts = [...drafts, newDraft];
      }
    } else {
      // Create new draft
      newDraft = {
        id: crypto.randomUUID(),
        name,
        data,
        createdAt: now,
        updatedAt: now,
        calculatorType,
        userId,
      };
      newDrafts = [...drafts, newDraft];
    }

    setDrafts(newDrafts);
    persistDrafts(newDrafts);
    return newDraft!;
  }, [drafts, calculatorType, userId, persistDrafts]);

  // Delete a draft
  const deleteDraft = useCallback((id: string) => {
    const newDrafts = drafts.filter(d => d.id !== id);
    setDrafts(newDrafts);
    persistDrafts(newDrafts);
  }, [drafts, persistDrafts]);

  // Get a draft by ID
  const getDraft = useCallback((id: string): ArchivedDraft<T> | undefined => {
    return drafts.find(d => d.id === id);
  }, [drafts]);

  return {
    drafts,
    saveDraft,
    deleteDraft,
    getDraft,
  };
}
