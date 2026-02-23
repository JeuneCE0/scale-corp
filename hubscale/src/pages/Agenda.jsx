import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { T } from '../lib/theme.js';
import { uid, daysUntil } from '../lib/utils.js';
import { storeDebounced, load } from '../lib/store.js';
import { broadcast, subscribe } from '../lib/sync.js';
import { Card, Section, Btn, Inp, Sel, Modal, EmptyState, Badge, ConfirmDialog } from '../components/ui.jsx';
import { useConfirmDialog } from '../hooks/useConfirmDialog.js';
import { useUndoStack } from '../hooks/useUndoStack.js';
import { EVENT_TYPES, EVENT_TYPE_COLORS as TYPE_COLORS, EVENT_TYPE_ICONS as TYPE_ICONS } from '../lib/constants.js';

/* ── Reminder options ─────────────────────────────────────── */
const REMINDER_OPTIONS = [
  { value: 'none', label: 'Aucun' },
  { value: '5min', label: '5 min avant' },
  { value: '15min', label: '15 min avant' },
  { value: '1h', label: '1 heure avant' },
  { value: '1d', label: '1 jour avant' },
];

const REMINDER_MS = {
  none: 0,
  '5min': 5 * 60 * 1000,
  '15min': 15 * 60 * 1000,
  '1h': 60 * 60 * 1000,
  '1d': 24 * 60 * 60 * 1000,
};

/* ── Calendar grid helper ─────────────────────────────────── */
function buildCalendarGrid(year, month) {
  // month is 0-indexed
  const firstOfMonth = new Date(year, month, 1);
  const lastOfMonth = new Date(year, month + 1, 0);

  // Day of week for first day (Mon=0 .. Sun=6)
  let startDow = firstOfMonth.getDay() - 1;
  if (startDow < 0) startDow = 6; // Sunday wraps

  const days = [];

  // Padding from previous month
  for (let i = startDow - 1; i >= 0; i--) {
    const d = new Date(year, month, -i);
    days.push({ date: d, inMonth: false });
  }

  // Days of current month
  for (let d = 1; d <= lastOfMonth.getDate(); d++) {
    days.push({ date: new Date(year, month, d), inMonth: true });
  }

  // Padding from next month to complete the last week
  while (days.length % 7 !== 0) {
    const nextDay = days.length - startDow - lastOfMonth.getDate() + 1;
    days.push({ date: new Date(year, month + 1, nextDay), inMonth: false });
  }

  return days;
}

