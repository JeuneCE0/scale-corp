import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { T } from '../lib/theme.js';
import { uid, ago, fmt, fK, daysSince, leadScore } from '../lib/utils.js';
import { storeDebounced, load } from '../lib/store.js';
import { broadcast, subscribe } from '../lib/sync.js';
import { Card, Btn, Inp, Badge, Modal, EmptyState, Sel, TabBar, ConfirmDialog, Pagination, ScoreRing, triggerConfetti, PremiumGate } from '../components/ui.jsx';
import { isPaid, canAccessPro } from '../lib/plan.js';
import { useConfirmDialog } from '../hooks/useConfirmDialog.js';
import { useUndoStack } from '../hooks/useUndoStack.js';
import { CRM_STATUSES as STATUSES, CRM_FILTER_TABS as FILTER_TABS, LEAD_SCORE_LABELS } from '../lib/constants.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Check if a contact needs a relance alert */
function getRelanceInfo(contact) {
  const days = daysSince(contact.createdAt);
  if (contact.status === 'prospect' && days > 14) return days;
  if (contact.status === 'lead' && days > 21) return days;
  return null;
}

/** Get the score label entry for a given score */
function getScoreLabel(score) {
  return LEAD_SCORE_LABELS.find((l) => score >= l.min) || LEAD_SCORE_LABELS[LEAD_SCORE_LABELS.length - 1];
}

