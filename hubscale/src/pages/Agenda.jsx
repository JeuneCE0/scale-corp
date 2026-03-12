import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { T } from '../lib/theme.js';
import { uid, daysUntil } from '../lib/utils.js';
import { storeDebounced, load, store } from '../lib/store.js';
import { broadcast, subscribe } from '../lib/sync.js';
import { Card, Section, Btn, Inp, Sel, Modal, EmptyState, Badge, ConfirmDialog } from '../components/ui.jsx';
import { useConfirmDialog } from '../hooks/useConfirmDialog.js';
import { useUndoStack } from '../hooks/useUndoStack.js';
import { EVENT_TYPES, EVENT_TYPE_COLORS as TYPE_COLORS, EVENT_TYPE_ICONS as TYPE_ICONS } from '../lib/constants.js';
import { startOAuthFlow } from '../lib/api.js';
import { isSupabaseConfigured } from '../lib/supabase.js';
import { onIntegrationConnect } from '../lib/integrationData.js';
import { t } from '../lib/i18n.js';

/* ── Reminder options ─────────────────────────────────────── */
const getReminderOptions = () => [
  { value: 'none', label: t('agenda.reminderNone') },
  { value: '5min', label: t('agenda.reminder5min') },
  { value: '15min', label: t('agenda.reminder15min') },
  { value: '1h', label: t('agenda.reminder1h') },
  { value: '1d', label: t('agenda.reminder1d') },
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

const getWeekdayLabels = () => [t('day.mon'), t('day.tue'), t('day.wed'), t('day.thu'), t('day.fri'), t('day.sat'), t('day.sun')];

const getMonthNames = () => [
  t('month.1'), t('month.2'), t('month.3'), t('month.4'), t('month.5'), t('month.6'),
  t('month.7'), t('month.8'), t('month.9'), t('month.10'), t('month.11'), t('month.12'),
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

  /* ── Google Calendar connection ──────────────────────────── */
  const [gcalConnected, setGcalConnected] = useState(() => !!(load('integrations') || {})['Google Calendar']);
  const [gcalConnecting, setGcalConnecting] = useState(false);
  const [gcalDismissed, setGcalDismissed] = useState(false);

  const connectGoogleCalendar = useCallback(async () => {
    setGcalConnecting(true);
    // Production: use real OAuth
    if (isSupabaseConfigured()) {
      try {
        const result = await startOAuthFlow('Google Calendar');
        if (result.url) { window.location.href = result.url; return; }
      } catch (err) {
        console.warn('[gcal] OAuth not available, falling back to local mode:', err.message);
      }
    }
    // Local / demo mode: toggle integration + seed data
    const integrations = load('integrations') || {};
    store('integrations', { ...integrations, 'Google Calendar': true });
    const timestamps = load('integrationTimestamps') || {};
    store('integrationTimestamps', { ...timestamps, 'Google Calendar': new Date().toISOString() });
    onIntegrationConnect('Google Calendar');
    // Refresh events from store
    setEvents(load('events') || []);
    setGcalConnected(true);
    setGcalConnecting(false);
    window.dispatchEvent(new CustomEvent('hs:integration-sync', { detail: { name: 'Google Calendar', action: 'connect' } }));
  }, []);

  // Listen for external connection changes (e.g. from Settings page)
  useEffect(() => {
    const handler = (e) => {
      // Always refresh events — any integration may add calendar events
      setEvents(load('events') || []);
      if (e.detail?.name === 'Google Calendar') {
        setGcalConnected(e.detail.action === 'connect' || e.detail.action === 'resync');
      }
    };
    window.addEventListener('hs:integration-sync', handler);
    return () => window.removeEventListener('hs:integration-sync', handler);
  }, []);

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
    setUndoMsg(t('agenda.restored').replace('{title}', item.title));
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
              if (d === 0) return <span style={{ marginLeft: 6, color: T.orange, fontWeight: 700 }}>{t('common.today')}</span>;
              if (d === 1) return <span style={{ marginLeft: 6, color: T.blue, fontWeight: 600 }}>{t('common.tomorrow')}</span>;
              if (d > 1 && d <= 7) return <span style={{ marginLeft: 6, color: T.textMuted, fontWeight: 600 }}>{t('agenda.inDays').replace('{d}', d)}</span>;
              return null;
            })()}
          </div>
          {e.description && <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>{e.description}</div>}
          {e.meetingLink && (
            <a href={e.meetingLink} target="_blank" rel="noopener noreferrer" onClick={(ev) => ev.stopPropagation()}
              style={{ fontSize: 10, color: T.accent, fontWeight: 600, marginTop: 3, display: 'inline-flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}>
              {e.meetingLink.includes('meet.google') ? t('agenda.googleMeet') : e.meetingLink.includes('zoom') ? t('agenda.zoom') : t('agenda.videoLink')}
            </a>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {e.recurrence && e.recurrence !== 'none' && (
            <Badge label={e.recurrence === 'weekly' ? t('agenda.weeklyBadge') : t('agenda.monthlyBadge')} color={T.blue} bg={T.blueBg} />
          )}
          {!faded && (
            <Badge
              label={EVENT_TYPES.find((t) => t.value === e.type)?.label}
              color={typeColor}
              bg={typeColor + '20'}
            />
          )}
          <Btn v="ghost" small aria-label={`${t('common.delete')} ${e.title}`} onClick={(ev) => del.request(e.id, ev)}>✕</Btn>
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
        {upcoming.length} {t('agenda.upcoming')}
      </span>
      <span style={{ width: 1, height: 14, background: T.border }} />
      <span style={{ fontSize: 12, fontWeight: 700, color: T.orange }}>
        {todayEvents.length} {t('agenda.todayCount')}
      </span>
      <span style={{ width: 1, height: 14, background: T.border }} />
      <span style={{ fontSize: 12, fontWeight: 700, color: T.blue }}>
        {weekEvents.length} {t('agenda.thisWeek')}
      </span>
    </div>
  );

  /* ── Calendar view ──────────────────────────────────────── */
  const renderCalendar = () => (
    <div className="fade-up" style={{ marginTop: 12 }}>
      {/* Month navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Btn v="ghost" small onClick={goToPrevMonth} aria-label={t('agenda.prevMonth')}>{t('agenda.prevMonth')}</Btn>
        <span style={{ fontSize: 16, fontWeight: 800, color: T.text }}>
          {getMonthNames()[calMonth]} {calYear}
        </span>
        <Btn v="ghost" small onClick={goToNextMonth} aria-label={t('agenda.nextMonth')}>{t('agenda.nextMonth')}</Btn>
      </div>

      {/* Grid */}
      <div className="cal-grid" style={{
        display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2,
        borderRadius: 12, overflow: 'hidden', border: `1px solid ${T.border}`,
        background: T.border,
      }}>
        {/* Header row */}
        {getWeekdayLabels().map((d) => (
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
                {t('agenda.eventCount').replace('{count}', selectedDayEvents.length).replace('{s}', selectedDayEvents.length !== 1 ? 's' : '')}
              </span>
            </div>
            <Btn v="secondary" small onClick={() => openNew(toISO(selectedDay))} aria-label={t('agenda.addToDay')}>
              {t('agenda.addToDay')}
            </Btn>
          </div>
          {selectedDayEvents.length === 0 ? (
            <div style={{ color: T.textMuted, fontSize: 12, textAlign: 'center', padding: '12px 0' }}>
              {t('agenda.noEventDay')}
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
                  <Btn v="ghost" small aria-label={`${t('common.delete')} ${e.title}`} onClick={(ev) => del.request(e.id, ev)}>✕</Btn>
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
      <Section title={t('agenda.upcomingSection')} sub={t('agenda.eventCount').replace('{count}', upcoming.length).replace('{s}', upcoming.length !== 1 ? 's' : '')}>
        {upcoming.length === 0 ? (
          <Card><EmptyState icon="📅" title={t('agenda.noUpcoming')} sub={t('agenda.noUpcomingSub')}
            action={<Btn onClick={() => openNew()} style={{ background: 'linear-gradient(135deg, #f97316, #f59e0b)' }}>{t('agenda.createEvent')}</Btn>} /></Card>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{upcoming.map((e) => renderEvent(e, false))}</div>
        )}
      </Section>

      {past.length > 0 && (
        <Section title={t('agenda.pastSection')} sub={t('agenda.eventCount').replace('{count}', past.length).replace('{s}', past.length !== 1 ? 's' : '')}>
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
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>{t('agenda.title')}</h1>
          <p style={{ color: T.textSecondary, fontSize: 12, marginTop: 4 }}>{t('agenda.subtitle')}</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {notifPermission !== 'granted' && 'Notification' in window && (
            <Btn v="secondary" small onClick={requestNotifPermission} aria-label={t('agenda.notifications')}>🔔 {t('agenda.notifications')}</Btn>
          )}
          {notifPermission === 'granted' && (
            <span style={{ fontSize: 10, color: T.green, fontWeight: 600 }}>🔔 {t('agenda.remindersActive')}</span>
          )}
          <Btn onClick={() => openNew()} aria-label={t('agenda.addEvent')} style={{ background: 'linear-gradient(135deg, #f97316, #f59e0b)', boxShadow: '0 2px 12px rgba(249,115,22,.3)' }}>{t('agenda.addEvent')}</Btn>
        </div>
      </div>

      {/* Quick stats */}
      {statsBar}

      {/* Google Calendar connection banner */}
      {!gcalConnected && !gcalDismissed && (
        <div className="fade-up" style={{
          display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16,
          padding: '16px 20px', borderRadius: 14,
          background: `linear-gradient(135deg, ${T.surface2}, ${T.surface})`,
          border: `1px solid ${T.border}`,
          flexWrap: 'wrap',
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: '#4285f420', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, flexShrink: 0,
          }}>{'📅'}</div>
          <div style={{ flex: 1, minWidth: 180 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: T.text, marginBottom: 2 }}>
              {t('agenda.connectGCal')}
            </div>
            <div style={{ fontSize: 11, color: T.textSecondary, lineHeight: 1.4 }}>
              {t('agenda.connectGCalSub')}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Btn v="ghost" small onClick={() => setGcalDismissed(true)} style={{ color: T.textMuted }}>{t('agenda.later')}</Btn>
            <Btn onClick={connectGoogleCalendar} small
              disabled={gcalConnecting}
              style={{
                background: gcalConnecting ? T.surface2 : 'linear-gradient(135deg, #4285f4, #34a853)',
                boxShadow: gcalConnecting ? 'none' : '0 2px 12px rgba(66,133,244,.3)',
              }}>
              {gcalConnecting ? t('agenda.connecting') : t('agenda.connect')}
            </Btn>
          </div>
        </div>
      )}

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
          >{t('agenda.listView')}</button>
          <button
            onClick={() => setView('calendar')}
            style={{
              padding: '7px 16px', fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer',
              fontFamily: 'inherit',
              background: view === 'calendar' ? T.accentBg : 'transparent',
              color: view === 'calendar' ? T.accent : T.textMuted,
              transition: 'all .15s',
            }}
          >{t('agenda.monthView')}</button>
        </div>

        {/* Aujourd'hui button */}
        <Btn v="secondary" small onClick={goToToday} aria-label={t('common.today')} style={{
          borderColor: T.orange + '44', color: T.orange, fontWeight: 700,
        }}>
          {t('agenda.todayBtn').replace('{count}', todayEvents.length)}
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
          <Btn v="ghost" small onClick={undo.undo}>{t('agenda.undoLabel').replace('{count}', undo.stackSize)}</Btn>
          <span>{t('agenda.undoHint')}</span>
        </div>
      )}

      {/* Content */}
      {view === 'list' ? renderList() : renderCalendar()}

      {/* Create/Edit modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editId ? t('agenda.editEvent') : t('agenda.newEvent')}>
        <Inp label={t('agenda.titleRequired')} value={form.title} onChange={(v) => setForm({ ...form, title: v })} placeholder={t('agenda.titlePlaceholder')} />
        <div className="grid-2-mobile-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Inp label={t('agenda.dateRequired')} type="date" value={form.date} onChange={(v) => setForm({ ...form, date: v })} />
          <Inp label={t('agenda.time')} type="time" value={form.time} onChange={(v) => setForm({ ...form, time: v })} />
        </div>
        <div className="grid-2-mobile-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Sel label={t('agenda.typeLabel')} value={form.type} onChange={(v) => setForm({ ...form, type: v })} options={EVENT_TYPES} />
          <Sel label={t('agenda.reminderLabel')} value={form.reminder} onChange={(v) => setForm({ ...form, reminder: v })} options={getReminderOptions()} />
        </div>
        <Sel label={t('agenda.recurrence')} value={form.recurrence} onChange={(v) => setForm({ ...form, recurrence: v })} options={[
          { value: 'none', label: t('agenda.recurrenceNone') }, { value: 'weekly', label: t('agenda.recurrenceWeekly') }, { value: 'monthly', label: t('agenda.recurrenceMonthly') },
        ]} />
        <Inp label={t('agenda.meetingLink')} value={form.meetingLink} onChange={(v) => setForm({ ...form, meetingLink: v })} placeholder={t('agenda.meetingLinkPlaceholder')} />
        <Inp label={t('common.description')} value={form.description} onChange={(v) => setForm({ ...form, description: v })} textarea placeholder={t('agenda.descPlaceholder')} />

        {/* Conflict warning */}
        {conflict && (
          <div style={{ fontSize: 11, color: T.orange, padding: '8px 10px', borderRadius: 6, background: T.orangeBg, marginBottom: 8 }}>
            {t('agenda.conflict').replace('{title}', conflict.title).replace('{date}', conflict.date).replace('{time}', conflict.time)}
            <div style={{ marginTop: 4 }}>
              <Btn v="ghost" small onClick={() => { setConflict(null); forceSave(); }}>{t('agenda.createAnyway')}</Btn>
            </div>
          </div>
        )}

        <div style={{ marginTop: 16, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Btn v="ghost" onClick={() => setShowModal(false)}>{t('common.cancel')}</Btn>
          <Btn onClick={saveEvent} style={{ background: 'linear-gradient(135deg, #f97316, #f59e0b)' }}>
            {editId ? t('common.save') : t('agenda.create')}
          </Btn>
        </div>
      </Modal>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={del.isOpen}
        title={t('agenda.deleteConfirm')}
        message={t('agenda.deleteMessage')}
        onConfirm={del.execute}
        onCancel={del.cancel}
      />
    </div>
  );
}
