import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { T } from '../lib/theme.js';
import { uid, fmt, formatDateFR, ago } from '../lib/utils.js';
import { storeDebounced, load } from '../lib/store.js';
import { broadcast, subscribe } from '../lib/sync.js';
import { Card, Btn, Inp, Badge, Modal, EmptyState, Sel, TabBar, Pagination, PremiumGate } from '../components/ui.jsx';
import { useConfirmDialog } from '../hooks/useConfirmDialog.js';
import { INVOICE_STATUSES, TVA_RATES } from '../lib/constants.js';
import { t } from '../lib/i18n.js';

// ---------------------------------------------------------------------------
// Document types & constants
// ---------------------------------------------------------------------------

const getDOC_TYPES = () => [
  { id: 'invoice', label: t('doc.invoice'), icon: '🧾', color: T.blue },
  { id: 'quote', label: t('doc.quote'), icon: '📋', color: T.purple },
  { id: 'credit', label: t('doc.credit'), icon: '↩️', color: T.orange },
  { id: 'receipt', label: t('doc.receipt'), icon: '🧾', color: T.green },
];

const getFILTER_TABS = () => [t('doc.filterAll'), t('doc.filterInvoices'), t('doc.filterQuotes'), t('doc.filterCredits'), t('doc.filterReceipts')];
const FILTER_MAP_KEYS = ['', 'invoice', 'quote', 'credit', 'receipt'];

const getSORT_OPTIONS = () => [
  { value: 'date-desc', label: t('doc.sortRecent') },
  { value: 'date-asc', label: t('doc.sortOldest') },
  { value: 'amount-desc', label: t('doc.sortAmountDesc') },
  { value: 'amount-asc', label: t('doc.sortAmountAsc') },
];

const STATUS_COLORS = {
  draft: { color: T.textMuted, bg: T.surface2 },
  sent: { color: T.blue, bg: T.blueBg },
  paid: { color: T.green, bg: T.greenBg },
  overdue: { color: T.red, bg: T.redBg },
  accepted: { color: T.green, bg: T.greenBg },
  rejected: { color: T.red, bg: T.redBg },
  cancelled: { color: T.textMuted, bg: T.surface2 },
};

const getSTATUS_LABELS = () => ({
  draft: t('status.draft'), sent: t('status.sent'), paid: t('status.paid'), overdue: t('status.overdue'),
  accepted: t('status.accepted'), rejected: t('status.rejected'), cancelled: t('status.cancelled'),
});

function emptyDoc() {
  return {
    id: uid(), type: 'invoice', status: 'draft',
    number: '', clientName: '', clientEmail: '', clientAddress: '',
    items: [{ id: uid(), description: '', qty: 1, unitPrice: 0, tva: 20 }],
    notes: '', paymentTerms: t('doc.paymentDefault'), createdAt: new Date().toISOString(),
    dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    paidAt: null,
  };
}

