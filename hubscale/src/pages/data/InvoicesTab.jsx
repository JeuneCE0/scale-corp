import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { T } from '../../lib/theme.js';
import { fmt, fK, pf } from '../../lib/utils.js';
import { uid, nextInvoiceNumber, computeInvoiceTotals, isInvoiceOverdue, formatDateFR } from '../../lib/utils.js';
import { storeDebounced, load } from '../../lib/store.js';
import { broadcast, subscribe } from '../../lib/sync.js';
import { Card, Btn, Inp, EmptyState, Badge } from '../../components/ui.jsx';
import { INVOICE_STATUSES } from '../../lib/constants.js';

export default function InvoicesTab() {
  const [invoices, setInvoices] = useState(() => load('invoices') || []);
  const [catalog] = useState(() => load('catalog') || []);
  const [contacts] = useState(() => load('contacts') || []);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [form, setForm] = useState({ contactId: '', dueDate: '', notes: '', items: [{ description: '', qty: 1, unitPrice: 0, tva: 20 }] });

  useEffect(() => { storeDebounced('invoices', invoices); broadcast('invoices', invoices); }, [invoices]);
  useEffect(() => subscribe('invoices', (data) => setInvoices(data)), []);

  // Auto-mark overdue invoices
  useEffect(() => {
    const updated = invoices.map((inv) => {
      if (inv.status === 'sent' && isInvoiceOverdue(inv)) return { ...inv, status: 'overdue' };
      return inv;
    });
    if (JSON.stringify(updated) !== JSON.stringify(invoices)) setInvoices(updated);
  }, [invoices]);

  const addItem = useCallback(() => {
    setForm((prev) => ({ ...prev, items: [...prev.items, { description: '', qty: 1, unitPrice: 0, tva: 20 }] }));
  }, []);

  const removeItem = useCallback((idx) => {
    setForm((prev) => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) }));
  }, []);

  const updateItem = useCallback((idx, field, value) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((item, i) => i === idx ? { ...item, [field]: field === 'description' ? value : pf(value) } : item),
    }));
  }, []);

  const addFromCatalog = useCallback((catItem) => {
    setForm((prev) => ({
      ...prev,
      items: [...prev.items, { description: catItem.name, qty: 1, unitPrice: catItem.price, tva: catItem.tva || 20, catalogId: catItem.id }],
    }));
  }, []);

  const totals = useMemo(() => computeInvoiceTotals(form.items), [form.items]);

  const save = useCallback(() => {
    if (!form.contactId || form.items.length === 0) return;
    const contact = contacts.find((c) => c.id === form.contactId);
    const { totalHT, totalTVA, totalTTC } = computeInvoiceTotals(form.items);
    if (editId) {
      setInvoices((prev) => prev.map((inv) => inv.id === editId ? {
        ...inv, contactId: form.contactId, contactName: contact?.name || '', dueDate: form.dueDate,
        notes: form.notes, items: form.items, totalHT, totalTVA, totalTTC,
      } : inv));
    } else {
      const number = nextInvoiceNumber(invoices);
      setInvoices((prev) => [...prev, {
        id: uid(), number, contactId: form.contactId, contactName: contact?.name || '',
        createdAt: new Date().toISOString(), dueDate: form.dueDate, notes: form.notes,
        items: form.items, status: 'draft', totalHT, totalTVA, totalTTC,
      }]);
    }
    setForm({ contactId: '', dueDate: '', notes: '', items: [{ description: '', qty: 1, unitPrice: 0, tva: 20 }] });
    setEditId(null);
    setShowForm(false);
  }, [form, editId, invoices, contacts]);

  const changeStatus = useCallback((id, status) => {
    setInvoices((prev) => prev.map((inv) => inv.id === id ? { ...inv, status, ...(status === 'paid' ? { paidAt: new Date().toISOString() } : {}) } : inv));
  }, []);

  const deleteInvoice = useCallback((id) => setInvoices((prev) => prev.filter((inv) => inv.id !== id)), []);

  const editInvoice = useCallback((inv) => {
    setForm({ contactId: inv.contactId, dueDate: inv.dueDate || '', notes: inv.notes || '', items: inv.items || [] });
    setEditId(inv.id);
    setShowForm(true);
  }, []);

  // Stats
  const stats = useMemo(() => {
    const totalTTC = invoices.reduce((s, inv) => s + (inv.totalTTC || 0), 0);
    const paid = invoices.filter((inv) => inv.status === 'paid');
    const paidAmount = paid.reduce((s, inv) => s + (inv.totalTTC || 0), 0);
    const pending = invoices.filter((inv) => inv.status === 'sent' || inv.status === 'overdue');
    const pendingAmount = pending.reduce((s, inv) => s + (inv.totalTTC || 0), 0);
    const overdue = invoices.filter((inv) => inv.status === 'overdue');
    const overdueAmount = overdue.reduce((s, inv) => s + (inv.totalTTC || 0), 0);
    return { total: invoices.length, totalTTC, paidAmount, pendingAmount, overdueAmount, overdueCount: overdue.length };
  }, [invoices]);

  const filtered = useMemo(() => {
    if (filterStatus === 'all') return invoices;
    return invoices.filter((inv) => inv.status === filterStatus);
  }, [invoices, filterStatus]);

  return (
    <>
      {/* KPIs */}
      <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginBottom: 20 }}>
        {[
          { l: 'Total facturé', v: `${fK(stats.totalTTC)}€`, c: T.accent, icon: '📋' },
          { l: 'Encaissé', v: `${fK(stats.paidAmount)}€`, c: T.green, icon: '✅' },
          { l: 'En attente', v: `${fK(stats.pendingAmount)}€`, c: T.orange, icon: '⏳' },
          { l: 'En retard', v: `${fK(stats.overdueAmount)}€`, c: T.red, icon: '⚠️', sub: stats.overdueCount > 0 ? `${stats.overdueCount} facture(s)` : '' },
        ].map((s) => (
          <div key={s.l} style={{ textAlign: 'center', padding: 14, borderRadius: 10, background: s.c + '10', border: `1px solid ${s.c}22` }}>
            <div style={{ fontSize: 14, marginBottom: 4 }}>{s.icon}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.c }}>{s.v}</div>
            <div style={{ fontSize: 10, fontWeight: 600, color: s.c, marginTop: 2 }}>{s.l}</div>
            {s.sub && <div style={{ fontSize: 9, color: T.red, marginTop: 2 }}>{s.sub}</div>}
          </div>
        ))}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {['all', 'draft', 'sent', 'paid', 'overdue'].map((s) => {
            const label = s === 'all' ? 'Toutes' : INVOICE_STATUSES.find((st) => st.id === s)?.label || s;
            const count = s === 'all' ? invoices.length : invoices.filter((inv) => inv.status === s).length;
            return (
              <button key={s} onClick={() => setFilterStatus(s)}
                style={{
                  background: filterStatus === s ? T.accent + '20' : 'transparent', border: `1px solid ${filterStatus === s ? T.accent : T.border}`,
                  borderRadius: 20, padding: '4px 10px', cursor: 'pointer', fontSize: 10, fontWeight: 600,
                  color: filterStatus === s ? T.accent : T.textMuted, fontFamily: 'inherit',
                }}>
                {label} ({count})
              </button>
            );
          })}
        </div>
        <Btn onClick={() => { setShowForm(!showForm); setEditId(null); setForm({ contactId: '', dueDate: '', notes: '', items: [{ description: '', qty: 1, unitPrice: 0, tva: 20 }] }); }}
          style={{ background: 'linear-gradient(135deg, #f97316, #f59e0b)' }}>
          {showForm ? 'Annuler' : '+ Nouvelle facture'}
        </Btn>
      </div>

      {/* Invoice Form */}
      {showForm && (
        <Card style={{ marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', color: T.textSecondary, fontSize: 11, fontWeight: 600, marginBottom: 4 }}>Client *</label>
              <select value={form.contactId} onChange={(e) => setForm({ ...form, contactId: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, background: T.surface2, border: `1px solid ${T.border}`, color: T.text, fontSize: 12, fontFamily: 'inherit' }}>
                <option value="">Sélectionner un contact...</option>
                {contacts.map((c) => <option key={c.id} value={c.id}>{c.name}{c.company ? ` (${c.company})` : ''}</option>)}
              </select>
            </div>
            <Inp label="Date d'échéance" type="date" value={form.dueDate} onChange={(v) => setForm({ ...form, dueDate: v })} />
            <Inp label="Notes" value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} placeholder="Conditions, mentions..." />
          </div>

          {/* Catalog quick-add */}
          {catalog.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', color: T.textSecondary, fontSize: 11, fontWeight: 600, marginBottom: 6 }}>Ajouter depuis le catalogue</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {catalog.map((item) => (
                  <button key={item.id} onClick={() => addFromCatalog(item)}
                    style={{
                      background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 8, padding: '5px 10px',
                      cursor: 'pointer', fontSize: 10, fontWeight: 600, color: T.text, fontFamily: 'inherit',
                      display: 'flex', alignItems: 'center', gap: 4,
                    }}>
                    + {item.name} ({fmt(item.price)}€)
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Line items */}
          <label style={{ display: 'block', color: T.textSecondary, fontSize: 11, fontWeight: 600, marginBottom: 8 }}>Lignes de facturation</label>
          {form.items.map((item, idx) => (
            <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 60px 100px 60px 32px', gap: 8, marginBottom: 6, alignItems: 'end' }}>
              <Inp label={idx === 0 ? 'Description' : ''} value={item.description} onChange={(v) => updateItem(idx, 'description', v)} placeholder="Description" small />
              <Inp label={idx === 0 ? 'Qté' : ''} value={String(item.qty)} onChange={(v) => updateItem(idx, 'qty', v)} type="number" small />
              <Inp label={idx === 0 ? 'Prix HT' : ''} value={String(item.unitPrice)} onChange={(v) => updateItem(idx, 'unitPrice', v)} type="number" suffix="€" small />
              <Inp label={idx === 0 ? 'TVA%' : ''} value={String(item.tva)} onChange={(v) => updateItem(idx, 'tva', v)} type="number" small />
              {form.items.length > 1 && <Btn v="danger" small onClick={() => removeItem(idx)}>{'✕'}</Btn>}
            </div>
          ))}
          <Btn v="ghost" small onClick={addItem} style={{ marginBottom: 12 }}>+ Ligne</Btn>

          {/* Totals */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <div style={{ minWidth: 200, textAlign: 'right' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: T.textSecondary, marginBottom: 4 }}>
                <span>Sous-total HT</span><span style={{ fontWeight: 700 }}>{fmt(totals.totalHT)} €</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: T.textSecondary, marginBottom: 4 }}>
                <span>TVA</span><span style={{ fontWeight: 700 }}>{fmt(totals.totalTVA)} €</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 800, color: T.green, borderTop: `2px solid ${T.border}`, paddingTop: 6 }}>
                <span>Total TTC</span><span>{fmt(totals.totalTTC)} €</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Btn onClick={save} style={{ background: 'linear-gradient(135deg, #f97316, #f59e0b)' }}>{editId ? 'Modifier' : 'Créer la facture'}</Btn>
          </div>
        </Card>
      )}

      {/* Invoice list */}
      {filtered.length === 0 ? (
        <Card><EmptyState icon="📋" title="Aucune facture" sub="Créez votre première facture pour commencer le suivi" /></Card>
      ) : (
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                {['N°', 'Client', 'Date', 'Échéance', 'Total TTC', 'Statut', 'Actions'].map((h) => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: T.textMuted, fontSize: 10, textTransform: 'uppercase', letterSpacing: .5 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...filtered].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')).map((inv) => {
                const st = INVOICE_STATUSES.find((s) => s.id === inv.status);
                return (
                  <tr key={inv.id} style={{ borderBottom: `1px solid ${T.border}22` }}>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: T.accent, fontFamily: 'monospace', fontSize: 11 }}>{inv.number}</td>
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: T.text }}>{inv.contactName || '—'}</td>
                    <td style={{ padding: '10px 14px', color: T.textSecondary, fontSize: 11 }}>{formatDateFR(inv.createdAt)}</td>
                    <td style={{ padding: '10px 14px', color: inv.status === 'overdue' ? T.red : T.textSecondary, fontWeight: inv.status === 'overdue' ? 700 : 400, fontSize: 11 }}>
                      {inv.dueDate ? formatDateFR(inv.dueDate) : '—'}
                    </td>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: T.text }}>{fmt(inv.totalTTC)} €</td>
                    <td style={{ padding: '10px 14px' }}>
                      <Badge label={st?.label} color={st?.color} bg={st?.bg} />
                    </td>
                    <td style={{ padding: '10px 14px', display: 'flex', gap: 4 }}>
                      {inv.status === 'draft' && <Btn v="ghost" small onClick={() => changeStatus(inv.id, 'sent')}>Envoyer</Btn>}
                      {(inv.status === 'sent' || inv.status === 'overdue') && <Btn v="success" small onClick={() => changeStatus(inv.id, 'paid')}>Encaisser</Btn>}
                      <Btn v="ghost" small onClick={() => editInvoice(inv)}>Modifier</Btn>
                      <Btn v="danger" small onClick={() => deleteInvoice(inv.id)}>{'✕'}</Btn>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </>
  );
}
