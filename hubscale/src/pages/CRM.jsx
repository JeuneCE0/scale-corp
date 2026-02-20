import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { T } from '../lib/theme.js';
import { uid } from '../lib/utils.js';
import { store, load } from '../lib/store.js';
import { Card, Btn, Inp, Badge, Modal, EmptyState, Sel, TabBar, ConfirmDialog } from '../components/ui.jsx';

const STATUSES = [
  { id: 'prospect', label: 'PROSPECT', color: T.orange, bg: T.orangeBg },
  { id: 'lead', label: 'LEAD', color: T.orange, bg: T.orangeBg },
  { id: 'client', label: 'CLIENT', color: T.green, bg: T.greenBg },
  { id: 'perdu', label: 'PERDU', color: T.red, bg: T.redBg },
  { id: 'partenaire', label: 'PARTENAIRE', color: T.purple, bg: T.purpleBg },
];

const FILTER_TABS = ['Tous', 'Prospect', 'Lead', 'Client', 'Perdu', 'Partenaire'];

export default function CRM() {
  const [contacts, setContacts] = useState(() => load('contacts') || []);
  const [filter, setFilter] = useState('Tous');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', company: '', phone: '', status: 'prospect', notes: '' });
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => { store('contacts', contacts); }, [contacts]);

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
      if (search) {
        const q = search.toLowerCase();
        return c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || (c.company || '').toLowerCase().includes(q);
      }
      return true;
    });
  }, [contacts, filter, search]);

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

  const saveContact = useCallback(() => {
    if (!form.name.trim()) return;
    if (editId) { setContacts((prev) => prev.map((c) => c.id === editId ? { ...c, ...form } : c)); }
    else { setContacts((prev) => [...prev, { ...form, id: uid(), createdAt: new Date().toISOString() }]); }
    setForm({ name: '', email: '', company: '', phone: '', status: 'prospect', notes: '' });
    setEditId(null);
    setShowModal(false);
  }, [form, editId]);

  const confirmDelete = useCallback((id, e) => {
    e.stopPropagation();
    setDeleteTarget(id);
  }, []);

  const executeDelete = useCallback(() => {
    if (deleteTarget) {
      setContacts((prev) => prev.filter((c) => c.id !== deleteTarget));
      setDeleteTarget(null);
    }
  }, [deleteTarget]);

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
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher..."
              aria-label="Rechercher un contact"
              style={{ flex: 1, background: 'transparent', border: 'none', color: T.text, padding: '8px 12px 8px 0', fontSize: 12, fontFamily: 'inherit', outline: 'none', width: '100%' }} />
          </div>
        </div>
        <Btn onClick={openNew} aria-label="Ajouter un contact" style={{ background: 'linear-gradient(135deg, #f97316, #f59e0b)', boxShadow: '0 2px 12px rgba(249,115,22,.3)' }}>+ Contact</Btn>
      </div>

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
                  {['Nom', 'Email', 'Société', 'Téléphone', 'Statut', ''].map((h) => (
                    <th key={h} scope="col" style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: T.textMuted, fontSize: 10, textTransform: 'uppercase', letterSpacing: .5 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => {
                  const st = STATUSES.find((s) => s.id === c.status);
                  return (
                    <tr key={c.id} onClick={() => openEdit(c)} style={{ borderBottom: `1px solid ${T.border}22`, cursor: 'pointer' }}>
                      <td style={{ padding: '10px 14px', fontWeight: 600, color: T.text }}>{c.name}</td>
                      <td style={{ padding: '10px 14px', color: T.textSecondary }}>{c.email || '—'}</td>
                      <td style={{ padding: '10px 14px', color: T.textSecondary }}>{c.company || '—'}</td>
                      <td style={{ padding: '10px 14px', color: T.textSecondary }}>{c.phone || '—'}</td>
                      <td style={{ padding: '10px 14px' }}><Badge label={st?.label} color={st?.color} bg={st?.bg} /></td>
                      <td style={{ padding: '10px 14px' }}>
                        <Btn v="danger" small aria-label={`Supprimer ${c.name}`} onClick={(e) => confirmDelete(c.id, e)}>✕</Btn>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editId ? 'Modifier le contact' : 'Nouveau contact'}>
        <Inp label="Nom *" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="Nom complet" />
        <Inp label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} type="email" placeholder="email@exemple.com" />
        <Inp label="Société" value={form.company} onChange={(v) => setForm({ ...form, company: v })} placeholder="Nom de la société" />
        <Inp label="Téléphone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} placeholder="+33 6 00 00 00 00" />
        <Sel label="Statut" value={form.status} onChange={(v) => setForm({ ...form, status: v })} options={STATUSES.map((s) => ({ value: s.id, label: s.label }))} />
        <Inp label="Notes" value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} textarea placeholder="Notes..." />
        <div style={{ marginTop: 16, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Btn v="ghost" onClick={() => setShowModal(false)}>Annuler</Btn>
          <Btn onClick={saveContact} style={{ background: 'linear-gradient(135deg, #f97316, #f59e0b)' }}>{editId ? 'Enregistrer' : 'Ajouter'}</Btn>
        </div>
      </Modal>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Supprimer ce contact ?"
        message="Le contact sera définitivement supprimé. Cette action est irréversible."
        onConfirm={executeDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