function toISO(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

const WEEKDAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

const MONTH_NAMES_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

/* ── Default form state ───────────────────────────────────── */
const EMPTY_FORM = {
  title: '', date: '', time: '', type: 'reunion',
  description: '', recurrence: 'none', meetingLink: '', reminder: '15min',
};

/* ── Component ────────────────────────────────────────────── */
export default function Agenda() {
  const [events, setEvents] = useState(() => load('events') || []);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [undoMsg, setUndoMsg] = useState('');

  // View mode: 'list' | 'calendar'
  const [view, setView] = useState('list');

  // Calendar navigation
  const today = useMemo(() => new Date(), []);
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState(null);

  // Ref for scrolling to today in list view
  const todayRef = useRef(null);

  /* ── Undo stack ─────────────────────────────────────────── */
  const undoRestore = useCallback((item) => {
    setEvents((prev) => [...prev, item]);
    setUndoMsg(`"${item.title}" restaure`);
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

  /* ── Persist + multi-tab sync ───────────────────────────── */
  useEffect(() => {
    storeDebounced('events', events);
    broadcast('events', events);
  }, [events]);

  useEffect(() => subscribe('events', (data) => setEvents(data)), []);

  /* ── Live clock ─────────────────────────────────────────── */
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  /* ── Browser notification reminders (uses per-event reminder value) */
  useEffect(() => {
    if (!('Notification' in window)) return;
    const checkReminders = () => {
      const currentTime = new Date();
      events.forEach((e) => {
        if (!e.date || !e.time) return;
        const reminderVal = e.reminder || '15min';
        if (reminderVal === 'none') return;
        const leadMs = REMINDER_MS[reminderVal] || REMINDER_MS['15min'];
        const eventTime = new Date(`${e.date}T${e.time}`);
        const triggerTime = new Date(eventTime.getTime() - leadMs);
        // Fire if we are within 1 minute of the trigger time
        if (currentTime >= triggerTime && currentTime <= new Date(triggerTime.getTime() + 60000)) {
          const notifKey = `hs_notif_${e.id}_${e.date}_${reminderVal}`;
          if (sessionStorage.getItem(notifKey)) return;
          sessionStorage.setItem(notifKey, '1');
          if (Notification.permission === 'granted') {
            new Notification(`HubScale — ${e.title}`, {
              body: `Commence ${e.time ? `a ${e.time}` : 'bientot'}`,
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

  /* ── Derived data ───────────────────────────────────────── */
  const todayISO = useMemo(() => toISO(now), [now]);

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

  /* ── Quick stats ────────────────────────────────────────── */
  const todayEvents = useMemo(() => events.filter((e) => e.date === todayISO), [events, todayISO]);

  const weekEvents = useMemo(() => {
    const startOfWeek = new Date(now);
    const dow = startOfWeek.getDay();
    const mondayOffset = dow === 0 ? -6 : 1 - dow;
    startOfWeek.setDate(startOfWeek.getDate() + mondayOffset);
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 7);
    return events.filter((e) => {
      const d = new Date(e.date);
      return d >= startOfWeek && d < endOfWeek;
    });
  }, [events, now]);

  /* ── Calendar grid data ─────────────────────────────────── */
  const calendarDays = useMemo(() => buildCalendarGrid(calYear, calMonth), [calYear, calMonth]);

  const eventsByDate = useMemo(() => {
    const map = {};
    events.forEach((e) => {
      if (!e.date) return;
      if (!map[e.date]) map[e.date] = [];
      map[e.date].push(e);
    });
    return map;
  }, [events]);

  const selectedDayEvents = useMemo(() => {
    if (!selectedDay) return [];
    const iso = toISO(selectedDay);
    return (eventsByDate[iso] || []).sort(
      (a, b) => (a.time || '00:00').localeCompare(b.time || '00:00')
    );
  }, [selectedDay, eventsByDate]);

  /* ── Navigation helpers ─────────────────────────────────── */
  const goToPrevMonth = useCallback(() => {
    setCalMonth((m) => {
      if (m === 0) { setCalYear((y) => y - 1); return 11; }
      return m - 1;
    });
    setSelectedDay(null);
  }, []);

  const goToNextMonth = useCallback(() => {
    setCalMonth((m) => {
      if (m === 11) { setCalYear((y) => y + 1); return 0; }
      return m + 1;
    });
    setSelectedDay(null);
  }, []);

  const goToToday = useCallback(() => {
    if (view === 'calendar') {
      setCalYear(now.getFullYear());
      setCalMonth(now.getMonth());
      setSelectedDay(new Date(now.getFullYear(), now.getMonth(), now.getDate()));
    } else {
      // Scroll to today section in list view
      if (todayRef.current) {
        todayRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [view, now]);

  /* ── Modal open / close ─────────────────────────────────── */
  const [conflict, setConflict] = useState(null);

  const openNew = useCallback((prefillDate) => {
    setEditId(null);
    setForm({ ...EMPTY_FORM, date: prefillDate || '' });
    setShowModal(true);
    setConflict(null);
  }, []);

  const openEdit = useCallback((e) => {
    setEditId(e.id);
    setForm({
      title: e.title,
      date: e.date,
      time: e.time,
      type: e.type,
      description: e.description || '',
      recurrence: e.recurrence || 'none',
      meetingLink: e.meetingLink || '',
      reminder: e.reminder || '15min',
    });
    setShowModal(true);
    setConflict(null);
  }, []);

  /* ── Conflict detection ─────────────────────────────────── */
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

  /* ── Save event (create or update) ─────────────────────── */
  const forceSave = useCallback(() => {
    if (editId) {
      setEvents((prev) => prev.map((e) => e.id === editId ? { ...e, ...form } : e));
    } else {
      setEvents((prev) => [...prev, { ...form, id: uid() }]);
    }
    setForm({ ...EMPTY_FORM });
    setEditId(null);
    setShowModal(false);
    setConflict(null);
  }, [form, editId]);

  const saveEvent = useCallback(() => {
    if (!form.title.trim() || !form.date) return;
    const c = checkConflict(form.date, form.time);
    if (c) { setConflict(c); return; }
    forceSave();
  }, [form, checkConflict, forceSave]);

  /* ── Format helpers ─────────────────────────────────────── */
  const formatDate = useCallback((d) =>
    new Date(d).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' }),
    []
  );

  /* ── Render a single event card (list view) ─────────────── */
  const renderEvent = (e, faded) => {
    const isToday = e.date === todayISO;
    const typeColor = TYPE_COLORS[e.type] || T.accent;
    return (
      <Card
        key={e.id}
        onClick={() => openEdit(e)}
        accent={typeColor}
        style={{
          display: 'flex', alignItems: 'center', gap: 12, opacity: faded ? 0.6 : 1,
          flexWrap: 'wrap',
          borderLeft: `3px solid ${typeColor}`,
          ...(isToday && !faded ? { boxShadow: `inset 3px 0 0 ${T.orange}, 0 0 0 1px ${T.orange}33` } : {}),
        }}
      >
        <div ref={isToday && !faded ? todayRef : undefined} style={{
          width: 40, height: 40, borderRadius: 10, flexShrink: 0,
          background: faded ? T.border + '44' : typeColor + '18',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
        }}>{TYPE_ICONS[e.type] || '🎉'}</div>
        <div style={{ flex: 1, minWidth: 120 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: faded ? T.textMuted : T.text }}>{e.title}</div>
          <div style={{ fontSize: 11, color: T.textSecondary, marginTop: 2 }}>
            {formatDate(e.date)}{e.time ? ` a ${e.time}` : ''}
            {!faded && e.date && (() => {
              const d = daysUntil(e.date);
              if (d === 0) return <span style={{ marginLeft: 6, color: T.orange, fontWeight: 700 }}>Aujourd'hui</span>;
              if (d === 1) return <span style={{ marginLeft: 6, color: T.blue, fontWeight: 600 }}>Demain</span>;
              if (d > 1 && d <= 7) return <span style={{ marginLeft: 6, color: T.textMuted, fontWeight: 600 }}>dans {d}j</span>;
              return null;
            })()}
          </div>
          {e.description && <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>{e.description}</div>}
          {e.meetingLink && (
            <a href={e.meetingLink} target="_blank" rel="noopener noreferrer" onClick={(ev) => ev.stopPropagation()}
              style={{ fontSize: 10, color: T.accent, fontWeight: 600, marginTop: 3, display: 'inline-flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}>
              {e.meetingLink.includes('meet.google') ? '📹 Google Meet' : e.meetingLink.includes('zoom') ? '📹 Zoom' : '🔗 Lien visio'}
            </a>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {e.recurrence && e.recurrence !== 'none' && (
            <Badge label={e.recurrence === 'weekly' ? '🔁 Hebdo' : '🔁 Mensuel'} color={T.blue} bg={T.blueBg} />
          )}
          {!faded && (
            <Badge
              label={EVENT_TYPES.find((t) => t.value === e.type)?.label}
              color={typeColor}
              bg={typeColor + '20'}
            />
          )}
          <Btn v="ghost" small aria-label={`Supprimer ${e.title}`} onClick={(ev) => del.request(e.id, ev)}>✕</Btn>
        </div>
      </Card>
    );
  };

  /* ── Calendar cell click ────────────────────────────────── */
  const handleCellClick = useCallback((dayObj) => {
    setSelectedDay(dayObj.date);
  }, []);

  /* ── Quick stats bar ────────────────────────────────────── */
  const statsBar = (
    <div className="fade-up" style={{
      display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center',
      padding: '10px 16px', borderRadius: 12,
      background: T.surface2, border: `1px solid ${T.border}`,
    }}>
      <span style={{ fontSize: 12, fontWeight: 700, color: T.accent }}>
        {upcoming.length} a venir
      </span>
      <span style={{ width: 1, height: 14, background: T.border }} />
      <span style={{ fontSize: 12, fontWeight: 700, color: T.orange }}>
        {todayEvents.length} aujourd'hui
      </span>
      <span style={{ width: 1, height: 14, background: T.border }} />
      <span style={{ fontSize: 12, fontWeight: 700, color: T.blue }}>
        {weekEvents.length} cette semaine
      </span>
    </div>
  );

  /* ── Calendar view ──────────────────────────────────────── */
  const renderCalendar = () => (
    <div className="fade-up" style={{ marginTop: 12 }}>
      {/* Month navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Btn v="ghost" small onClick={goToPrevMonth} aria-label="Mois precedent">← Mois precedent</Btn>
        <span style={{ fontSize: 16, fontWeight: 800, color: T.text }}>
          {MONTH_NAMES_FR[calMonth]} {calYear}
        </span>
        <Btn v="ghost" small onClick={goToNextMonth} aria-label="Mois suivant">Mois suivant →</Btn>
      </div>

      {/* Grid */}
      <div className="cal-grid" style={{
        display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2,
        borderRadius: 12, overflow: 'hidden', border: `1px solid ${T.border}`,
        background: T.border,
      }}>
        {/* Header row */}
        {WEEKDAY_LABELS.map((d) => (
          <div key={d} className="cal-header" style={{
            padding: '8px 4px', textAlign: 'center',
            fontSize: 10, fontWeight: 700, color: T.textSecondary,
            background: T.surface2, textTransform: 'uppercase', letterSpacing: 0.5,
          }}>{d}</div>
        ))}

        {/* Day cells */}
        {calendarDays.map((dayObj, idx) => {
          const iso = toISO(dayObj.date);
          const isCurrentDay = isSameDay(dayObj.date, now);
          const isSelected = selectedDay && isSameDay(dayObj.date, selectedDay);
          const dayEvents = eventsByDate[iso] || [];

          return (
            <div
              key={idx}
              className={`cal-cell${isCurrentDay ? ' today' : ''}${!dayObj.inMonth ? ' other-month' : ''}`}
              onClick={() => handleCellClick(dayObj)}
              style={{
                padding: '6px 4px', minHeight: 64, cursor: 'pointer',
                background: isSelected ? T.accentBg : T.surface,
                opacity: dayObj.inMonth ? 1 : 0.35,
                borderLeft: isCurrentDay ? `2px solid ${T.orange}` : 'none',
                borderRight: isCurrentDay ? `2px solid ${T.orange}` : 'none',
                borderTop: isCurrentDay ? `2px solid ${T.orange}` : 'none',
                borderBottom: isCurrentDay ? `2px solid ${T.orange}` : 'none',
                transition: 'background .15s',
                position: 'relative',
              }}
            >
              <div style={{
                fontSize: 12, fontWeight: isCurrentDay ? 800 : 600,
                color: isCurrentDay ? T.orange : (dayObj.inMonth ? T.text : T.textMuted),
                textAlign: 'right', marginBottom: 4, paddingRight: 2,
              }}>
                {dayObj.date.getDate()}
              </div>
              {/* Event dots */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, justifyContent: 'center' }}>
                {dayEvents.slice(0, 5).map((evt) => (
                  <div
                    key={evt.id}
                    className="cal-event-dot"
                    title={evt.title}
                    style={{
                      width: 7, height: 7, borderRadius: '50%',
                      background: TYPE_COLORS[evt.type] || T.accent,
                      flexShrink: 0,
                    }}
                  />
                ))}
                {dayEvents.length > 5 && (
                  <span style={{ fontSize: 8, color: T.textMuted, fontWeight: 700 }}>+{dayEvents.length - 5}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected day panel */}
      {selectedDay && (
        <div className="fade-up" style={{
          marginTop: 16, padding: 16, borderRadius: 12,
          background: T.surface, border: `1px solid ${T.border}`,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <span style={{ fontSize: 14, fontWeight: 700, color: T.text }}>
                {selectedDay.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
              <span style={{ marginLeft: 8, fontSize: 11, color: T.textMuted }}>
                {selectedDayEvents.length} evenement{selectedDayEvents.length !== 1 ? 's' : ''}
              </span>
            </div>
            <Btn v="secondary" small onClick={() => openNew(toISO(selectedDay))} aria-label="Creer un evenement ce jour">
              + Ajouter
            </Btn>
          </div>
          {selectedDayEvents.length === 0 ? (
            <div style={{ color: T.textMuted, fontSize: 12, textAlign: 'center', padding: '12px 0' }}>
              Aucun evenement ce jour
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {selectedDayEvents.map((e) => (
                <div
                  key={e.id}
                  onClick={() => openEdit(e)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
                    borderRadius: 8, cursor: 'pointer',
                    background: T.surface2, border: `1px solid ${T.border}`,
                    borderLeft: `3px solid ${TYPE_COLORS[e.type] || T.accent}`,
                    transition: 'background .15s',
                  }}
                >
                  <span style={{ fontSize: 14 }}>{TYPE_ICONS[e.type] || '🎉'}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 12, color: T.text }}>{e.title}</div>
                    {e.time && <div style={{ fontSize: 10, color: T.textSecondary }}>a {e.time}</div>}
                  </div>
                  <Badge
                    label={EVENT_TYPES.find((t) => t.value === e.type)?.label}
                    color={TYPE_COLORS[e.type]}
                    bg={(TYPE_COLORS[e.type] || T.accent) + '20'}
                  />
                  <Btn v="ghost" small aria-label={`Supprimer ${e.title}`} onClick={(ev) => del.request(e.id, ev)}>✕</Btn>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );

  /* ── List view ──────────────────────────────────────────── */
  const renderList = () => (
    <>
      <Section title="A VENIR" sub={`${upcoming.length} evenement${upcoming.length !== 1 ? 's' : ''}`}>
        {upcoming.length === 0 ? (
          <Card><EmptyState icon="📅" title="Aucun evenement a venir" sub="Planifiez vos reunions, deadlines et evenements"
            action={<Btn onClick={() => openNew()} style={{ background: 'linear-gradient(135deg, #f97316, #f59e0b)' }}>Creer un evenement</Btn>} /></Card>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{upcoming.map((e) => renderEvent(e, false))}</div>
        )}
      </Section>

      {past.length > 0 && (
        <Section title="PASSES" sub={`${past.length} evenement${past.length !== 1 ? 's' : ''}`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{past.map((e) => renderEvent(e, true))}</div>
        </Section>
      )}
    </>
  );

  /* ── Main render ────────────────────────────────────────── */
  return (
    <div>
      {/* Header */}
      <div className="fade-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Agenda</h1>
          <p style={{ color: T.textSecondary, fontSize: 12, marginTop: 4 }}>Reunions, deadlines et evenements</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {notifPermission !== 'granted' && 'Notification' in window && (
            <Btn v="secondary" small onClick={requestNotifPermission} aria-label="Activer les notifications">🔔 Notifications</Btn>
          )}
          {notifPermission === 'granted' && (
            <span style={{ fontSize: 10, color: T.green, fontWeight: 600 }}>🔔 Rappels actives</span>
          )}
          <Btn onClick={() => openNew()} aria-label="Creer un evenement" style={{ background: 'linear-gradient(135deg, #f97316, #f59e0b)', boxShadow: '0 2px 12px rgba(249,115,22,.3)' }}>+ Evenement</Btn>
        </div>
      </div>

      {/* Quick stats */}
      {statsBar}

      {/* View toggle + Aujourd'hui button */}
      <div className="fade-up" style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        {/* View toggle */}
        <div style={{
          display: 'inline-flex', borderRadius: 10, overflow: 'hidden',
          border: `1px solid ${T.border}`, background: T.surface,
        }}>
          <button
            onClick={() => setView('list')}
            style={{
              padding: '7px 16px', fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer',
              fontFamily: 'inherit',
              background: view === 'list' ? T.accentBg : 'transparent',
              color: view === 'list' ? T.accent : T.textMuted,
              transition: 'all .15s',
            }}
          >Liste</button>
          <button
            onClick={() => setView('calendar')}
            style={{
              padding: '7px 16px', fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer',
              fontFamily: 'inherit',
              background: view === 'calendar' ? T.accentBg : 'transparent',
              color: view === 'calendar' ? T.accent : T.textMuted,
              transition: 'all .15s',
            }}
          >Mois</button>
        </div>

        {/* Aujourd'hui button */}
        <Btn v="secondary" small onClick={goToToday} aria-label="Aller a aujourd'hui" style={{
          borderColor: T.orange + '44', color: T.orange, fontWeight: 700,
        }}>
          Aujourd'hui ({todayEvents.length})
        </Btn>
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
          <span>Ctrl+Z pour annuler la derniere suppression</span>
        </div>
      )}

      {/* Content */}
      {view === 'list' ? renderList() : renderCalendar()}

      {/* Create/Edit modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editId ? "Modifier l'evenement" : 'Nouvel evenement'}>
        <Inp label="Titre *" value={form.title} onChange={(v) => setForm({ ...form, title: v })} placeholder="Titre de l'evenement" />
        <div className="grid-2-mobile-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Inp label="Date *" type="date" value={form.date} onChange={(v) => setForm({ ...form, date: v })} />
          <Inp label="Heure" type="time" value={form.time} onChange={(v) => setForm({ ...form, time: v })} />
        </div>
        <div className="grid-2-mobile-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Sel label="Type" value={form.type} onChange={(v) => setForm({ ...form, type: v })} options={EVENT_TYPES} />
          <Sel label="Rappel" value={form.reminder} onChange={(v) => setForm({ ...form, reminder: v })} options={REMINDER_OPTIONS} />
        </div>
        <Sel label="Recurrence" value={form.recurrence} onChange={(v) => setForm({ ...form, recurrence: v })} options={[
          { value: 'none', label: 'Aucune' }, { value: 'weekly', label: 'Hebdomadaire' }, { value: 'monthly', label: 'Mensuelle' },
        ]} />
        <Inp label="Lien visio (Meet, Zoom...)" value={form.meetingLink} onChange={(v) => setForm({ ...form, meetingLink: v })} placeholder="https://meet.google.com/xxx ou https://zoom.us/j/xxx" />
        <Inp label="Description" value={form.description} onChange={(v) => setForm({ ...form, description: v })} textarea placeholder="Details..." />

        {/* Conflict warning */}
        {conflict && (
          <div style={{ fontSize: 11, color: T.orange, padding: '8px 10px', borderRadius: 6, background: T.orangeBg, marginBottom: 8 }}>
            Conflit horaire avec "{conflict.title}" le {conflict.date} a {conflict.time}
            <div style={{ marginTop: 4 }}>
              <Btn v="ghost" small onClick={() => { setConflict(null); forceSave(); }}>Creer quand meme</Btn>
            </div>
          </div>
        )}

        <div style={{ marginTop: 16, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Btn v="ghost" onClick={() => setShowModal(false)}>Annuler</Btn>
          <Btn onClick={saveEvent} style={{ background: 'linear-gradient(135deg, #f97316, #f59e0b)' }}>
            {editId ? 'Enregistrer' : 'Creer'}
          </Btn>
        </div>
      </Modal>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={del.isOpen}
        title="Supprimer cet evenement ?"
        message="L'evenement sera definitivement supprime. Cette action est irreversible."
        onConfirm={del.execute}
        onCancel={del.cancel}
      />
    </div>
  );
}
