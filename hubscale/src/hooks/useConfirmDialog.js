import { useState, useCallback } from 'react';

/**
 * Shared hook for confirm-before-delete pattern.
 * Returns [target, requestConfirm, executeConfirm, cancelConfirm]
 */
export function useConfirmDialog(onConfirm) {
  const [target, setTarget] = useState(null);

  const request = useCallback((id, e) => {
    if (e) e.stopPropagation();
    setTarget(id);
  }, []);

  const execute = useCallback(() => {
    if (target != null) {
      onConfirm(target);
      setTarget(null);
    }
  }, [target, onConfirm]);

  const cancel = useCallback(() => setTarget(null), []);

  return { target, request, execute, cancel, isOpen: target != null };
}
