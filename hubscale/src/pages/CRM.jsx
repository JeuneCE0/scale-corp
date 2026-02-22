import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { T } from '../lib/theme.js';
import { uid, ago, fmt } from '../lib/utils.js';
import { storeDebounced, load } from '../lib/store.js';
import { broadcast, subscribe } from '../lib/sync.js';
import { Card, Btn, Inp, Badge, Modal, EmptyState, Sel, TabBar, ConfirmDialog, Pagination } from '../components/ui.jsx';
import { useConfirmDialog } from '../hooks/useConfirmDialog.js';
import { useUndoStack } from '../hooks/useUndoStack.js';
import { CRM_STATUSES as STATUSES, CRM_FILTER_TABS as FILTER_TABS } from '../lib/constants.js';

/** Compute days since a given ISO date string */
function daysSince(isoDate) {
  if (!isoDate) return 0;
  return Math.floor((Date.now() - new Date(isoDate).getTime()) / 86400000);
}

/** Check if a contact needs a relance alert */
function getRelanceInfo(contact) {
  const days = daysSince(contact.createdAt);
  if (contact.status === 'prospect' && days > 14) return days;
  if (contact.status === 'lead' && days > 21) return days;
  return null;
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
        <strong>N\u00b0 :</strong> ${invoiceNum}<br>
        <strong>Date :</strong> ${dateStr}
      </p>
    </div>
  </div>

  <div class="client-section">
    <h3>Facturer \u00e0</h3>
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
        <th style="width:10%">Qt\u00e9</th>
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
      <div class="row"><span>Sous-total HT</span><span contenteditable="true">0,00 \u20ac</span></div>
      <div class="row"><span>TVA (20%)</span><span contenteditable="true">0,00 \u20ac</span></div>
      <div class="row total"><span>Total TTC</span><span contenteditable="true">0,00 \u20ac</span></div>
    </div>
  </div>

  <div class="footer">
    <p>
      <strong>Conditions de paiement :</strong> Paiement \u00e0 30 jours \u00e0 compter de la date de facturation.<br>
      <strong>Coordonn\u00e9es bancaires :</strong> IBAN FR76 XXXX XXXX XXXX XXXX XXXX XXX &bull; BIC XXXXXXXX<br>
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

export default function CRM() {
  const [contacts, setContacts] = useState(() => load('contacts') || []);
  const [filter, setFilter] = useState('Tous');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const searchTimer = useRef(null);
  const [viewMode, setViewMode] = useState('table');
  const [undoMsg, setUndoMsg] = useState('');

  const handleSearch = useCallback((v) => {
    setSearch(v);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setDebouncedSearch(v), 200);
  }, []);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', company: '', phone: '', status: 'prospect', notes: '' });

  // New comment input state
  const [newComment, setNewComment] = useState('');

  // Undo stack for deletions
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
  }, [undo]);
  const del = useConfirmDialog(deleteContact);
  const [saved, setSaved] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [duplicateWarning, setDuplicateWarning] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  // Persist + broadcast to other tabs
  useEffect(() => {
    storeDebounced('contacts', contacts);
    broadcast('contacts', contacts);
  }, [contacts]);

  // Listen for changes from other tabs
  useEffect(() => subscribe('contacts', (data) => setContacts(data)), []);

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

  const filtered = useMemo(() => {
    return contacts.filter((c) => {
      if (filter !== 'Tous' && c.status !== filter.toLowerCase()) return false;
      if (debouncedSearch) {
        const q = debouncedSearch.toLowerCase();
        return (c.name || '').toLowerCase().includes(q) || (c.email || '').toLowerCase().includes(q) || (c.company || '').toLowerCase().includes(q);
      }
      return true;
    });
  }, [contacts, filter, debouncedSearch]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const va = (a[sortBy] || '').toLowerCase();
      const vb = (b[sortBy] || '').toLowerCase();
      return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
    });
  }, [filtered, sortBy, sortDir]);

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paginated = useMemo(() => sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [sorted, page]);

  useEffect(() => { setPage(1); }, [filter, debouncedSearch]);

  const toggleSort = useCallback((col) => {
    setSortBy((prev) => { if (prev === col) { setSortDir((d) => d === 'asc' ? 'desc' : 'asc'); } else { setSortDir('asc'); } return col; });
  }, []);

  const openNew = useCallback(() => {
    setEditId(null);
    setForm({ name: '', email: '', company: '', phone: '', status: 'prospect', notes: '' });
    setNewComment('');
    setShowModal(true);
  }, []);

  const openEdit = useCallback((c) => {
    setEditId(c.id);
    setForm({ name: c.name, email: c.email, company: c.company, phone: c.phone, status: c.status, notes: c.notes || '' });
    setNewComment('');
    setShowModal(true);
  }, []);

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
    return match ? `Doublon possible : ${match.name} (${match.email || 'pas d\'email'})` : '';
  }, [contacts, editId]);

  const saveContact = useCallback(() => {
    if (!form.name.trim()) return;
    const emailErr = validateEmail(form.email);
    if (emailErr) { setEmailError(emailErr); return; }

    // Build new comment if provided
    const commentToAdd = newComment.trim() ? { text: newComment.trim(), date: new Date().toISOString() } : null;

    if (editId) {
      setContacts((prev) => prev.map((c) => {
        if (c.id !== editId) return c;
        const updatedComments = [...(c.commentaires || [])];
        if (commentToAdd) updatedComments.push(commentToAdd);
        return { ...c, ...form, commentaires: updatedComments };
      }));
    } else {
      const newContact = {
        ...form,
        id: uid(),
        createdAt: new Date().toISOString(),
        commentaires: commentToAdd ? [commentToAdd] : [],
      };
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

  // --- CSV Import ---
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

        newContacts.push({ id: uid(), name, email, company, phone, status, notes: '', commentaires: [], createdAt: new Date().toISOString() });
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

  // --- Kanban drag and drop ---
  const [dragId, setDragId] = useState(null);

  const handleDragStart = useCallback((e, id) => {
    setDragId(id);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDrop = useCallback((e, newStatus) => {
    e.preventDefault();
    if (dragId) {
      setContacts((prev) => prev.map((c) => c.id === dragId ? { ...c, status: newStatus } : c));
      setDragId(null);
    }
  }, [dragId]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  // Get the currently-edited contact's comments for the modal
  const editContact = editId ? contacts.find((c) => c.id === editId) : null;
  const editComments = editContact?.commentaires || [];

  return (
    <div>
      <div className="fade-up" style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>CRM</h1>
        <p style={{ color: T.textSecondary, fontSize: 12, marginTop: 4 }}>Gestion des contacts et pipeline commercial</p>
      </div>

      <div className="fade-up d1 kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 10, marginBottom: 20 }}>
        {STATUSES.map((s) => (
          <div key={s.id} className="glass-static" style={{ padding: '12px 14px', textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{counts[s.id] || 0}</div>
            <div style={{ fontSize: 9, fontWeight: 700, color: s.color, letterSpacing: .8, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="fade-up d2" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <TabBar items={FILTER_TABS} active={filter} onChange={setFilter} counts={filterCounts} compact />
        <div style={{ flex: 1, minWidth: 140 }}>
          <div className="glass-input" style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ padding: '0 8px 0 12px', color: T.textMuted, fontSize: 13 }}>🔍</span>
            <input value={search} onChange={(e) => handleSearch(e.target.value)} placeholder="Rechercher..."
              aria-label="Rechercher un contact"
              style={{ flex: 1, background: 'transparent', border: 'none', color: T.text, padding: '8px 12px 8px 0', fontSize: 12, fontFamily: 'inherit', outline: 'none', width: '100%' }} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <Btn v={viewMode === 'table' ? 'primary' : 'ghost'} small onClick={() => setViewMode('table')} aria-label="Vue tableau">☰</Btn>
          <Btn v={viewMode === 'kanban' ? 'primary' : 'ghost'} small onClick={() => setViewMode('kanban')} aria-label="Vue Kanban">▦</Btn>
        </div>
        <Btn v="secondary" small onClick={() => csvInputRef.current?.click()} aria-label="Importer CSV">↑ Import CSV</Btn>
        <input ref={csvInputRef} type="file" accept=".csv" onChange={handleCSVImport} style={{ display: 'none' }} />
        <Btn onClick={openNew} aria-label="Ajouter un contact" style={{ background: 'linear-gradient(135deg, #f97316, #f59e0b)', boxShadow: '0 2px 12px rgba(249,115,22,.3)' }}>+ Contact</Btn>
      </div>

      {/* Undo + Import feedback */}
      {(undoMsg || importResult) && (
        <div style={{ marginBottom: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {undoMsg && (
            <div style={{ fontSize: 11, color: T.green, fontWeight: 600, padding: '6px 12px', borderRadius: 8, background: T.greenBg, border: `1px solid ${T.green}22` }}>
              ↩ {undoMsg}
            </div>
          )}
          {importResult && (
            <div style={{ fontSize: 11, fontWeight: 600, padding: '6px 12px', borderRadius: 8, background: importResult.error ? T.redBg : T.greenBg, color: importResult.error ? T.red : T.green, border: `1px solid ${importResult.error ? T.red : T.green}22` }}>
              {importResult.error || `✓ ${importResult.imported} contact${importResult.imported > 1 ? 's' : ''} importé${importResult.imported > 1 ? 's' : ''}${importResult.skipped ? ` (${importResult.skipped} doublon${importResult.skipped > 1 ? 's' : ''} ignoré${importResult.skipped > 1 ? 's' : ''})` : ''}`}
            </div>
          )}
        </div>
      )}

      {undo.canUndo && !undoMsg && (
        <div style={{ marginBottom: 12, fontSize: 11, color: T.textMuted, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Btn v="ghost" small onClick={undo.undo}>↩ Annuler ({undo.stackSize})</Btn>
          <span>Ctrl+Z pour annuler la dernière suppression</span>
        </div>
      )}

      {viewMode === 'table' && (
        <>
          {filtered.length === 0 ? (
            <Card>
              <EmptyState icon="👥" title="Aucun contact" sub="Ajoutez votre premier contact pour commencer"
                action={<Btn onClick={openNew} style={{ background: 'linear-gradient(135deg, #f97316, #f59e0b)' }}>Ajouter un contact</Btn>} />
            </Card>
          ) : (
            <Card style={{ padding: 0, overflow: 'hidden' }}>
              <div className="table-wrap">
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                      {[{ label: 'Nom', key: 'name' }, { label: 'Email', key: 'email' }, { label: 'Société', key: 'company' }, { label: 'Téléphone', key: null }, { label: 'Statut', key: 'status' }, { label: '', key: null }].map((h) => (
                        <th key={h.label} scope="col" onClick={h.key ? () => toggleSort(h.key) : undefined}
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
                      return (
                        <tr key={c.id} onClick={() => openEdit(c)} style={{ borderBottom: `1px solid ${T.border}22`, cursor: 'pointer' }}>
                          <td style={{ padding: '10px 14px', fontWeight: 600, color: T.text }}>
                            {c.name}
                            {relanceDays && (
                              <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 600, color: T.orange, background: T.orangeBg, padding: '2px 6px', borderRadius: 6, whiteSpace: 'nowrap' }}>
                                ⚠️ Relance {relanceDays}j
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '10px 14px', color: T.textSecondary }}>{c.email || '—'}</td>
                          <td style={{ padding: '10px 14px', color: T.textSecondary }}>{c.company || '—'}</td>
                          <td style={{ padding: '10px 14px', color: T.textSecondary }}>{c.phone || '—'}</td>
                          <td style={{ padding: '10px 14px' }}><Badge label={st?.label} color={st?.color} bg={st?.bg} /></td>
                          <td style={{ padding: '10px 14px' }}>
                            <Btn v="danger" small aria-label={`Supprimer ${c.name}`} onClick={(e) => del.request(c.id, e)}>✕</Btn>
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

      {viewMode === 'kanban' && (
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
                    return (
                      <div key={c.id} draggable onDragStart={(e) => handleDragStart(e, c.id)}
                        onClick={() => openEdit(c)}
                        style={{
                          padding: '10px 12px', borderRadius: 10, background: T.surface2,
                          border: `1px solid ${dragId === c.id ? status.color : T.border}`,
                          cursor: 'grab', transition: 'all .15s',
                          opacity: dragId === c.id ? 0.5 : 1,
                        }}>
                        <div style={{ fontWeight: 600, fontSize: 12, color: T.text, marginBottom: 2 }}>{c.name}</div>
                        {c.company && <div style={{ fontSize: 10, color: T.textSecondary }}>{c.company}</div>}
                        {c.email && <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2 }}>{c.email}</div>}
                        {relanceDays && (
                          <div style={{ marginTop: 4, fontSize: 10, fontWeight: 600, color: T.orange, background: T.orangeBg, padding: '2px 6px', borderRadius: 6, display: 'inline-block' }}>
                            ⚠️ Relance {relanceDays}j
                          </div>
                        )}
                        <div style={{ marginTop: 6, display: 'flex', justifyContent: 'flex-end' }}>
                          <Btn v="danger" small aria-label={`Supprimer ${c.name}`} onClick={(e) => del.request(c.id, e)}>✕</Btn>
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

      <Modal open={showModal} onClose={() => { setShowModal(false); setEmailError(''); setDuplicateWarning(''); }} title={editId ? 'Modifier le contact' : 'Nouveau contact'} wide={!!editId}>
        <Inp label="Nom *" value={form.name} onChange={(v) => { setForm({ ...form, name: v }); setDuplicateWarning(checkDuplicate(v, form.email)); }} placeholder="Nom complet" />
        <Inp label="Email" value={form.email} onChange={(v) => { setForm({ ...form, email: v }); setEmailError(''); setDuplicateWarning(checkDuplicate(form.name, v)); }} type="email" placeholder="email@exemple.com" />
        {emailError && <div style={{ fontSize: 11, color: T.red, marginTop: -8, marginBottom: 8 }}>{emailError}</div>}
        {duplicateWarning && <div style={{ fontSize: 11, color: T.orange, padding: '6px 10px', borderRadius: 6, background: T.orangeBg, marginTop: -4, marginBottom: 8 }}>{duplicateWarning}</div>}
        <Inp label="Société" value={form.company} onChange={(v) => setForm({ ...form, company: v })} placeholder="Nom de la société" />
        <Inp label="Téléphone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} placeholder="+33 6 00 00 00 00" />
        <Sel label="Statut" value={form.status} onChange={(v) => setForm({ ...form, status: v })} options={STATUSES.map((s) => ({ value: s.id, label: s.label }))} />
        <Inp label="Notes" value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} placeholder="Notes..." />

        {/* Comments/Notes History Section */}
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
            {editId ? 'Appuyez sur Entrée ou cliquez Ajouter. Le commentaire sera aussi ajouté à l\'enregistrement.' : 'Le commentaire sera ajouté à la création du contact.'}
          </div>
        </div>

        {/* Comments Timeline (only when editing and there are comments) */}
        {editId && editComments.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', color: T.textSecondary, fontSize: 11, fontWeight: 600, marginBottom: 8, letterSpacing: .3 }}>Historique des commentaires ({editComments.length})</label>
            <div style={{ maxHeight: 200, overflowY: 'auto', borderRadius: 10, border: `1px solid ${T.border}`, background: T.surface2 }}>
              {[...editComments].reverse().map((comment, idx) => (
                <div key={idx} style={{
                  padding: '10px 14px',
                  borderBottom: idx < editComments.length - 1 ? `1px solid ${T.border}` : 'none',
                  display: 'flex', flexDirection: 'column', gap: 4,
                }}>
                  <div style={{ fontSize: 12, color: T.text, lineHeight: 1.4 }}>{comment.text}</div>
                  <div style={{ fontSize: 10, color: T.textMuted }}>
                    {new Date(comment.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    {' — '}{ago(comment.date)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginTop: 16, display: 'flex', gap: 8, justifyContent: 'flex-end', alignItems: 'center', flexWrap: 'wrap' }}>
          {saved && <span style={{ fontSize: 11, color: T.green, fontWeight: 600 }}>✓ Enregistré</span>}
          {editId && (
            <Btn v="secondary" small onClick={() => generateInvoice(editContact)} style={{ marginRight: 'auto' }}>
              Facturer
            </Btn>
          )}
          <Btn v="ghost" onClick={() => { setShowModal(false); setEmailError(''); setDuplicateWarning(''); }}>Annuler</Btn>
          <Btn onClick={saveContact} style={{ background: 'linear-gradient(135deg, #f97316, #f59e0b)' }}>{editId ? 'Enregistrer' : 'Ajouter'}</Btn>
        </div>
      </Modal>

      <ConfirmDialog
        open={del.isOpen}
        title="Supprimer ce contact ?"
        message="Le contact sera définitivement supprimé. Cette action est irréversible."
        onConfirm={del.execute}
        onCancel={del.cancel}
      />
    </div>
  );
}

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
