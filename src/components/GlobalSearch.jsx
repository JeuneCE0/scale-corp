import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { C, FONT, FONT_TITLE, normalizeStr } from "../shared.jsx";

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => { const t = setTimeout(() => setDebounced(value), delay); return () => clearTimeout(t); }, [value, delay]);
  return debounced;
}

export function GlobalSearch({ open, onClose, clients, socs, socBank, ghlData, onNavigate }) {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Keyboard: Escape to close
  useEffect(() => {
    if (!open) return;
    const h = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);

  const results = useMemo(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) return [];
    const q = normalizeStr(debouncedQuery);
    const out = [];
    const MAX = 20;

    // Search clients
    if (clients) {
      for (const cl of clients) {
        if (out.length >= MAX) break;
        const txt = normalizeStr(`${cl.nom || ''} ${cl.prenom || ''} ${cl.email || ''} ${cl.tel || ''}`);
        if (txt.includes(q)) {
          out.push({
            type: 'client',
            icon: '👤',
            title: `${cl.prenom || ''} ${cl.nom || ''}`.trim(),
            sub: cl.email || cl.tel || '',
            action: () => onNavigate('clients', cl),
          });
        }
      }
    }

    // Search societies
    if (socs) {
      for (const s of socs) {
        if (out.length >= MAX) break;
        const txt = normalizeStr(`${s.nom || ''} ${s.desc || ''}`);
        if (txt.includes(q)) {
          out.push({
            type: 'societe',
            icon: '🏢',
            title: s.nom,
            sub: s.desc || '',
            color: s.color,
            action: () => onNavigate('societe', s),
          });
        }
      }
    }

    // Search GHL contacts/prospects
    if (ghlData) {
      for (const [socId, data] of Object.entries(ghlData)) {
        if (out.length >= MAX) break;
        const contacts = data?.contacts || [];
        for (const c of contacts) {
          if (out.length >= MAX) break;
          const txt = normalizeStr(`${c.contactName || c.name || ''} ${c.email || ''} ${c.phone || ''}`);
          if (txt.includes(q)) {
            out.push({
              type: 'prospect',
              icon: '🎯',
              title: c.contactName || c.name || 'Sans nom',
              sub: `${c.email || ''} · ${socs?.find(s => s.id === socId)?.nom || ''}`,
              action: () => onNavigate('crm', c),
            });
          }
        }
      }
    }

    // Search bank transactions
    if (socBank) {
      for (const [socId, bankData] of Object.entries(socBank)) {
        if (out.length >= MAX) break;
        const txs = bankData?.transactions || bankData?.tx || [];
        for (const tx of txs) {
          if (out.length >= MAX) break;
          const desc = tx.description || tx.reference || tx.desc || '';
          if (normalizeStr(desc).includes(q)) {
            out.push({
              type: 'transaction',
              icon: '💳',
              title: desc.slice(0, 60),
              sub: `${tx.amount ? (tx.amount / 100).toFixed(2) + '€' : ''} · ${socs?.find(s => s.id === socId)?.nom || ''}`,
              action: () => onNavigate('banking'),
            });
          }
        }
      }
    }

    return out;
  }, [debouncedQuery, clients, socs, socBank, ghlData, onNavigate]);

  if (!open) return null;

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)',
      zIndex: 2000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      paddingTop: '15vh', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: 520, maxWidth: '92vw', maxHeight: '60vh',
        background: 'rgba(14,14,22,.92)', border: '1px solid rgba(255,255,255,.08)',
        borderRadius: 18, overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,.6)',
        backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)',
      }}>
        {/* Search input */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px',
          borderBottom: '1px solid rgba(255,255,255,.06)',
        }}>
          <span style={{ fontSize: 16, opacity: 0.5 }}>🔍</span>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Rechercher clients, sociétés, transactions…"
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              color: C.t, fontSize: 15, fontFamily: FONT, fontWeight: 500,
            }}
          />
          <kbd style={{
            fontSize: 10, padding: '2px 6px', borderRadius: 4,
            background: 'rgba(255,255,255,.06)', color: C.td, border: '1px solid rgba(255,255,255,.08)',
          }}>ESC</kbd>
        </div>

        {/* Results */}
        <div style={{ overflowY: 'auto', maxHeight: 'calc(60vh - 56px)', padding: '6px 0' }}>
          {query.length >= 2 && results.length === 0 && (
            <div style={{ padding: '24px 18px', textAlign: 'center', color: C.td, fontSize: 12 }}>
              Aucun résultat pour « {query} »
            </div>
          )}
          {results.map((r, i) => (
            <div
              key={i}
              onClick={() => { r.action(); onClose(); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 18px',
                cursor: 'pointer', transition: 'background .1s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.04)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <span style={{ fontSize: 16, width: 28, textAlign: 'center' }}>{r.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.t, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {r.title}
                </div>
                {r.sub && <div style={{ fontSize: 10, color: C.td, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.sub}</div>}
              </div>
              <span style={{
                fontSize: 9, padding: '2px 8px', borderRadius: 10,
                background: r.type === 'client' ? 'rgba(52,211,153,.1)' : r.type === 'prospect' ? 'rgba(255,191,0,.1)' : r.type === 'societe' ? 'rgba(167,139,250,.1)' : 'rgba(255,255,255,.05)',
                color: r.type === 'client' ? '#34d399' : r.type === 'prospect' ? '#FFBF00' : r.type === 'societe' ? '#a78bfa' : C.td,
                fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5,
              }}>
                {r.type === 'client' ? 'Client' : r.type === 'prospect' ? 'Prospect' : r.type === 'societe' ? 'Société' : 'Transaction'}
              </span>
            </div>
          ))}
          {query.length < 2 && (
            <div style={{ padding: '24px 18px', textAlign: 'center', color: C.td, fontSize: 11 }}>
              <div style={{ marginBottom: 8 }}>Tape au moins 2 caractères pour chercher</div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 6, flexWrap: 'wrap' }}>
                {['Clients', 'Sociétés', 'Prospects', 'Transactions'].map(t => (
                  <span key={t} style={{ fontSize: 9, padding: '2px 8px', borderRadius: 10, background: 'rgba(255,255,255,.04)', color: C.td }}>
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
