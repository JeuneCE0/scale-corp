// HubScale — Super-Admin Panel
// Cross-organization management: clients, revenue, users, plans

import React, { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react';
import { T, FONT } from '../lib/theme.js';
import { KPI, Btn, Badge, Inp, Sel, Card, Modal, Section, Spinner } from '../components/ui.jsx';
import { PLANS } from '../lib/constants.js';
import * as api from '../lib/adminApi.js';

const Recharts = lazy(() => import('recharts').then((m) => ({ default: m })));

const ADMIN_TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'organizations', label: 'Organisations', icon: '🏢' },
  { id: 'users', label: 'Utilisateurs', icon: '👥' },
  { id: 'revenue', label: 'Revenus', icon: '💰' },
];

const PLAN_BADGES = {
  starter: { label: 'Essentiel', color: T.blue, bg: T.blueBg },
  professional: { label: 'Business', color: T.orange, bg: T.orangeBg },
  enterprise: { label: 'Scale', color: T.purple, bg: T.purpleBg },
};

const ROLE_LABELS = {
  owner: 'Proprietaire',
  admin: 'Admin',
  member: 'Membre',
  readonly: 'Lecture seule',
  super_admin: 'Super Admin',
};

function fmt(n) { return n != null ? n.toLocaleString('fr-FR') : '0'; }

// ─── Main Component ───

export default function Admin({ user, onBack }) {
  const [tab, setTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getPlatformStats().then(setStats).catch(console.error).finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: FONT, color: T.text }}>
      {/* Nav */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(9,9,11,.92)', backdropFilter: 'blur(24px)',
        borderBottom: `1px solid ${T.border}`, padding: '0 20px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 52 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Btn v="ghost" small onClick={onBack}>← Retour</Btn>
            <div style={{
              width: 30, height: 30, borderRadius: 8,
              background: 'linear-gradient(135deg, #ef4444, #f97316)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: 13, color: '#fff',
            }}>A</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 14, color: T.text, lineHeight: 1.2 }}>HubScale Admin</div>
              <div style={{ fontSize: 9, color: T.textMuted, letterSpacing: .5, textTransform: 'uppercase' }}>Super Admin Panel</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, color: T.textMuted }}>{user?.name || 'Admin'}</span>
            <div style={{
              width: 28, height: 28, borderRadius: 8, background: T.surface2,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700, color: T.textSecondary,
            }}>{(user?.name || 'A').charAt(0).toUpperCase()}</div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 2, overflow: 'auto' }}>
          {ADMIN_TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                background: active ? T.accentBg : 'transparent',
                color: active ? T.accent : T.textMuted,
                border: 'none', borderBottom: active ? `2px solid ${T.accent}` : '2px solid transparent',
                padding: '8px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                fontFamily: FONT, display: 'flex', alignItems: 'center', gap: 5,
                transition: 'all .15s ease',
              }}>
                <span style={{ fontSize: 13 }}>{t.icon}</span>
                {t.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Content */}
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '20px 24px 60px' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 80, gap: 10 }}>
            <Spinner size={24} />
            <span style={{ color: T.textMuted, fontSize: 12 }}>Chargement du panel admin...</span>
          </div>
        ) : (
          <>
            {tab === 'dashboard' && <DashboardTab stats={stats} />}
            {tab === 'organizations' && <OrganizationsTab />}
            {tab === 'users' && <UsersTab />}
            {tab === 'revenue' && <RevenueTab stats={stats} />}
          </>
        )}
      </main>
    </div>
  );
}

// ─── Dashboard Tab ───

function DashboardTab({ stats }) {
  if (!stats) return null;

  return (
    <>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <KPI label="ORGANISATIONS" value={fmt(stats.totalOrgs)} icon="🏢" delay={0} accent={T.blue} />
        <KPI label="UTILISATEURS" value={fmt(stats.totalUsers)} icon="👥" delay={1} accent={T.purple} />
        <KPI label="MRR" value={`${fmt(stats.mrr)} €`} icon="💰" delay={2} accent={T.green}
          sub={`ARR : ${fmt(stats.arr)} €`} />
        <KPI label="ARPU" value={`${fmt(stats.arpu)} €`} icon="📈" delay={3} accent={T.orange}
          sub="Par organisation" />
        <KPI label="NOUVEAUX CE MOIS" value={fmt(stats.newThisMonth)} icon="🆕" delay={4} accent={T.accent} />
      </div>

      <Section title="Repartition par forfait">
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {PLANS.map((p) => {
            const count = stats.planDistribution?.[p.id] || 0;
            const badge = PLAN_BADGES[p.id];
            return (
              <Card key={p.id} style={{ flex: '1 1 200px', minWidth: 180 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <Badge label={badge.label} color={badge.color} bg={badge.bg} />
                  <span style={{ fontSize: 11, color: T.textMuted }}>{p.monthly} €/mois</span>
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, color: T.text }}>{count}</div>
                <div style={{ fontSize: 11, color: T.textSecondary, marginTop: 2 }}>
                  organisations • {fmt(count * p.monthly)} €/mois
                </div>
              </Card>
            );
          })}
        </div>
      </Section>
    </>
  );
}

