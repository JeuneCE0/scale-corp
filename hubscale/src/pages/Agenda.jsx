import React, { useState } from 'react';
import { T } from '../lib/theme.js';
import { uid } from '../lib/utils.js';
import { Card, Section, Btn, Inp, Sel, Modal, EmptyState, Badge } from '../components/ui.jsx';

const EVENT_TYPES = [
  { value: 'reunion', label: 'Réunion' },
  { value: 'deadline', label: 'Deadline' },
  { value: 'call', label: 'Appel' },
  { value: 'event', label: 'Événement' },
];

const TYPE_COLORS = { reunion: T.blue, deadline: T.red, call: T.green, event: T.purple };

export default function Agenda() {
  const [events, setEvents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', date: '', time: '', type: 'reunion', description: '' });

  const now = new Date();
  const upcoming = events
    .filter((e) => new Date(`${e.date}T${e.time || '23:59'}`) >= now)
    .sort((a, b) => new Date(`${a.date}T${a.time || '00:00'}`) - new Date(`${b.date}T${b.time || '00:00'}`));

  const past = events
    .filter((e) => new Date(`${e.date}T${e.time || '23:59'}`) < now)
    .sort((a, b) => new Date(`${b.date}T${b.time || '00:00'}`) - new Date(`${a.date}T${a.time || '00:00'}`));

  const addEvent = () => {
    if (!form.title.trim() || !form.date) return;
    setEvents([...events, { ...form, id: uid() }]);
    setForm({ title: '', date: '', time: '', type: 'reunion', description: '' });
    setShowModal(false);
  };

  const deleteEvent = (id) => setEvents(events.filter((e) => e.id !== id));

  const formatDate = (d) => new Date(d).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div>
      <div className="fade-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Agenda</h1>
          <p style={{ color: T.textSecondary, fontSize: 12, marginTop: 4 }}>Réunions, deadlines et événements</p>
        </div>
        <Btn onClick={() => setShowModal(true)} style={{ background: 'linear-gradient(135deg, #f97316, #f59e0b)', boxShadow: '0 2px 12px rgba(249,115,22,.3)' }}>
          + Événement
        </Btn>
      </div>

      {/* À venir */}
      <Section title="À VENIR" sub={`${upcoming.length} événement${upcoming.length > 1 ? 's' : ''}`}>
        {upcoming.length === 0 ? (
          <Card>
            <EmptyState
              icon="📅"
              title="Aucun événement à venir"
              sub="Planifiez vos réunions, deadlines et événements"
              action={<Btn onClick={() => setShowModal(true)} style={{ background: 'linear-gradient(135deg, #f97316, #f59e0b)' }}>Créer un événement</Btn>}
            />
          </Card>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {upcoming.map((e) => (
              <Card key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: (TYPE_COLORS[e.type] || T.accent) + '15',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  fontSize: 18,
                }}>
                  {e.type === 'reunion' ? '🤝' : e.type === 'deadline' ? '⏰' : e.type === 'call' ? '📞' : '🎉'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: T.text }}>{e.title}</div>
                  <div style={{ fontSize: 11, color: T.textSecondary, marginTop: 2 }}>
                    {formatDate(e.date)}{e.time ? ` à ${e.time}` : ''}
                  </div>
                  {e.description && <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>{e.description}</div>}
                </div>
                <Badge label={EVENT_TYPES.find((t) => t.value === e.type)?.label} color={TYPE_COLORS[e.type]} bg={TYPE_COLORS[e.type] + '15'} />
                <Btn v="ghost" small onClick={() => deleteEvent(e.id)}>✕</Btn>
              </Card>
            ))}
          </div>
        )}
      </Section>

      {/* Passés */}
      {past.length > 0 && (
        <Section title="PASSÉS" sub={`${past.length} événement${past.length > 1 ? 's' : ''}`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {past.map((e) => (
              <Card key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 14, opacity: .6 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: T.border + '44', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 18,
                }}>
                  {e.type === 'reunion' ? '🤝' : e.type === 'deadline' ? '⏰' : e.type === 'call' ? '📞' : '🎉'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: T.textMuted }}>{e.title}</div>
                  <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>{formatDate(e.date)}{e.time ? ` à ${e.time}` : ''}</div>
                </div>
                <Btn v="ghost" small onClick={() => deleteEvent(e.id)}>✕</Btn>
              </Card>
            ))}
          </div>
        </Section>
      )}

      {/* Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Nouvel événement">
        <Inp label="Titre *" value={form.title} onChange={(v) => setForm({ ...form, title: v })} placeholder="Titre de l'événement" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Inp label="Date *" type="date" value={form.date} onChange={(v) => setForm({ ...form, date: v })} />
          <Inp label="Heure" type="time" value={form.time} onChange={(v) => setForm({ ...form, time: v })} />
        </div>
        <Sel label="Type" value={form.type} onChange={(v) => setForm({ ...form, type: v })} options={EVENT_TYPES} />
        <Inp label="Description" value={form.description} onChange={(v) => setForm({ ...form, description: v })} textarea placeholder="Détails..." />
        <div style={{ marginTop: 16, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Btn v="ghost" onClick={() => setShowModal(false)}>Annuler</Btn>
          <Btn onClick={addEvent} style={{ background: 'linear-gradient(135deg, #f97316, #f59e0b)' }}>Créer</Btn>
        </div>
      </Modal>
    </div>
  );
}
