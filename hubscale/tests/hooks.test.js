import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useConfirmDialog } from '../src/hooks/useConfirmDialog.js';
import { useUndoStack } from '../src/hooks/useUndoStack.js';

describe('useConfirmDialog', () => {
  it('starts with isOpen false', () => {
    const { result } = renderHook(() => useConfirmDialog(() => {}));
    expect(result.current.isOpen).toBe(false);
    expect(result.current.target).toBeNull();
  });

  it('opens on request and closes on cancel', () => {
    const { result } = renderHook(() => useConfirmDialog(() => {}));
    act(() => result.current.request('abc'));
    expect(result.current.isOpen).toBe(true);
    expect(result.current.target).toBe('abc');
    act(() => result.current.cancel());
    expect(result.current.isOpen).toBe(false);
  });

  it('calls onConfirm with target on execute', () => {
    const onConfirm = vi.fn();
    const { result } = renderHook(() => useConfirmDialog(onConfirm));
    act(() => result.current.request(42));
    act(() => result.current.execute());
    expect(onConfirm).toHaveBeenCalledWith(42);
    expect(result.current.isOpen).toBe(false);
  });
});

describe('useUndoStack', () => {
  it('starts empty', () => {
    const { result } = renderHook(() => useUndoStack(() => {}));
    expect(result.current.canUndo).toBe(false);
    expect(result.current.stackSize).toBe(0);
  });

  it('push adds items and undo restores', () => {
    const onRestore = vi.fn();
    const { result } = renderHook(() => useUndoStack(onRestore));

    act(() => result.current.push({ id: 1, name: 'A' }));
    expect(result.current.canUndo).toBe(true);
    expect(result.current.stackSize).toBe(1);

    act(() => result.current.undo());
    expect(onRestore).toHaveBeenCalledWith({ id: 1, name: 'A' });
  });

  it('undo works LIFO', () => {
    const restored = [];
    const onRestore = (item) => restored.push(item);
    const { result } = renderHook(() => useUndoStack(onRestore));

    act(() => result.current.push({ name: 'A' }));
    act(() => result.current.push({ name: 'B' }));
    expect(result.current.stackSize).toBe(2);

    act(() => result.current.undo());
    expect(restored[0]).toEqual({ name: 'B' });

    act(() => result.current.undo());
    expect(restored[1]).toEqual({ name: 'A' });
    expect(result.current.canUndo).toBe(false);
  });
});
