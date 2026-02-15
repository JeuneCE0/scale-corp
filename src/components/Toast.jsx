import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';

const ToastContext = createContext(null);

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 5000) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type, duration }]);
    if (duration > 0) {
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
    }
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = {
    info: (msg, dur) => addToast(msg, 'info', dur),
    success: (msg, dur) => addToast(msg, 'success', dur),
    warning: (msg, dur) => addToast(msg, 'warning', dur),
    error: (msg, dur) => addToast(msg, 'error', dur || 8000),
    remove: removeToast,
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

function ToastContainer({ toasts, onRemove }) {
  if (toasts.length === 0) return null;

  const colors = {
    info: { bg: 'rgba(96,165,250,.15)', border: '#60a5fa', icon: 'ℹ️' },
    success: { bg: 'rgba(52,211,153,.15)', border: '#34d399', icon: '✅' },
    warning: { bg: 'rgba(251,146,60,.15)', border: '#fb923c', icon: '⚠️' },
    error: { bg: 'rgba(248,113,113,.15)', border: '#f87171', icon: '❌' },
  };

  return (
    <div style={{
      position: 'fixed', top: 16, right: 16, zIndex: 99999,
      display: 'flex', flexDirection: 'column', gap: 8,
      maxWidth: 380, width: '100%', pointerEvents: 'none',
    }}>
      {toasts.map(t => {
        const c = colors[t.type] || colors.info;
        return (
          <div key={t.id} style={{
            background: c.bg, border: `1px solid ${c.border}33`,
            borderLeft: `3px solid ${c.border}`,
            borderRadius: 10, padding: '10px 14px',
            backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
            display: 'flex', alignItems: 'flex-start', gap: 8,
            animation: 'toastIn .3s ease both',
            pointerEvents: 'auto',
            boxShadow: '0 8px 32px rgba(0,0,0,.3)',
            fontFamily: "'Teachers',sans-serif",
          }}>
            <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>{c.icon}</span>
            <div style={{ flex: 1, fontSize: 12, color: '#e4e4e7', lineHeight: 1.4 }}>{t.message}</div>
            <button onClick={() => onRemove(t.id)} style={{
              background: 'none', border: 'none', color: '#71717a',
              fontSize: 14, cursor: 'pointer', padding: 0, flexShrink: 0, lineHeight: 1,
            }}>✕</button>
          </div>
        );
      })}
    </div>
  );
}
