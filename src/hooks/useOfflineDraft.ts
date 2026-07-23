import { useEffect, useState } from 'react';
import { showToast } from '../components/ui/Toaster';

export function useOfflineDraft<T extends Record<string, any>>(draftKey: string) {
  const [draftLoaded, setDraftLoaded] = useState(false);


  const getSavedDraft = (): Partial<T> => {
    try {
      const saved = localStorage.getItem(`draft_${draftKey}`);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Ignore JSON parse errors
    }
    return {};
  };

  const saveDraft = (values: Partial<T>) => {
    try {
      // Filter out non-serializable fields like files
      const cleanValues: Record<string, any> = {};
      Object.keys(values).forEach((k) => {
        const val = (values as any)[k];
        if (typeof val !== 'function' && !(val && typeof val === 'object' && 'name' in val && 'size' in val)) {
          cleanValues[k] = val;
        }
      });



      localStorage.setItem(`draft_${draftKey}`, JSON.stringify(cleanValues));
    } catch {
      // Storage full or restricted
    }
  };

  const clearDraft = () => {
    try {
      localStorage.removeItem(`draft_${draftKey}`);
    } catch {}
  };

  const hasDraft = () => {
    const d = getSavedDraft();
    return Object.keys(d).length > 0 && (d.title || d.description);
  };

  return {
    getSavedDraft,
    saveDraft,
    clearDraft,
    hasDraft,
  };
}
