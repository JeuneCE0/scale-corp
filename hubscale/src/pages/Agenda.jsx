import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { T } from '../lib/theme.js';
import { uid } from '../lib/utils.js';
import { storeDebounced, load } from '../lib/store.js';
import { broadcast, subscribe } from '../lib/sync.js';
import { Card, Section, Btn, Inp, Sel, Modal, EmptyState, Badge, ConfirmDialog } from '../components/ui.jsx';
import { useConfirmDialog } from '../hooks/useConfirmDialog.js';
import { useUndoStack } from '../hooks/useUndoStack.js';
import { EVENT_TYPES, EVENT_TYPE_COLORS as TYPE_COLORS, EVENT_TYPE_ICONS as TYPE_ICONS } from '../lib/constants.js';

export default function Agenda() {
  const [events, setEvents] = useState(() => load('events') || []);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ title: '', date: '', time: '', type: 'reunion', description: '', recurrence: 'none', meetingLink: '' });
  const [undoMsg, setUndoMsg] = useState('');

  // Undo stack for deletions
  const undoRestore = useCallback((item) => {
    setEvents((prev) => [...prev, item]);
    setUndoMsg(`"${item.title}" restauré`);
    setTimeout(() => setUndoMsg(''), 3000);
  }, []);
  const undo = useUndoStack(undoRestore);

  const deleteEvent = useCallback((id) => {
    setEvents((prev) => {
      const evt = prev.find((e) => e.id === id);
      if (evt) undo.push(evt);
      return prev.filter((e) => e.id !== id);
    });
  }, [undo]);
  const del = useConfirmDialog(deleteEvent);

  // Persist + multi-tab sync
  useEffect(() => {
    storeDebounced('events', events);
    broadcast('events', events);
  }, [events]);

  useEffect(() => subscribe('events', (data) => setEvents(data)), []);

  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  // Browser notification reminders for events within the next 15 minutes
  useEffect(() => {
    if (!('Notification' in window)) return;
    const checkReminders = () => {
      const currentTime = new Date();
      const soon = new Date(currentTime.getTime() + 15 * 60 * 1000);
      events.forEach((e) => {
        if (!e.date || !e.time) return;
        const eventTime = new Date(`${e.date}T${e.time}`);
        if (eventTime > currentTime && eventTime <= soon) {
          const notifKey = `hs_notif_${e.id}_${e.date}`;
          if (sessionStorage.getItem(notifKey)) return;
          sessionStorage.setItem(notifKey, '1');
          if (Notification.permission === 'granted') {
            new Notification(`HubScale — ${e.title}`, {
              body: `Commence ${e.time ? `à ${e.time}` : 'bientôt'}`,
              icon: TYPE_ICONS[e.type] || '📅',
            });
          }
        }
      });
    };
    checkReminders();
    const id = setInterval(checkReminders, 60000);
    return () => clearInterval(id);
  }, [events]);

  const [notifPermission, setNotifPermission] = useState(() => {
    try { return Notification.permission; } catch { return 'denied'; }
  });

  const requestNotifPermission = useCallback(async () => {
    try {
      const perm = await Notification.requestPermission();
      setNotifPermission(perm);
    } catch {}
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
    setForm({ title: '', date: '', time: '', type: 'reunion', description: '', recurrence: 'none', meetingLink: '' });
    setShowModal(true);
    setConflict(null);
  }, []);

  const openEdit = useCallback((e) => {
    setEditId(e.id);
    setForm({ title: e.title, date: e.date, time: e.time, type: e.type, description: e.description || '', recurrence: e.recurrence || 'none', meetingLink: e.meetingLink || '' });
    setShowModal(true);
    setConflict(null);
  }, []);

  const [conflict, setConflict] = useState(null);

  const checkConflict = useCallback((date, time) => {
    if (!date || !time) return null;
    const newStart = new Date(`${date}T${time}`);
    const newEnd = new Date(newStart.getTime() + 60 * 60 * 1000);
    return events.find((e) => {
      if (e.id === editId || !e.time || e.date !== date) return false;
      const eStart = new Date(`${e.date}T${e.time}`);
      const eEnd = new Date(eStart.getTime() + 60 * 60 * 1000);
      return newStart < eEnd && newEnd > eStart;
    });
  }, [events, editId]);

  const saveEvent = useCallback(() => {
    if (!form.title.trim() || !form.date) return;
    const c = checkConflict(form.date, form.time);
    if (c) { setConflict(c); return; }
    if (editId) { setEvents((prev) => prev.map((e) => e.id === editId ? { ...e, ...form, recurrence: form.recurrence } : e)); }
    else { setEvents((prev) => [...prev, { ...form, id: uid() }]); }
    setForm({ title: '', date: '', time: '', type: 'reunion', description: '', recurrence: 'none', meetingLink: '' });
    setEditId(null);
    setShowModal(false);
    setConflict(null);
  }, [form, editId, checkConflict]);

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
        {e.meetingLink && (
          <a href={e.meetingLink} target="_blank" rel="noopener noreferrer" onClick={(ev) => ev.stopPropagation()}
            style={{ fontSize: 10, color: T.accent, fontWeight: 600, marginTop: 3, display: 'inline-flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}>
            {e.meetingLink.includes('meet.google') ? '📹 Google Meet' : e.meetingLink.includes('zoom') ? '📹 Zoom' : '🔗 Lien visio'}
          </a>
        )}
      </div>
      {e.recurrence && e.recurrence !== 'none' && <Badge label={e.recurrence === 'weekly' ? '🔁 Hebdo' : '🔁 Mensuel'} color={T.blue} bg={T.blueBg} />}
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
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {notifPermission !== 'granted' && 'Notification' in window && (
            <Btn v="secondary" small onClick={requestNotifPermission} aria-label="Activer les notifications">🔔 Notifications</Btn>
          )}
          {notifPermission === 'granted' && (
            <span style={{ fontSize: 10, color: T.green, fontWeight: 600 }}>🔔 Rappels activés</span>
          )}
          <Btn onClick={openNew} aria-label="Créer un événement" style={{ background: 'linear-gradient(135deg, #f97316, #f59e0b)', boxShadow: '0 2px 12px rgba(249,115,22,.3)' }}>+ Événement</Btn>
        </div>
      </div>

      {/* Undo bar */}
      {undoMsg && (
        <div style={{ marginBottom: 12, fontSize: 11, color: T.green, fontWeight: 600, padding: '6px 12px', borderRadius: 8, background: T.greenBg, border: `1px solid ${T.green}22`, display: 'inline-block' }}>
          ↩ {undoMsg}
        </div>
      )}
      {undo.canUndo && !undoMsg && (
        <div style={{ marginBottom: 12, fontSize: 11, color: T.textMuted, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Btn v="ghost" small onClick={undo.undo}>↩ Annuler ({undo.stackSize})</Btn>
          <span>Ctrl+Z pour annuler la dernière suppression</span>
        </div>
      )}

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
        <Sel label="Récurrence" value={form.recurrence} onChange={(v) => setForm({ ...form, recurrence: v })} options={[
          { value: 'none', label: 'Aucune' }, { value: 'weekly', label: 'Hebdomadaire' }, { value: 'monthly', label: 'Mensuelle' },
        ]} />
        <Inp label="Lien visio (Meet, Zoom...)" value={form.meetingLink} onChange={(v) => setForm({ ...form, meetingLink: v })} placeholder="https://meet.google.com/xxx ou https://zoom.us/j/xxx" />
        <Inp label="Description" value={form.description} onChange={(v) => setForm({ ...form, description: v })} textarea placeholder="Détails..." />
        {conflict && (
          <div style={{ fontSize: 11, color: T.orange, padding: '8px 10px', borderRadius: 6, background: T.orangeBg, marginBottom: 8 }}>
            Conflit horaire avec "{conflict.title}" le {conflict.date} à {conflict.time}
            <div style={{ marginTop: 4 }}>
              <Btn v="ghost" small onClick={() => { setConflict(null); const ev = form; if (editId) { setEvents((prev) => prev.map((e) => e.id === editId ? { ...e, ...ev } : e)); } else { setEvents((prev) => [...prev, { ...ev, id: uid() }]); } setForm({ title: '', date: '', time: '', type: 'reunion', description: '', recurrence: 'none', meetingLink: '' }); setEditId(null); setShowModal(false); }}>Créer quand même</Btn>
            </div>
          </div>
        )}
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
