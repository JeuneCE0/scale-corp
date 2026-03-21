import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { T } from '../../lib/theme.js';
import { fmt, fK, pf } from '../../lib/utils.js';
import { uid } from '../../lib/utils.js';
import { storeDebounced } from '../../lib/store.js';
import { broadcast, subscribe } from '../../lib/sync.js';
import { load } from '../../lib/store.js';
import { Card, Btn, Inp, EmptyState, Badge } from '../../components/ui.jsx';
import { TVA_RATES } from '../../lib/constants.js';

export default function CatalogTab() {
  const [catalog, setCatalog] = useState(() => load('catalog') || []);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', price: '', tva: 20, unit: 'unité', type: 'service' });

  useEffect(() => { storeDebounced('catalog', catalog); broadcast('catalog', catalog); }, [catalog]);
  useEffect(() => subscribe('catalog', (data) => setCatalog(data)), []);

  const save = useCallback(() => {
    if (!form.name.trim() || !pf(form.price)) return;
    const item = { ...form, price: Math.round(pf(form.price) * 100) / 100, tva: pf(form.tva) };
    if (editId) {
      setCatalog((prev) => prev.map((c) => c.id === editId ? { ...c, ...item } : c));
    } else {
      setCatalog((prev) => [...prev, { ...item, id: uid(), createdAt: new Date().toISOString() }]);
    }
    setForm({ name: '', description: '', price: '', tva: 20, unit: 'unité', type: 'service' });
    setEditId(null);
    setShowForm(false);
  }, [form, editId]);

  const edit = useCallback((item) => {
    setForm({ name: item.name, description: item.description || '', price: String(item.price), tva: item.tva, unit: item.unit || 'unité', type: item.type || 'service' });
    setEditId(item.id);
    setShowForm(true);
  }, []);

  const remove = useCallback((id) => setCatalog((prev) => prev.filter((c) => c.id !== id)), []);

  // Stats
  const stats = useMemo(() => {
    const services = catalog.filter((c) => c.type === 'service');
    const products = catalog.filter((c) => c.type === 'product');
    const avgPrice = catalog.length > 0 ? Math.round(catalog.reduce((s, c) => s + c.price, 0) / catalog.length) : 0;
    return { total: catalog.length, services: services.length, products: products.length, avgPrice };
  }, [catalog]);

  return (
    <>
      {/* KPIs */}
      <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12, marginBottom: 20 }}>
        {[
          { l: 'Total', v: stats.total, c: T.accent, icon: '📦' },
          { l: 'Services', v: stats.services, c: T.blue, icon: '💼' },
          { l: 'Produits', v: stats.products, c: T.green, icon: '📦' },
          { l: 'Prix moyen', v: `${fK(stats.avgPrice)}€`, c: T.orange, icon: '💰' },
        ].map((s) => (
          <div key={s.l} style={{ textAlign: 'center', padding: 14, borderRadius: 10, background: s.c + '10', border: `1px solid ${s.c}22` }}>
            <div style={{ fontSize: 14, marginBottom: 4 }}>{s.icon}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.c }}>{s.v}</div>
            <div style={{ fontSize: 10, fontWeight: 600, color: s.c, marginTop: 2 }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Add button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <Btn onClick={() => { setShowForm(!showForm); setEditId(null); setForm({ name: '', description: '', price: '', tva: 20, unit: 'unité', type: 'service' }); }}
          style={{ background: 'linear-gradient(135deg, #f97316, #f59e0b)' }}>
          {showForm ? 'Annuler' : '+ Ajouter'}
        </Btn>
      </div>

      {/* Form */}
      {showForm && (
        <Card style={{ marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            <Inp label="Nom *" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="Nom du produit/service" />
            <Inp label="Description" value={form.description} onChange={(v) => setForm({ ...form, description: v })} placeholder="Description courte" />
            <Inp label="Prix HT (€)" value={form.price} onChange={(v) => setForm({ ...form, price: v })} type="number" placeholder="0" suffix="€" />
            <div>
              <label style={{ display: 'block', color: T.textSecondary, fontSize: 11, fontWeight: 600, marginBottom: 4 }}>TVA</label>
              <select value={form.tva} onChange={(e) => setForm({ ...form, tva: Number(e.target.value) })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, background: T.surface2, border: `1px solid ${T.border}`, color: T.text, fontSize: 12, fontFamily: 'inherit' }}>
                {TVA_RATES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <Inp label="Unité" value={form.unit} onChange={(v) => setForm({ ...form, unit: v })} placeholder="unité, heure, jour..." />
            <div>
              <label style={{ display: 'block', color: T.textSecondary, fontSize: 11, fontWeight: 600, marginBottom: 4 }}>Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, background: T.surface2, border: `1px solid ${T.border}`, color: T.text, fontSize: 12, fontFamily: 'inherit' }}>
                <option value="service">Service</option>
                <option value="product">Produit</option>
              </select>
            </div>
          </div>
          <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
            <Btn onClick={save} style={{ background: 'linear-gradient(135deg, #f97316, #f59e0b)' }}>{editId ? 'Modifier' : 'Ajouter'}</Btn>
          </div>
        </Card>
      )}

      {/* Catalog list */}
      {catalog.length === 0 ? (
        <Card><EmptyState icon="📦" title="Aucun produit/service" sub="Ajoutez votre premier produit ou service pour faciliter la facturation" /></Card>
      ) : (
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                {['Type', 'Nom', 'Description', 'Prix HT', 'TVA', 'Prix TTC', ''].map((h) => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: T.textMuted, fontSize: 10, textTransform: 'uppercase', letterSpacing: .5 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {catalog.map((item) => {
                const ttc = Math.round(item.price * (1 + (item.tva || 0) / 100) * 100) / 100;
                return (
                  <tr key={item.id} style={{ borderBottom: `1px solid ${T.border}22`, cursor: 'pointer' }} onClick={() => edit(item)}>
                    <td style={{ padding: '10px 14px' }}>
                      <Badge label={item.type === 'service' ? 'Service' : 'Produit'} color={item.type === 'service' ? T.blue : T.green} bg={item.type === 'service' ? T.blueBg : T.greenBg} />
                    </td>
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: T.text }}>{item.name}</td>
                    <td style={{ padding: '10px 14px', color: T.textSecondary, fontSize: 11 }}>{item.description || '—'}</td>
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: T.text }}>{fmt(item.price)} €</td>
                    <td style={{ padding: '10px 14px', color: T.textMuted }}>{item.tva}%</td>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: T.green }}>{fmt(ttc)} €</td>
                    <td style={{ padding: '10px 14px' }}>
                      <Btn v="danger" small onClick={(e) => { e.stopPropagation(); remove(item.id); }}>{'✕'}</Btn>
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
