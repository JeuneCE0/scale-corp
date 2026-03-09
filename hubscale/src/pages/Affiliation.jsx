import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { T } from '../lib/theme.js';
import { uid, fmt, formatDateFR, ago } from '../lib/utils.js';
import { store, storeDebounced, load } from '../lib/store.js';
import { broadcast, subscribe } from '../lib/sync.js';
import { Card, Btn, Inp, Badge, Modal, EmptyState, TabBar, Pagination } from '../components/ui.jsx';
import { t } from '../lib/i18n.js';
import { isSupabaseConfigured } from '../lib/supabase.js';
import { getAffiliateDashboard, registerAffiliateSlug, requestAffiliatePayout, saveAffiliateBankInfo } from '../lib/api.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const COMMISSION_RATE = 20; // Fixed 20% commission

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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function slugify(str) {
  return (str || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 30);
}

function generateShortId() {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function buildUniqueSlug() {
  const company = load('settings_company') || {};
  const base = slugify(company.name) || 'user';
  return base + '-' + generateShortId();
}

function Sparkline({ data, color, width = 120, height = 40 }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const stepX = width / (data.length - 1);
  const points = data.map((v, i) => `${i * stepX},${height - ((v - min) / range) * (height - 4) - 2}`).join(' ');
  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <polyline points={points} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function Affiliation() {
  const [data, setData] = useState(() => {
    const saved = load('affiliation');
    if (saved) {
      // Ensure slug exists (migration for existing users)
      if (!saved.slug) {
        saved.slug = buildUniqueSlug();
        store('affiliation', saved);
      }
      return saved;
    }
    return {
      slug: buildUniqueSlug(),
      referrals: [],
      payouts: [],
      clicks: [],
      totalEarned: 0,
      totalPaid: 0,
      bankInfo: null,
      createdAt: new Date().toISOString(),
    };
  });

  const [activeTab, setActiveTab] = useState(0);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [page, setPage] = useState(1);
  const perPage = 10;

  const [serverLoaded, setServerLoaded] = useState(false);

  useEffect(() => {
    storeDebounced('affiliation', data);
    broadcast('affiliation', data);
  }, [data]);

  useEffect(() => {
    const unsub = subscribe('affiliation', (d) => setData(d));
    return unsub;
  }, []);

  // Fetch affiliate data from server (Supabase) and merge with local
  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    let cancelled = false;

    (async () => {
      try {
        // Register slug on server if not already done
        const orgId = load('_orgId');
        if (orgId && data.slug) {
          await registerAffiliateSlug(data.slug, orgId).catch(() => {});
        }

        const res = await getAffiliateDashboard();
        if (cancelled || !res.ok) return;

        // Merge server referrals with local data
        const serverRefs = (res.referrals || []).map(r => ({
          id: r.id,
          name: r.name,
          email: r.email,
          status: r.status,
          joinedAt: r.joined_at,
          convertedAt: r.converted_at,
          plan: r.plan,
          saleAmount: r.sale_amount,
          commissionEarned: r.commission_earned,
          potentialCommission: r.potential_commission,
          trialEndsAt: r.trial_ends_at,
          firstChargeConfirmed: r.first_charge_confirmed,
          _fromServer: true,
        }));

        const serverPayouts = (res.payouts || []).map(p => ({
          id: p.id,
          amount: p.amount,
          status: p.status,
          date: p.requested_at,
          method: p.method,
          bankInfo: p.bank_info,
          _fromServer: true,
        }));

        const serverClicks = (res.clickDays || []).map(c => ({
          date: c.date,
          count: c.count,
        }));

        setData(prev => {
          // Merge: server referrals + any local-only referrals not in server
          const serverEmails = new Set(serverRefs.map(r => r.email?.toLowerCase()));
          const localOnly = (prev.referrals || []).filter(r => !r._fromServer && !serverEmails.has(r.email?.toLowerCase()));
          const mergedRefs = [...serverRefs, ...localOnly];

          const serverPayoutIds = new Set(serverPayouts.map(p => p.id));
          const localOnlyPayouts = (prev.payouts || []).filter(p => !p._fromServer && !serverPayoutIds.has(p.id));
          const mergedPayouts = [...serverPayouts, ...localOnlyPayouts];

          // Use server clicks if available, otherwise keep local
          const mergedClicks = serverClicks.length > 0 ? serverClicks : (prev.clicks || []);

          const bankInfo = res.affiliate?.bank_info || prev.bankInfo;
          const totalPaid = res.affiliate?.total_paid || prev.totalPaid;
          const slug = res.affiliate?.slug || prev.slug;

          return {
            ...prev,
            slug,
            referrals: mergedRefs,
            payouts: mergedPayouts,
            clicks: mergedClicks,
            totalPaid,
            bankInfo,
          };
        });
        setServerLoaded(true);
      } catch (e) {
        // Server not available — continue with local data only
        console.warn('Affiliate dashboard fetch failed:', e);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  const referralLink = `${window.location.host}/r/${data.slug}`;

  const copyLink = useCallback(() => {
    navigator.clipboard.writeText('https://' + referralLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [referralLink]);

  const saveBankInfo = (bankInfo) => {
    setData(prev => ({ ...prev, bankInfo }));
    setShowBankModal(false);
    // Save to server
    if (isSupabaseConfigured()) {
      saveAffiliateBankInfo(bankInfo).catch(() => {});
    }
  };

  // Stats
  const stats = useMemo(() => {
    const active = data.referrals.filter(r => r.status === 'active').length;
    const pending = data.referrals.filter(r => r.status === 'pending').length;
    const totalSalesAmount = data.referrals.filter(r => r.status === 'active').reduce((s, r) => s + (r.saleAmount || 0), 0);
    const totalCommissions = data.referrals.filter(r => r.status === 'active' && r.firstChargeConfirmed).reduce((s, r) => s + (r.commissionEarned || 0), 0);
    const pendingPayout = totalCommissions - data.totalPaid;
    const clicks = (data.clicks || []).reduce((s, c) => s + (c.count || 0), 0);

    const clicksHistory = (data.clicks || []).slice(-7).map(c => c.count || 0);
    const leadsHistory = [];
    const salesHistory = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const day = d.toISOString().split('T')[0];
      leadsHistory.push(data.referrals.filter(r => r.joinedAt?.startsWith(day)).length);
      salesHistory.push(data.referrals.filter(r => r.status === 'active' && r.convertedAt?.startsWith(day)).length);
    }

    return {
      total: data.referrals.length, active, pending, totalCommissions, pendingPayout,
      clicks, totalSalesAmount,
      clicksHistory: clicksHistory.length >= 2 ? clicksHistory : [0, 0, 0, 0, 0, 0, 0],
      leadsHistory, salesHistory,
    };
  }, [data]);

  const sortedReferrals = useMemo(() => [...data.referrals].sort((a, b) => new Date(b.joinedAt) - new Date(a.joinedAt)), [data.referrals]);
  const sortedPayouts = useMemo(() => [...data.payouts].sort((a, b) => new Date(b.date) - new Date(a.date)), [data.payouts]);

  const getTabs = () => [t('affiliation.tabQuickstart'), t('affiliation.tabEarnings'), t('affiliation.tabLinks'), t('affiliation.tabLeaderboard'), t('affiliation.tabFaq')];

  const requestPayout = async () => {
    if (stats.pendingPayout < 50) return;
    if (!data.bankInfo?.iban) {
      setShowBankModal(true);
      return;
    }
    const payout = {
      id: uid(),
      amount: stats.pendingPayout,
      status: 'pending',
      date: new Date().toISOString(),
      method: 'bank_transfer',
      bankInfo: { ...data.bankInfo },
    };
    setData(prev => ({
      ...prev,
      payouts: [...prev.payouts, payout],
      totalPaid: prev.totalPaid + stats.pendingPayout,
    }));
    // Send to server
    if (isSupabaseConfigured()) {
      try {
        await requestAffiliatePayout(stats.pendingPayout, data.bankInfo);
      } catch (e) {
        console.warn('Server payout request failed:', e);
      }
    }
  };

  const hasBankInfo = data.bankInfo && data.bankInfo.iban;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>

      {/* ── Hero: Referral link + Rewards ── */}
      <div className="glass-static fade-up" style={{
        padding: 0, borderRadius: 16, overflow: 'hidden',
        background: `linear-gradient(135deg, ${T.surface}ee, ${T.accent}08)`,
        border: `1px solid ${T.border}`,
      }}>
        <div style={{ display: 'flex', gap: 0, minHeight: 180 }}>
          <div style={{ flex: '1 1 55%', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Referral link */}
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 8 }}>
                {t('affiliation.referralLink')}
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{
                  flex: 1, padding: '10px 14px', background: T.surface2, borderRadius: 10, fontFamily: 'monospace',
                  fontSize: 13, fontWeight: 500, color: T.textSecondary, userSelect: 'all',
                  border: `1px solid ${T.border}`,
                }}>
                  {referralLink}
                </div>
                <Btn small onClick={copyLink} style={{ whiteSpace: 'nowrap' }}>
                  {copied ? '✓ ' + t('affiliation.copied') : '📋 ' + t('affiliation.copyLink')}
                </Btn>
              </div>
            </div>

            {/* Rewards */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: T.accent }}>{t('affiliation.rewards')}</span>
                <span style={{ fontSize: 11, color: T.textMuted, cursor: 'pointer', textDecoration: 'underline' }}>
                  {t('affiliation.viewTerms')}
                </span>
              </div>
              <div style={{
                padding: '12px 16px', background: T.surface2, borderRadius: 10,
                border: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', gap: 6,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: T.text }}>
                  <span style={{ fontSize: 14 }}>💰</span>
                  <span><strong>20%</strong> {t('affiliation.perSaleLifetime')}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: T.text }}>
                  <span style={{ fontSize: 14 }}>🎁</span>
                  <span>{t('affiliation.newUserDiscount')}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: T.text }}>
                  <span style={{ fontSize: 14 }}>⏳</span>
                  <span style={{ fontSize: 11, color: T.textMuted }}>Commission activée après la fin de l'essai et le 1er paiement confirmé</span>
                </div>
                <div style={{ marginTop: 4, fontSize: 11, fontWeight: 600, color: T.textMuted }}>
                  {t('affiliation.holdingPeriod')}
                </div>
              </div>
            </div>
          </div>

          {/* Right decorative */}
          <div style={{
            flex: '0 0 35%', position: 'relative', overflow: 'hidden',
            background: `linear-gradient(135deg, ${T.accent}30, ${T.purple}40)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              width: 100, height: 100, borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: `linear-gradient(135deg, ${T.accent}80, ${T.purple}80)`,
              boxShadow: `0 8px 32px ${T.accent}40`, fontSize: 42,
            }}>
              🚀
            </div>
            <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: 40, background: T.accent + '15' }} />
            <div style={{ position: 'absolute', bottom: -10, left: 20, width: 50, height: 50, borderRadius: 25, background: T.purple + '20' }} />
          </div>
        </div>
      </div>

      {/* ── Stats row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1.3fr', gap: 12 }}>
        <div className="glass-static" style={{ padding: '16px 18px', borderRadius: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: T.textSecondary }}>{t('affiliation.clicks')}</span>
            <span style={{ fontSize: 10, color: T.textMuted, cursor: 'help' }} title={t('affiliation.clicksTooltip')}>ⓘ</span>
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: T.text, marginBottom: 8 }}>{stats.clicks}</div>
          <Sparkline data={stats.clicksHistory} color={T.accent} />
        </div>

        <div className="glass-static" style={{ padding: '16px 18px', borderRadius: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: T.textSecondary }}>{t('affiliation.leads')}</span>
            <span style={{ fontSize: 10, color: T.textMuted, cursor: 'help' }} title={t('affiliation.leadsTooltip')}>ⓘ</span>
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: T.text, marginBottom: 8 }}>{stats.total}</div>
          <Sparkline data={stats.leadsHistory} color={T.blue} />
        </div>

        <div className="glass-static" style={{ padding: '16px 18px', borderRadius: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: T.textSecondary }}>{t('affiliation.sales')}</span>
            <span style={{ fontSize: 10, color: T.textMuted, cursor: 'help' }} title={t('affiliation.salesTooltip')}>ⓘ</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 8 }}>
            <span style={{ fontSize: 26, fontWeight: 800, color: T.text }}>{stats.active}</span>
            <span style={{ fontSize: 13, color: T.textMuted }}>({fmt(stats.totalSalesAmount)}€)</span>
          </div>
          <Sparkline data={stats.salesHistory} color={T.green} />
        </div>

        <div className="glass-static" style={{ padding: '16px 18px', borderRadius: 12, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: T.textSecondary }}>{t('affiliation.earnings')}</span>
              <span style={{ fontSize: 10, color: T.textMuted, cursor: 'help' }} title={t('affiliation.earningsTooltip')}>ⓘ</span>
            </div>
            <Btn small v="secondary" onClick={() => setShowBankModal(true)} style={{ fontSize: 11, padding: '4px 10px' }}>
              {t('affiliation.settings')}
            </Btn>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: T.textSecondary }}>{t('affiliation.upcoming')}</span>
              <span style={{ fontSize: 16, fontWeight: 800, color: T.accent }}>{fmt(stats.pendingPayout)}€</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: T.textSecondary }}>{t('affiliation.paid')}</span>
              <span style={{ fontSize: 16, fontWeight: 800, color: T.text }}>{fmt(stats.totalCommissions - stats.pendingPayout)}€</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <Card style={{ padding: '0 16px' }}>
        <TabBar items={getTabs()} active={getTabs()[activeTab]} onChange={(tab) => { setActiveTab(getTabs().indexOf(tab)); setPage(1); }} />
      </Card>

      {/* ── Tab Content ── */}
      {activeTab === 0 && (
        <QuickstartTab
          referralLink={referralLink}
          onCopy={copyLink}
          copied={copied}
          hasBankInfo={hasBankInfo}
          onOpenBankModal={() => setShowBankModal(true)}
          pendingPayout={stats.pendingPayout}
        />
      )}
      {activeTab === 1 && <EarningsTab referrals={sortedReferrals} payouts={sortedPayouts} stats={stats} onRequestPayout={requestPayout} page={page} setPage={setPage} perPage={perPage} />}
      {activeTab === 2 && <LinksTab referralLink={referralLink} slug={data.slug} onCopy={copyLink} copied={copied} />}
      {activeTab === 3 && <LeaderboardTab />}
      {activeTab === 4 && <FaqTab />}

      {/* Share Modal */}
      {showShareModal && (
        <ShareModal link={'https://' + referralLink} slug={data.slug} onClose={() => setShowShareModal(false)} />
      )}

      {/* Bank Info Modal */}
      {showBankModal && (
        <BankInfoModal bankInfo={data.bankInfo} onSave={saveBankInfo} onClose={() => setShowBankModal(false)} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Bank Info Modal (Nom, Prénom, IBAN, BIC + billing info)
// ---------------------------------------------------------------------------

function BankInfoModal({ bankInfo, onSave, onClose }) {
  const company = load('settings_company') || {};
  const [form, setForm] = useState({
    firstName: bankInfo?.firstName || '',
    lastName: bankInfo?.lastName || '',
    iban: bankInfo?.iban || '',
    bic: bankInfo?.bic || '',
    billingName: bankInfo?.billingName || company.name || '',
    billingAddress: bankInfo?.billingAddress || company.address || '',
    billingCity: bankInfo?.billingCity || company.city || '',
    billingZip: bankInfo?.billingZip || company.zip || '',
    billingCountry: bankInfo?.billingCountry || 'France',
    billingEmail: bankInfo?.billingEmail || company.email || '',
  });

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const formatIban = (v) => {
    const clean = v.replace(/\s/g, '').toUpperCase();
    return clean.replace(/(.{4})/g, '$1 ').trim();
  };

  const isValid = form.firstName.trim() && form.lastName.trim() && form.iban.replace(/\s/g, '').length >= 14 && form.bic.trim().length >= 8;

  return (
    <Modal open onClose={onClose} title={t('affiliation.bankInfoTitle')} wide>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* Status indicator */}
        {bankInfo?.iban ? (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px',
            background: T.green + '12', borderRadius: 8, border: `1px solid ${T.green}30`,
          }}>
            <span style={{ fontSize: 16 }}>✅</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: T.green }}>{t('affiliation.bankInfoConfigured')}</span>
          </div>
        ) : (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px',
            background: T.orange + '12', borderRadius: 8, border: `1px solid ${T.orange}30`,
          }}>
            <span style={{ fontSize: 16 }}>⚠️</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: T.orange }}>{t('affiliation.bankInfoRequired')}</span>
          </div>
        )}

        {/* Identity */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.textSecondary, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 10 }}>
            {t('affiliation.bankIdentity')}
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 200px' }}>
              <Inp label={t('affiliation.firstName')} value={form.firstName} onChange={(v) => set('firstName', v)} placeholder="Jean" />
            </div>
            <div style={{ flex: '1 1 200px' }}>
              <Inp label={t('affiliation.lastName')} value={form.lastName} onChange={(v) => set('lastName', v)} placeholder="Dupont" />
            </div>
          </div>
        </div>

        {/* Bank details */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.textSecondary, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 10 }}>
            {t('affiliation.bankDetails')}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Inp
              label="IBAN"
              value={form.iban}
              onChange={(v) => set('iban', formatIban(v))}
              placeholder="FR76 1234 5678 9012 3456 7890 123"
              style={{ fontFamily: 'monospace', letterSpacing: 1 }}
            />
            <div style={{ maxWidth: 300 }}>
              <Inp
                label="BIC / SWIFT"
                value={form.bic}
                onChange={(v) => set('bic', v.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11))}
                placeholder="BNPAFRPPXXX"
                style={{ fontFamily: 'monospace', letterSpacing: 1 }}
              />
            </div>
          </div>
        </div>

        {/* Billing info */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.textSecondary, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 10 }}>
            {t('affiliation.billingInfo')}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 300px' }}>
                <Inp label={t('affiliation.billingName')} value={form.billingName} onChange={(v) => set('billingName', v)} placeholder={t('affiliation.billingNamePlaceholder')} />
              </div>
              <div style={{ flex: '1 1 200px' }}>
                <Inp label={t('affiliation.billingEmail')} value={form.billingEmail} onChange={(v) => set('billingEmail', v)} type="email" placeholder="contact@example.com" />
              </div>
            </div>
            <Inp label={t('common.address')} value={form.billingAddress} onChange={(v) => set('billingAddress', v)} placeholder="12 rue de la Paix" />
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ flex: '0 0 120px' }}>
                <Inp label={t('affiliation.billingZip')} value={form.billingZip} onChange={(v) => set('billingZip', v)} placeholder="75001" />
              </div>
              <div style={{ flex: '1 1 200px' }}>
                <Inp label={t('affiliation.billingCity')} value={form.billingCity} onChange={(v) => set('billingCity', v)} placeholder="Paris" />
              </div>
              <div style={{ flex: '1 1 150px' }}>
                <Inp label={t('affiliation.billingCountry')} value={form.billingCountry} onChange={(v) => set('billingCountry', v)} placeholder="France" />
              </div>
            </div>
          </div>
        </div>

        {/* Security note */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: T.surface2, borderRadius: 8 }}>
          <span style={{ fontSize: 14 }}>🔒</span>
          <span style={{ fontSize: 11, color: T.textMuted, lineHeight: 1.5 }}>
            {t('affiliation.bankSecurityNote')}
          </span>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Btn v="ghost" onClick={onClose}>{t('common.cancel')}</Btn>
          <Btn onClick={() => onSave(form)} disabled={!isValid}>
            {t('affiliation.saveBankInfo')}
          </Btn>
        </div>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Quickstart Tab
// ---------------------------------------------------------------------------

function QuickstartTab({ referralLink, onCopy, copied, hasBankInfo, onOpenBankModal, pendingPayout }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
      {/* Share your link card */}
      <div className="glass-static" style={{
        padding: '28px 24px', borderRadius: 14, textAlign: 'center',
        border: `1px solid ${T.accent}25`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 36px)', gap: 8, marginBottom: 4 }}>
          {['💼', '🐦', '📣', '📧', '✖️', '💬', '📱', '📢', '🔗'].map((icon, i) => (
            <div key={i} style={{
              width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: i === 4 ? T.accent + '20' : T.surface2,
              border: i === 4 ? `1px solid ${T.accent}40` : `1px solid ${T.border}`,
              fontSize: 16,
            }}>
              {icon}
            </div>
          ))}
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: T.text, marginBottom: 6 }}>
            {t('affiliation.shareYourLink')}
          </div>
          <div style={{ fontSize: 12, color: T.textSecondary, lineHeight: 1.5, maxWidth: 280 }}>
            {t('affiliation.shareYourLinkDesc')}
          </div>
        </div>
        <Btn onClick={onCopy} style={{ width: '100%', justifyContent: 'center' }}>
          {copied ? '✓ ' + t('affiliation.copied') : '📋 ' + t('affiliation.copyLink')}
        </Btn>
      </div>

      {/* Receive earnings card */}
      <div className="glass-static" style={{
        padding: '28px 24px', borderRadius: 14, textAlign: 'center',
        border: `1px solid ${hasBankInfo ? T.green : T.orange}25`,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
      }}>
        <div style={{ position: 'relative', marginBottom: 4 }}>
          <div style={{
            width: 120, height: 80, borderRadius: 12, background: T.surface2, border: `1px solid ${T.border}`,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
          }}>
            <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 600 }}>{t('affiliation.payoutsLabel')}</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: T.green }}>💰 {fmt(pendingPayout)}€</div>
          </div>
          <div style={{
            position: 'absolute', bottom: -8, right: -8, width: 28, height: 28, borderRadius: 14,
            background: hasBankInfo ? T.green : T.orange,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, color: '#fff', boxShadow: `0 2px 8px ${hasBankInfo ? T.green : T.orange}40`,
          }}>
            {hasBankInfo ? '✓' : '!'}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: T.text, marginBottom: 6 }}>
            {t('affiliation.receiveEarnings')}
          </div>
          <div style={{ fontSize: 12, color: T.textSecondary, lineHeight: 1.5, maxWidth: 280 }}>
            {hasBankInfo ? t('affiliation.bankInfoConfiguredDesc') : t('affiliation.receiveEarningsDesc')}
          </div>
        </div>
        <Btn v={hasBankInfo ? 'secondary' : 'primary'} onClick={onOpenBankModal} style={{ width: '100%', justifyContent: 'center' }}>
          {hasBankInfo ? t('affiliation.editBankInfo') : t('affiliation.connectPayouts')}
        </Btn>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Earnings Tab
// ---------------------------------------------------------------------------

function EarningsTab({ referrals, payouts, stats, onRequestPayout, page, setPage, perPage }) {
  const pagedReferrals = referrals.slice((page - 1) * perPage, page * perPage);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <div className="glass-static" style={{ padding: '16px 18px', borderRadius: 12, textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: T.textSecondary, fontWeight: 600, marginBottom: 4 }}>{t('affiliation.totalEarned')}</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: T.green }}>{fmt(stats.totalCommissions)}€</div>
        </div>
        <div className="glass-static" style={{ padding: '16px 18px', borderRadius: 12, textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: T.textSecondary, fontWeight: 600, marginBottom: 4 }}>{t('affiliation.upcoming')}</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: T.accent }}>{fmt(stats.pendingPayout)}€</div>
        </div>
        <div className="glass-static" style={{ padding: '16px 18px', borderRadius: 12, textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: T.textSecondary, fontWeight: 600, marginBottom: 4 }}>{t('affiliation.paid')}</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: T.text }}>{fmt(stats.totalCommissions - stats.pendingPayout)}€</div>
        </div>
      </div>

      {referrals.length === 0 ? (
        <EmptyState icon="👥" title={t('affiliation.noReferrals')} sub={t('affiliation.noReferralsSub')} />
      ) : (
        <Card>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.textSecondary, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 12 }}>
            {t('affiliation.salesHistory')}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {pagedReferrals.map(ref => {
              const st = REFERRAL_STATUSES[ref.status] || REFERRAL_STATUSES.pending;
              const isActive = ref.status === 'active' && ref.firstChargeConfirmed;
              const trialEnd = ref.trialEndsAt ? new Date(ref.trialEndsAt) : null;
              const now = new Date();
              const trialDaysLeft = trialEnd ? Math.max(0, Math.ceil((trialEnd - now) / 86400000)) : 0;
              const inTrial = trialEnd && trialDaysLeft > 0;
              const commissionAmount = isActive ? (ref.commissionEarned || 0) : (ref.potentialCommission || ref.commissionEarned || 0);

              return (
                <div key={ref.id} style={{ padding: '14px 16px', borderRadius: 10, background: T.surface2, border: `1px solid ${T.border}` }}>
                  {/* Row 1: Avatar, name, status, commission */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 19, background: st.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, color: st.color, flexShrink: 0 }}>
                      {ref.name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: T.text }}>{ref.name || t('affiliation.noReferrals')}</div>
                      <div style={{ fontSize: 11, color: T.textMuted }}>{ref.email || '—'}</div>
                    </div>
                    <Badge label={st.label()} color={st.color} bg={st.bg} />
                    <div style={{ textAlign: 'right', minWidth: 90 }}>
                      {isActive ? (
                        <>
                          <div style={{ fontWeight: 700, fontSize: 13, color: T.green }}>+{fmt(commissionAmount)}€</div>
                          <div style={{ fontSize: 9, color: T.textMuted }}>20% {t('affiliation.commission')}</div>
                        </>
                      ) : (
                        <>
                          <div style={{ fontWeight: 600, fontSize: 12, color: T.textMuted }}>~{fmt(commissionAmount)}€</div>
                          <div style={{ fontSize: 9, color: T.orange }}>{t('affiliation.potentialCommission')}</div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Row 2: Details */}
                  <div style={{ display: 'flex', gap: 16, marginTop: 10, paddingTop: 10, borderTop: `1px solid ${T.border}`, flexWrap: 'wrap' }}>
                    <div style={{ minWidth: 80 }}>
                      <div style={{ fontSize: 9, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', marginBottom: 2 }}>{t('affiliation.referralJoinDate')}</div>
                      <div style={{ fontSize: 11, color: T.textSecondary }}>{formatDateFR(ref.joinedAt)}</div>
                    </div>
                    <div style={{ minWidth: 80 }}>
                      <div style={{ fontSize: 9, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', marginBottom: 2 }}>{t('affiliation.referralPlan')}</div>
                      <div style={{ fontSize: 11, color: T.textSecondary, textTransform: 'capitalize' }}>{ref.plan || '—'}</div>
                    </div>
                    <div style={{ minWidth: 60 }}>
                      <div style={{ fontSize: 9, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', marginBottom: 2 }}>{t('affiliation.referralAmount')}</div>
                      <div style={{ fontSize: 11, color: T.textSecondary }}>{fmt(ref.saleAmount || 0)}€/mois</div>
                    </div>
                    <div style={{ minWidth: 100 }}>
                      <div style={{ fontSize: 9, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', marginBottom: 2 }}>{t('affiliation.referralTrialStatus')}</div>
                      {isActive ? (
                        <div style={{ fontSize: 11, color: T.green, fontWeight: 600 }}>✓ {t('affiliation.firstPaymentDone')}</div>
                      ) : inTrial ? (
                        <div style={{ fontSize: 11, color: T.orange, fontWeight: 600 }}>⏳ {t('affiliation.trialEndsIn', { days: trialDaysLeft })}</div>
                      ) : ref.status === 'churned' ? (
                        <div style={{ fontSize: 11, color: T.red, fontWeight: 600 }}>{st.label()}</div>
                      ) : (
                        <div style={{ fontSize: 11, color: T.orange, fontWeight: 600 }}>{t('affiliation.commissionPending')}</div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
      {referrals.length > perPage && (
        <Pagination current={page} total={Math.ceil(referrals.length / perPage)} onChange={setPage} />
      )}

      {payouts.length > 0 && (
        <Card>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.textSecondary, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 12 }}>
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
                    <div style={{ fontSize: 11, color: T.textMuted }}>{formatDateFR(p.date)}</div>
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
// Links Tab
// ---------------------------------------------------------------------------

function LinksTab({ referralLink, slug, onCopy, copied }) {
  const fullLink = 'https://' + referralLink;

  const shareChannels = [
    { id: 'email', icon: '📧', label: 'Email', href: `mailto:?subject=${encodeURIComponent(t('affiliation.shareEmailSubject'))}&body=${encodeURIComponent(t('affiliation.shareMessage', { rate: COMMISSION_RATE, link: fullLink }))}` },
    { id: 'whatsapp', icon: '💬', label: 'WhatsApp', href: `https://wa.me/?text=${encodeURIComponent(t('affiliation.shareMessage', { rate: COMMISSION_RATE, link: fullLink }))}` },
    { id: 'twitter', icon: '🐦', label: 'Twitter/X', href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(t('affiliation.shareMessage', { rate: COMMISSION_RATE, link: fullLink }))}` },
    { id: 'linkedin', icon: '💼', label: 'LinkedIn', href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(fullLink)}` },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Card>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.textSecondary, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 14 }}>
          {t('affiliation.yourLink')}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16 }}>
          <div style={{
            flex: 1, padding: '12px 16px', background: T.surface2, borderRadius: 10,
            fontFamily: 'monospace', fontSize: 14, color: T.text, userSelect: 'all', border: `1px solid ${T.border}`,
          }}>
            {referralLink}
          </div>
          <Btn onClick={onCopy}>
            {copied ? '✓ ' + t('affiliation.copied') : '📋 ' + t('affiliation.copyLink')}
          </Btn>
        </div>

        <div style={{ fontSize: 11, fontWeight: 700, color: T.textSecondary, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 10 }}>
          {t('affiliation.yourCode')}
        </div>
        <div style={{
          display: 'inline-block', padding: '10px 24px', background: T.accent + '15', borderRadius: 10,
          fontFamily: 'monospace', fontSize: 20, fontWeight: 800, color: T.accent, letterSpacing: 3,
        }}>
          {slug}
        </div>
      </Card>

      <Card>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.textSecondary, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 14 }}>
          {t('affiliation.shareVia')}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          {shareChannels.map(ch => (
            <a key={ch.id} href={ch.href} target="_blank" rel="noopener noreferrer"
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                padding: '18px 12px', borderRadius: 12, background: T.surface2,
                textDecoration: 'none', cursor: 'pointer', transition: 'all .15s',
                border: `1px solid ${T.border}`,
              }}
              onMouseOver={e => { e.currentTarget.style.background = T.accent + '12'; e.currentTarget.style.borderColor = T.accent + '40'; }}
              onMouseOut={e => { e.currentTarget.style.background = T.surface2; e.currentTarget.style.borderColor = T.border; }}
            >
              <span style={{ fontSize: 28 }}>{ch.icon}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{ch.label}</span>
            </a>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Leaderboard Tab
// ---------------------------------------------------------------------------

function LeaderboardTab() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetchLeaderboard() {
      try {
        const company = load('settings_company') || {};
        const socId = company.societyId || company.id;
        if (socId) {
          const r = await fetch(`/api/affiliate?action=leaderboard&society_id=${encodeURIComponent(socId)}`);
          if (r.ok && !cancelled) {
            const data = await r.json();
            if (Array.isArray(data) && data.length > 0) { setLeaderboard(data); }
          }
        }
      } catch { /* silently fallback to empty */ }
      if (!cancelled) setLoading(false);
    }
    fetchLeaderboard();
    return () => { cancelled = true; };
  }, []);

  return (
    <Card>
      <div style={{ fontSize: 11, fontWeight: 700, color: T.textSecondary, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 14 }}>
        {t('affiliation.leaderboardTitle')}
      </div>
      {loading ? (
        <div style={{ textAlign: 'center', padding: '24px 0', color: T.textMuted, fontSize: 12 }}>Chargement...</div>
      ) : leaderboard.length === 0 ? (
        <EmptyState icon="🏆" title={t('affiliation.noReferrals')} sub="Le classement apparaitra quand les premiers affiliés auront parrainé." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {leaderboard.map((entry, i) => (
            <div key={entry.rank} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 8,
              background: i < 3 ? T.accent + '06' : 'transparent',
            }}>
              <div style={{ width: 28, minWidth: 28, textAlign: 'center', fontSize: i < 3 ? 18 : 13, fontWeight: 700, color: i < 3 ? T.accent : T.textMuted }}>
                {entry.badge || `#${entry.rank}`}
              </div>
              <div style={{ flex: 1, fontWeight: 600, fontSize: 13, color: T.text }}>{entry.name}</div>
              <div style={{ fontSize: 12, color: T.textSecondary, minWidth: 90, textAlign: 'right' }}>{entry.referrals} {t('affiliation.referralsLabel')}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.green, minWidth: 80, textAlign: 'right' }}>{fmt(entry.earned)}€</div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// FAQ Tab
// ---------------------------------------------------------------------------

function FaqTab() {
  const [openIdx, setOpenIdx] = useState(null);

  const faqs = [
    { q: t('affiliation.faq1Q'), a: t('affiliation.faq1A') },
    { q: t('affiliation.faq2Q'), a: t('affiliation.faq2A') },
    { q: t('affiliation.faq3Q'), a: t('affiliation.faq3A') },
    { q: t('affiliation.faq4Q'), a: t('affiliation.faq4A') },
    { q: t('affiliation.faq5Q'), a: t('affiliation.faq5A') },
  ];

  return (
    <Card>
      <div style={{ fontSize: 11, fontWeight: 700, color: T.textSecondary, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 14 }}>
        {t('affiliation.faqTitle')}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {faqs.map((faq, i) => (
          <div key={i}>
            <button
              onClick={() => setOpenIdx(openIdx === i ? null : i)}
              style={{
                width: '100%', padding: '14px 16px', background: 'none', border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                cursor: 'pointer', borderRadius: 8, borderBottom: `1px solid ${T.border}`,
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 600, color: T.text, textAlign: 'left' }}>{faq.q}</span>
              <span style={{ fontSize: 16, color: T.textMuted, transform: openIdx === i ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>▾</span>
            </button>
            {openIdx === i && (
              <div style={{ padding: '12px 16px 16px', fontSize: 13, color: T.textSecondary, lineHeight: 1.6 }}>{faq.a}</div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Share Modal
// ---------------------------------------------------------------------------

function ShareModal({ link, slug, onClose }) {
  const [copied, setCopied] = useState('');

  const copy = (text, key) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(''), 2000);
    });
  };

  const shareMessage = t('affiliation.shareMessage', { rate: COMMISSION_RATE, link });

  const shareChannels = [
    { id: 'email', icon: '📧', label: 'Email', href: `mailto:?subject=${encodeURIComponent(t('affiliation.shareEmailSubject'))}&body=${encodeURIComponent(shareMessage)}` },
    { id: 'whatsapp', icon: '💬', label: 'WhatsApp', href: `https://wa.me/?text=${encodeURIComponent(shareMessage)}` },
    { id: 'twitter', icon: '🐦', label: 'Twitter/X', href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}` },
    { id: 'linkedin', icon: '💼', label: 'LinkedIn', href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}` },
  ];

  return (
    <Modal open onClose={onClose} title={t('affiliation.shareTitle')}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.textSecondary, textTransform: 'uppercase', marginBottom: 6 }}>
            {t('affiliation.yourLink')}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ flex: 1, padding: '10px 14px', background: T.surface2, borderRadius: 8, fontFamily: 'monospace', fontSize: 12, color: T.accent, userSelect: 'all' }}>
              {link}
            </div>
            <Btn small onClick={() => copy(link, 'link')}>
              {copied === 'link' ? '✓' : t('affiliation.copy')}
            </Btn>
          </div>
        </div>

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

        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.textSecondary, textTransform: 'uppercase', marginBottom: 6 }}>
            {t('affiliation.prewrittenMessage')}
          </div>
          <div style={{ padding: '12px 14px', background: T.surface2, borderRadius: 8, fontSize: 12, color: T.textSecondary, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
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
