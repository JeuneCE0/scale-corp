import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { T } from '../lib/theme.js';
import { uid, ago, fmt, formatDateFR, daysSince } from '../lib/utils.js';
import { storeDebounced, load } from '../lib/store.js';
import { broadcast, subscribe } from '../lib/sync.js';
import { Card, Btn, Inp, Badge, Modal, EmptyState, Sel, TabBar, Pagination } from '../components/ui.jsx';
import { useConfirmDialog } from '../hooks/useConfirmDialog.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TASK_STATUSES = [
  { id: 'backlog', label: 'Backlog', icon: '📋', color: T.textMuted },
  { id: 'todo', label: 'À faire', icon: '📌', color: T.blue },
  { id: 'in_progress', label: 'En cours', icon: '🔧', color: T.orange },
  { id: 'review', label: 'En revue', icon: '👀', color: T.purple },
  { id: 'done', label: 'Terminé', icon: '✅', color: T.green },
];

const PRIORITIES = [
  { id: 'urgent', label: 'Urgent', icon: '🔴', color: T.red },
  { id: 'high', label: 'Haute', icon: '🟠', color: T.orange },
  { id: 'medium', label: 'Moyenne', icon: '🟡', color: '#eab308' },
  { id: 'low', label: 'Basse', icon: '🟢', color: T.green },
];

const TASK_CATEGORIES = [
  { value: '', label: 'Aucune' },
  { value: 'dev', label: 'Développement' },
  { value: 'design', label: 'Design' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'admin', label: 'Administratif' },
  { value: 'support', label: 'Support' },
  { value: 'autre', label: 'Autre' },
];

const VIEW_TABS = ['Kanban', 'Liste', 'Calendrier'];

