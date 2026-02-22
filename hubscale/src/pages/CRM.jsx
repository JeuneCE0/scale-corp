import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { T } from '../lib/theme.js';
import { uid } from '../lib/utils.js';
import { storeDebounced, load } from '../lib/store.js';
import { broadcast, subscribe } from '../lib/sync.js';
import { Card, Btn, Inp, Badge, Modal, EmptyState, Sel, TabBar, ConfirmDialog, Pagination } from '../components/ui.jsx';
import { useConfirmDialog } from '../hooks/useConfirmDialog.js';
import { useUndoStack } from '../hooks/useUndoStack.js';
import { CRM_STATUSES as STATUSES, CRM_FILTER_TABS as FILTER_TABS } from '../lib/constants.js';

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
    setShowModal(true);
  }, []);

  const openEdit = useCallback((c) => {
    setEditId(c.id);
    setForm({ name: c.name, email: c.email, company: c.company, phone: c.phone, status: c.status, notes: c.notes || '' });
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
    if (editId) { setContacts((prev) => prev.map((c) => c.id === editId ? { ...c, ...form } : c)); }
    else { setContacts((prev) => [...prev, { ...form, id: uid(), createdAt: new Date().toISOString() }]); }
    setForm({ name: '', email: '', company: '', phone: '', status: 'prospect', notes: '' });
    setEditId(null);
    setShowModal(false);
    setEmailError('');
    setDuplicateWarning('');
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [form, editId, validateEmail]);

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

        newContacts.push({ id: uid(), name, email, company, phone, status, notes: '', createdAt: new Date().toISOString() });
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
                      return (
                        <tr key={c.id} onClick={() => openEdit(c)} style={{ borderBottom: `1px solid ${T.border}22`, cursor: 'pointer' }}>
                          <td style={{ padding: '10px 14px', fontWeight: 600, color: T.text }}>{c.name}</td>
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
                  {colContacts.map((c) => (
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
                      <div style={{ marginTop: 6, display: 'flex', justifyContent: 'flex-end' }}>
                        <Btn v="danger" small aria-label={`Supprimer ${c.name}`} onClick={(e) => del.request(c.id, e)}>✕</Btn>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={showModal} onClose={() => { setShowModal(false); setEmailError(''); setDuplicateWarning(''); }} title={editId ? 'Modifier le contact' : 'Nouveau contact'}>
        <Inp label="Nom *" value={form.name} onChange={(v) => { setForm({ ...form, name: v }); setDuplicateWarning(checkDuplicate(v, form.email)); }} placeholder="Nom complet" />
        <Inp label="Email" value={form.email} onChange={(v) => { setForm({ ...form, email: v }); setEmailError(''); setDuplicateWarning(checkDuplicate(form.name, v)); }} type="email" placeholder="email@exemple.com" />
        {emailError && <div style={{ fontSize: 11, color: T.red, marginTop: -8, marginBottom: 8 }}>{emailError}</div>}
        {duplicateWarning && <div style={{ fontSize: 11, color: T.orange, padding: '6px 10px', borderRadius: 6, background: T.orangeBg, marginTop: -4, marginBottom: 8 }}>{duplicateWarning}</div>}
        <Inp label="Société" value={form.company} onChange={(v) => setForm({ ...form, company: v })} placeholder="Nom de la société" />
        <Inp label="Téléphone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} placeholder="+33 6 00 00 00 00" />
        <Sel label="Statut" value={form.status} onChange={(v) => setForm({ ...form, status: v })} options={STATUSES.map((s) => ({ value: s.id, label: s.label }))} />
        <Inp label="Notes" value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} textarea placeholder="Notes..." />
        <div style={{ marginTop: 16, display: 'flex', gap: 8, justifyContent: 'flex-end', alignItems: 'center' }}>
          {saved && <span style={{ fontSize: 11, color: T.green, fontWeight: 600 }}>✓ Enregistré</span>}
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
