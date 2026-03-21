import { useCallback } from 'react';
import { load } from '../lib/store.js';
import { daysSince, forecastCA, businessHealth, fmt, isInvoiceOverdue } from '../lib/utils.js';
import { t } from '../lib/i18n.js';

export function useNotifications() {
  const compute = useCallback(() => {
    const notifs = [];
    const now = new Date();

    // 1. Contacts needing follow-up
    const contacts = load('contacts') || [];
    contacts.forEach((c) => {
      if (!c.createdAt) return;
      const lastActivity = c.commentaires && c.commentaires.length > 0
        ? c.commentaires[c.commentaires.length - 1].date
        : c.createdAt;
      const daysSinceActivity = daysSince(lastActivity);

      if (c.status === 'prospect' && daysSinceActivity > 14) {
        notifs.push({
          id: `relance-${c.id}`, type: 'relance',
          message: `${c.name} (prospect) ${t('app.noActivitySince', { days: daysSinceActivity })}`,
          time: lastActivity, tab: 'crm',
        });
      }
      if (c.status === 'lead' && daysSinceActivity > 21) {
        notifs.push({
          id: `relance-${c.id}`, type: 'relance',
          message: `${c.name} (lead) ${t('app.noActivitySince', { days: daysSinceActivity })}`,
          time: lastActivity, tab: 'crm',
        });
      }
    });

    // 2. Events happening today or tomorrow
    const events = load('events') || [];
    const todayStr = now.toISOString().split('T')[0];
    const tomorrowDate = new Date(now);
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrowStr = tomorrowDate.toISOString().split('T')[0];

    events.forEach((ev) => {
      if (ev.date === todayStr) {
        notifs.push({ id: `event-today-${ev.id}`, type: 'event', message: `Aujourd'hui : ${ev.title}${ev.time ? ` à ${ev.time}` : ''}`, time: ev.date, tab: 'agenda' });
      } else if (ev.date === tomorrowStr) {
        notifs.push({ id: `event-tomorrow-${ev.id}`, type: 'event', message: `Demain : ${ev.title}${ev.time ? ` à ${ev.time}` : ''}`, time: ev.date, tab: 'agenda' });
      }
    });

    // 3. Missing financial data for current month
    const curMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const finHistory = load('finHistory') || [];
    const hasCurrentMonth = finHistory.some((f) => f.key === curMonth);
    if (!hasCurrentMonth) {
      notifs.push({ id: 'finance-missing', type: 'finance', message: `Données financières manquantes pour ${curMonth}`, time: now.toISOString(), tab: 'data' });
    }

    // 4. Tip: connect integrations
    const integrations = load('integrations') || {};
    const connectedCount = Object.values(integrations).filter(Boolean).length;
    if (connectedCount < 2) {
      notifs.push({ id: 'tip-integrations', type: 'tip', message: 'Connectez vos intégrations pour plus de données', time: now.toISOString(), tab: 'settings' });
    }

    // 5. Smart business alerts — financial thresholds
    if (finHistory.length >= 2) {
      const last = finHistory[finHistory.length - 1];
      const prev = finHistory[finHistory.length - 2];

      if (last.ca > 0) {
        const margin = (last.result / last.ca) * 100;
        if (margin < 10) {
          notifs.push({ id: 'alert-margin-critical', type: 'alert', message: `Marge critique : ${Math.round(margin)}% — risque de perte nette`, time: now.toISOString(), tab: 'data' });
        } else if (margin < 20) {
          notifs.push({ id: 'alert-margin-warning', type: 'alert', message: `Marge faible : ${Math.round(margin)}% — surveillez vos charges`, time: now.toISOString(), tab: 'data' });
        }
      }

      if (prev.ca > 0) {
        const caDecline = ((prev.ca - last.ca) / prev.ca) * 100;
        if (caDecline > 15) {
          notifs.push({ id: 'alert-ca-decline', type: 'alert', message: `CA en baisse de ${Math.round(caDecline)}% vs mois dernier (${fmt(last.ca)} € vs ${fmt(prev.ca)} €)`, time: now.toISOString(), tab: 'data' });
        }
      }

      if (prev.charges > 0) {
        const chargesSpike = ((last.charges - prev.charges) / prev.charges) * 100;
        if (chargesSpike > 20) {
          notifs.push({ id: 'alert-charges-spike', type: 'alert', message: `Charges en hausse de ${Math.round(chargesSpike)}% : ${fmt(last.charges)} € vs ${fmt(prev.charges)} €`, time: now.toISOString(), tab: 'data' });
        }
      }

      if (last.result < 0) {
        notifs.push({ id: 'alert-negative-result', type: 'alert', message: `Résultat net négatif : ${fmt(last.result)} € — revoyez vos charges`, time: now.toISOString(), tab: 'data' });
      }
    }

    // 6. Forecast warning
    if (finHistory.length >= 3) {
      const forecast = forecastCA(finHistory, 3);
      const lastCA = finHistory[finHistory.length - 1]?.ca || 0;
      if (forecast.length > 0 && lastCA > 0) {
        const forecastEnd = forecast[forecast.length - 1]?.ca || 0;
        const pctChange = Math.round(((forecastEnd - lastCA) / lastCA) * 100);
        if (pctChange < -20) {
          notifs.push({ id: 'alert-forecast-decline', type: 'alert', message: `Prévision : CA en baisse de ${Math.abs(pctChange)}% dans 3 mois`, time: now.toISOString(), tab: 'analytics' });
        }
      }
    }

    // 7. Business health degradation
    const healthScore = businessHealth(finHistory, contacts, integrations);
    if (healthScore < 30) {
      notifs.push({ id: 'alert-health-critical', type: 'alert', message: `Santé business critique (${healthScore}/100) — actions requises`, time: now.toISOString(), tab: 'overview' });
    } else if (healthScore < 50) {
      notifs.push({ id: 'alert-health-warning', type: 'finance', message: `Santé business faible (${healthScore}/100) — connectez plus d'outils`, time: now.toISOString(), tab: 'settings' });
    }

    // 8. Treasury low warning
    if (finHistory.length > 0) {
      const lastTreso = finHistory[finHistory.length - 1]?.treso || 0;
      const avgCharges = Math.round(finHistory.slice(-3).reduce((s, r) => s + (r.charges || 0), 0) / Math.min(finHistory.length, 3));
      if (lastTreso > 0 && avgCharges > 0 && lastTreso < avgCharges * 2) {
        notifs.push({ id: 'alert-treasury-low', type: 'alert', message: `Trésorerie faible : ${fmt(lastTreso)} € (< 2 mois de charges)`, time: now.toISOString(), tab: 'data' });
      }
    }

    // 9. Invoice overdue alerts
    const automations = load('automations') || {};
    const invoices = load('invoices') || [];
    invoices.forEach((inv) => {
      if (inv.status === 'paid' || inv.status === 'draft') return;
      if (isInvoiceOverdue(inv)) {
        const daysPast = Math.floor((Date.now() - new Date(inv.dueDate).getTime()) / 86400000);
        if (daysPast >= 7 && automations['invoice-overdue-7j'] !== false) {
          notifs.push({ id: `invoice-overdue-7j-${inv.id}`, type: 'alert', message: `Facture ${inv.number} impayée depuis ${daysPast}j (${fmt(inv.totalTTC || 0)} €) — ${inv.contactName || 'Client inconnu'}`, time: inv.dueDate, tab: 'data' });
        } else if (daysPast >= 3 && automations['invoice-overdue-3j'] !== false) {
          notifs.push({ id: `invoice-overdue-3j-${inv.id}`, type: 'finance', message: `Facture ${inv.number} en retard de ${daysPast}j — ${inv.contactName || ''}`, time: inv.dueDate, tab: 'data' });
        }
      }
    });

    // 10. CA goal reached
    const caGoal = load('caGoal') || 0;
    if (caGoal > 0 && finHistory.length > 0 && automations['ca-objectif-atteint'] !== false) {
      const last = finHistory[finHistory.length - 1];
      if (last.ca >= caGoal) {
        notifs.push({ id: 'auto-ca-objectif', type: 'tip', message: `Objectif CA atteint ! ${fmt(last.ca)} € / ${fmt(caGoal)} € ce mois`, time: now.toISOString(), tab: 'data' });
      }
    }

    // 11. Conversion rate alert
    if (contacts.length >= 5) {
      const clients = contacts.filter((c) => c.status === 'client').length;
      const lost = contacts.filter((c) => c.status === 'perdu').length;
      const denom = clients + lost;
      if (denom >= 3) {
        const convRate = Math.round((clients / denom) * 100);
        if (convRate < 20) {
          notifs.push({ id: 'alert-conversion-low', type: 'relance', message: `Taux de conversion bas : ${convRate}% — optimisez votre pipeline`, time: now.toISOString(), tab: 'crm' });
        }
      }
    }

    return notifs;
  }, []);

  return compute;
}