// ─── Organizations Tab ───

function OrganizationsTab() {
  const [orgs, setOrgs] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [detailOrg, setDetailOrg] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.listOrganizations({ page, limit: 15, search, plan: planFilter });
      setOrgs(res.organizations || []);
      setTotal(res.total || 0);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [page, search, planFilter]);

  useEffect(() => { load(); }, [load]);

  const openDetail = async (org) => {
    setSelectedOrg(org);
    setDetailLoading(true);
    try {
      const detail = await api.getOrganization(org.id);
      setDetailOrg(detail);
    } catch (e) { console.error(e); }
    setDetailLoading(false);
  };

  const handlePlanChange = async (orgId, newPlan) => {
    try {
      await api.changeOrgPlan(orgId, newPlan);
      load();
      if (detailOrg && detailOrg.id === orgId) setDetailOrg({ ...detailOrg, plan: newPlan });
    } catch (e) { console.error(e); }
  };

  return (
    <>
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: '1 1 250px' }}>
          <Inp label="Rechercher" value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Nom de l'organisation..." small />
        </div>
        <div style={{ flex: '0 0 180px' }}>
          <Sel label="Forfait" value={planFilter} onChange={(v) => { setPlanFilter(v); setPage(1); }} options={[
            { value: 'all', label: 'Tous les forfaits' },
            { value: 'starter', label: 'Essentiel' },
            { value: 'professional', label: 'Business' },
            { value: 'enterprise', label: 'Scale' },
          ]} />
        </div>
      </div>

      <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 8 }}>{total} organisation{total > 1 ? 's' : ''}</div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}><Spinner size={20} /></div>
      ) : (
        <div className="glass-static" style={{ borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                {['Organisation', 'Forfait', 'Membres', 'Contacts', 'MRR', 'Cree le'].map((h) => (
                  <th key={h} style={{ textAlign: 'left', padding: '10px 14px', color: T.textSecondary, fontSize: 10, fontWeight: 600, letterSpacing: .5, textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orgs.map((org) => {
                const badge = PLAN_BADGES[org.plan] || PLAN_BADGES.starter;
                return (
                  <tr key={org.id} onClick={() => openDetail(org)} style={{ borderBottom: `1px solid ${T.border}`, cursor: 'pointer', transition: 'background .15s' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = T.surface2}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ fontWeight: 600, color: T.text }}>{org.name}</div>
                      {org.sector && <div style={{ fontSize: 10, color: T.textMuted }}>{org.sector}</div>}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <Badge label={badge.label} color={badge.color} bg={badge.bg} />
                    </td>
                    <td style={{ padding: '10px 14px', color: T.textSecondary }}>{org.memberCount}</td>
                    <td style={{ padding: '10px 14px', color: T.textSecondary }}>{org.contactCount}</td>
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: T.green }}>{fmt(org.monthlyRevenue)} €</td>
                    <td style={{ padding: '10px 14px', color: T.textMuted, fontSize: 11 }}>{new Date(org.created_at).toLocaleDateString('fr-FR')}</td>
                  </tr>
                );
              })}
              {orgs.length === 0 && (
                <tr><td colSpan={6} style={{ padding: 30, textAlign: 'center', color: T.textMuted }}>Aucune organisation trouvee</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {total > 15 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
          <Btn v="ghost" small disabled={page <= 1} onClick={() => setPage(page - 1)}>Precedent</Btn>
          <span style={{ fontSize: 12, color: T.textMuted, padding: '4px 8px' }}>Page {page} / {Math.ceil(total / 15)}</span>
          <Btn v="ghost" small disabled={page >= Math.ceil(total / 15)} onClick={() => setPage(page + 1)}>Suivant</Btn>
        </div>
      )}

      {/* Organization Detail Modal */}
      <Modal open={!!selectedOrg} onClose={() => { setSelectedOrg(null); setDetailOrg(null); }} title={selectedOrg?.name || 'Organisation'} wide>
        {detailLoading ? (
          <div style={{ textAlign: 'center', padding: 30 }}><Spinner size={20} /></div>
        ) : detailOrg ? (
          <OrgDetail org={detailOrg} onPlanChange={handlePlanChange} />
        ) : null}
      </Modal>
    </>
  );
}

// ─── Organization Detail (inside Modal) ───

function OrgDetail({ org, onPlanChange }) {
  const badge = PLAN_BADGES[org.plan] || PLAN_BADGES.starter;
  const planObj = PLANS.find((p) => p.id === org.plan);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Info */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ flex: '1 1 200px' }}>
          <div style={{ fontSize: 10, color: T.textMuted, marginBottom: 2 }}>SECTEUR</div>
          <div style={{ fontSize: 13, color: T.text }}>{org.sector || '-'}</div>
        </div>
        <div style={{ flex: '1 1 200px' }}>
          <div style={{ fontSize: 10, color: T.textMuted, marginBottom: 2 }}>SITE WEB</div>
          <div style={{ fontSize: 13, color: T.text }}>{org.website || '-'}</div>
        </div>
        <div style={{ flex: '1 1 200px' }}>
          <div style={{ fontSize: 10, color: T.textMuted, marginBottom: 2 }}>CONTACTS</div>
          <div style={{ fontSize: 13, color: T.text }}>{org.contactCount}</div>
        </div>
        <div style={{ flex: '1 1 200px' }}>
          <div style={{ fontSize: 10, color: T.textMuted, marginBottom: 2 }}>STRIPE</div>
          <div style={{ fontSize: 13, color: org.stripe_customer_id ? T.green : T.textMuted }}>
            {org.stripe_customer_id ? 'Connecte' : 'Non connecte'}
          </div>
        </div>
      </div>

      {/* Plan */}
      <div>
        <div style={{ fontSize: 10, color: T.textMuted, marginBottom: 6, fontWeight: 600 }}>FORFAIT ACTUEL</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {PLANS.map((p) => {
            const b = PLAN_BADGES[p.id];
            const isCurrent = org.plan === p.id;
            return (
              <button key={p.id} onClick={() => !isCurrent && onPlanChange(org.id, p.id)} style={{
                background: isCurrent ? b.bg : 'transparent',
                border: `1px solid ${isCurrent ? b.color : T.border}`,
                borderRadius: 8, padding: '6px 14px', cursor: isCurrent ? 'default' : 'pointer',
                fontFamily: FONT, fontSize: 12, fontWeight: 600,
                color: isCurrent ? b.color : T.textMuted,
                opacity: isCurrent ? 1 : .7,
                transition: 'all .15s',
              }}>
                {b.label} • {p.monthly} €
              </button>
            );
          })}
        </div>
      </div>

      {/* Members */}
      <div>
        <div style={{ fontSize: 10, color: T.textMuted, marginBottom: 6, fontWeight: 600 }}>MEMBRES ({org.members?.length || 0})</div>
        <div className="glass-static" style={{ borderRadius: 10, overflow: 'hidden' }}>
          {(org.members || []).map((m, i) => (
            <div key={m.id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '8px 14px', borderBottom: i < org.members.length - 1 ? `1px solid ${T.border}` : 'none',
            }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{m.full_name}</div>
                <div style={{ fontSize: 11, color: T.textMuted }}>{m.email}</div>
              </div>
              <Badge label={ROLE_LABELS[m.role] || m.role} color={m.role === 'owner' ? T.orange : T.textSecondary} bg={m.role === 'owner' ? T.orangeBg : T.surface2} />
            </div>
          ))}
          {(!org.members || org.members.length === 0) && (
            <div style={{ padding: 14, textAlign: 'center', color: T.textMuted, fontSize: 12 }}>Aucun membre</div>
          )}
        </div>
      </div>

      {/* Financial History */}
      {org.financialHistory && org.financialHistory.length > 0 && (
        <div>
          <div style={{ fontSize: 10, color: T.textMuted, marginBottom: 6, fontWeight: 600 }}>HISTORIQUE FINANCIER (derniers mois)</div>
          <div className="glass-static" style={{ borderRadius: 10, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                  {['Periode', 'CA', 'Charges', 'Marge'].map((h) => (
                    <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: T.textSecondary, fontSize: 10, fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {org.financialHistory.slice(0, 6).map((f) => (
                  <tr key={f.period_key} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: '6px 12px', color: T.text }}>{f.period_key}</td>
                    <td style={{ padding: '6px 12px', color: T.green }}>{fmt(Number(f.ca))} €</td>
                    <td style={{ padding: '6px 12px', color: T.red }}>{fmt(Number(f.charges))} €</td>
                    <td style={{ padding: '6px 12px', color: Number(f.marge) >= 0 ? T.green : T.red }}>{fmt(Number(f.marge))} €</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Users Tab ───

function UsersTab() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [editUser, setEditUser] = useState(null);
  const [editRole, setEditRole] = useState('');
  const [editName, setEditName] = useState('');
  const [saving, setSaving] = useState(false);
  const [resetMsg, setResetMsg] = useState('');

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.listUsers({ page, limit: 20, search });
      setUsers(res.users || []);
      setTotal(res.total || 0);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [page, search]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const openEdit = (u) => {
    setEditUser(u);
    setEditRole(u.role);
    setEditName(u.full_name);
    setResetMsg('');
  };

  const handleSave = async () => {
    if (!editUser) return;
    setSaving(true);
    try {
      await api.updateUser(editUser.id, { full_name: editName, role: editRole });
      loadUsers();
      setEditUser(null);
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  const handleResetPassword = async () => {
    if (!editUser) return;
    setSaving(true);
    try {
      const res = await api.resetUserPassword(editUser.id);
      setResetMsg(res.message || 'Email de reset envoye');
    } catch (e) { setResetMsg('Erreur: ' + e.message); }
    setSaving(false);
  };

  return (
    <>
      <div style={{ marginBottom: 16, maxWidth: 400 }}>
        <Inp label="Rechercher un utilisateur" value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Nom ou email..." small />
      </div>

      <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 8 }}>{total} utilisateur{total > 1 ? 's' : ''}</div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}><Spinner size={20} /></div>
      ) : (
        <div className="glass-static" style={{ borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                {['Utilisateur', 'Organisation', 'Role', 'Forfait', 'Inscrit le'].map((h) => (
                  <th key={h} style={{ textAlign: 'left', padding: '10px 14px', color: T.textSecondary, fontSize: 10, fontWeight: 600, letterSpacing: .5, textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const planBadge = PLAN_BADGES[u.orgPlan] || PLAN_BADGES.starter;
                return (
                  <tr key={u.id} onClick={() => openEdit(u)} style={{ borderBottom: `1px solid ${T.border}`, cursor: 'pointer', transition: 'background .15s' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = T.surface2}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ fontWeight: 600, color: T.text }}>{u.full_name}</div>
                      <div style={{ fontSize: 11, color: T.textMuted }}>{u.email}</div>
                    </td>
                    <td style={{ padding: '10px 14px', color: T.textSecondary }}>{u.orgName}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <Badge label={ROLE_LABELS[u.role] || u.role} color={u.role === 'super_admin' ? T.red : u.role === 'owner' ? T.orange : T.textSecondary}
                        bg={u.role === 'super_admin' ? T.redBg : u.role === 'owner' ? T.orangeBg : T.surface2} />
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <Badge label={planBadge.label} color={planBadge.color} bg={planBadge.bg} />
                    </td>
                    <td style={{ padding: '10px 14px', color: T.textMuted, fontSize: 11 }}>{new Date(u.created_at).toLocaleDateString('fr-FR')}</td>
                  </tr>
                );
              })}
              {users.length === 0 && (
                <tr><td colSpan={5} style={{ padding: 30, textAlign: 'center', color: T.textMuted }}>Aucun utilisateur trouve</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {total > 20 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
          <Btn v="ghost" small disabled={page <= 1} onClick={() => setPage(page - 1)}>Precedent</Btn>
          <span style={{ fontSize: 12, color: T.textMuted, padding: '4px 8px' }}>Page {page} / {Math.ceil(total / 20)}</span>
          <Btn v="ghost" small disabled={page >= Math.ceil(total / 20)} onClick={() => setPage(page + 1)}>Suivant</Btn>
        </div>
      )}

      {/* Edit User Modal */}
      <Modal open={!!editUser} onClose={() => setEditUser(null)} title="Modifier l'utilisateur"
        footer={
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Btn v="ghost" onClick={() => setEditUser(null)}>Annuler</Btn>
            <Btn onClick={handleSave} disabled={saving}>{saving ? 'Enregistrement...' : 'Enregistrer'}</Btn>
          </div>
        }>
        {editUser && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Inp label="Nom complet" value={editName} onChange={setEditName} />
            <div style={{ fontSize: 11, color: T.textMuted }}>Email : {editUser.email}</div>
            <Sel label="Role" value={editRole} onChange={setEditRole} options={[
              { value: 'owner', label: 'Proprietaire' },
              { value: 'admin', label: 'Admin' },
              { value: 'member', label: 'Membre' },
              { value: 'readonly', label: 'Lecture seule' },
              { value: 'super_admin', label: 'Super Admin' },
            ]} />
            <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 12 }}>
              <Btn v="danger" small onClick={handleResetPassword} disabled={saving}>
                Reinitialiser le mot de passe
              </Btn>
              {resetMsg && <div style={{ fontSize: 11, color: T.green, marginTop: 6 }}>{resetMsg}</div>}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

// ─── Revenue Tab ───

function RevenueTab({ stats }) {
  const [revenue, setRevenue] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getRevenueHistory().then(setRevenue).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ textAlign: 'center', padding: 40 }}><Spinner size={20} /></div>;
  if (!revenue) return null;

  return (
    <>
      {/* KPIs */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <KPI label="MRR ACTUEL" value={`${fmt(stats?.mrr || 0)} €`} icon="💰" delay={0} accent={T.green} />
        <KPI label="ARR" value={`${fmt(stats?.arr || 0)} €`} icon="📈" delay={1} accent={T.blue} />
        <KPI label="ARPU" value={`${fmt(stats?.arpu || 0)} €`} icon="👤" delay={2} accent={T.orange}
          sub="Revenu moyen par org" />
      </div>

      {/* MRR Chart */}
      <Section title="Evolution du MRR" sub="12 derniers mois">
        <Suspense fallback={<div style={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spinner size={20} /></div>}>
          <MRRChart data={revenue.months || []} />
        </Suspense>
      </Section>

      {/* Revenue per org */}
      <Section title="Revenus par organisation" sub={`${(revenue.organizations || []).length} organisations`}>
        <div className="glass-static" style={{ borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                {['Organisation', 'Forfait', 'MRR', 'Stripe', 'Inscrit le'].map((h) => (
                  <th key={h} style={{ textAlign: 'left', padding: '10px 14px', color: T.textSecondary, fontSize: 10, fontWeight: 600, letterSpacing: .5, textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(revenue.organizations || [])
                .sort((a, b) => b.monthlyRevenue - a.monthlyRevenue)
                .map((o) => {
                  const badge = PLAN_BADGES[o.plan] || PLAN_BADGES.starter;
                  return (
                    <tr key={o.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '10px 14px', fontWeight: 600, color: T.text }}>{o.name}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <Badge label={badge.label} color={badge.color} bg={badge.bg} />
                      </td>
                      <td style={{ padding: '10px 14px', fontWeight: 600, color: T.green }}>{fmt(o.monthlyRevenue)} €</td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ fontSize: 11, color: o.hasStripe ? T.green : T.textMuted }}>
                          {o.hasStripe ? 'Actif' : '-'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', color: T.textMuted, fontSize: 11 }}>{new Date(o.createdAt).toLocaleDateString('fr-FR')}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </Section>
    </>
  );
}

// ─── MRR Chart (Recharts lazy-loaded) ───

function MRRChart({ data }) {
  const [RC, setRC] = useState(null);

  useEffect(() => {
    import('recharts').then((m) => setRC(m)).catch(() => {});
  }, []);

  if (!RC) return <div style={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spinner size={16} /></div>;

  const { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } = RC;

  return (
    <div className="glass-static" style={{ borderRadius: 12, padding: 16 }}>
      <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
          <defs>
            <linearGradient id="mrrGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={T.green} stopOpacity={.3} />
              <stop offset="95%" stopColor={T.green} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
          <XAxis dataKey="month" tick={{ fill: T.textMuted, fontSize: 10 }} axisLine={{ stroke: T.border }} tickLine={false} />
          <YAxis tick={{ fill: T.textMuted, fontSize: 10 }} axisLine={{ stroke: T.border }} tickLine={false}
            tickFormatter={(v) => `${v} €`} />
          <Tooltip
            contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: T.textSecondary }}
            formatter={(v) => [`${fmt(v)} €`, 'MRR']}
          />
          <Area type="monotone" dataKey="mrr" stroke={T.green} fill="url(#mrrGradient)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