function computeTotals(items) {
  let totalHT = 0, totalTVA = 0;
  items.forEach(item => {
    const lineHT = (item.qty || 0) * (item.unitPrice || 0);
    totalHT += lineHT;
    totalTVA += lineHT * ((item.tva || 0) / 100);
  });
  return { totalHT, totalTVA, totalTTC: totalHT + totalTVA };
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function Documents() {
  const [docs, setDocs] = useState(() => load('documents') || []);
  const [filterIdx, setFilterIdx] = useState(0);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('date-desc');
  const [editing, setEditing] = useState(null);
  const [page, setPage] = useState(1);
  const perPage = 15;
  const confirm = useConfirmDialog();

  useEffect(() => {
    storeDebounced('documents', docs);
    broadcast('documents', docs);
  }, [docs]);

  useEffect(() => {
    const unsub = subscribe('documents', (d) => setDocs(d));
    return unsub;
  }, []);

  // Filtered + sorted
  const filtered = useMemo(() => {
    let list = [...docs];

    // Type filter
    const typeKey = FILTER_MAP_KEYS[filterIdx];
    if (typeKey) list = list.filter(d => d.type === typeKey);

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(d =>
        d.number?.toLowerCase().includes(q) ||
        d.clientName?.toLowerCase().includes(q) ||
        d.clientEmail?.toLowerCase().includes(q)
      );
    }

    // Sort
    list.sort((a, b) => {
      if (sort === 'date-desc') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sort === 'date-asc') return new Date(a.createdAt) - new Date(b.createdAt);
      const ta = computeTotals(a.items || []).totalTTC;
      const tb = computeTotals(b.items || []).totalTTC;
      return sort === 'amount-desc' ? tb - ta : ta - tb;
    });

    return list;
  }, [docs, filterIdx, search, sort]);

  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Stats
  const stats = useMemo(() => {
    const total = docs.length;
    const paid = docs.filter(d => d.status === 'paid').length;
    const overdue = docs.filter(d => d.status === 'overdue' || (d.status === 'sent' && d.dueDate && new Date(d.dueDate) < new Date())).length;
    const totalRevenue = docs.filter(d => d.status === 'paid').reduce((s, d) => s + computeTotals(d.items || []).totalTTC, 0);
    const pendingAmount = docs.filter(d => d.status === 'sent').reduce((s, d) => s + computeTotals(d.items || []).totalTTC, 0);
    return { total, paid, overdue, totalRevenue, pendingAmount };
  }, [docs]);

  const addDoc = (type = 'invoice') => {
    const org = load('organization') || {};
    const prefix = type === 'invoice' ? 'F' : type === 'quote' ? 'D' : type === 'credit' ? 'AV' : 'R';
    const num = `${prefix}-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(docs.filter(d => d.type === type).length + 1).padStart(3, '0')}`;
    const doc = { ...emptyDoc(), type, number: num };
    setEditing(doc);
  };

  const saveDoc = (doc) => {
    const exists = docs.find(d => d.id === doc.id);
    if (exists) {
      setDocs(prev => prev.map(d => d.id === doc.id ? doc : d));
    } else {
      setDocs(prev => [doc, ...prev]);
    }
    setEditing(null);
  };

  const deleteDoc = async (id) => {
    const ok = await confirm.open(t('doc.deleteConfirm'), t('common.irreversible'));
    if (ok) setDocs(prev => prev.filter(d => d.id !== id));
  };

  const markPaid = (id) => {
    setDocs(prev => prev.map(d => d.id === id ? { ...d, status: 'paid', paidAt: new Date().toISOString() } : d));
  };

  const duplicateDoc = (doc) => {
    const newDoc = { ...doc, id: uid(), status: 'draft', createdAt: new Date().toISOString(), paidAt: null,
      number: doc.number + t('doc.copy'), items: doc.items.map(i => ({ ...i, id: uid() })) };
    setDocs(prev => [newDoc, ...prev]);
  };

  const generatePDF = (doc) => {
    const org = load('organization') || {};
    const { totalHT, totalTVA, totalTTC } = computeTotals(doc.items || []);
    const typeLabel = getDOC_TYPES().find(dt => dt.id === doc.type)?.label || 'Document';
    const html = `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><title>${typeLabel} ${doc.number}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',sans-serif;color:#1a1a2e;padding:40px;max-width:800px;margin:0 auto}
.header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:40px;border-bottom:3px solid #6366f1;padding-bottom:20px}
.brand{font-size:26px;font-weight:800;color:#6366f1}.brand-sub{font-size:11px;color:#666;margin-top:4px}
.meta{text-align:right}.meta h2{font-size:20px;color:#6366f1;margin-bottom:8px}.meta p{font-size:12px;color:#666;line-height:1.6}
.parties{display:flex;gap:40px;margin-bottom:30px}.party{flex:1;background:#f8f9fa;border-radius:10px;padding:16px}
.party h3{font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#999;margin-bottom:8px}.party p{font-size:13px;line-height:1.6}
table{width:100%;border-collapse:collapse;margin-bottom:30px}
thead th{background:#1a1a2e;color:#fff;padding:10px 14px;font-size:11px;text-transform:uppercase;letter-spacing:.5px;text-align:left}
thead th:nth-child(n+2){text-align:right}tbody td{padding:12px 14px;border-bottom:1px solid #eee;font-size:13px}
tbody td:nth-child(n+2){text-align:right}
.totals{display:flex;justify-content:flex-end}.totals-box{width:260px}
.totals-row{display:flex;justify-content:space-between;padding:6px 0;font-size:13px;border-bottom:1px solid #eee}
.totals-row.final{border-top:2px solid #1a1a2e;border-bottom:none;padding-top:10px;margin-top:4px;font-weight:800;font-size:16px;color:#6366f1}
.notes{margin-top:30px;padding:16px;background:#f8f9fa;border-radius:10px;font-size:12px;color:#666}
.footer{margin-top:40px;padding-top:16px;border-top:1px solid #eee;text-align:center;font-size:10px;color:#999;line-height:1.8}
.no-print{text-align:center;margin-bottom:20px}
@media print{.no-print{display:none}}
</style></head><body>
<div class="no-print"><button onclick="window.print()" style="background:linear-gradient(135deg,#6366f1,#4f46e5);color:#fff;border:none;padding:10px 24px;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer">${t('doc.pdfPrint')}</button></div>
<div class="header"><div><div class="brand">${org.name || 'HubScale'}</div><div class="brand-sub">${org.siret ? 'SIRET: ' + org.siret : ''}</div></div>
<div class="meta"><h2>${typeLabel} ${doc.number}</h2><p>${t('common.date')}: ${formatDateFR(doc.createdAt)}<br>${doc.dueDate ? t('doc.dueDate') + ' ' + formatDateFR(doc.dueDate) : ''}<br>${t('common.status')}: ${getSTATUS_LABELS()[doc.status] || doc.status}</p></div></div>
<div class="parties"><div class="party"><h3>${t('doc.pdfEmitter')}</h3><p><strong>${org.name || '—'}</strong><br>${org.address || ''}<br>${org.email || ''}</p></div>
<div class="party"><h3>${t('doc.client')}</h3><p><strong>${doc.clientName || '—'}</strong><br>${doc.clientAddress || ''}<br>${doc.clientEmail || ''}</p></div></div>
<table><thead><tr><th>${t('common.description')}</th><th>${t('doc.qty')}</th><th>${t('doc.unitPriceHT')}</th><th>${t('doc.tva')}</th><th>${t('doc.totalHT')}</th></tr></thead><tbody>
${(doc.items || []).map(i => `<tr><td>${i.description || '—'}</td><td>${i.qty}</td><td>${fmt(i.unitPrice)}€</td><td>${i.tva}%</td><td>${fmt(i.qty * i.unitPrice)}€</td></tr>`).join('')}
</tbody></table>
<div class="totals"><div class="totals-box">
<div class="totals-row"><span>${t('doc.totalHT')}</span><span>${fmt(totalHT)}€</span></div>
<div class="totals-row"><span>${t('doc.totalTVA')}</span><span>${fmt(totalTVA)}€</span></div>
<div class="totals-row final"><span>${t('doc.totalTTC')}</span><span>${fmt(totalTTC)}€</span></div>
</div></div>
${doc.notes ? `<div class="notes"><strong>${t('common.notes')}:</strong><br>${doc.notes}</div>` : ''}
<div class="footer"><strong>${org.name || 'HubScale'}</strong> — ${org.siret ? 'SIRET ' + org.siret : ''} ${org.tva_number ? '— TVA ' + org.tva_number : ''}<br>
${org.iban ? 'IBAN: ' + org.iban + (org.bic ? ' — BIC: ' + org.bic : '') : t('doc.bankInfoMissing')}</div>
</body></html>`;
    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
      {/* Header Stats */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {[
          { label: t('doc.documents'), value: stats.total, icon: '📄', color: T.accent },
          { label: t('doc.paid'), value: stats.paid, icon: '✅', color: T.green },
          { label: t('doc.overdue'), value: stats.overdue, icon: '⚠️', color: T.red },
          { label: t('doc.revenue'), value: fmt(stats.totalRevenue) + '€', icon: '💰', color: T.green },
          { label: t('doc.pending'), value: fmt(stats.pendingAmount) + '€', icon: '⏳', color: T.orange },
        ].map((s, i) => (
          <div key={i} className="glass-static fade-up" style={{ flex: '1 1 140px', padding: '14px 16px', minWidth: 0 }}>
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
          <TabBar items={getFILTER_TABS()} active={getFILTER_TABS()[filterIdx]} onChange={(tab) => { setFilterIdx(getFILTER_TABS().indexOf(tab)); setPage(1); }} />
          <div style={{ flex: 1 }} />
          <Inp small placeholder={t('common.search')} value={search} onChange={(v) => { setSearch(v); setPage(1); }} />
          <Sel value={sort} onChange={setSort} options={getSORT_OPTIONS()} small />
          <div style={{ display: 'flex', gap: 6 }}>
            <Btn small onClick={() => addDoc('invoice')}>{t('doc.addInvoice')}</Btn>
            <Btn small v="secondary" onClick={() => addDoc('quote')}>{t('doc.addQuote')}</Btn>
            <Btn small v="ghost" onClick={() => addDoc('credit')}>{t('doc.addCredit')}</Btn>
          </div>
        </div>
      </Card>

      {/* Document List */}
      {paged.length === 0 ? (
        <EmptyState icon="📄" title={t('doc.noDocuments')} sub={t('doc.noDocSub')} actionLabel={t('doc.createDoc')} onAction={() => addDoc('invoice')} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {paged.map(doc => {
            const docType = getDOC_TYPES().find(dt => dt.id === doc.type) || getDOC_TYPES()[0];
            const { totalTTC } = computeTotals(doc.items || []);
            const sc = STATUS_COLORS[doc.status] || STATUS_COLORS.draft;
            const isOverdue = doc.status === 'sent' && doc.dueDate && new Date(doc.dueDate) < new Date();

            return (
              <div key={doc.id} className="glass-static pressable" onClick={() => setEditing({ ...doc, items: doc.items.map(i => ({ ...i })) })}
                style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', borderLeft: `3px solid ${isOverdue ? T.red : docType.color}` }}>
                <div style={{ fontSize: 22 }}>{docType.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: T.text }}>{doc.number || t('common.noNumber')}</span>
                    <Badge label={getSTATUS_LABELS()[isOverdue ? 'overdue' : doc.status]} color={isOverdue ? T.red : sc.color} bg={isOverdue ? T.redBg : sc.bg} />
                    <Badge label={docType.label} color={docType.color} bg={T.surface2} />
                  </div>
                  <div style={{ fontSize: 12, color: T.textSecondary }}>
                    {doc.clientName || t('doc.noClient')} — {formatDateFR(doc.createdAt)}
                    {doc.dueDate && <span style={{ marginLeft: 8, color: isOverdue ? T.red : T.textMuted }}>{t('doc.dueDate')} {formatDateFR(doc.dueDate)}</span>}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 800, fontSize: 16, color: T.text }}>{fmt(totalTTC)}€</div>
                  <div style={{ fontSize: 10, color: T.textMuted }}>TTC</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {filtered.length > perPage && (
        <Pagination current={page} total={Math.ceil(filtered.length / perPage)} onChange={setPage} />
      )}

      {/* Edit Modal */}
      {editing && (
        <DocumentEditor
          doc={editing}
          onSave={saveDoc}
          onClose={() => setEditing(null)}
          onDelete={() => { deleteDoc(editing.id); setEditing(null); }}
          onDuplicate={() => { duplicateDoc(editing); setEditing(null); }}
          onMarkPaid={() => { markPaid(editing.id); setEditing(null); }}
          onGeneratePDF={() => generatePDF(editing)}
        />
      )}

      {confirm.dialog}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Document Editor Modal
// ---------------------------------------------------------------------------

function DocumentEditor({ doc, onSave, onClose, onDelete, onDuplicate, onMarkPaid, onGeneratePDF }) {
  const [form, setForm] = useState(doc);
  const contacts = load('contacts') || [];

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
  const { totalHT, totalTVA, totalTTC } = computeTotals(form.items || []);

  const addItem = () => set('items', [...form.items, { id: uid(), description: '', qty: 1, unitPrice: 0, tva: 20 }]);
  const removeItem = (id) => set('items', form.items.filter(i => i.id !== id));
  const updateItem = (id, k, v) => set('items', form.items.map(i => i.id === id ? { ...i, [k]: v } : i));

  const fillFromContact = (contactId) => {
    const c = contacts.find(x => x.id === contactId);
    if (c) {
      set('clientName', c.name || c.company || '');
      set('clientEmail', c.email || '');
      set('clientAddress', c.address || '');
    }
  };

  return (
    <Modal open onClose={onClose} title={`${getDOC_TYPES().find(dt => dt.id === form.type)?.label || 'Document'} — ${form.number || t('doc.new')}`} wide>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Type + Status */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 200px' }}>
            <Sel label={t('common.type')} value={form.type} onChange={(v) => set('type', v)} options={getDOC_TYPES().map(dt => ({ value: dt.id, label: dt.label }))} />
          </div>
          <div style={{ flex: '1 1 200px' }}>
            <Sel label={t('common.status')} value={form.status} onChange={(v) => set('status', v)} options={Object.entries(getSTATUS_LABELS()).map(([k, v]) => ({ value: k, label: v }))} />
          </div>
          <div style={{ flex: '1 1 200px' }}>
            <Inp label={t('doc.number')} value={form.number} onChange={(v) => set('number', v)} />
          </div>
        </div>

        {/* Client info */}
        <div style={{ padding: 14, background: T.surface2, borderRadius: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.textSecondary, marginBottom: 10, textTransform: 'uppercase', letterSpacing: .5 }}>{t('doc.client')}</div>
          {contacts.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <Sel small value="" onChange={fillFromContact} options={[{ value: '', label: t('doc.fillFromContact') }, ...contacts.map(c => ({ value: c.id, label: c.name || c.company || c.email }))]} />
            </div>
          )}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 200px' }}><Inp small label={t('common.name')} value={form.clientName} onChange={(v) => set('clientName', v)} /></div>
            <div style={{ flex: '1 1 200px' }}><Inp small label={t('common.email')} value={form.clientEmail} onChange={(v) => set('clientEmail', v)} type="email" /></div>
            <div style={{ flex: '1 1 300px' }}><Inp small label={t('common.address')} value={form.clientAddress} onChange={(v) => set('clientAddress', v)} /></div>
          </div>
        </div>

        {/* Dates */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 200px' }}><Inp label={t('doc.dueDateLabel')} type="date" value={form.dueDate || ''} onChange={(v) => set('dueDate', v)} /></div>
          <div style={{ flex: '1 1 200px' }}><Inp label={t('doc.paymentTerms')} value={form.paymentTerms} onChange={(v) => set('paymentTerms', v)} /></div>
        </div>

        {/* Line items */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.textSecondary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: .5 }}>{t('doc.lines')}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, overflowX: 'auto' }}>
            {form.items.map((item, idx) => (
              <div key={item.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-end', padding: '8px 10px', background: T.surface2, borderRadius: 8, minWidth: 520 }}>
                <div style={{ flex: '3 1 200px' }}><Inp small label={idx === 0 ? t('common.description') : ''} value={item.description} onChange={(v) => updateItem(item.id, 'description', v)} placeholder={t('doc.descPlaceholder')} /></div>
                <div style={{ flex: '0 0 70px' }}><Inp small label={idx === 0 ? t('doc.qty') : ''} type="number" value={item.qty} onChange={(v) => updateItem(item.id, 'qty', parseFloat(v) || 0)} /></div>
                <div style={{ flex: '0 0 100px' }}><Inp small label={idx === 0 ? t('doc.unitPriceHT') : ''} type="number" value={item.unitPrice} onChange={(v) => updateItem(item.id, 'unitPrice', parseFloat(v) || 0)} suffix="€" /></div>
                <div style={{ flex: '0 0 80px' }}>
                  <Sel small label={idx === 0 ? t('doc.tva') : ''} value={item.tva} onChange={(v) => updateItem(item.id, 'tva', parseFloat(v))} options={TVA_RATES} />
                </div>
                <div style={{ flex: '0 0 90px', textAlign: 'right', fontWeight: 700, fontSize: 13, color: T.text, paddingBottom: 8 }}>
                  {fmt((item.qty || 0) * (item.unitPrice || 0))}€
                </div>
                {form.items.length > 1 && (
                  <button onClick={() => removeItem(item.id)} style={{ background: 'none', border: 'none', color: T.red, cursor: 'pointer', fontSize: 16, padding: '0 4px' }}>×</button>
                )}
              </div>
            ))}
          </div>
          <Btn small v="ghost" onClick={addItem} style={{ marginTop: 8 }}>{t('doc.addLine')}</Btn>
        </div>

        {/* Totals */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: 240, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: T.textSecondary }}>
              <span>{t('doc.totalHT')}</span><span>{fmt(totalHT)}€</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: T.textSecondary }}>
              <span>{t('doc.totalTVA')}</span><span>{fmt(totalTVA)}€</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 800, color: T.accent, borderTop: `2px solid ${T.border}`, paddingTop: 8 }}>
              <span>{t('doc.totalTTC')}</span><span>{fmt(totalTTC)}€</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        <Inp label={t('doc.notesLabel')} value={form.notes} onChange={(v) => set('notes', v)} textarea />

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            {form.status !== 'paid' && <Btn small v="success" onClick={() => { onMarkPaid(); }}>{t('doc.markPaid')}</Btn>}
            <Btn small v="secondary" onClick={() => onGeneratePDF()}>{t('doc.printPdf')}</Btn>
            <Btn small v="ghost" onClick={() => onDuplicate()}>{t('common.duplicate')}</Btn>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn small v="danger" onClick={() => onDelete()}>{t('common.delete')}</Btn>
            <Btn small onClick={() => onSave(form)}>{t('common.save')}</Btn>
          </div>
        </div>
      </div>
    </Modal>
  );
}
