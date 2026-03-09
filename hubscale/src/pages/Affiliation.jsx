import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { T } from '../lib/theme.js';
import { uid, fmt, formatDateFR, ago } from '../lib/utils.js';
import { storeDebounced, load } from '../lib/store.js';
import { broadcast, subscribe } from '../lib/sync.js';
import { Card, Btn, Inp, Badge, Modal, EmptyState, TabBar, Pagination } from '../components/ui.jsx';
import { t } from '../lib/i18n.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const COMMISSION_TIERS = [
  { id: 'starter', minReferrals: 0, rate: 15, label: 'Starter', color: T.textSecondary, icon: '🌱' },
  { id: 'silver', minReferrals: 5, rate: 20, label: 'Silver', color: '#94a3b8', icon: '🥈' },
  { id: 'gold', minReferrals: 15, rate: 25, label: 'Gold', color: '#eab308', icon: '🥇' },
  { id: 'platinum', minReferrals: 30, rate: 30, label: 'Platinum', color: T.accent, icon: '💎' },
];

const REFERRAL_STATUSES = {
  pending: { label: () => t('affiliation.statusPending'), color: T.orange, bg: T.orangeBg },
  active: { label: () => t('affiliation.statusActive'), color: T.green, bg: T.greenBg },
  churned: { label: () => t('affiliation.statusChurned'), color: T.red, bg: T.redBg },
};

const PAYOUT_STATUSES = {
  pending: { label: () => t('affiliation.payoutPending'), color: T.orange, bg: T.orangeBg },
  processing: { label: () => t('affiliation.payoutProcessing'), color: T.blue, bg: T.blueBg },
  paid: { label: () => t('affiliation.payoutPaid'), color: T.green, bg: T.greenBg },
};

function generateReferralCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function Affiliation() {
  const [data, setData] = useState(() => {
    const saved = load('affiliation');
    if (saved) return saved;
    return {
      referralCode: generateReferralCode(),
      referrals: [],
      payouts: [],
      totalEarned: 0,
      totalPaid: 0,
      createdAt: new Date().toISOString(),
    };
  });

  const [activeTab, setActiveTab] = useState(0);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [page, setPage] = useState(1);
  const perPage = 10;

  useEffect(() => {
    storeDebounced('affiliation', data);
    broadcast('affiliation', data);
  }, [data]);

  useEffect(() => {
    const unsub = subscribe('affiliation', (d) => setData(d));
    return unsub;
  }, []);

  const referralLink = `https://hubscale.app/r/${data.referralCode}`;

  const copyLink = useCallback(() => {
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [referralLink]);

  // Current tier
  const currentTier = useMemo(() => {
    const activeCount = data.referrals.filter(r => r.status === 'active').length;
    let tier = COMMISSION_TIERS[0];
    for (const t of COMMISSION_TIERS) {
      if (activeCount >= t.minReferrals) tier = t;
    }
    return tier;
  }, [data.referrals]);

  const nextTier = useMemo(() => {
    const idx = COMMISSION_TIERS.findIndex(t => t.id === currentTier.id);
    return idx < COMMISSION_TIERS.length - 1 ? COMMISSION_TIERS[idx + 1] : null;
  }, [currentTier]);

  // Stats
  const stats = useMemo(() => {
    const active = data.referrals.filter(r => r.status === 'active').length;
    const pending = data.referrals.filter(r => r.status === 'pending').length;
    const totalCommissions = data.referrals.reduce((s, r) => s + (r.commissionEarned || 0), 0);
    const pendingPayout = totalCommissions - data.totalPaid;
    const thisMonth = data.referrals.filter(r => {
      const d = new Date(r.joinedAt);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
    return { total: data.referrals.length, active, pending, totalCommissions, pendingPayout, thisMonth };
  }, [data]);

  // Sorted referrals
  const sortedReferrals = useMemo(() => {
    return [...data.referrals].sort((a, b) => new Date(b.joinedAt) - new Date(a.joinedAt));
  }, [data.referrals]);

  const pagedReferrals = sortedReferrals.slice((page - 1) * perPage, page * perPage);

  // Sorted payouts
  const sortedPayouts = useMemo(() => {
    return [...data.payouts].sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [data.payouts]);

  const getTabs = () => [t('affiliation.tabOverview'), t('affiliation.tabReferrals'), t('affiliation.tabPayouts'), t('affiliation.tabTiers')];

  const requestPayout = () => {
    if (stats.pendingPayout < 50) return;
    const payout = {
      id: uid(),
      amount: stats.pendingPayout,
      status: 'pending',
      date: new Date().toISOString(),
      method: 'bank_transfer',
    };
    setData(prev => ({
      ...prev,
      payouts: [...prev.payouts, payout],
      totalPaid: prev.totalPaid + stats.pendingPayout,
    }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
      {/* Referral Link Banner */}
      <div className="glass-static fade-up" style={{
        padding: '20px 24px', borderRadius: 14,
        background: `linear-gradient(135deg, ${T.accent}15, ${T.purple}15)`,
        border: `1px solid ${T.accent}30`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: T.text, marginBottom: 4 }}>
              🎁 {t('affiliation.inviteTitle')}
            </div>
            <div style={{ fontSize: 13, color: T.textSecondary, maxWidth: 500 }}>
              {t('affiliation.inviteSub', { rate: currentTier.rate })}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{
              padding: '10px 16px', background: T.surface2, borderRadius: 10, fontFamily: 'monospace',
              fontSize: 13, fontWeight: 600, color: T.accent, letterSpacing: .5, userSelect: 'all',
              border: `1px solid ${T.border}`,
            }}>
              {referralLink}
            </div>
            <Btn small onClick={copyLink}>
              {copied ? t('affiliation.copied') : t('affiliation.copyLink')}
            </Btn>
            <Btn small v="secondary" onClick={() => setShowShareModal(true)}>
              {t('affiliation.share')}
            </Btn>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {[
          { label: t('affiliation.totalReferrals'), value: stats.total, icon: '👥', color: T.accent },
          { label: t('affiliation.activeReferrals'), value: stats.active, icon: '✅', color: T.green },
          { label: t('affiliation.thisMonth'), value: stats.thisMonth, icon: '📅', color: T.blue },
          { label: t('affiliation.totalCommissions'), value: fmt(stats.totalCommissions) + '€', icon: '💰', color: T.green },
          { label: t('affiliation.pendingPayout'), value: fmt(stats.pendingPayout) + '€', icon: '⏳', color: T.orange },
          { label: t('affiliation.currentRate'), value: currentTier.rate + '%', icon: currentTier.icon, color: T.accent },
        ].map((s, i) => (
          <div key={i} className="glass-static fade-up" style={{ flex: '1 1 140px', padding: '14px 16px', minWidth: 0 }}>
            <div style={{ fontSize: 10, color: T.textSecondary, fontWeight: 600, letterSpacing: .5, textTransform: 'uppercase', marginBottom: 4 }}>
              <span style={{ marginRight: 4 }}>{s.icon}</span>{s.label}
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <Card>
        <TabBar items={getTabs()} active={getTabs()[activeTab]} onChange={(tab) => { setActiveTab(getTabs().indexOf(tab)); setPage(1); }} />
      </Card>

      {/* Tab Content */}
      {activeTab === 0 && <OverviewTab stats={stats} currentTier={currentTier} nextTier={nextTier} referrals={data.referrals} payouts={sortedPayouts} onRequestPayout={requestPayout} />}
      {activeTab === 1 && (
        <>
          {sortedReferrals.length === 0 ? (
            <EmptyState icon="👥" title={t('affiliation.noReferrals')} sub={t('affiliation.noReferralsSub')} />
          ) : (
            <Card>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {pagedReferrals.map(ref => {
                  const st = REFERRAL_STATUSES[ref.status] || REFERRAL_STATUSES.pending;
                  return (
                    <div key={ref.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 8, background: T.surface2 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 18, background: T.accent + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                        {ref.name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, color: T.text }}>{ref.name || ref.email}</div>
                        <div style={{ fontSize: 11, color: T.textMuted }}>{ref.email} — {t('affiliation.joinedOn')} {formatDateFR(ref.joinedAt)}</div>
                      </div>
                      <Badge label={st.label()} color={st.color} bg={st.bg} />
                      <div style={{ textAlign: 'right', minWidth: 80 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: T.green }}>{fmt(ref.commissionEarned || 0)}€</div>
                        <div style={{ fontSize: 9, color: T.textMuted }}>{t('affiliation.earned')}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
          {sortedReferrals.length > perPage && (
            <Pagination current={page} total={Math.ceil(sortedReferrals.length / perPage)} onChange={setPage} />
          )}
        </>
      )}
      {activeTab === 2 && <PayoutsTab payouts={sortedPayouts} pendingAmount={stats.pendingPayout} onRequestPayout={requestPayout} />}
      {activeTab === 3 && <TiersTab currentTier={currentTier} activeCount={stats.active} />}

      {/* Share Modal */}
      {showShareModal && (
        <ShareModal
          link={referralLink}
          code={data.referralCode}
          rate={currentTier.rate}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Overview Tab
// ---------------------------------------------------------------------------

function OverviewTab({ stats, currentTier, nextTier, referrals, payouts, onRequestPayout }) {
  const recentReferrals = referrals.slice(-5).reverse();
  const recentPayouts = payouts.slice(0, 3);
  const activeCount = referrals.filter(r => r.status === 'active').length;
  const progressToNext = nextTier ? Math.min(100, Math.round((activeCount / nextTier.minReferrals) * 100)) : 100;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
      {/* Current Tier Card */}
      <Card>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.textSecondary, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 14 }}>
          {t('affiliation.yourTier')}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ fontSize: 36 }}>{currentTier.icon}</div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: currentTier.color }}>{currentTier.label}</div>
            <div style={{ fontSize: 13, color: T.textSecondary }}>{currentTier.rate}% {t('affiliation.commission')}</div>
          </div>
        </div>
        {nextTier && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: T.textMuted, marginBottom: 6 }}>
              <span>{t('affiliation.progressToNext', { tier: nextTier.label })}</span>
              <span>{activeCount}/{nextTier.minReferrals}</span>
            </div>
            <div style={{ height: 8, borderRadius: 4, background: T.surface2, overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: 4, background: `linear-gradient(90deg, ${currentTier.color}, ${nextTier.color})`, width: `${progressToNext}%`, transition: 'width .5s ease' }} />
            </div>
            <div style={{ fontSize: 10, color: T.textMuted, marginTop: 4 }}>
              {t('affiliation.referralsNeeded', { n: Math.max(0, nextTier.minReferrals - activeCount) })}
            </div>
          </div>
        )}
      </Card>

      {/* Payout Summary */}
      <Card>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.textSecondary, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 14 }}>
          {t('affiliation.payoutSummary')}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${T.border}` }}>
            <span style={{ fontSize: 13, color: T.textSecondary }}>{t('affiliation.totalEarned')}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: T.green }}>{fmt(stats.totalCommissions)}€</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${T.border}` }}>
            <span style={{ fontSize: 13, color: T.textSecondary }}>{t('affiliation.totalPaid')}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{fmt(stats.totalCommissions - stats.pendingPayout)}€</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{t('affiliation.availablePayout')}</span>
            <span style={{ fontSize: 16, fontWeight: 800, color: T.accent }}>{fmt(stats.pendingPayout)}€</span>
          </div>
        </div>
        <Btn small onClick={onRequestPayout} disabled={stats.pendingPayout < 50}>
          {stats.pendingPayout < 50 ? t('affiliation.minPayout') : t('affiliation.requestPayout')}
        </Btn>
      </Card>

      {/* Recent Activity */}
      <Card style={{ gridColumn: '1 / -1' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.textSecondary, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 14 }}>
          {t('affiliation.recentActivity')}
        </div>
        {recentReferrals.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 24, color: T.textMuted, fontSize: 12 }}>
            {t('affiliation.noActivityYet')}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recentReferrals.map((ref, i) => {
              const st = REFERRAL_STATUSES[ref.status] || REFERRAL_STATUSES.pending;
              return (
                <div key={ref.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < recentReferrals.length - 1 ? `1px solid ${T.border}` : 'none' }}>
                  <div style={{ width: 28, height: 28, borderRadius: 14, background: st.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: st.color }}>
                    {ref.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{ref.name || ref.email}</span>
                    <span style={{ fontSize: 11, color: T.textMuted, marginLeft: 8 }}>{ago(ref.joinedAt)}</span>
                  </div>
                  <Badge label={st.label()} color={st.color} bg={st.bg} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: T.green }}>{fmt(ref.commissionEarned || 0)}€</span>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Payouts Tab
// ---------------------------------------------------------------------------

function PayoutsTab({ payouts, pendingAmount, onRequestPayout }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Request payout banner */}
      <div className="glass-static" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: 10 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{t('affiliation.availablePayout')}</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: T.accent }}>{fmt(pendingAmount)}€</div>
          <div style={{ fontSize: 10, color: T.textMuted }}>{t('affiliation.minPayoutNote')}</div>
        </div>
        <Btn onClick={onRequestPayout} disabled={pendingAmount < 50}>
          {pendingAmount < 50 ? t('affiliation.minPayout') : t('affiliation.requestPayout')}
        </Btn>
      </div>

      {/* Payout history */}
      {payouts.length === 0 ? (
        <EmptyState icon="💸" title={t('affiliation.noPayouts')} sub={t('affiliation.noPayoutsSub')} />
      ) : (
        <Card>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.textSecondary, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 14 }}>
            {t('affiliation.payoutHistory')}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {payouts.map(p => {
              const st = PAYOUT_STATUSES[p.status] || PAYOUT_STATUSES.pending;
              return (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 8, background: T.surface2 }}>
                  <div style={{ fontSize: 18 }}>💸</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: T.text }}>{fmt(p.amount)}€</div>
                    <div style={{ fontSize: 11, color: T.textMuted }}>{formatDateFR(p.date)} — {t('affiliation.bankTransfer')}</div>
                  </div>
                  <Badge label={st.label()} color={st.color} bg={st.bg} />
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tiers Tab
// ---------------------------------------------------------------------------

function TiersTab({ currentTier, activeCount }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Card>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.textSecondary, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 14 }}>
          {t('affiliation.commissionTiers')}
        </div>
        <div style={{ fontSize: 12, color: T.textSecondary, marginBottom: 16 }}>
          {t('affiliation.tierExplanation')}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
          {COMMISSION_TIERS.map(tier => {
            const isActive = tier.id === currentTier.id;
            const isUnlocked = activeCount >= tier.minReferrals;
            return (
              <div key={tier.id} style={{
                padding: '20px 16px', borderRadius: 12, textAlign: 'center',
                background: isActive ? tier.color + '15' : T.surface2,
                border: `2px solid ${isActive ? tier.color : 'transparent'}`,
                opacity: isUnlocked ? 1 : 0.6,
                position: 'relative',
              }}>
                {isActive && (
                  <div style={{
                    position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
                    background: tier.color, color: '#fff', fontSize: 9, fontWeight: 700,
                    padding: '2px 10px', borderRadius: 10, textTransform: 'uppercase', letterSpacing: .5,
                  }}>
                    {t('affiliation.currentTier')}
                  </div>
                )}
                <div style={{ fontSize: 36, marginBottom: 8 }}>{tier.icon}</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: tier.color, marginBottom: 4 }}>{tier.label}</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: T.text, marginBottom: 4 }}>{tier.rate}%</div>
                <div style={{ fontSize: 11, color: T.textSecondary }}>{t('affiliation.commission')}</div>
                <div style={{ marginTop: 10, fontSize: 11, color: T.textMuted, padding: '6px 0', borderTop: `1px solid ${T.border}` }}>
                  {tier.minReferrals === 0
                    ? t('affiliation.tierDefault')
                    : t('affiliation.tierRequirement', { n: tier.minReferrals })}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* How it works */}
      <Card>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.textSecondary, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 14 }}>
          {t('affiliation.howItWorks')}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
          {[
            { step: '1', icon: '🔗', title: t('affiliation.step1Title'), desc: t('affiliation.step1Desc') },
            { step: '2', icon: '📨', title: t('affiliation.step2Title'), desc: t('affiliation.step2Desc') },
            { step: '3', icon: '✅', title: t('affiliation.step3Title'), desc: t('affiliation.step3Desc') },
            { step: '4', icon: '💰', title: t('affiliation.step4Title'), desc: t('affiliation.step4Desc') },
          ].map(s => (
            <div key={s.step} style={{ textAlign: 'center', padding: '12px 8px' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 4 }}>{s.title}</div>
              <div style={{ fontSize: 11, color: T.textSecondary, lineHeight: 1.5 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Share Modal
// ---------------------------------------------------------------------------

function ShareModal({ link, code, rate, onClose }) {
  const [copied, setCopied] = useState('');

  const copy = (text, key) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(''), 2000);
    });
  };

  const shareMessage = t('affiliation.shareMessage', { rate, link });

  const shareChannels = [
    { id: 'email', icon: '📧', label: 'Email', href: `mailto:?subject=${encodeURIComponent(t('affiliation.shareEmailSubject'))}&body=${encodeURIComponent(shareMessage)}` },
    { id: 'whatsapp', icon: '💬', label: 'WhatsApp', href: `https://wa.me/?text=${encodeURIComponent(shareMessage)}` },
    { id: 'twitter', icon: '🐦', label: 'Twitter/X', href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}` },
    { id: 'linkedin', icon: '💼', label: 'LinkedIn', href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}` },
  ];

  return (
    <Modal open onClose={onClose} title={t('affiliation.shareTitle')}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Link */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.textSecondary, textTransform: 'uppercase', marginBottom: 6 }}>
            {t('affiliation.yourLink')}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{
              flex: 1, padding: '10px 14px', background: T.surface2, borderRadius: 8,
              fontFamily: 'monospace', fontSize: 12, color: T.accent, userSelect: 'all',
            }}>
              {link}
            </div>
            <Btn small onClick={() => copy(link, 'link')}>
              {copied === 'link' ? '✓' : t('affiliation.copy')}
            </Btn>
          </div>
        </div>

        {/* Code */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.textSecondary, textTransform: 'uppercase', marginBottom: 6 }}>
            {t('affiliation.yourCode')}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{
              padding: '10px 20px', background: T.accent + '15', borderRadius: 8,
              fontFamily: 'monospace', fontSize: 18, fontWeight: 800, color: T.accent, letterSpacing: 2, textAlign: 'center',
            }}>
              {code}
            </div>
            <Btn small v="secondary" onClick={() => copy(code, 'code')}>
              {copied === 'code' ? '✓' : t('affiliation.copy')}
            </Btn>
          </div>
        </div>

        {/* Share channels */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.textSecondary, textTransform: 'uppercase', marginBottom: 10 }}>
            {t('affiliation.shareVia')}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {shareChannels.map(ch => (
              <a key={ch.id} href={ch.href} target="_blank" rel="noopener noreferrer"
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                  padding: '14px 8px', borderRadius: 10, background: T.surface2,
                  textDecoration: 'none', cursor: 'pointer', transition: 'all .15s',
                }}
                onMouseOver={e => e.currentTarget.style.background = T.accent + '15'}
                onMouseOut={e => e.currentTarget.style.background = T.surface2}
              >
                <span style={{ fontSize: 24 }}>{ch.icon}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: T.text }}>{ch.label}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Pre-written message */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.textSecondary, textTransform: 'uppercase', marginBottom: 6 }}>
            {t('affiliation.prewrittenMessage')}
          </div>
          <div style={{
            padding: '12px 14px', background: T.surface2, borderRadius: 8,
            fontSize: 12, color: T.textSecondary, lineHeight: 1.6, whiteSpace: 'pre-wrap',
          }}>
            {shareMessage}
          </div>
          <Btn small v="ghost" onClick={() => copy(shareMessage, 'msg')} style={{ marginTop: 6 }}>
            {copied === 'msg' ? '✓ ' + t('affiliation.copied') : t('affiliation.copyMessage')}
          </Btn>
        </div>
      </div>
    </Modal>
  );
}
