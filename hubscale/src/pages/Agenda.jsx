import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { T } from '../lib/theme.js';
import { uid } from '../lib/utils.js';
import { storeDebounced, load } from '../lib/store.js';
import { Card, Section, Btn, Inp, Sel, Modal, EmptyState, Badge, ConfirmDialog } from '../components/ui.jsx';
import { useConfirmDialog } from '../hooks/useConfirmDialog.js';
import { EVENT_TYPES, EVENT_TYPE_COLORS as TYPE_COLORS, EVENT_TYPE_ICONS as TYPE_ICONS } from '../lib/constants.js';

export default function Agenda() {
  const [events, setEvents] = useState(() => load('events') || []);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ title: '', date: '', time: '', type: 'reunion', description: '' });
  const deleteEvent = useCallback((id) => setEvents((prev) => prev.filter((e) => e.id !== id)), []);
  const del = useConfirmDialog(deleteEvent);

  useEffect(() => { storeDebounced('events', events); }, [events]);

  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  const upcoming = useMemo(() =>
    events
      .filter((e) => new Date(`${e.date}T${e.time || '23:59'}`) >= now)
      .sort((a, b) => new Date(`${a.date}T${a.time || '00:00'}`) - new Date(`${b.date}T${b.time || '00:00'}`)),
    [events, now]
  );

  const past = useMemo(() =>
    events
      .filter((e) => new Date(`${e.date}T${e.time || '23:59'}`) < now)
      .sort((a, b) => new Date(`${b.date}T${b.time || '00:00'}`) - new Date(`${a.date}T${a.time || '00:00'}`)),
    [events, now]
  );

  const openNew = useCallback(() => {
    setEditId(null);
    setForm({ title: '', date: '', time: '', type: 'reunion', description: '' });
    setShowModal(true);
  }, []);

  const openEdit = useCallback((e) => {
    setEditId(e.id);
    setForm({ title: e.title, date: e.date, time: e.time, type: e.type, description: e.description || '' });
    setShowModal(true);
  }, []);

  const saveEvent = useCallback(() => {
    if (!form.title.trim() || !form.date) return;
    if (editId) { setEvents((prev) => prev.map((e) => e.id === editId ? { ...e, ...form } : e)); }
    else { setEvents((prev) => [...prev, { ...form, id: uid() }]); }
    setForm({ title: '', date: '', time: '', type: 'reunion', description: '' });
    setEditId(null);
    setShowModal(false);
  }, [form, editId]);


  const formatDate = useCallback((d) =>
    new Date(d).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' }),
    []
  );

  const renderEvent = (e, faded) => (
    <Card key={e.id} onClick={() => openEdit(e)} style={{ display: 'flex', alignItems: 'center', gap: 12, opacity: faded ? .6 : 1, flexWrap: 'wrap' }}>
      <div style={{
        width: 40, height: 40, borderRadius: 10, flexShrink: 0,
        background: faded ? T.border + '44' : (TYPE_COLORS[e.type] || T.accent) + '15',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
      }}>{TYPE_ICONS[e.type] || '🎉'}</div>
      <div style={{ flex: 1, minWidth: 120 }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: faded ? T.textMuted : T.text }}>{e.title}</div>
        <div style={{ fontSize: 11, color: T.textSecondary, marginTop: 2 }}>{formatDate(e.date)}{e.time ? ` à ${e.time}` : ''}</div>
        {e.description && <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>{e.description}</div>}
      </div>
      {!faded && <Badge label={EVENT_TYPES.find((t) => t.value === e.type)?.label} color={TYPE_COLORS[e.type]} bg={TYPE_COLORS[e.type] + '15'} />}
      <Btn v="ghost" small aria-label={`Supprimer ${e.title}`} onClick={(ev) => del.request(e.id, ev)}>✕</Btn>
    </Card>
  );

  return (
    <div>
      <div className="fade-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Agenda</h1>
          <p style={{ color: T.textSecondary, fontSize: 12, marginTop: 4 }}>Réunions, deadlines et événements</p>
        </div>
        <Btn onClick={openNew} aria-label="Créer un événement" style={{ background: 'linear-gradient(135deg, #f97316, #f59e0b)', boxShadow: '0 2px 12px rgba(249,115,22,.3)' }}>+ Événement</Btn>
      </div>

      <Section title="À VENIR" sub={`${upcoming.length} événement${upcoming.length !== 1 ? 's' : ''}`}>
        {upcoming.length === 0 ? (
          <Card><EmptyState icon="📅" title="Aucun événement à venir" sub="Planifiez vos réunions, deadlines et événements"
            action={<Btn onClick={openNew} style={{ background: 'linear-gradient(135deg, #f97316, #f59e0b)' }}>Créer un événement</Btn>} /></Card>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{upcoming.map((e) => renderEvent(e, false))}</div>
        )}
      </Section>

      {past.length > 0 && (
        <Section title="PASSÉS" sub={`${past.length} événement${past.length !== 1 ? 's' : ''}`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{past.map((e) => renderEvent(e, true))}</div>
        </Section>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editId ? "Modifier l'événement" : 'Nouvel événement'}>
        <Inp label="Titre *" value={form.title} onChange={(v) => setForm({ ...form, title: v })} placeholder="Titre de l'événement" />
        <div className="grid-2-mobile-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Inp label="Date *" type="date" value={form.date} onChange={(v) => setForm({ ...form, date: v })} />
          <Inp label="Heure" type="time" value={form.time} onChange={(v) => setForm({ ...form, time: v })} />
        </div>
        <Sel label="Type" value={form.type} onChange={(v) => setForm({ ...form, type: v })} options={EVENT_TYPES} />
        <Inp label="Description" value={form.description} onChange={(v) => setForm({ ...form, description: v })} textarea placeholder="Détails..." />
        <div style={{ marginTop: 16, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Btn v="ghost" onClick={() => setShowModal(false)}>Annuler</Btn>
          <Btn onClick={saveEvent} style={{ background: 'linear-gradient(135deg, #f97316, #f59e0b)' }}>{editId ? 'Enregistrer' : 'Créer'}</Btn>
        </div>
      </Modal>

      <ConfirmDialog
        open={del.isOpen}
        title="Supprimer cet événement ?"
        message="L'événement sera définitivement supprimé. Cette action est irréversible."
        onConfirm={del.execute}
        onCancel={del.cancel}
      />
    </div>
  );
}
