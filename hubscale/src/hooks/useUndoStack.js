import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Hook for undo-able deletions.
 * Maintains a stack of deleted items, supports Ctrl+Z to restore.
 * @param {Function} onRestore - called with the restored item
 * @param {number} maxSize - max undo stack size
 */
export function useUndoStack(onRestore, maxSize = 20) {
  const [stack, setStack] = useState([]);
  const stackRef = useRef(stack);
  stackRef.current = stack;
  const onRestoreRef = useRef(onRestore);
  onRestoreRef.current = onRestore;

  const push = useCallback((item) => {
    setStack((prev) => [...prev.slice(-(maxSize - 1)), item]);
  }, [maxSize]);

  const undo = useCallback(() => {
    setStack((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      onRestoreRef.current(last);
      return prev.slice(0, -1);
    });
  }, []);

  const canUndo = stack.length > 0;

  useEffect(() => {
    const handleKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        // Only undo if not in an input/textarea
        const tag = document.activeElement?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
        if (stackRef.current.length > 0) {
          e.preventDefault();
          undo();
        }
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [undo]);

  return { push, undo, canUndo, stackSize: stack.length };
}