function emptyTask() {
  return {
    id: uid(), title: '', description: '', status: 'todo', priority: 'medium',
    category: '', assignee: '', dueDate: '', tags: [], subtasks: [],
    createdAt: new Date().toISOString(), completedAt: null, timeEstimate: 0, timeSpent: 0,
    contactId: null,
  };
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function Tasks() {
  const [tasks, setTasks] = useState(() => load('tasks') || []);
  const [projects, setProjects] = useState(() => load('projects') || []);
  const [view, setView] = useState('Kanban');
  const [search, setSearch] = useState('');
  const [filterProject, setFilterProject] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [editing, setEditing] = useState(null);
  const [editingProject, setEditingProject] = useState(null);
  const confirm = useConfirmDialog();

  useEffect(() => {
    storeDebounced('tasks', tasks);
    broadcast('tasks', tasks);
  }, [tasks]);

  useEffect(() => {
    storeDebounced('projects', projects);
    broadcast('projects', projects);
  }, [projects]);

  useEffect(() => {
    const u1 = subscribe('tasks', setTasks);
    const u2 = subscribe('projects', setProjects);
    return () => { u1(); u2(); };
  }, []);

  // Filtered tasks
  const filtered = useMemo(() => {
    let list = [...tasks];
    if (filterProject) list = list.filter(t => t.projectId === filterProject);
    if (filterPriority) list = list.filter(t => t.priority === filterPriority);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(t => t.title?.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q) || t.assignee?.toLowerCase().includes(q));
    }
    return list;
  }, [tasks, filterProject, filterPriority, search]);

  // Stats
  const stats = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter(t => t.status === 'done').length;
    const inProgress = tasks.filter(t => t.status === 'in_progress').length;
    const overdue = tasks.filter(t => t.status !== 'done' && t.dueDate && new Date(t.dueDate) < new Date()).length;
    return { total, done, inProgress, overdue, completion: total ? Math.round((done / total) * 100) : 0 };
  }, [tasks]);

  const addTask = (status = 'todo') => {
    setEditing({ ...emptyTask(), status });
  };

  const saveTask = (task) => {
    if (task.status === 'done' && !task.completedAt) task.completedAt = new Date().toISOString();
    if (task.status !== 'done') task.completedAt = null;
    const exists = tasks.find(t => t.id === task.id);
    if (exists) {
      setTasks(prev => prev.map(t => t.id === task.id ? task : t));
    } else {
      setTasks(prev => [task, ...prev]);
    }
    setEditing(null);
  };

  const deleteTask = async (id) => {
    const ok = await confirm.open('Supprimer cette tâche ?', 'Cette action est irréversible.');
    if (ok) { setTasks(prev => prev.filter(t => t.id !== id)); setEditing(null); }
  };

  const moveTask = (id, newStatus) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== id) return t;
      const completedAt = newStatus === 'done' ? new Date().toISOString() : null;
      return { ...t, status: newStatus, completedAt };
    }));
  };

  const addProject = () => {
    setEditingProject({ id: uid(), name: '', description: '', color: T.accent, createdAt: new Date().toISOString() });
  };

  const saveProject = (p) => {
    const exists = projects.find(x => x.id === p.id);
    if (exists) setProjects(prev => prev.map(x => x.id === p.id ? p : x));
    else setProjects(prev => [p, ...prev]);
    setEditingProject(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Stats */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {[
          { label: 'Total', value: stats.total, icon: '📋', color: T.accent },
          { label: 'En cours', value: stats.inProgress, icon: '🔧', color: T.orange },
          { label: 'Terminées', value: stats.done, icon: '✅', color: T.green },
          { label: 'En retard', value: stats.overdue, icon: '⚠️', color: T.red },
          { label: 'Complétion', value: stats.completion + '%', icon: '📊', color: T.accent },
        ].map((s, i) => (
          <div key={i} className="glass-static fade-up" style={{ flex: '1 1 130px', padding: '14px 16px', minWidth: 110 }}>
            <div style={{ fontSize: 10, color: T.textSecondary, fontWeight: 600, letterSpacing: .5, textTransform: 'uppercase', marginBottom: 4 }}>
              <span style={{ marginRight: 4 }}>{s.icon}</span>{s.label}
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <Card>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <TabBar items={VIEW_TABS} active={view} onChange={setView} />
          <div style={{ flex: 1 }} />
          <Inp small placeholder="Rechercher..." value={search} onChange={setSearch} />
          {projects.length > 0 && (
            <Sel small value={filterProject} onChange={setFilterProject}
              options={[{ value: '', label: 'Tous les projets' }, ...projects.map(p => ({ value: p.id, label: p.name }))]} />
          )}
          <Sel small value={filterPriority} onChange={setFilterPriority}
            options={[{ value: '', label: 'Toutes priorités' }, ...PRIORITIES.map(p => ({ value: p.id, label: p.label }))]} />
          <Btn small onClick={() => addTask()}>+ Tâche</Btn>
          <Btn small v="secondary" onClick={addProject}>+ Projet</Btn>
        </div>
      </Card>

      {/* Views */}
      {view === 'Kanban' && <KanbanView tasks={filtered} onEdit={setEditing} onMove={moveTask} onAdd={addTask} />}
      {view === 'Liste' && <ListView tasks={filtered} onEdit={setEditing} onMove={moveTask} />}
      {view === 'Calendrier' && <CalendarView tasks={filtered} onEdit={setEditing} />}

      {/* Edit Modal */}
      {editing && (
        <TaskEditor task={editing} onSave={saveTask} onClose={() => setEditing(null)}
          onDelete={() => deleteTask(editing.id)} projects={projects} />
      )}

      {/* Project Modal */}
      {editingProject && (
        <ProjectEditor project={editingProject} onSave={saveProject} onClose={() => setEditingProject(null)} />
      )}

      {confirm.dialog}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Kanban View
// ---------------------------------------------------------------------------

function KanbanView({ tasks, onEdit, onMove, onAdd }) {
  const [draggedId, setDraggedId] = useState(null);

  const handleDragStart = (e, taskId) => {
    setDraggedId(taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (e, status) => {
    e.preventDefault();
    if (draggedId) {
      onMove(draggedId, status);
      setDraggedId(null);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  return (
    <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8, minHeight: 400 }}>
      {TASK_STATUSES.map(col => {
        const colTasks = tasks.filter(t => t.status === col.id);
        return (
          <div key={col.id} style={{ flex: '1 1 220px', minWidth: 220, maxWidth: 320 }}
            onDrop={(e) => handleDrop(e, col.id)} onDragOver={handleDragOver}>
            {/* Column Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, padding: '0 4px' }}>
              <span style={{ fontSize: 14 }}>{col.icon}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{col.label}</span>
              <span style={{ fontSize: 11, color: T.textMuted, fontWeight: 600 }}>{colTasks.length}</span>
              <div style={{ flex: 1 }} />
              <button onClick={() => onAdd(col.id)}
                style={{ background: 'none', border: `1px dashed ${T.border}`, borderRadius: 6, color: T.textMuted, cursor: 'pointer', fontSize: 14, width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
            </div>

            {/* Column Body */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minHeight: 200, padding: 4, borderRadius: 10, background: T.surface2, border: `1px solid ${T.border}` }}>
              {colTasks.length === 0 && (
                <div style={{ padding: '30px 10px', textAlign: 'center', color: T.textMuted, fontSize: 11 }}>Aucune tâche</div>
              )}
              {colTasks.map(task => (
                <KanbanCard key={task.id} task={task} onEdit={() => onEdit({ ...task, subtasks: [...(task.subtasks || [])] })}
                  onDragStart={(e) => handleDragStart(e, task.id)} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function KanbanCard({ task, onEdit, onDragStart }) {
  const prio = PRIORITIES.find(p => p.id === task.priority) || PRIORITIES[2];
  const isOverdue = task.status !== 'done' && task.dueDate && new Date(task.dueDate) < new Date();
  const subtasksDone = (task.subtasks || []).filter(s => s.done).length;
  const subtasksTotal = (task.subtasks || []).length;

  return (
    <div draggable onDragStart={onDragStart} onClick={onEdit} className="pressable"
      style={{ padding: '10px 12px', background: T.surface, borderRadius: 8, cursor: 'grab', border: `1px solid ${isOverdue ? T.red + '40' : T.border}`, transition: 'all .15s ease' }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 6, lineHeight: 1.3 }}>
        {task.title || 'Sans titre'}
      </div>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
        <Badge label={prio.label} color={prio.color} bg={prio.color + '18'} />
        {task.category && <Badge label={TASK_CATEGORIES.find(c => c.value === task.category)?.label || task.category} color={T.textMuted} bg={T.surface2} />}
        {isOverdue && <Badge label="En retard" color={T.red} bg={T.redBg} />}
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center', fontSize: 10, color: T.textMuted }}>
        {task.assignee && <span>👤 {task.assignee}</span>}
        {task.dueDate && <span style={{ color: isOverdue ? T.red : T.textMuted }}>📅 {formatDateFR(task.dueDate)}</span>}
        {subtasksTotal > 0 && <span>☑ {subtasksDone}/{subtasksTotal}</span>}
        {task.timeEstimate > 0 && <span>⏱ {task.timeEstimate}h</span>}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// List View
// ---------------------------------------------------------------------------

function ListView({ tasks, onEdit, onMove }) {
  const sorted = useMemo(() => {
    const priority = { urgent: 0, high: 1, medium: 2, low: 3 };
    return [...tasks].sort((a, b) => (priority[a.priority] || 2) - (priority[b.priority] || 2));
  }, [tasks]);

  if (sorted.length === 0) {
    return <EmptyState icon="📋" title="Aucune tâche" sub="Créez votre première tâche pour commencer" />;
  }

  return (
    <Card>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Header */}
        <div style={{ display: 'flex', gap: 10, padding: '8px 12px', borderBottom: `1px solid ${T.border}`, fontSize: 10, color: T.textMuted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: .5 }}>
          <div style={{ flex: '0 0 30px' }}>Prio</div>
          <div style={{ flex: 3 }}>Tâche</div>
          <div style={{ flex: 1 }}>Statut</div>
          <div style={{ flex: 1 }}>Assigné</div>
          <div style={{ flex: 1 }}>Échéance</div>
        </div>
        {sorted.map(task => {
          const prio = PRIORITIES.find(p => p.id === task.priority) || PRIORITIES[2];
          const status = TASK_STATUSES.find(s => s.id === task.status) || TASK_STATUSES[0];
          const isOverdue = task.status !== 'done' && task.dueDate && new Date(task.dueDate) < new Date();
          return (
            <div key={task.id} className="pressable" onClick={() => onEdit({ ...task, subtasks: [...(task.subtasks || [])] })}
              style={{ display: 'flex', gap: 10, padding: '10px 12px', alignItems: 'center', cursor: 'pointer', borderBottom: `1px solid ${T.border}20` }}>
              <div style={{ flex: '0 0 30px', fontSize: 14 }}>{prio.icon}</div>
              <div style={{ flex: 3, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title || 'Sans titre'}</div>
                {task.description && <div style={{ fontSize: 11, color: T.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.description}</div>}
              </div>
              <div style={{ flex: 1 }}>
                <Sel small value={task.status} onChange={(v) => { onMove(task.id, v); }}
                  options={TASK_STATUSES.map(s => ({ value: s.id, label: s.label }))} />
              </div>
              <div style={{ flex: 1, fontSize: 12, color: T.textSecondary }}>{task.assignee || '—'}</div>
              <div style={{ flex: 1, fontSize: 12, color: isOverdue ? T.red : T.textSecondary }}>
                {task.dueDate ? formatDateFR(task.dueDate) : '—'}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Calendar View
// ---------------------------------------------------------------------------

function CalendarView({ tasks, onEdit }) {
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const { days, monthLabel } = useMemo(() => {
    const [y, m] = month.split('-').map(Number);
    const firstDay = new Date(y, m - 1, 1);
    const lastDay = new Date(y, m, 0);
    const startPad = (firstDay.getDay() + 6) % 7; // Monday start
    const totalDays = lastDay.getDate();
    const days = [];

    for (let i = 0; i < startPad; i++) days.push(null);
    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayTasks = tasks.filter(t => t.dueDate === dateStr);
      days.push({ day: d, date: dateStr, tasks: dayTasks });
    }

    const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    return { days, monthLabel: `${MONTHS[m - 1]} ${y}` };
  }, [month, tasks]);

  const prevMonth = () => {
    const [y, m] = month.split('-').map(Number);
    const d = new Date(y, m - 2, 1);
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const nextMonth = () => {
    const [y, m] = month.split('-').map(Number);
    const d = new Date(y, m, 1);
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <Btn small v="ghost" onClick={prevMonth}>←</Btn>
        <span style={{ fontSize: 15, fontWeight: 700, color: T.text }}>{monthLabel}</span>
        <Btn small v="ghost" onClick={nextMonth}>→</Btn>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
        {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(d => (
          <div key={d} style={{ padding: '6px 4px', textAlign: 'center', fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase' }}>{d}</div>
        ))}
        {days.map((d, i) => (
          <div key={i} style={{
            minHeight: 70, padding: 4, borderRadius: 6,
            background: d ? T.surface2 : 'transparent',
            border: d ? `1px solid ${T.border}` : 'none',
          }}>
            {d && (
              <>
                <div style={{ fontSize: 11, fontWeight: 600, color: T.textSecondary, marginBottom: 2 }}>{d.day}</div>
                {d.tasks.slice(0, 3).map(task => {
                  const prio = PRIORITIES.find(p => p.id === task.priority);
                  return (
                    <div key={task.id} onClick={() => onEdit({ ...task, subtasks: [...(task.subtasks || [])] })}
                      style={{ fontSize: 9, padding: '2px 4px', borderRadius: 3, marginBottom: 1, cursor: 'pointer',
                        background: (prio?.color || T.accent) + '18', color: prio?.color || T.accent, fontWeight: 600,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {task.title || '—'}
                    </div>
                  );
                })}
                {d.tasks.length > 3 && <div style={{ fontSize: 9, color: T.textMuted }}>+{d.tasks.length - 3}</div>}
              </>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Task Editor Modal
// ---------------------------------------------------------------------------

function TaskEditor({ task, onSave, onClose, onDelete, projects }) {
  const [form, setForm] = useState(task);
  const contacts = load('contacts') || [];
  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const addSubtask = () => set('subtasks', [...(form.subtasks || []), { id: uid(), label: '', done: false }]);
  const removeSubtask = (id) => set('subtasks', form.subtasks.filter(s => s.id !== id));
  const updateSubtask = (id, k, v) => set('subtasks', form.subtasks.map(s => s.id === id ? { ...s, [k]: v } : s));

  const subtasksDone = (form.subtasks || []).filter(s => s.done).length;
  const subtasksTotal = (form.subtasks || []).length;

  return (
    <Modal open onClose={onClose} title="Tâche" wide>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Inp label="Titre" value={form.title} onChange={(v) => set('title', v)} placeholder="Titre de la tâche..." />

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 180px' }}>
            <Sel label="Statut" value={form.status} onChange={(v) => set('status', v)} options={TASK_STATUSES.map(s => ({ value: s.id, label: `${s.icon} ${s.label}` }))} />
          </div>
          <div style={{ flex: '1 1 180px' }}>
            <Sel label="Priorité" value={form.priority} onChange={(v) => set('priority', v)} options={PRIORITIES.map(p => ({ value: p.id, label: `${p.icon} ${p.label}` }))} />
          </div>
          <div style={{ flex: '1 1 180px' }}>
            <Sel label="Catégorie" value={form.category} onChange={(v) => set('category', v)} options={TASK_CATEGORIES} />
          </div>
        </div>

        <Inp label="Description" value={form.description} onChange={(v) => set('description', v)} textarea placeholder="Détails de la tâche..." />

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 180px' }}><Inp label="Assigné à" value={form.assignee} onChange={(v) => set('assignee', v)} placeholder="Nom..." /></div>
          <div style={{ flex: '1 1 180px' }}><Inp label="Date d'échéance" type="date" value={form.dueDate} onChange={(v) => set('dueDate', v)} /></div>
          <div style={{ flex: '1 1 180px' }}><Inp label="Estimation (heures)" type="number" value={form.timeEstimate} onChange={(v) => set('timeEstimate', parseFloat(v) || 0)} /></div>
        </div>

        {projects.length > 0 && (
          <Sel label="Projet" value={form.projectId || ''} onChange={(v) => set('projectId', v || null)}
            options={[{ value: '', label: 'Aucun projet' }, ...projects.map(p => ({ value: p.id, label: p.name }))]} />
        )}

        {contacts.length > 0 && (
          <Sel label="Lié au contact" value={form.contactId || ''} onChange={(v) => set('contactId', v || null)}
            options={[{ value: '', label: 'Aucun contact' }, ...contacts.map(c => ({ value: c.id, label: c.name || c.email }))]} />
        )}

        {/* Subtasks */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: T.textSecondary, textTransform: 'uppercase', letterSpacing: .5 }}>
              Sous-tâches {subtasksTotal > 0 && `(${subtasksDone}/${subtasksTotal})`}
            </span>
            {subtasksTotal > 0 && (
              <div style={{ flex: 1, maxWidth: 120, height: 4, borderRadius: 2, background: T.surface2, overflow: 'hidden' }}>
                <div style={{ width: `${subtasksTotal > 0 ? (subtasksDone / subtasksTotal) * 100 : 0}%`, height: '100%', background: T.green, borderRadius: 2, transition: 'width .3s ease' }} />
              </div>
            )}
          </div>
          {(form.subtasks || []).map(st => (
            <div key={st.id} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
              <input type="checkbox" checked={st.done} onChange={(e) => updateSubtask(st.id, 'done', e.target.checked)}
                style={{ accentColor: T.accent }} />
              <input value={st.label} onChange={(e) => updateSubtask(st.id, 'label', e.target.value)} placeholder="Sous-tâche..."
                style={{ flex: 1, background: 'transparent', border: 'none', borderBottom: `1px solid ${T.border}`, color: st.done ? T.textMuted : T.text,
                  textDecoration: st.done ? 'line-through' : 'none', fontSize: 13, padding: '4px 0', outline: 'none', fontFamily: "'Inter', sans-serif" }} />
              <button onClick={() => removeSubtask(st.id)} style={{ background: 'none', border: 'none', color: T.red, cursor: 'pointer', fontSize: 14 }}>×</button>
            </div>
          ))}
          <Btn small v="ghost" onClick={addSubtask} style={{ marginTop: 4 }}>+ Sous-tâche</Btn>
        </div>

        {/* Time tracking */}
        {form.timeEstimate > 0 && (
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <Inp small label="Temps passé (h)" type="number" value={form.timeSpent} onChange={(v) => set('timeSpent', parseFloat(v) || 0)} />
            <div style={{ fontSize: 12, color: form.timeSpent > form.timeEstimate ? T.red : T.textSecondary, paddingTop: 16 }}>
              {form.timeSpent}/{form.timeEstimate}h ({Math.round((form.timeSpent / form.timeEstimate) * 100)}%)
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <Btn small v="danger" onClick={onDelete}>Supprimer</Btn>
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn small v="ghost" onClick={onClose}>Annuler</Btn>
            <Btn small onClick={() => onSave(form)}>Enregistrer</Btn>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Project Editor Modal
// ---------------------------------------------------------------------------

function ProjectEditor({ project, onSave, onClose }) {
  const [form, setForm] = useState(project);
  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const COLORS = [T.accent, T.blue, T.green, T.orange, T.red, T.purple, '#eab308', '#06b6d4'];

  return (
    <Modal open onClose={onClose} title="Projet">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Inp label="Nom du projet" value={form.name} onChange={(v) => set('name', v)} placeholder="Mon projet..." />
        <Inp label="Description" value={form.description} onChange={(v) => set('description', v)} textarea placeholder="Description..." />
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.textSecondary, marginBottom: 6, textTransform: 'uppercase', letterSpacing: .5 }}>Couleur</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {COLORS.map(c => (
              <button key={c} onClick={() => set('color', c)}
                style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: form.color === c ? '3px solid #fff' : '2px solid transparent',
                  cursor: 'pointer', boxShadow: form.color === c ? `0 0 0 2px ${c}` : 'none' }} />
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Btn small v="ghost" onClick={onClose}>Annuler</Btn>
          <Btn small onClick={() => onSave(form)}>Enregistrer</Btn>
        </div>
      </div>
    </Modal>
  );
}