/** Generate a printable invoice HTML in a new window */
function generateInvoice(contact) {
  const now = new Date();
  const dateStr = now.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const invoiceNum = `HS-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Facture ${invoiceNum}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif; color: #1a1a2e; padding: 40px; max-width: 800px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 3px solid #f97316; padding-bottom: 20px; }
    .brand { font-size: 28px; font-weight: 800; background: linear-gradient(135deg, #f97316, #f59e0b); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .brand-sub { font-size: 11px; color: #666; margin-top: 4px; }
    .invoice-meta { text-align: right; }
    .invoice-meta h2 { font-size: 22px; color: #f97316; margin-bottom: 8px; }
    .invoice-meta p { font-size: 12px; color: #666; line-height: 1.6; }
    .client-section { background: #f8f9fa; border-radius: 10px; padding: 20px; margin-bottom: 30px; }
    .client-section h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #999; margin-bottom: 10px; }
    .client-section p { font-size: 13px; line-height: 1.8; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    thead th { background: #1a1a2e; color: #fff; padding: 12px 16px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; text-align: left; }
    thead th:last-child, thead th:nth-child(2), thead th:nth-child(3) { text-align: right; }
    tbody td { padding: 14px 16px; border-bottom: 1px solid #eee; font-size: 13px; }
    tbody td:last-child, tbody td:nth-child(2), tbody td:nth-child(3) { text-align: right; }
    tbody tr:hover { background: #fafafa; }
    .totals { display: flex; justify-content: flex-end; }
    .totals-table { width: 280px; }
    .totals-table .row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 13px; border-bottom: 1px solid #eee; }
    .totals-table .row.total { border-bottom: none; border-top: 2px solid #1a1a2e; padding-top: 12px; margin-top: 4px; font-weight: 800; font-size: 16px; color: #f97316; }
    .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; font-size: 11px; color: #999; line-height: 1.8; }
    .footer strong { color: #666; }
    @media print {
      body { padding: 20px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="text-align:center;margin-bottom:20px;">
    <button onclick="window.print()" style="background:linear-gradient(135deg,#f97316,#f59e0b);color:#fff;border:none;padding:10px 24px;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;">Imprimer / PDF</button>
  </div>

  <div class="header">
    <div>
      <div class="brand">HubScale</div>
      <div class="brand-sub">Plateforme de gestion commerciale</div>
    </div>
    <div class="invoice-meta">
      <h2>FACTURE</h2>
      <p>
        <strong>N° :</strong> ${invoiceNum}<br>
        <strong>Date :</strong> ${dateStr}
      </p>
    </div>
  </div>

  <div class="client-section">
    <h3>Facturer à</h3>
    <p>
      <strong>${contact.name || ''}</strong><br>
      ${contact.company ? contact.company + '<br>' : ''}
      ${contact.email ? contact.email : ''}
      ${contact.phone ? '<br>' + contact.phone : ''}
    </p>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:50%">Description</th>
        <th style="width:10%">Qté</th>
        <th style="width:20%">Prix unitaire HT</th>
        <th style="width:20%">Total HT</th>
      </tr>
    </thead>
    <tbody>
      <tr><td contenteditable="true" style="min-height:20px">&nbsp;</td><td contenteditable="true">&nbsp;</td><td contenteditable="true">&nbsp;</td><td contenteditable="true">&nbsp;</td></tr>
      <tr><td contenteditable="true">&nbsp;</td><td contenteditable="true">&nbsp;</td><td contenteditable="true">&nbsp;</td><td contenteditable="true">&nbsp;</td></tr>
      <tr><td contenteditable="true">&nbsp;</td><td contenteditable="true">&nbsp;</td><td contenteditable="true">&nbsp;</td><td contenteditable="true">&nbsp;</td></tr>
    </tbody>
  </table>

  <div class="totals">
    <div class="totals-table">
      <div class="row"><span>Sous-total HT</span><span contenteditable="true">0,00 €</span></div>
      <div class="row"><span>TVA (20%)</span><span contenteditable="true">0,00 €</span></div>
      <div class="row total"><span>Total TTC</span><span contenteditable="true">0,00 €</span></div>
    </div>
  </div>

  <div class="footer">
    <p>
      <strong>Conditions de paiement :</strong> Paiement à 30 jours à compter de la date de facturation.<br>
      <strong>Coordonnées bancaires :</strong> IBAN FR76 XXXX XXXX XXXX XXXX XXXX XXX &bull; BIC XXXXXXXX<br>
      <strong>HubScale SAS</strong> &mdash; SIRET 000 000 000 00000 &mdash; TVA FR00 000000000<br>
      Merci pour votre confiance.
    </p>
  </div>
</body>
</html>`;

  const w = window.open('', '_blank');
  if (w) {
    w.document.write(html);
    w.document.close();
  }
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function CRM() {
  // ---- Core state ----
  const [contacts, setContacts] = useState(() => load('contacts') || []);
  const [filter, setFilter] = useState('Tous');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const searchTimer = useRef(null);
  const [viewMode, setViewMode] = useState('table');
  const [view, setView] = useState('list'); // 'list' or 'pipeline'
  const [undoMsg, setUndoMsg] = useState('');

  // ---- Score filter ----
  const [scoreFilter, setScoreFilter] = useState(null); // null | 'Hot' | 'Warm' | 'Tiède' | 'Froid'

  // ---- Selection for bulk actions ----
  const [selected, setSelected] = useState(new Set());

  // ---- Toast for conversion celebration ----
  const [conversionToast, setConversionToast] = useState(null);

  // Debounced search handler
  const handleSearch = useCallback((v) => {
    setSearch(v);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setDebouncedSearch(v), 200);
  }, []);

  const contactLimit = canAccessPro() ? Infinity : isPaid() ? 100 : 20;
  const atContactLimit = contacts.length >= contactLimit;

  // ---- Modal state ----
  const [showModal, setShowModal] = useState(false);
  const [showLimitGate, setShowLimitGate] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', company: '', phone: '', status: 'prospect', notes: '' });
  const [newComment, setNewComment] = useState('');

  // ---- Undo stack for deletions ----
  const undoRestore = useCallback((item) => {
    setContacts((prev) => [...prev, item]);
    setUndoMsg(`"${item.name}" restauré`);
    setTimeout(() => setUndoMsg(''), 3000);
  }, []);
  const undo = useUndoStack(undoRestore);

  const deleteContact = useCallback((id) => {
    setContacts((prev) => {
      const contact = prev.find((c) => c.id === id);
      if (contact) undo.push(contact);
      return prev.filter((c) => c.id !== id);
    });
    setSelected((prev) => { const next = new Set(prev); next.delete(id); return next; });
  }, [undo]);
  const del = useConfirmDialog(deleteContact);

  const [saved, setSaved] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [duplicateWarning, setDuplicateWarning] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  // ---- Persist + broadcast to other tabs ----
  useEffect(() => {
    storeDebounced('contacts', contacts);
    broadcast('contacts', contacts);
  }, [contacts]);

  useEffect(() => subscribe('contacts', (data) => setContacts(data)), []);

  // ---- KPI counts ----
  const counts = useMemo(() =>
    STATUSES.reduce((acc, s) => { acc[s.id] = contacts.filter((c) => c.status === s.id).length; return acc; }, {}),
    [contacts]
  );

  const filterCounts = useMemo(() => {
    const c = {};
    FILTER_TABS.forEach((f) => {
      c[f] = f === 'Tous' ? contacts.length : contacts.filter((ct) => ct.status === f.toLowerCase()).length;
    });
    return c;
  }, [contacts]);

  // ---- Pipeline value KPI ----
  const pipelineValue = useMemo(() => {
    const finHistory = load('finHistory') || [];
    const clients = contacts.filter((c) => c.status === 'client');
    let avgCA = 5000;
    if (finHistory.length > 0 && clients.length > 0) {
      const totalCA = finHistory.reduce((sum, r) => sum + (r.ca || 0), 0);
      avgCA = Math.round(totalCA / finHistory.length / Math.max(clients.length, 1));
    }
    const pipelineContacts = contacts.filter((c) => c.status !== 'perdu' && c.status !== 'client');
    return pipelineContacts.length * avgCA;
  }, [contacts]);

  // ---- Filtering (status + search + score) ----
  const filtered = useMemo(() => {
    return contacts.filter((c) => {
      // Status filter
      if (filter !== 'Tous' && c.status !== filter.toLowerCase()) return false;
      // Text search
      if (debouncedSearch) {
        const q = debouncedSearch.toLowerCase();
        if (!(c.name || '').toLowerCase().includes(q) && !(c.email || '').toLowerCase().includes(q) && !(c.company || '').toLowerCase().includes(q)) return false;
      }
      // Score filter
      if (scoreFilter) {
        const score = leadScore(c);
        const label = getScoreLabel(score);
        if (label.label !== scoreFilter) return false;
      }
      return true;
    });
  }, [contacts, filter, debouncedSearch, scoreFilter]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      if (sortBy === 'score') {
        const sa = leadScore(a);
        const sb = leadScore(b);
        return sortDir === 'asc' ? sa - sb : sb - sa;
      }
      const va = (a[sortBy] || '').toLowerCase();
      const vb = (b[sortBy] || '').toLowerCase();
      return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
    });
  }, [filtered, sortBy, sortDir]);

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paginated = useMemo(() => sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [sorted, page]);

  useEffect(() => { setPage(1); }, [filter, debouncedSearch, scoreFilter]);

  // Clear selection when filter changes
  useEffect(() => { setSelected(new Set()); }, [filter, debouncedSearch, scoreFilter]);

  const toggleSort = useCallback((col) => {
    setSortBy((prev) => { if (prev === col) { setSortDir((d) => d === 'asc' ? 'desc' : 'asc'); } else { setSortDir('asc'); } return col; });
  }, []);

  // ---- Modal open/close ----
  const openNew = useCallback(() => {
    if (atContactLimit) { setShowLimitGate(true); return; }
    setEditId(null);
    setForm({ name: '', email: '', company: '', phone: '', status: 'prospect', notes: '' });
    setNewComment('');
    setShowModal(true);
  }, [atContactLimit]);

  const openEdit = useCallback((c) => {
    setEditId(c.id);
    setForm({ name: c.name, email: c.email, company: c.company, phone: c.phone, status: c.status, notes: c.notes || '' });
    setNewComment('');
    setShowModal(true);
  }, []);

  // ---- Validation ----
  const validateEmail = useCallback((email) => {
    if (!email) return '';
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? '' : 'Format email invalide';
  }, []);

  const checkDuplicate = useCallback((name, email) => {
    const match = contacts.find((c) =>
      c.id !== editId && (
        (email && c.email && c.email.toLowerCase() === email.toLowerCase()) ||
        (name && c.name && c.name.toLowerCase() === name.trim().toLowerCase())
      )
    );
    return match ? `Doublon possible : ${match.name} (${match.email || "pas d'email"})` : '';
  }, [contacts, editId]);

  // ---- Save contact (with history tracking + confetti) ----
  const saveContact = useCallback(() => {
    if (!form.name.trim()) return;
    const emailErr = validateEmail(form.email);
    if (emailErr) { setEmailError(emailErr); return; }

    const commentToAdd = newComment.trim() ? { text: newComment.trim(), date: new Date().toISOString() } : null;

    if (editId) {
      setContacts((prev) => prev.map((c) => {
        if (c.id !== editId) return c;
        const updatedComments = [...(c.commentaires || [])];
        if (commentToAdd) updatedComments.push(commentToAdd);

        // Track status change in history
        const history = [...(c.history || [])];
        if (c.status !== form.status) {
          history.push({ type: 'status', from: c.status, to: form.status, date: new Date().toISOString() });
          // Confetti on conversion to client
          if (form.status === 'client' && c.status !== 'client') {
            setTimeout(() => {
              triggerConfetti();
              setConversionToast(form.name);
              setTimeout(() => setConversionToast(null), 4000);
            }, 100);
          }
        }

        return { ...c, ...form, commentaires: updatedComments, history };
      }));
    } else {
      const newContact = {
        ...form,
        id: uid(),
        createdAt: new Date().toISOString(),
        commentaires: commentToAdd ? [commentToAdd] : [],
        history: [],
      };
      // Confetti if new contact created directly as client
      if (form.status === 'client') {
        setTimeout(() => {
          triggerConfetti();
          setConversionToast(form.name);
          setTimeout(() => setConversionToast(null), 4000);
        }, 100);
      }
      setContacts((prev) => [...prev, newContact]);
    }

    setForm({ name: '', email: '', company: '', phone: '', status: 'prospect', notes: '' });
    setNewComment('');
    setEditId(null);
    setShowModal(false);
    setEmailError('');
    setDuplicateWarning('');
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [form, editId, validateEmail, newComment]);

  // ---- CSV Import ----
  const csvInputRef = useRef(null);
  const [importResult, setImportResult] = useState(null);

  const handleCSVImport = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;
      const lines = text.split(/\r?\n/).filter((l) => l.trim());
      if (lines.length < 2) { setImportResult({ error: 'Fichier vide ou invalide' }); return; }

      const header = lines[0].toLowerCase().split(',').map((h) => h.trim().replace(/^["']|["']$/g, ''));
      const nameIdx = header.findIndex((h) => h === 'nom' || h === 'name');
      const emailIdx = header.findIndex((h) => h === 'email' || h === 'mail');
      const companyIdx = header.findIndex((h) => h === 'société' || h === 'societe' || h === 'company');
      const phoneIdx = header.findIndex((h) => h === 'téléphone' || h === 'telephone' || h === 'phone' || h === 'tel');
      const statusIdx = header.findIndex((h) => h === 'statut' || h === 'status');

      if (nameIdx === -1) { setImportResult({ error: 'Colonne "Nom" introuvable dans le CSV' }); return; }

      let imported = 0;
      let skipped = 0;
      const newContacts = [];

      for (let i = 1; i < lines.length; i++) {
        const cols = parseCSVLine(lines[i]);
        const name = (cols[nameIdx] || '').trim();
        if (!name) { skipped++; continue; }

        const email = emailIdx >= 0 ? (cols[emailIdx] || '').trim() : '';
        const company = companyIdx >= 0 ? (cols[companyIdx] || '').trim() : '';
        const phone = phoneIdx >= 0 ? (cols[phoneIdx] || '').trim() : '';
        const rawStatus = statusIdx >= 0 ? (cols[statusIdx] || '').trim().toLowerCase() : 'prospect';
        const status = STATUSES.find((s) => s.id === rawStatus) ? rawStatus : 'prospect';

        const isDup = contacts.some((c) =>
          (email && c.email && c.email.toLowerCase() === email.toLowerCase()) ||
          (c.name && c.name.toLowerCase() === name.toLowerCase())
        ) || newContacts.some((c) =>
          (email && c.email && c.email.toLowerCase() === email.toLowerCase()) ||
          (c.name && c.name.toLowerCase() === name.toLowerCase())
        );

        if (isDup) { skipped++; continue; }

        newContacts.push({ id: uid(), name, email, company, phone, status, notes: '', commentaires: [], history: [], createdAt: new Date().toISOString() });
        imported++;
      }

      if (newContacts.length > 0) {
        setContacts((prev) => [...prev, ...newContacts]);
      }
      setImportResult({ imported, skipped });
      setTimeout(() => setImportResult(null), 5000);
    };
    reader.readAsText(file);
    e.target.value = '';
  }, [contacts]);

  // ---- Kanban drag and drop (with confetti on client conversion) ----
  const [dragId, setDragId] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);

  const handleDragStart = useCallback((e, id) => {
    setDragId(id);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDrop = useCallback((e, newStatus) => {
    e.preventDefault();
    setDragOverCol(null);
    if (dragId) {
      setContacts((prev) => prev.map((c) => {
        if (c.id !== dragId) return c;
        if (c.status === newStatus) return c;
        const history = [...(c.history || [])];
        history.push({ type: 'status', from: c.status, to: newStatus, date: new Date().toISOString() });
        // Confetti on conversion to client
        if (newStatus === 'client' && c.status !== 'client') {
          setTimeout(() => {
            triggerConfetti();
            setConversionToast(c.name);
            setTimeout(() => setConversionToast(null), 4000);
          }, 100);
        }
        return { ...c, status: newStatus, history };
      }));
      setDragId(null);
    }
  }, [dragId]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  // ---- Bulk actions ----
  const toggleSelect = useCallback((id, e) => {
    if (e) e.stopPropagation();
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelected((prev) => {
      if (prev.size === paginated.length && paginated.every((c) => prev.has(c.id))) {
        return new Set();
      }
      return new Set(paginated.map((c) => c.id));
    });
  }, [paginated]);

  const bulkChangeStatus = useCallback((newStatus) => {
    setContacts((prev) => prev.map((c) => {
      if (!selected.has(c.id)) return c;
      if (c.status === newStatus) return c;
      const history = [...(c.history || [])];
      history.push({ type: 'status', from: c.status, to: newStatus, date: new Date().toISOString() });
      if (newStatus === 'client' && c.status !== 'client') {
        setTimeout(() => {
          triggerConfetti();
          setConversionToast(`${selected.size} contact(s)`);
          setTimeout(() => setConversionToast(null), 4000);
        }, 100);
      }
      return { ...c, status: newStatus, history };
    }));
    setSelected(new Set());
  }, [selected]);

  const bulkDelete = useCallback(() => {
    setContacts((prev) => {
      const toDelete = prev.filter((c) => selected.has(c.id));
      toDelete.forEach((c) => undo.push(c));
      return prev.filter((c) => !selected.has(c.id));
    });
    setSelected(new Set());
    setUndoMsg(`${selected.size} contact(s) supprimé(s)`);
    setTimeout(() => setUndoMsg(''), 3000);
  }, [selected, undo]);

  // ---- Currently edited contact ----
  const editContact = editId ? contacts.find((c) => c.id === editId) : null;
  const editComments = editContact?.commentaires || [];

  // ---- Activity timeline for modal ----
  const activityTimeline = useMemo(() => {
    if (!editContact) return [];
    const events = [];

    // Created event
    if (editContact.createdAt) {
      events.push({
        type: 'created',
        date: editContact.createdAt,
        label: 'Contact créé',
        icon: '➕',
      });
    }

    // Comments
    (editContact.commentaires || []).forEach((c) => {
      events.push({
        type: 'comment',
        date: c.date,
        label: c.text,
        icon: '💬',
      });
    });

    // Status changes from history
    (editContact.history || []).forEach((h) => {
      if (h.type === 'status') {
        const fromLabel = STATUSES.find((s) => s.id === h.from)?.label || h.from;
        const toLabel = STATUSES.find((s) => s.id === h.to)?.label || h.to;
        events.push({
          type: 'status',
          date: h.date,
          label: `${fromLabel} → ${toLabel}`,
          icon: '🔄',
          from: h.from,
          to: h.to,
        });
      }
    });

    // Sort by date descending (most recent first)
    events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return events;
  }, [editContact]);

  // ---- Score distribution for filter chips ----
  const scoreDistribution = useMemo(() => {
    const dist = { Hot: 0, Warm: 0, 'Tiède': 0, Froid: 0 };
    contacts.forEach((c) => {
      const score = leadScore(c);
      const label = getScoreLabel(score);
      dist[label.label]++;
    });
    return dist;
  }, [contacts]);

  // ---- All-pages selection check ----
  const allPageSelected = paginated.length > 0 && paginated.every((c) => selected.has(c.id));

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------

  return (
    <div>
      {/* Page header */}
      <div className="fade-up" style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>CRM</h1>
        <p style={{ color: T.textSecondary, fontSize: 12, marginTop: 4 }}>Gestion des contacts et pipeline commercial</p>
      </div>

      {/* KPI Grid */}
      <div className="fade-up d1 kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 10, marginBottom: 20 }}>
        {STATUSES.map((s) => (
          <div key={s.id} className="glass-static" style={{ padding: '12px 14px', textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{counts[s.id] || 0}</div>
            <div style={{ fontSize: 9, fontWeight: 700, color: s.color, letterSpacing: .8, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
        {/* Pipeline Value KPI */}
        <div className="glass-static" style={{ padding: '12px 14px', textAlign: 'center', borderLeft: `3px solid ${T.accent}` }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: T.accent }}>{fK(pipelineValue)}€</div>
          <div style={{ fontSize: 9, fontWeight: 700, color: T.accent, letterSpacing: .8, marginTop: 2 }}>PIPELINE</div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="fade-up d2" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10, flexWrap: 'wrap' }}>
        <TabBar items={FILTER_TABS} active={filter} onChange={(f) => { setFilter(f); setScoreFilter(null); }} counts={filterCounts} compact />
        <div style={{ flex: 1, minWidth: 140 }}>
          <div className="glass-input" style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ padding: '0 8px 0 12px', color: T.textMuted, fontSize: 13 }}>{'🔍'}</span>
            <input value={search} onChange={(e) => handleSearch(e.target.value)} placeholder="Rechercher..."
              aria-label="Rechercher un contact"
              style={{ flex: 1, background: 'transparent', border: 'none', color: T.text, padding: '8px 12px 8px 0', fontSize: 12, fontFamily: 'inherit', outline: 'none', width: '100%' }} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <Btn v={viewMode === 'table' ? 'primary' : 'ghost'} small onClick={() => setViewMode('table')} aria-label="Vue tableau">{'☰'}</Btn>
          <Btn v={viewMode === 'kanban' ? 'primary' : 'ghost'} small onClick={() => setViewMode('kanban')} aria-label="Vue Kanban">{'▦'}</Btn>
        </div>
        <div style={{ display: 'flex', gap: 2, background: T.surface2, borderRadius: 8, padding: 2 }}>
          <button
            onClick={() => setView('list')}
            style={{
              background: view === 'list' ? T.accent : 'transparent',
              color: view === 'list' ? '#fff' : T.textMuted,
              border: 'none', borderRadius: 6, padding: '5px 12px',
              fontSize: 11, fontWeight: 600, cursor: 'pointer',
              fontFamily: 'inherit', transition: 'all .15s',
            }}
          >Liste</button>
          <button
            onClick={() => setView('pipeline')}
            style={{
              background: view === 'pipeline' ? T.accent : 'transparent',
              color: view === 'pipeline' ? '#fff' : T.textMuted,
              border: 'none', borderRadius: 6, padding: '5px 12px',
              fontSize: 11, fontWeight: 600, cursor: 'pointer',
              fontFamily: 'inherit', transition: 'all .15s',
            }}
          >Pipeline</button>
        </div>
        <Btn v="secondary" small onClick={() => csvInputRef.current?.click()} aria-label="Importer CSV">{'↑'} Import CSV</Btn>
        <input ref={csvInputRef} type="file" accept=".csv" onChange={handleCSVImport} style={{ display: 'none' }} />
        {contactLimit < Infinity && (
          <span style={{ fontSize: 10, color: atContactLimit ? T.red : T.textMuted, fontWeight: 600 }}>
            {contacts.length}/{contactLimit}
          </span>
        )}
        <Btn onClick={openNew} aria-label="Ajouter un contact" style={{ background: atContactLimit ? T.surface2 : 'linear-gradient(135deg, #f97316, #f59e0b)', boxShadow: atContactLimit ? 'none' : '0 2px 12px rgba(249,115,22,.3)', opacity: atContactLimit ? .7 : 1 }}>
          {atContactLimit ? '🔒 Limite atteinte' : '+ Contact'}
        </Btn>
      </div>

      {/* Score filter chips */}
      <div className="fade-up d2" style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 10, color: T.textMuted, fontWeight: 600, marginRight: 4 }}>Score :</span>
        {LEAD_SCORE_LABELS.map((sl) => {
          const isActive = scoreFilter === sl.label;
          return (
            <button
              key={sl.label}
              onClick={() => setScoreFilter(isActive ? null : sl.label)}
              style={{
                background: isActive ? sl.bg : 'transparent',
                border: `1px solid ${isActive ? sl.color + '66' : T.border}`,
                borderRadius: 20, padding: '4px 10px', cursor: 'pointer',
                fontSize: 10, fontWeight: 600, color: isActive ? sl.color : T.textMuted,
                fontFamily: 'inherit', transition: 'all .15s',
                display: 'flex', alignItems: 'center', gap: 4,
              }}
            >
              <span>{sl.icon}</span>
              <span>{sl.label}</span>
              <span style={{ opacity: .7 }}>({scoreDistribution[sl.label] || 0})</span>
            </button>
          );
        })}
        {scoreFilter && (
          <button onClick={() => setScoreFilter(null)} style={{
            background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 20,
            padding: '4px 8px', cursor: 'pointer', fontSize: 10, color: T.textMuted,
            fontFamily: 'inherit',
          }}>{'✕'} Reset</button>
        )}
      </div>

      {/* Undo + Import + Conversion feedback */}
      {(undoMsg || importResult || conversionToast) && (
        <div style={{ marginBottom: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {undoMsg && (
            <div style={{ fontSize: 11, color: T.green, fontWeight: 600, padding: '6px 12px', borderRadius: 8, background: T.greenBg, border: `1px solid ${T.green}22` }}>
              {'↩'} {undoMsg}
            </div>
          )}
          {importResult && (
            <div style={{ fontSize: 11, fontWeight: 600, padding: '6px 12px', borderRadius: 8, background: importResult.error ? T.redBg : T.greenBg, color: importResult.error ? T.red : T.green, border: `1px solid ${importResult.error ? T.red : T.green}22` }}>
              {importResult.error || `✓ ${importResult.imported} contact${importResult.imported > 1 ? 's' : ''} importé${importResult.imported > 1 ? 's' : ''}${importResult.skipped ? ` (${importResult.skipped} doublon${importResult.skipped > 1 ? 's' : ''} ignoré${importResult.skipped > 1 ? 's' : ''})` : ''}`}
            </div>
          )}
          {conversionToast && (
            <div className="scale-in" style={{
              fontSize: 12, fontWeight: 700, padding: '8px 16px', borderRadius: 10,
              background: T.greenBg, color: T.green,
              border: `1px solid ${T.green}44`,
              boxShadow: `0 4px 16px ${T.green}22`,
            }}>
              {'🎉'} Nouveau client : {conversionToast} !
            </div>
          )}
        </div>
      )}

      {undo.canUndo && !undoMsg && (
        <div style={{ marginBottom: 12, fontSize: 11, color: T.textMuted, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Btn v="ghost" small onClick={undo.undo}>{'↩'} Annuler ({undo.stackSize})</Btn>
          <span>Ctrl+Z pour annuler la dernière suppression</span>
        </div>
      )}

      {/* ---- TABLE VIEW ---- */}
      {viewMode === 'table' && view === 'list' && (
        <>
          {filtered.length === 0 ? (
            <Card>
              <EmptyState icon={'👥'} title="Aucun contact" sub="Ajoutez votre premier contact pour commencer"
                action={<Btn onClick={openNew} style={{ background: 'linear-gradient(135deg, #f97316, #f59e0b)' }}>Ajouter un contact</Btn>} />
            </Card>
          ) : (
            <Card style={{ padding: 0, overflow: 'hidden' }}>
              <div className="table-wrap">
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                      {/* Checkbox column */}
                      <th style={{ padding: '10px 8px 10px 14px', width: 36 }}>
                        <input
                          type="checkbox"
                          checked={allPageSelected}
                          onChange={toggleSelectAll}
                          aria-label="Sélectionner tout"
                          style={{ cursor: 'pointer', accentColor: T.accent }}
                        />
                      </th>
                      {[
                        { label: 'Nom', key: 'name' },
                        { label: 'Score', key: 'score' },
                        { label: 'Email', key: 'email' },
                        { label: 'Société', key: 'company' },
                        { label: 'Téléphone', key: null },
                        { label: 'Statut', key: 'status' },
                        { label: '', key: null },
                      ].map((h, i) => (
                        <th key={h.label + i} scope="col" onClick={h.key ? () => toggleSort(h.key) : undefined}
                          style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: T.textMuted, fontSize: 10, textTransform: 'uppercase', letterSpacing: .5, cursor: h.key ? 'pointer' : 'default', userSelect: 'none' }}>
                          {h.label}{h.key && sortBy === h.key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((c) => {
                      const st = STATUSES.find((s) => s.id === c.status);
                      const relanceDays = getRelanceInfo(c);
                      const score = leadScore(c);
                      const isSelected = selected.has(c.id);
                      return (
                        <tr key={c.id} onClick={() => openEdit(c)} style={{
                          borderBottom: `1px solid ${T.border}22`, cursor: 'pointer',
                          background: isSelected ? T.accentBg : 'transparent',
                          transition: 'background .1s',
                        }}>
                          {/* Selection checkbox */}
                          <td style={{ padding: '10px 8px 10px 14px', width: 36 }}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => toggleSelect(c.id, e)}
                              onClick={(e) => e.stopPropagation()}
                              style={{ cursor: 'pointer', accentColor: T.accent }}
                            />
                          </td>
                          <td style={{ padding: '10px 14px', fontWeight: 600, color: T.text }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span>{c.name}</span>
                              {relanceDays && (
                                <span style={{ fontSize: 10, fontWeight: 600, color: T.orange, background: T.orangeBg, padding: '2px 6px', borderRadius: 6, whiteSpace: 'nowrap' }}>
                                  {'⚠️'} Relance {relanceDays}j
                                </span>
                              )}
                            </div>
                          </td>
                          {/* Score column with ScoreRing */}
                          <td style={{ padding: '10px 8px' }}>
                            <ScoreRing score={score} size={28} strokeWidth={3} />
                          </td>
                          <td style={{ padding: '10px 14px', color: T.textSecondary }}>{c.email || '—'}</td>
                          <td style={{ padding: '10px 14px', color: T.textSecondary }}>{c.company || '—'}</td>
                          <td style={{ padding: '10px 14px', color: T.textSecondary }}>{c.phone || '—'}</td>
                          <td style={{ padding: '10px 14px' }}><Badge label={st?.label} color={st?.color} bg={st?.bg} /></td>
                          <td style={{ padding: '10px 14px' }}>
                            <Btn v="danger" small aria-label={`Supprimer ${c.name}`} onClick={(e) => del.request(c.id, e)}>{'✕'}</Btn>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <Pagination page={page} totalPages={totalPages} onChange={setPage} />
            </Card>
          )}
        </>
      )}

      {/* ---- KANBAN VIEW ---- */}
      {viewMode === 'kanban' && view === 'list' && (
        <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 12 }}>
          {STATUSES.map((status) => {
            const colContacts = contacts.filter((c) => c.status === status.id);
            return (
              <div key={status.id}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, status.id)}
                style={{
                  minWidth: 220, maxWidth: 280, flex: '1 0 220px',
                  background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`,
                  display: 'flex', flexDirection: 'column', maxHeight: '70vh',
                }}>
                <div style={{ padding: '12px 14px', borderBottom: `2px solid ${status.color}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: status.color, letterSpacing: .5 }}>{status.label}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, background: T.surface2, borderRadius: 10, padding: '2px 8px' }}>{colContacts.length}</span>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {colContacts.length === 0 && (
                    <div style={{ textAlign: 'center', padding: 16, fontSize: 11, color: T.textMuted }}>Aucun contact</div>
                  )}
                  {colContacts.map((c) => {
                    const relanceDays = getRelanceInfo(c);
                    const score = leadScore(c);
                    const sl = getScoreLabel(score);
                    return (
                      <div key={c.id} draggable onDragStart={(e) => handleDragStart(e, c.id)}
                        onClick={() => openEdit(c)}
                        style={{
                          padding: '10px 12px', borderRadius: 10, background: T.surface2,
                          border: `1px solid ${dragId === c.id ? status.color : T.border}`,
                          cursor: 'grab', transition: 'all .15s',
                          opacity: dragId === c.id ? 0.5 : 1,
                        }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                          <div style={{ fontWeight: 600, fontSize: 12, color: T.text }}>{c.name}</div>
                          {/* Score badge on Kanban card */}
                          <span style={{
                            fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 10,
                            background: sl.bg, color: sl.color, whiteSpace: 'nowrap',
                            display: 'inline-flex', alignItems: 'center', gap: 2,
                          }}>
                            {sl.icon} {score}
                          </span>
                        </div>
                        {c.company && <div style={{ fontSize: 10, color: T.textSecondary }}>{c.company}</div>}
                        {c.email && <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2 }}>{c.email}</div>}
                        {relanceDays && (
                          <div style={{ marginTop: 4, fontSize: 10, fontWeight: 600, color: T.orange, background: T.orangeBg, padding: '2px 6px', borderRadius: 6, display: 'inline-block' }}>
                            {'⚠️'} Relance {relanceDays}j
                          </div>
                        )}
                        <div style={{ marginTop: 6, display: 'flex', justifyContent: 'flex-end' }}>
                          <Btn v="danger" small aria-label={`Supprimer ${c.name}`} onClick={(e) => del.request(c.id, e)}>{'✕'}</Btn>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ---- PIPELINE VIEW (Kanban) ---- */}
      {view === 'pipeline' && (() => {
        // Contacts filtered by search (reuse the existing filtered array which respects search + status + score filters)
        // For pipeline, we show all statuses as columns, but only show contacts matching the text search
        const pipelineContacts = contacts.filter((c) => {
          if (debouncedSearch) {
            const q = debouncedSearch.toLowerCase();
            if (!(c.name || '').toLowerCase().includes(q) && !(c.email || '').toLowerCase().includes(q) && !(c.company || '').toLowerCase().includes(q)) return false;
          }
          if (scoreFilter) {
            const score = leadScore(c);
            const label = getScoreLabel(score);
            if (label.label !== scoreFilter) return false;
          }
          return true;
        });

        return (
          <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 16, minHeight: 400 }}>
            {STATUSES.map((status) => {
              const colContacts = pipelineContacts.filter((c) => c.status === status.id);
              const isOver = dragOverCol === status.id && dragId;
              const totalCA = colContacts.reduce((sum, c) => sum + (c.ca || 0), 0);
              const avgScore = colContacts.length > 0
                ? Math.round(colContacts.reduce((sum, c) => sum + leadScore(c), 0) / colContacts.length)
                : 0;

              return (
                <div
                  key={status.id}
                  onDragOver={(e) => { handleDragOver(e); setDragOverCol(status.id); }}
                  onDragLeave={() => setDragOverCol(null)}
                  onDrop={(e) => handleDrop(e, status.id)}
                  style={{
                    minWidth: 240, maxWidth: 300, flex: '1 0 240px',
                    background: T.surface,
                    borderRadius: 14,
                    border: `1px solid ${isOver ? status.color : T.border}`,
                    borderTop: `3px solid ${status.color}`,
                    display: 'flex', flexDirection: 'column',
                    maxHeight: '75vh',
                    transition: 'border-color .2s, box-shadow .2s',
                    boxShadow: isOver ? `0 0 0 2px ${status.color}33, 0 4px 16px ${status.color}22` : 'none',
                  }}
                >
                  {/* Column header */}
                  <div style={{
                    padding: '12px 14px',
                    borderBottom: `1px solid ${T.border}`,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{
                        fontSize: 11, fontWeight: 700, color: status.color,
                        letterSpacing: .5, textTransform: 'uppercase',
                      }}>{status.label}</span>
                    </div>
                    <span style={{
                      fontSize: 11, fontWeight: 700, color: T.textMuted,
                      background: T.surface2, borderRadius: 10, padding: '2px 8px',
                      minWidth: 24, textAlign: 'center',
                    }}>{colContacts.length}</span>
                  </div>

                  {/* Drop indicator */}
                  {isOver && (
                    <div style={{
                      margin: '8px 8px 0', padding: '8px',
                      borderRadius: 8, border: `2px dashed ${status.color}`,
                      background: status.bg, textAlign: 'center',
                      fontSize: 10, color: status.color, fontWeight: 600,
                    }}>
                      Déposer ici
                    </div>
                  )}

                  {/* Scrollable card list */}
                  <div style={{
                    flex: 1, overflowY: 'auto', padding: 8,
                    display: 'flex', flexDirection: 'column', gap: 8,
                  }}>
                    {colContacts.length === 0 && !isOver && (
                      <div style={{
                        textAlign: 'center', padding: 24,
                        fontSize: 11, color: T.textMuted, fontStyle: 'italic',
                      }}>Aucun contact</div>
                    )}
                    {colContacts.map((c) => {
                      const score = leadScore(c);
                      const isDragging = dragId === c.id;
                      const truncEmail = c.email && c.email.length > 24 ? c.email.slice(0, 22) + '...' : c.email;

                      return (
                        <div
                          key={c.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, c.id)}
                          onDragEnd={() => { setDragId(null); setDragOverCol(null); }}
                          onClick={() => openEdit(c)}
                          style={{
                            padding: '10px 12px', borderRadius: 10,
                            background: T.surface2,
                            border: `1px solid ${isDragging ? status.color : T.border}`,
                            cursor: 'grab',
                            transition: 'all .2s ease',
                            opacity: isDragging ? 0.4 : 1,
                            transform: isDragging ? 'scale(0.95)' : 'scale(1)',
                          }}
                        >
                          {/* Name + ScoreRing row */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                            <div style={{ fontWeight: 600, fontSize: 12, color: T.text, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {c.name}
                            </div>
                            <ScoreRing score={score} size={26} strokeWidth={3} />
                          </div>

                          {/* Company */}
                          {c.company && (
                            <div style={{ fontSize: 10, color: T.textSecondary, marginBottom: 2 }}>
                              {c.company}
                            </div>
                          )}

                          {/* Email truncated */}
                          {c.email && (
                            <div style={{ fontSize: 10, color: T.textMuted, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {truncEmail}
                            </div>
                          )}

                          {/* Bottom row: date + CA */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                            <span style={{ fontSize: 9, color: T.textMuted }}>
                              {ago(c.createdAt)}
                            </span>
                            {c.ca > 0 && (
                              <span style={{
                                fontSize: 9, fontWeight: 700, color: T.green,
                                background: T.greenBg, padding: '1px 6px', borderRadius: 6,
                              }}>
                                {fK(c.ca)}€
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Column stats footer */}
                  <div style={{
                    padding: '8px 12px',
                    borderTop: `1px solid ${T.border}`,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    fontSize: 10, color: T.textMuted,
                  }}>
                    <span title="CA total de la colonne">
                      CA : <strong style={{ color: totalCA > 0 ? T.green : T.textMuted }}>{totalCA > 0 ? fK(totalCA) + '€' : '—'}</strong>
                    </span>
                    <span title="Score moyen de la colonne">
                      Score moy. : <strong style={{ color: avgScore >= 60 ? T.orange : T.textMuted }}>{colContacts.length > 0 ? avgScore : '—'}</strong>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* ---- BULK ACTIONS FLOATING BAR ---- */}
      {selected.size > 0 && viewMode === 'table' && (
        <div className="scale-in" style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          background: T.surface, border: `1px solid ${T.border}`,
          borderRadius: 14, padding: '10px 20px', zIndex: 900,
          display: 'flex', alignItems: 'center', gap: 12,
          boxShadow: '0 8px 32px rgba(0,0,0,.4)',
          backdropFilter: 'blur(12px)',
        }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: T.accent }}>
            {selected.size} sélectionné{selected.size > 1 ? 's' : ''}
          </span>
          <div style={{ width: 1, height: 20, background: T.border }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 10, color: T.textMuted, fontWeight: 600 }}>Changer statut :</span>
            <select
              onChange={(e) => { if (e.target.value) bulkChangeStatus(e.target.value); e.target.value = ''; }}
              defaultValue=""
              style={{
                background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 8,
                color: T.text, padding: '5px 8px', fontSize: 11, fontFamily: 'inherit', outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="" disabled>Choisir...</option>
              {STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>
          <div style={{ width: 1, height: 20, background: T.border }} />
          <Btn v="danger" small onClick={bulkDelete}>Supprimer ({selected.size})</Btn>
          <Btn v="ghost" small onClick={() => setSelected(new Set())}>{'✕'}</Btn>
        </div>
      )}

      {/* ---- CONTACT MODAL ---- */}
      <Modal open={showModal} onClose={() => { setShowModal(false); setEmailError(''); setDuplicateWarning(''); }} title={editId ? 'Modifier le contact' : 'Nouveau contact'} wide={!!editId}>
        {/* Lead score display in modal (edit mode) */}
        {editId && editContact && (() => {
          const score = leadScore(editContact);
          const sl = getScoreLabel(score);
          return (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16,
              padding: '12px 16px', borderRadius: 12, background: T.surface2,
              border: `1px solid ${sl.color}33`,
            }}>
              <ScoreRing score={score} size={56} strokeWidth={4} color={sl.color} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: sl.color, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>{sl.icon}</span>
                  <span>{sl.label}</span>
                  <span style={{ fontSize: 11, fontWeight: 500, color: T.textMuted }}>({score}/100)</span>
                </div>
                <div style={{ fontSize: 10, color: T.textSecondary, marginTop: 2 }}>Lead Score</div>
              </div>
            </div>
          );
        })()}

        <Inp label="Nom *" value={form.name} onChange={(v) => { setForm({ ...form, name: v }); setDuplicateWarning(checkDuplicate(v, form.email)); }} placeholder="Nom complet" />
        <Inp label="Email" value={form.email} onChange={(v) => { setForm({ ...form, email: v }); setEmailError(''); setDuplicateWarning(checkDuplicate(form.name, v)); }} type="email" placeholder="email@exemple.com" />
        {emailError && <div style={{ fontSize: 11, color: T.red, marginTop: -8, marginBottom: 8 }}>{emailError}</div>}
        {duplicateWarning && <div style={{ fontSize: 11, color: T.orange, padding: '6px 10px', borderRadius: 6, background: T.orangeBg, marginTop: -4, marginBottom: 8 }}>{duplicateWarning}</div>}
        <Inp label="Société" value={form.company} onChange={(v) => setForm({ ...form, company: v })} placeholder="Nom de la société" />
        <Inp label="Téléphone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} placeholder="+33 6 00 00 00 00" />
        <Sel label="Statut" value={form.status} onChange={(v) => setForm({ ...form, status: v })} options={STATUSES.map((s) => ({ value: s.id, label: s.label }))} />
        <Inp label="Notes" value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} placeholder="Notes..." />

        {/* Comment input */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', color: T.textSecondary, fontSize: 11, fontWeight: 600, marginBottom: 4, letterSpacing: .3 }}>Ajouter un commentaire</label>
          <div className="glass-input" style={{ display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newComment.trim() && editId) {
                  e.preventDefault();
                  setContacts((prev) => prev.map((c) => {
                    if (c.id !== editId) return c;
                    return { ...c, commentaires: [...(c.commentaires || []), { text: newComment.trim(), date: new Date().toISOString() }] };
                  }));
                  setNewComment('');
                }
              }}
              placeholder="Écrire un commentaire..."
              style={{ flex: 1, background: 'transparent', border: 'none', color: T.text, padding: '10px 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', width: '100%' }}
            />
            {editId && (
              <Btn v="ghost" small style={{ marginRight: 4, flexShrink: 0 }} onClick={() => {
                if (!newComment.trim()) return;
                setContacts((prev) => prev.map((c) => {
                  if (c.id !== editId) return c;
                  return { ...c, commentaires: [...(c.commentaires || []), { text: newComment.trim(), date: new Date().toISOString() }] };
                }));
                setNewComment('');
              }}>Ajouter</Btn>
            )}
          </div>
          <div style={{ color: T.textMuted, fontSize: 10, marginTop: 2 }}>
            {editId ? "Appuyez sur Entrée ou cliquez Ajouter. Le commentaire sera aussi ajouté à l'enregistrement." : "Le commentaire sera ajouté à la création du contact."}
          </div>
        </div>

        {/* Activity Timeline (edit mode only) */}
        {editId && activityTimeline.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', color: T.textSecondary, fontSize: 11, fontWeight: 600, marginBottom: 8, letterSpacing: .3 }}>
              Historique d'activité ({activityTimeline.length})
            </label>
            <div style={{ maxHeight: 260, overflowY: 'auto', borderRadius: 10, border: `1px solid ${T.border}`, background: T.surface2, padding: '8px 0' }}>
              {activityTimeline.map((event, idx) => {
                const isLast = idx === activityTimeline.length - 1;
                // Timeline colors
                let dotColor = T.textMuted;
                if (event.type === 'created') dotColor = T.green;
                else if (event.type === 'status') dotColor = T.accent;
                else if (event.type === 'comment') dotColor = T.orange;

                return (
                  <div key={idx} style={{ display: 'flex', gap: 12, paddingLeft: 16, paddingRight: 14, position: 'relative' }}>
                    {/* Timeline line + dot */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 14, position: 'relative' }}>
                      <div style={{
                        width: 10, height: 10, borderRadius: '50%', background: dotColor,
                        border: `2px solid ${T.surface2}`, flexShrink: 0, zIndex: 1, marginTop: 10,
                      }} />
                      {!isLast && (
                        <div style={{
                          width: 2, flex: 1, background: T.border, marginTop: 2,
                        }} />
                      )}
                    </div>
                    {/* Event content */}
                    <div style={{ flex: 1, paddingBottom: isLast ? 8 : 12, paddingTop: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 11 }}>{event.icon}</span>
                        <span style={{
                          fontSize: 11, fontWeight: 600,
                          color: event.type === 'status' ? T.accent : event.type === 'created' ? T.green : T.text,
                        }}>
                          {event.type === 'comment' ? 'Commentaire' : event.label}
                        </span>
                      </div>
                      {event.type === 'comment' && (
                        <div style={{ fontSize: 12, color: T.text, marginTop: 3, lineHeight: 1.4, paddingLeft: 2 }}>
                          {event.label}
                        </div>
                      )}
                      <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2 }}>
                        {new Date(event.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        {' — '}{ago(event.date)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Modal footer actions */}
        <div style={{ marginTop: 16, display: 'flex', gap: 8, justifyContent: 'flex-end', alignItems: 'center', flexWrap: 'wrap' }}>
          {saved && <span style={{ fontSize: 11, color: T.green, fontWeight: 600 }}>{'✓'} Enregistré</span>}
          {editId && (
            <Btn v="secondary" small onClick={() => generateInvoice(editContact)} style={{ marginRight: 'auto' }}>
              Facturer
            </Btn>
          )}
          <Btn v="ghost" onClick={() => { setShowModal(false); setEmailError(''); setDuplicateWarning(''); }}>Annuler</Btn>
          <Btn onClick={saveContact} style={{ background: 'linear-gradient(135deg, #f97316, #f59e0b)' }}>{editId ? 'Enregistrer' : 'Ajouter'}</Btn>
        </div>
      </Modal>

      {/* ---- CONFIRM DIALOG ---- */}
      <ConfirmDialog
        open={del.isOpen}
        title="Supprimer ce contact ?"
        message="Le contact sera définitivement supprimé. Cette action est irréversible."
        onConfirm={del.execute}
        onCancel={del.cancel}
      />

      {/* ---- CONTACT LIMIT GATE ---- */}
      <Modal open={showLimitGate} onClose={() => setShowLimitGate(false)} title="Limite atteinte">
        <PremiumGate label={`Limite de ${contactLimit} contacts atteinte`} blur={false}>
          <div />
        </PremiumGate>
      </Modal>

      {/* ---- CONVERSION TOAST (fixed position) ---- */}
      {conversionToast && (
        <div style={{
          position: 'fixed', top: 24, right: 24, zIndex: 2000,
          background: T.surface, border: `1px solid ${T.green}44`,
          borderLeft: `4px solid ${T.green}`,
          borderRadius: 12, padding: '12px 20px',
          boxShadow: `0 8px 32px ${T.green}22`,
          animation: 'slideDown .3s ease',
          fontSize: 13, fontWeight: 700, color: T.green,
        }}>
          {'🎉'} Nouveau client : {conversionToast} !
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// CSV Parser
// ---------------------------------------------------------------------------

/** Parse a single CSV line handling quoted fields */
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') { current += '"'; i++; }
      else if (ch === '"') { inQuotes = false; }
      else { current += ch; }
    } else {
      if (ch === '"') { inQuotes = true; }
      else if (ch === ',') { result.push(current.trim()); current = ''; }
      else { current += ch; }
    }
  }
  result.push(current.trim());
  return result;
}
